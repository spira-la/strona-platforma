import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';

// ---------------------------------------------------------------------------
// Language name mapping
// ---------------------------------------------------------------------------

const LANGUAGE_NAMES: Record<string, string> = {
  pl: 'Polish',
  en: 'English',
  es: 'Spanish',
};

// ---------------------------------------------------------------------------
// Ollama API response shape
// ---------------------------------------------------------------------------

interface OllamaGenerateResponse {
  response: string;
  done: boolean;
}

// ---------------------------------------------------------------------------
// HTML text-node walker — extracts translatable text while preserving structure
// ---------------------------------------------------------------------------

/** Tags whose text content we should never translate (embedded media, code) */
const OPAQUE_TAGS = new Set(['iframe', 'script', 'style', 'code', 'pre']);

/** Max characters per batch request to Ollama (stays inside 4k context) */
const BATCH_CHAR_LIMIT = 2000;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly ollamaUrl: string;
  private readonly model = 'gemma4:e2b';

  /** 2 minutes per chunk — small blocks translate fast */
  private readonly chunkTimeoutMs = 2 * 60 * 1000;

  constructor(private readonly config: ConfigService) {
    this.ollamaUrl =
      this.config.get<string>('OLLAMA_URL') ??
      // eslint-disable-next-line sonarjs/no-clear-text-protocols -- internal Docker network
      'http://spirala-ollama:11434';
  }

  // ---------------------------------------------------------------------------
  // Health check
  // ---------------------------------------------------------------------------

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.ollamaUrl}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res.ok;
    } catch (error) {
      this.logger.warn(`Ollama not reachable: ${String(error)}`);
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Translates plain text (title, excerpt) — single call.
   */
  async translate(
    text: string,
    fromLang: string,
    toLang: string,
  ): Promise<string> {
    if (!text.trim()) return text;
    return this.callOllama(text, fromLang, toLang);
  }

  /**
   * Translates HTML content (blog body from TipTap) preserving structure.
   *
   * Uses cheerio to parse the HTML into a DOM tree, walks all text nodes,
   * batches them into a single numbered-lines prompt (staying within
   * Ollama's context window), then writes the translations back to the
   * exact same text nodes. All attributes, classes, nested structures
   * (tables, task lists, images, youtube embeds) are preserved as-is.
   *
   * Text nodes inside <iframe>, <script>, <style>, <code>, <pre> are skipped.
   */
  async translateHtml(
    html: string,
    fromLang: string,
    toLang: string,
  ): Promise<string> {
    if (!html.trim()) return html;

    const $ = cheerio.load(html, { xml: false }, false);

    // Collect all translatable text nodes in document order
    interface TextNodeRef {
      node: ReturnType<typeof $>[number];
      text: string;
    }
    const nodes: TextNodeRef[] = [];

    const walk = (el: ReturnType<typeof $>[number]) => {
      const element = el as unknown as {
        type: string;
        name?: string;
        data?: string;
        children?: ReturnType<typeof $>[number][];
      };

      if (element.type === 'text') {
        const raw = element.data ?? '';
        if (raw.trim().length > 0) {
          nodes.push({ node: el, text: raw });
        }
        return;
      }

      if (
        element.type === 'tag' &&
        element.name &&
        OPAQUE_TAGS.has(element.name.toLowerCase())
      ) {
        return; // skip subtree
      }

      for (const child of element.children ?? []) {
        walk(child);
      }
    };

    for (const root of $.root().contents()) {
      walk(root);
    }

    if (nodes.length === 0) {
      this.logger.log(`translateHtml: no text nodes ${fromLang}→${toLang}`);
      return html;
    }

    this.logger.log(
      `translateHtml: ${nodes.length} text nodes ${fromLang}→${toLang}`,
    );

    // Split into batches that fit within the context window
    const batches: TextNodeRef[][] = [];
    let current: TextNodeRef[] = [];
    let currentSize = 0;
    for (const n of nodes) {
      if (
        currentSize + n.text.length > BATCH_CHAR_LIMIT &&
        current.length > 0
      ) {
        batches.push(current);
        current = [];
        currentSize = 0;
      }
      current.push(n);
      currentSize += n.text.length;
    }
    if (current.length > 0) batches.push(current);

    this.logger.log(
      `translateHtml: ${batches.length} batches (avg ${Math.round(
        nodes.length / batches.length,
      )} nodes/batch)`,
    );

    // Translate each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      this.logger.debug(
        `  batch ${i + 1}/${batches.length} (${batch.length} nodes)`,
      );

      const translations = await this.translateBatch(
        batch.map((b) => b.text),
        fromLang,
        toLang,
      );

      // Apply back
      for (const [j, element] of batch.entries()) {
        const translated = translations[j];
        if (translated && translated.trim().length > 0) {
          const el = element.node as unknown as { data: string };
          el.data = translated;
        }
      }
    }

    const out = $.root().html() ?? html;

    this.logger.log(`translateHtml: done ${fromLang}→${toLang}`);
    return out;
  }

  /**
   * Translates an array of plain text strings in a single Ollama call,
   * using a numbered-line protocol. Returns a same-length array of
   * translations (falls back to the original string for any line that
   * fails to parse).
   */
  private async translateBatch(
    texts: string[],
    fromLang: string,
    toLang: string,
  ): Promise<string[]> {
    if (texts.length === 0) return [];

    const fromName = LANGUAGE_NAMES[fromLang] ?? fromLang;
    const toName = LANGUAGE_NAMES[toLang] ?? toLang;

    // Number each line with a clear delimiter the model is unlikely to output itself
    const numbered = texts
      .map((t, i) => `[${i + 1}] ${t.replaceAll('\n', ' ')}`)
      .join('\n');

    const prompt = `Translate each numbered line from ${fromName} to ${toName}.
RULES:
- Keep the exact same numbering format: [N] translation
- Output ONE translation per input line
- Do not merge lines, do not skip lines
- Do not add explanations or extra text

${numbered}`;

    const raw = await this.callOllama(prompt, fromLang, toLang, true);

    // Parse numbered lines back to array. Forgiving: accepts [1], 1., 1:, etc.
    const result: string[] = Array.from<string>({ length: texts.length }).fill(
      '',
    );
    // eslint-disable-next-line sonarjs/slow-regex -- input is LLM output, bounded by BATCH_CHAR_LIMIT
    const lineRegex = /^\s*\[?(\d+)\]?[.:)\s]\s*(.*)$/;

    for (const line of raw.split('\n')) {
      const m = lineRegex.exec(line);
      if (!m) continue;
      const idx = Number.parseInt(m[1], 10) - 1;
      if (idx >= 0 && idx < texts.length) {
        result[idx] = m[2].trim();
      }
    }

    // Fall back to original for any line that didn't parse
    for (const [i, text] of texts.entries()) {
      if (!result[i]) result[i] = text;
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Ollama API call
  // ---------------------------------------------------------------------------

  private async callOllama(
    text: string,
    fromLang: string,
    toLang: string,
    rawPrompt = false,
  ): Promise<string> {
    let prompt: string;
    if (rawPrompt) {
      // Caller already built the full prompt (e.g. translateBatch)
      prompt = text;
    } else {
      const fromName = LANGUAGE_NAMES[fromLang] ?? fromLang;
      const toName = LANGUAGE_NAMES[toLang] ?? toLang;
      prompt = `Translate the following text from ${fromName} to ${toName}.
Do not add any explanation or commentary. Output ONLY the translated text.

${text}`;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.chunkTimeoutMs);

      const res = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: { num_ctx: 4096 },
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(
          `Ollama API error ${res.status}: ${body.slice(0, 200)}`,
        );
        return text;
      }

      const data = (await res.json()) as OllamaGenerateResponse;
      const translated = data.response?.trim();

      if (!translated) {
        this.logger.warn('Ollama returned empty response — keeping source');
        return text;
      }

      return translated;
    } catch (error) {
      this.logger.error(
        `Ollama call failed (${fromLang}→${toLang}): ${String(error)}`,
      );
      return text;
    }
  }
}
