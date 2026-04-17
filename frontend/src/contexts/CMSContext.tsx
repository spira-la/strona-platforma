import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { cmsClient } from '@/clients/cms.client';
import { useRoles } from '@/hooks/useRoles';
import type {
  CMSContextValue,
  CMSLanguage,
  CMSSectionKey,
} from '@/types/cms.types';

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

const CACHE_KEY = 'spirala_cms_content';
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  content: Record<string, Record<CMSLanguage, Record<string, unknown>>>;
  version: number;
  savedAt: number;
}

function readCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.savedAt > CACHE_MAX_AGE_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function writeCache(entry: CacheEntry): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Storage quota exceeded — fail silently
  }
}

// ---------------------------------------------------------------------------
// Nested field resolution
// ---------------------------------------------------------------------------

/**
 * Resolves a dot-separated fieldPath inside an object.
 * e.g. getNestedValue({ story: { paragraph1: "Hello" } }, "story.paragraph1") === "Hello"
 */
function getNestedValue(
  obj: Record<string, unknown>,
  fieldPath: string,
): string | undefined {
  const parts = fieldPath.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  if (typeof current === 'string') return current;
  return undefined;
}

/**
 * Returns a deep clone of obj with the value at fieldPath set to value.
 */
function setNestedValue(
  obj: Record<string, unknown>,
  fieldPath: string,
  value: string,
): Record<string, unknown> {
  const parts = fieldPath.split('.');
  const result = { ...obj };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cursor: any = result;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    cursor[key] =
      typeof cursor[key] === 'object' && cursor[key] !== null
        ? { ...(cursor[key] as Record<string, unknown>) }
        : {};
    cursor = cursor[key];
  }
  const lastKey = parts.at(-1);
  if (lastKey !== undefined) cursor[lastKey] = value;
  return result;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CMSContext = createContext<CMSContextValue | null>(null);

interface CMSProviderProps {
  children: ReactNode;
}

export function CMSProvider({ children }: CMSProviderProps) {
  const { i18n } = useTranslation();
  const { isAdmin } = useRoles();

  const [content, setContent] = useState<
    Record<string, Record<CMSLanguage, Record<string, unknown>>>
  >(() => readCache()?.content ?? {});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isEditMode, setIsEditModeState] = useState(false);

  // Track latest version to keep cache consistent
  const versionRef = useRef<number>(readCache()?.version ?? 0);

  // Fetches the full content payload (expensive; cached by Cloudflare).
  const fetchContent = useCallback(async (): Promise<void> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const res = await fetch('/api/cms/content', {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const response = await res.json();
      setContent(response.content);
      versionRef.current = response.version;
      writeCache({
        content: response.content,
        version: response.version,
        savedAt: Date.now(),
      });
      setError(null);
    } catch {
      // Silently fall back to cache/placeholders — no console error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Checks the server's current version (cheap, uncached) and only
  // refetches the full content when it differs from what we have
  // cached locally. This keeps Cloudflare doing its job for the heavy
  // payload while guaranteeing edits propagate within one request.
  const syncIfStale = useCallback(async (): Promise<void> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const res = await fetch('/api/cms/version', {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const { version } = (await res.json()) as { version: number };
      if (version === versionRef.current) {
        setIsLoading(false);
      } else {
        await fetchContent();
      }
    } catch {
      // No network — keep whatever we have in local state
      setIsLoading(false);
    }
  }, [fetchContent]);

  useEffect(() => {
    // If we have a cached copy render from it instantly and just
    // verify freshness in the background. On a cold cache we must
    // fetch the full content before the page has anything to show.
    if (versionRef.current > 0) {
      void syncIfStale();
    } else {
      void fetchContent();
    }
  }, [fetchContent, syncIfStale]);

  const setEditMode = useCallback(
    (enabled: boolean) => {
      // Guard: only admins may enter edit mode
      if (enabled && !isAdmin) return;
      setIsEditModeState(enabled);
    },
    [isAdmin],
  );

  // Style + media suffixes are stored ONLY in PL and apply to all languages
  // (design, images, overlays are global; only text content differs per language)
  const STYLE_SUFFIXES = [
    // Text styling
    'Bold',
    'Italic',
    'Align',
    'Size',
    'Color',
    'MaxWidth',
    'MaxHeight',
    'Multiline',
    // Overlays
    'OverlayTop',
    'OverlayBottom',
    'OverlayAngle',
    // Backgrounds
    'Pos',
    'Fit',
  ];

  // Fields that are images/media (stored at root fieldPath without suffix).
  // We identify them by convention: fieldPath contains 'bg', 'image', 'logo',
  // 'photo', 'icon', 'avatar', 'cover', or ends in 'Src'.
  const MEDIA_FIELD_PATTERNS = [
    /bg$/i,
    /bg\./i,
    /image$/i,
    /image\./i,
    /logo$/i,
    /photo$/i,
    /icon$/i,
    /avatar$/i,
    /cover$/i,
    /Src$/,
  ];

  const isStyleField = (fieldPath: string): boolean => {
    if (STYLE_SUFFIXES.some((s) => fieldPath.endsWith(s))) return true;
    return MEDIA_FIELD_PATTERNS.some((re) => re.test(fieldPath));
  };

  const getFieldValue = useCallback(
    (section: CMSSectionKey, fieldPath: string): string => {
      const sectionData = content[section];
      if (!sectionData) return fieldPath;

      // Style fields always read from PL (design is global)
      const lang: CMSLanguage = isStyleField(fieldPath)
        ? 'pl'
        : (i18n.language as CMSLanguage);

      const langData = sectionData[lang] ?? sectionData['pl'];
      if (!langData) return fieldPath;

      return getNestedValue(langData, fieldPath) ?? fieldPath;
    },
    [content, i18n.language],
  );

  const updateField = useCallback(
    async (
      section: CMSSectionKey,
      fieldPath: string,
      value: string,
    ): Promise<void> => {
      // Style fields always write to PL (design is global)
      const lang: CMSLanguage = isStyleField(fieldPath)
        ? 'pl'
        : (i18n.language as CMSLanguage);

      // Optimistic update
      setContent((prev) => {
        const sectionData = prev[section] ?? {};
        const langData = sectionData[lang] ?? {};
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [lang]: setNestedValue(langData, fieldPath, value),
          },
        };
      });

      // Persist to API. The response carries the new server version
      // so we can bump the local version ref and keep the cache valid
      // (no forced refetch needed — the optimistic state is correct).
      const { version } = await cmsClient.updateField(
        section,
        lang,
        fieldPath,
        value,
      );
      versionRef.current = version;

      setContent((current) => {
        writeCache({
          content: current,
          version,
          savedAt: Date.now(),
        });
        return current;
      });
    },
    [i18n.language],
  );

  const value: CMSContextValue = {
    content,
    isLoading,
    error,
    isEditMode: isEditMode && isAdmin,
    setEditMode,
    getFieldValue,
    updateField,
    refresh: fetchContent,
  };

  return <CMSContext.Provider value={value}>{children}</CMSContext.Provider>;
}

export function useCMS(): CMSContextValue {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return context;
}
