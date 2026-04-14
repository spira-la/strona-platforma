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
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();

  // Check admin status from Supabase user metadata
  const isAdmin =
    user?.app_metadata?.role === 'admin' ||
    user?.user_metadata?.role === 'admin';

  const [content, setContent] = useState<
    Record<string, Record<CMSLanguage, Record<string, unknown>>>
  >(() => readCache()?.content ?? {});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isEditMode, setIsEditModeState] = useState(false);

  // Track latest version to keep cache consistent
  const versionRef = useRef<number>(readCache()?.version ?? 0);

  useEffect(() => {
    let cancelled = false;

    async function fetchContent() {
      // Skip API call entirely when backend is not available.
      // In dev without backend, just use placeholders.
      try {
        // Quick check: if the API base is proxied and backend isn't running, abort fast
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const res = await fetch('/api/cms/content', {
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const response = await res.json();
        if (cancelled) return;

        setContent(response.content);
        versionRef.current = response.version;
        writeCache({
          content: response.content,
          version: response.version,
          savedAt: Date.now(),
        });
        setError(null);
      } catch {
        if (cancelled) return;
        // Silently fall back to cache/placeholders — no console error
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchContent();
    return () => {
      cancelled = true;
    };
  }, []);

  const setEditMode = useCallback(
    (enabled: boolean) => {
      // Guard: only admins may enter edit mode
      if (enabled && !isAdmin) return;
      setIsEditModeState(enabled);
    },
    [isAdmin],
  );

  const getFieldValue = useCallback(
    (section: CMSSectionKey, fieldPath: string): string => {
      const sectionData = content[section];
      if (!sectionData) return fieldPath;

      const lang = i18n.language as CMSLanguage;

      // Try current language first, then 'pl' as primary fallback
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
      const lang = i18n.language as CMSLanguage;

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

      // Persist to API
      await cmsClient.updateField(section, lang, fieldPath, value);

      // Refresh cache with updated content — re-read state lazily via a
      // functional updater to avoid stale closure over `content`
      setContent((current) => {
        writeCache({
          content: current,
          version: versionRef.current,
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
