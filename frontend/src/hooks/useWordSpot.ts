import { useLayoutEffect, useRef, useState } from 'react';

export interface WordSpot {
  /** px from the wrapper's left edge */
  left: number;
  /** px from the wrapper's bottom edge */
  bottom: number;
}

/**
 * Finds a word inside a (CMS-editable) text and returns a spot on top of it,
 * relative to the wrapper `ref` — so a painted friend can land on that word
 * (client 2026-11-10: the butterfly sits on "Życie" in the Start hero).
 *
 * The text stays editable: the word is looked up in the rendered text on
 * every change, resize and font load. If the client rewrites the title and
 * the word is gone, the friend lands on the first word instead.
 *
 * `fx` / `fy` pick the point inside the word's box: fx = 0…1 across the
 * word, fy = 0…1 down its glyph box (≈0.4 is the top of lowercase letters
 * for Cormorant).
 */
export function useWordSpot<T extends HTMLElement = HTMLDivElement>(
  word: string,
  fx = 0.6,
  fy = 0.4,
) {
  const ref = useRef<T>(null);
  const [spot, setSpot] = useState<WordSpot | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const findRange = (): Range | null => {
      const needle = word.toLocaleLowerCase('pl');
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) =>
          n.parentElement?.closest('style, [aria-hidden="true"]')
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT,
      });
      let first: { node: Text; start: number; end: number } | null = null;
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const node = n as Text;
        const text = node.data;
        const idx = text.toLocaleLowerCase('pl').indexOf(needle);
        const range = document.createRange();
        if (idx !== -1) {
          range.setStart(node, idx);
          range.setEnd(node, idx + word.length);
          return range;
        }
        const m = /\S+/.exec(text);
        if (!first && m)
          first = { node, start: m.index, end: m.index + m[0].length };
      }
      if (!first) return null;
      const range = document.createRange();
      range.setStart(first.node, first.start);
      range.setEnd(first.node, first.end);
      return range;
    };

    const measure = () => {
      const range = findRange();
      if (!range) {
        setSpot(null);
        return;
      }
      const wrap = el.getBoundingClientRect();
      const r = range.getClientRects()[0] ?? range.getBoundingClientRect();
      const next = {
        left: Math.round(r.left - wrap.left + r.width * fx),
        bottom: Math.round(wrap.bottom - (r.top + r.height * fy)),
      };
      setSpot((prev) =>
        prev && prev.left === next.left && prev.bottom === next.bottom
          ? prev
          : next,
      );
    };

    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    const edits = new MutationObserver(measure);
    edits.observe(el, { subtree: true, childList: true, characterData: true });
    let alive = true;
    void document.fonts?.ready.then(() => alive && measure());
    return () => {
      alive = false;
      resize.disconnect();
      edits.disconnect();
    };
  }, [word, fx, fy]);

  return { ref, spot };
}
