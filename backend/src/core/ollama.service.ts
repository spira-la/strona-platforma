import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
// HTML chunking — splits TipTap content into translatable blocks
// ---------------------------------------------------------------------------

/** Tags that never contain translatable text */
const NON_TEXT_TAGS = new Set(['img', 'hr', 'br']);

interface HtmlChunk {
  html: string;
  translatable: boolean;
}

/** Check if a block has visible text (strip tags, check length) */
function hasText(html: string): boolean {
  let inTag = false;
  let text = '';
  for (const ch of html) {
    if (ch === '<') {
      inTag = true;
      continue;
    }
    if (ch === '>') {
      inTag = false;
      continue;
    }
    if (!inTag) text += ch;
  }
  return text.trim().length > 0;
}

/**
 * Splits TipTap HTML into chunks. Uses a simple approach:
 * split on `</p>`, `</h1>`..`</h6>`, `</blockquote>`, `</li>`, `</pre>`,
 * keeping the closing tag attached to each chunk.
 */
function splitHtmlIntoChunks(html: string): HtmlChunk[] {
  // Split on closing block tags, keeping the delimiter
  const parts = html.split(
    /(?<=<\/(?:p|h[1-6]|blockquote|li|pre|div|ul|ol|table|tr|td|th)>)/i,
  );

  const chunks: HtmlChunk[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Detect non-text elements (standalone <img>, <hr>, <br>, empty <p></p>)
    const tagMatch = /^<(\w+)/.exec(trimmed);
    const tagName = tagMatch?.[1]?.toLowerCase() ?? '';
    const isNonText = NON_TEXT_TAGS.has(tagName);
    const isEmpty = trimmed === '<p></p>';

    chunks.push({
      html: part,
      translatable: !isNonText && !isEmpty && hasText(trimmed),
    });
  }

  return chunks;
}

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
   * Translates HTML content (blog body from TipTap) — chunked by blocks.
   * Each <p>, <h1-h6>, <blockquote>, etc. is translated individually.
   * Images, empty paragraphs, and non-text blocks are passed through.
   */
  async translateHtml(
    html: string,
    fromLang: string,
    toLang: string,
  ): Promise<string> {
    if (!html.trim()) return html;

    const chunks = splitHtmlIntoChunks(html);
    const total = chunks.filter((c) => c.translatable).length;

    this.logger.log(
      `translateHtml: ${chunks.length} chunks (${total} translatable) ${fromLang}→${toLang}`,
    );

    const results: string[] = [];
    let done = 0;

    for (const chunk of chunks) {
      if (!chunk.translatable) {
        results.push(chunk.html);
        continue;
      }

      done++;
      this.logger.debug(
        `  chunk ${done}/${total} (${chunk.html.length} chars)`,
      );

      const translated = await this.callOllama(chunk.html, fromLang, toLang);
      results.push(translated);
    }

    this.logger.log(
      `translateHtml: completed ${total} chunks ${fromLang}→${toLang}`,
    );

    return results.join('\n');
  }

  // ---------------------------------------------------------------------------
  // Ollama API call
  // ---------------------------------------------------------------------------

  private async callOllama(
    text: string,
    fromLang: string,
    toLang: string,
  ): Promise<string> {
    const fromName = LANGUAGE_NAMES[fromLang] ?? fromLang;
    const toName = LANGUAGE_NAMES[toLang] ?? toLang;

    const prompt = `Translate the following text from ${fromName} to ${toName}.
IMPORTANT: Preserve ALL HTML tags and attributes exactly as they are. Only translate the visible text content.
Do not add any explanation or commentary. Output ONLY the translated text.

${text}`;

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
