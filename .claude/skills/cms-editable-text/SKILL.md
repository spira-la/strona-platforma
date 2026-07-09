---
name: cms-editable-text
description: CMS inline-editing pattern for Spirala. Covers EditableText usage, CMSSectionKey registration, static-text seed flow, transparent navbar, and i18n (PL/EN/ES). Required for every new page.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# CMS EditableText Pattern — Spirala

> Every user-visible text string on every page MUST use `EditableText`, not raw JSX strings. This enables admin inline editing and auto-translation to EN + ES.

---

## 1. The Rule: No Hardcoded Strings

```tsx
// BAD — never do this
<h1>Matka, żona, kochanka</h1>

// GOOD — always wrap in EditableText
<EditableText section="motherWifeLover" fieldPath="hero.title">
  Matka, żona, kochanka
</EditableText>
```

The `children` prop is the **Polish fallback** (client-approved copy). It is shown when the CMS has no saved value for that field yet, and it becomes the seed value when admin runs "Seed + Translate".

---

## 2. CMSSectionKey — Register Every New Page

Every new page section must be added to the union in:
**`frontend/src/types/cms.types.ts`**

```typescript
export type CMSSectionKey =
  | 'home'
  | 'about'
  | 'services'
  | 'howIWork'
  | 'blog'
  | 'contact'
  | 'navbar'
  | 'footer'
  | 'mamyNastolatkow'
  | 'motherWifeLover'   // ← added when /matka-zona-kochanka was created
  // add new pages here
  ;
```

TypeScript will error if you use an unknown section key — that's intentional.

---

## 3. fieldPath Convention

`fieldPath` must be unique within a section. Use dot notation to group logically:

```
hero.title          hero.subtitle       hero.cta
section1.title      section1.body       section1.body2
section2.title      section2.body
cta.title           cta.subtitle        cta.button
```

No spaces, no special characters, camelCase segments.

---

## 4. EditableText Variants

```tsx
import { EditableText } from '@/components/cms/EditableText';

// Inline text (renders a <span> by default)
<EditableText section="home" fieldPath="hero.title">
  Spirala — coaching dla kobiet
</EditableText>

// Multiline / paragraph — use as prop
<EditableText section="home" fieldPath="hero.body" as="p">
  Terapia systemowa i coaching...
</EditableText>

// Background image
<EditableBackground section="home" fieldPath="hero.image" />

// Gold overlay on hero
<EditableOverlay section="home" fieldPath="hero.overlay" />
```

---

## 5. How the Seed Flow Works

When a field has **no CMS value** yet, `EditableText` calls `registerDefault(section, fieldPath, children)` on the CMSContext. This stores the PL string in a `useRef<Map>` — no re-renders.

Admin workflow:
1. Browse any page (fields register themselves silently)
2. Go to `/admin/languages`
3. See "X unset fields detected" panel
4. Click **"Seed + Translate"**
5. `POST /cms/bulk-seed` saves PL values (skips already-set fields)
6. `POST /cms/retranslate-all` translates everything to EN + ES via OpenRouter

The seed is **idempotent** — repeating it never overwrites existing admin edits.

---

## 6. Transparent Navbar on Dark Hero Pages

Pages with a dark image + gold overlay hero must also be added to **`frontend/src/components/layout/Layout.tsx`**:

```typescript
const DARK_HERO_PAGES = new Set([
  '/',
  '/mama-nastolatka',
  '/matka-zona-kochanka',  // ← added with the page
  '/o-mnie',
  // ... all pages with dark hero
]);
```

If a page has a dark hero but is NOT in this Set, the navbar will show white background on load — wrong.

---

## 7. Translation Keys (3 Languages Always)

Every new common label goes into all three locale files:
- `frontend/src/locales/pl/translation.json` — Polish (primary, client-approved copy)
- `frontend/src/locales/en/translation.json` — English
- `frontend/src/locales/es/translation.json` — Spanish

**Never just PL + EN. Always add ES too.**

```json
// pl
"motherWifeLover": "Matka, żona, kochanka",
"specializations": "Specjalizacje",
"content": "Treści"

// en
"motherWifeLover": "Mother, Wife, Lover",
"specializations": "Specializations",
"content": "Content"

// es
"motherWifeLover": "Madre, esposa, amante",
"specializations": "Especializaciones",
"content": "Contenido"
```

---

## 8. New Page Checklist

When creating any new page for Spirala:

- [ ] All visible text wrapped in `<EditableText section="X" fieldPath="y.z">`
- [ ] Section key added to `CMSSectionKey` in `cms.types.ts`
- [ ] Page route added to `App.tsx` (lazy + Suspense)
- [ ] If dark hero: add path to `DARK_HERO_PAGES` in `Layout.tsx`
- [ ] If shown in nav: add to `Navbar.tsx` (direct link or group item)
- [ ] Add translation keys to `pl/en/es` translation.json
- [ ] After deploy: browse the page as admin → Languages panel → Seed + Translate

---

## 9. Backend: bulkSeed Endpoint

`POST /cms/bulk-seed` — no auth required (public, idempotent)

```typescript
// Request body
{ entries: [{ section: string, fieldPath: string, value: string }] }

// Response
{ success: true, seeded: 12, message: "Seeded 12 PL fields." }
```

The service skips any field that already has a PL value. After seeding with `seeded > 0`, the controller calls `purgeCmsContent()` to bust the Cloudflare edge cache.

---

## 10. Key Files

| File | Purpose |
|------|---------|
| `src/types/cms.types.ts` | `CMSSectionKey` union + `UnsetDefaultField` type |
| `src/contexts/CMSContext.tsx` | `registerDefault()` + `getUnsetDefaults()` |
| `src/components/cms/EditableText.tsx` | The component — renders or edits |
| `src/clients/cms.client.ts` | `bulkSeed()` + `retranslateAll()` API methods |
| `src/pages/admin/Languages.tsx` | "Seed + Translate" admin panel |
| `src/components/layout/Layout.tsx` | `DARK_HERO_PAGES` Set for transparent navbar |
| `backend/src/modules/cms/cms.service.ts` | `bulkSeed()` + `flattenFields()` logic |
| `backend/src/modules/cms/cms.controller.ts` | `POST /cms/bulk-seed` endpoint |
