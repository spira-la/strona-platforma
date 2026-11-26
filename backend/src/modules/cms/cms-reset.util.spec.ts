import { isMediaOrConfigLeaf, pruneTextFields } from './cms-reset.util.js';

describe('cms-reset.util', () => {
  it('keeps media/config suffixes and URLs, removes text and text styles', () => {
    expect(isMediaOrConfigLeaf('heroBgBgColor', '#fff')).toBe(true);
    expect(isMediaOrConfigLeaf('heroOverlayTop', '40')).toBe(true);
    expect(isMediaOrConfigLeaf('heroBgPos', '50% 20%')).toBe(true);
    expect(isMediaOrConfigLeaf('ctaAction', 'calendly')).toBe(true);
    expect(
      isMediaOrConfigLeaf(
        'heroBg',
        'https://cdn.x.pl/cms/home/heroBg.webp?v=1',
      ),
    ).toBe(true);
    expect(isMediaOrConfigLeaf('calendlyUrl', '')).toBe(true);
    expect(isMediaOrConfigLeaf('title', 'Hello')).toBe(false);
    expect(isMediaOrConfigLeaf('titleColor', '#000')).toBe(false);
    expect(isMediaOrConfigLeaf('titleBold', '1')).toBe(false);
    expect(isMediaOrConfigLeaf('body', 'See https://x.pl for more')).toBe(
      false,
    );
  });

  it('prunes nested text, drops empty objects and counts', () => {
    const input = {
      hero: { title: 'A', titleSize: '2', image: 'https://a.b/c.webp' },
      info: { calendlyUrl: 'https://calendly.com/x', phone: '123' },
      body: 'x',
    };
    const kept = pruneTextFields(input, true);
    expect(kept.value).toEqual({
      hero: { image: 'https://a.b/c.webp' },
      info: { calendlyUrl: 'https://calendly.com/x' },
    });
    expect(kept.removed).toBe(4);
    expect(kept.kept).toBe(2);
    const all = pruneTextFields(input, false);
    expect(all.value).toEqual({});
    expect(all.removed).toBe(6);
    expect(input.hero.title).toBe('A');
  });
});
