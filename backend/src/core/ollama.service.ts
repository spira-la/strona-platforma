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
// Service
// ---------------------------------------------------------------------------

/**
 * Communicates with a local Ollama instance for AI-powered text translation.
 * Translation is designed to preserve HTML tags (TipTap content).
 * Uses Node 22 native fetch — no extra HTTP client dependency needed.
 */
@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly ollamaUrl: string;
  private readonly model = 'qwen2.5:3b';

  /** 5 minutes — CPU inference is slow */
  private readonly timeoutMs = 5 * 60 * 1000;

  constructor(private readonly config: ConfigService) {
    this.ollamaUrl =
      this.config.get<string>('OLLAMA_URL') ?? 'http://localhost:45020';
  }

  /**
   * Checks whether the Ollama service is reachable by hitting /api/tags.
   * Returns false (never throws) so callers can degrade gracefully.
   */
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

  /**
   * Translates a piece of text (may contain HTML) from one language to another.
   * HTML tags are preserved — only inner text content is translated.
   *
   * @param text      - Source text (plain or HTML from TipTap)
   * @param fromLang  - BCP-47 language code, e.g. 'pl'
   * @param toLang    - BCP-47 language code, e.g. 'en'
   * @returns Translated text, or the original text when translation fails.
   */
  async translate(
    text: string,
    fromLang: string,
    toLang: string,
  ): Promise<string> {
    const fromName = LANGUAGE_NAMES[fromLang] ?? fromLang;
    const toName = LANGUAGE_NAMES[toLang] ?? toLang;

    const prompt = `Translate the following text from ${fromName} to ${toName}.
IMPORTANT: Preserve ALL HTML tags exactly as they are. Only translate the text content between tags.
Do not add any explanation, just output the translated text.

Text to translate:
${text}`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const res = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(
          `Ollama API error ${res.status} ${res.statusText}: ${body}`,
        );
        return text;
      }

      const data = (await res.json()) as OllamaGenerateResponse;
      const translated = data.response?.trim();

      if (!translated) {
        this.logger.warn('Ollama returned empty response — using source text');
        return text;
      }

      this.logger.debug(
        `Translated ${fromLang}→${toLang} (${text.length} chars → ${translated.length} chars)`,
      );

      return translated;
    } catch (error) {
      this.logger.error(
        `Translation failed (${fromLang}→${toLang}): ${String(error)}`,
      );
      // Return original text so callers can decide what to store
      return text;
    }
  }
}
