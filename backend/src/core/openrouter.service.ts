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
// OpenRouter API types
// ---------------------------------------------------------------------------

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// ---------------------------------------------------------------------------
// HTML text-node walker — extracts translatable text while preserving structure
// ---------------------------------------------------------------------------

/** Tags whose text content we should never translate (embedded media, code) */
const OPAQUE_TAGS = new Set(['iframe', 'script', 'style', 'code', 'pre']);

/**
 * Max characters per batch request.
 * gpt-4o-mini has a 128k context window — 4000 chars is safe and keeps
 * batches large enough that the model has sentence context to work with.
 */
const BATCH_CHAR_LIMIT = 4000;

/** System prompt shared across all translation calls */
const SYSTEM_PROMPT =
  'You are a professional translator specializing in wellness, coaching, and therapy content for the Polish market. ' +
  'Translate accurately while preserving the warm, professional tone of the Spirala coaching platform. ' +
  'Never add explanations or commentary — output only the translation.';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly apiKey: string;
  private readonly model: string;

  /** 3 minutes per chunk — cloud API, generous timeout */
  private readonly chunkTimeoutMs = 3 * 60 * 1000;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('OPENROUTER_API_KEY') ?? '';
    this.model =
      this.config.get<string>('OPENROUTER_MODEL') ?? 'openai/gpt-4o-mini';

    if (!this.apiKey) {
      this.logger.warn(
        'OPENROUTER_API_KEY is not set — translations will be skipped',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Health check
  // ---------------------------------------------------------------------------

  isAvailable(): boolean {
    return this.apiKey.length > 0;
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

    const fromName = LANGUAGE_NAMES[fromLang] ?? fromLang;
    const toName = LANGUAGE_NAMES[toLang] ?? toLang;

    const prompt = `Translate the following text from ${fromName} to ${toName}. Output ONLY the translated text.\n\n${text}`;
    return this.callOpenRouter([{ role: 'user', content: prompt }]);
  }

  /**
   * Translates HTML content (blog body from TipTap) preserving structure.
   *
   * Uses cheerio to parse the HTML into a DOM tree, walks all text nodes,
   * batches them into numbered-lines prompts, then writes the translations
   * back to the exact same text nodes. All attributes, classes, nested
   * structures (tables, task lists, images, youtube embeds) are preserved.
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
        return;
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

    // Split into batches
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
      `translateHtml: ${batches.length} batches (avg ${Math.round(nodes.length / batches.length)} nodes/batch)`,
    );

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
   * Translates an array of plain text strings in a single API call,
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

    const raw = await this.callOpenRouter([{ role: 'user', content: prompt }]);

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

    for (const [i, text] of texts.entries()) {
      if (!result[i]) result[i] = text;
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // OpenRouter API call
  // ---------------------------------------------------------------------------

  private lastUserContent(messages: OpenRouterMessage[]): string {
    return (
      [...messages].toReversed().find((m) => m.role === 'user')?.content ?? ''
    );
  }

  private async callOpenRouter(messages: OpenRouterMessage[]): Promise<string> {
    if (!this.apiKey) {
      this.logger.warn('OPENROUTER_API_KEY not set — returning source text');
      return this.lastUserContent(messages);
    }

    const messagesWithSystem: OpenRouterMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ];

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.chunkTimeoutMs);

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://spira-la.com',
          'X-Title': 'Spirala',
        },
        body: JSON.stringify({
          model: this.model,
          messages: messagesWithSystem,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(
          `OpenRouter API error ${res.status}: ${body.slice(0, 200)}`,
        );
        return this.lastUserContent(messages);
      }

      const data = (await res.json()) as OpenRouterResponse;
      const translated = data.choices?.[0]?.message?.content?.trim();

      if (!translated) {
        this.logger.warn('OpenRouter returned empty response — keeping source');
        return this.lastUserContent(messages);
      }

      return translated;
    } catch (error) {
      this.logger.error(`OpenRouter call failed: ${String(error)}`);
      return this.lastUserContent(messages);
    }
  }
}
