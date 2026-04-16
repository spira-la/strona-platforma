# CLAUDE.md - Spirala Development Guidelines

> Instructions for Claude Code to work effectively with the Spirala codebase.

---

## Excluded Directories

**DO NOT analyze, search, or modify these directories:**

```
**/node_modules/**
**/dist/**
**/lib/**
**/.next/**
ref/**              # Reference project (BeWonderMe) - read-only
```

---

## Project Identity

**Spirala** (domain: spira-la) is a coaching/therapy platform migrated from BeWonderMe.

- **Frontend**: React 19 + Vite 7 + TypeScript 5.9
- **Backend**: NestJS 11 + Node.js 22 + TypeScript 5.7
- **Database**: PostgreSQL via Supabase + Drizzle ORM
- **Auth**: Supabase Authentication
- **Payments**: Stripe (Cards, BLIK)
- **Storage**: Cloudflare R2 (S3-compatible)
- **CDN/DNS**: Cloudflare
- **i18n**: Polish (primary), English (secondary)

### Zero Firebase

This project has **no Firebase dependencies**. All Firebase services have been replaced:
- Firebase Auth → Supabase Auth
- Firebase Firestore → PostgreSQL (Supabase) + Drizzle ORM
- Firebase Storage → Cloudflare R2
- Firebase Analytics → Cloudflare Analytics
- Firestore rules → Supabase RLS policies

---

## Critical Rule: Hide, Don't Delete

**All BeWonderMe features are preserved in the codebase behind feature flags.** This includes:
- Multi-coach marketplace
- Webinars / LiveKit streaming
- Audio courses / Ebook player
- YouTube integration
- Gift purchases
- Stripe Connect (coach payouts)
- Coach panel
- Reviews system

**NEVER delete these modules.** They will be reactivated in the future. Use feature flags to control visibility.

---

## Architecture

### Frontend Structure

```
src/
├── components/
│   ├── ui/               # shadcn/ui primitives (Spirala themed)
│   ├── layout/           # Navbar, Footer, SectionHero
│   ├── booking/          # BookingCalendar, TimeSlotPicker
│   ├── blog/             # BlogCard, BlogGrid
│   ├── services/         # ServiceCard
│   └── shared/           # NewsletterSignup, ContactForm
├── pages/                # Route pages
├── hooks/                # Custom hooks
├── stores/               # Zustand stores
├── clients/              # API clients
├── types/                # TypeScript types
├── schemas/              # Zod schemas
├── config/
│   └── features.ts       # Feature flags configuration
├── locales/
│   ├── pl/               # Polish (primary)
│   └── en/               # English (secondary)
└── styles/
    └── spirala-theme.css # CSS variables for Spirala theme
```

### Backend Structure

```
backend/src/
├── modules/              # NestJS feature modules (35+)
│   ├── stripe/           # Payments (active)
│   ├── bookings/         # Session booking (active)
│   ├── email/            # Transactional emails (active)
│   ├── invoice/          # PDF generation (active)
│   ├── blogs/            # Blog system (active)
│   ├── newsletter/       # Email subscriptions (active)
│   ├── coupons/          # Discount codes (active)
│   ├── images/           # Image processing (active)
│   ├── webinars/         # [HIDDEN] Feature flag: webinars
│   ├── livekit/          # [HIDDEN] Feature flag: webinars
│   ├── products/         # [HIDDEN] Feature flag: audioCourses
│   ├── stripe-connect/   # [HIDDEN] Feature flag: stripeConnect
│   └── [feature]/        # Other modules
├── common/
│   ├── decorators/       # @Auth, @CurrentUser, @FeatureFlag
│   ├── filters/          # HTTP exception handling
│   ├── guards/           # SupabaseAuthGuard, FeatureFlagGuard, RolesGuard
│   └── interceptors/     # Cache control
├── core/
│   ├── database.service.ts    # Drizzle ORM + PostgreSQL
│   ├── storage.service.ts     # Cloudflare R2 (S3 SDK)
│   └── slug.service.ts        # URL slug generation
└── config/
    └── supabase.config.ts     # Supabase client
```

---

## Design System - Spirala

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `spirala-gold` | #B8963E | Buttons, accents, gradient headers |
| `spirala-gold-light` | #D4B96A | Hover states, subtle accents |
| `spirala-gold-dark` | #8A6F2E | Active states |
| `spirala-cream` | #F9F6F0 | Section backgrounds |
| `spirala-cream-dark` | #EDE8DC | Footer, dividers |

### Typography

| Element | Font | Weight | Usage |
|---------|------|--------|-------|
| Headings | Playfair Display | 700-900 | Page titles, section headings |
| Body | Inter | 400 | Paragraphs, UI text |
| Buttons | Inter | 500-600 | CTAs, navigation |

### Visual Language

- Nature photography (forests, meadows, sunlight)
- Gold gradient overlays on hero images
- Generous whitespace
- Rounded corners (subtle, not excessive)
- Elegant, warm, not clinical

---

## Development Principles

### SOLID Principles (Mandatory)

| Principle | Application |
|-----------|-------------|
| **SRP** | One component = one purpose |
| **OCP** | Extend via composition, not modification |
| **LSP** | Components/hooks are interchangeable |
| **ISP** | Small, focused interfaces |
| **DIP** | Depend on abstractions (ApiClient interface, not fetch directly) |

### Pragmatic Principles

| Principle | Rule |
|-----------|------|
| **DRY** | Extract after 2 repetitions, not before |
| **KISS** | Simplest solution wins |
| **YAGNI** | Don't build it until you need it |
| **Fail Fast** | Validate inputs immediately, return early |

### Anti-Patterns to Avoid

```typescript
// BAD: useEffect for derived state
useEffect(() => setFullName(first + last), [first, last]);

// GOOD: Compute directly
const fullName = `${first} ${last}`;

// BAD: Callback hell
useEffect(() => { fetch().then(x => setState(x.map(y => ...))); }, []);

// GOOD: TanStack Query
const { data } = useQuery({ queryKey: ['items'], queryFn: fetchItems });

// BAD: Direct Firestore queries (OLD PATTERN)
this.firestore.collection('bookings').where('userId', '==', userId);

// GOOD: Drizzle ORM (NEW PATTERN)
await db.select().from(bookings).where(eq(bookings.userId, userId));
```

---

## React Patterns

### State Management Hierarchy

1. **Local state**: `useState` for component-only state
2. **Derived state**: Compute from existing state, no hooks
3. **URL state**: `useSearchParams` for shareable state
4. **Server state**: TanStack Query for API data
5. **Global client state**: Zustand stores (minimal)
6. **Context**: Auth, Theme (stable, rarely-changing)

### Component Patterns

- Functional components only
- Composition over configuration
- Lazy load routes and heavy components
- Error boundaries for resilience
- `forwardRef` for reusable components

### Form Handling

```typescript
// React Hook Form + Zod (standard pattern)
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});
type FormData = z.infer<typeof schema>;
const { register, handleSubmit } = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

---

## NestJS Patterns

### Guards

```typescript
// Auth: Supabase JWT verification
@UseGuards(SupabaseAuthGuard)
@Controller('bookings')
export class BookingsController {}

// Roles: admin, user, coach
@Roles('admin')
@UseGuards(RolesGuard)
@Post()
async create() {}

// Feature flags: hide dormant features
@UseGuards(FeatureFlagGuard)
@FeatureFlag('webinars')
@Controller('api/webinars')
export class WebinarsController {}
```

### Database Queries (Drizzle ORM)

```typescript
// Type-safe queries
const result = await db
  .select()
  .from(bookings)
  .innerJoin(orders, eq(bookings.orderId, orders.id))
  .where(eq(bookings.userId, userId));

// Inserts with returning
const [newBooking] = await db
  .insert(bookings)
  .values({ userId, coachId, startTime, endTime })
  .returning();
```

### Storage (Cloudflare R2)

```typescript
// Upload via S3-compatible API
await this.s3.send(new PutObjectCommand({
  Bucket: this.bucket,
  Key: path,
  Body: file,
  ContentType: contentType,
}));
```

---

## Feature Flags

```typescript
// Frontend: conditional rendering
const showWebinars = useFeatureFlag('webinars');
{showWebinars && <Route path="/webinars" element={<Webinars />} />}

// Backend: guard decorator
@FeatureFlag('webinars')
@Controller('api/webinars')
export class WebinarsController {}
```

### Current Flag State (Spirala Launch)

| Flag | State | Feature |
|------|-------|---------|
| booking | ON | Session booking |
| packages | ON | Session packages |
| blog | ON | Blog system |
| newsletter | ON | Email subscriptions |
| seoManagement | ON | SEO management |
| multiCoach | OFF | Multiple coaches |
| webinars | OFF | Live webinars |
| audioCourses | OFF | Audio courses |
| ebooks | OFF | Ebook reader |
| youtubeContent | OFF | YouTube integration |
| giftPurchases | OFF | Gift purchases |
| stripeConnect | OFF | Coach payouts |
| reviews | OFF | Product reviews |
| multiCurrency | OFF | Multiple currencies |

---

## Development Commands

### Frontend

```bash
npm run dev              # Dev server (http://localhost:5173)
npm run build            # Production build
npm run build:dev        # Dev build (keeps console.log)
npm run lint             # ESLint with auto-fix
npm run preview          # Preview production build
```

### Backend

```bash
cd backend
npm run start:dev        # Dev with hot reload
npm run start:prod       # Production
npm run build            # Compile TypeScript
npm run lint             # ESLint
npm run test             # Unit tests
```

### Database

```bash
npx drizzle-kit generate  # Generate migration from schema changes
npx drizzle-kit migrate   # Run pending migrations
npx drizzle-kit studio    # Visual DB browser
npx supabase start        # Local Supabase (PostgreSQL + Auth)
npx supabase db reset     # Reset local DB
```

### Backend Restrictions

- Modify code, compile, run locally
- Do NOT install from scratch (`npm install` in fresh backend) without permission
- Do NOT deploy (manual by project owner)

---

## i18n Requirements

```typescript
// Always use t() for user-facing text
const { t } = useTranslation();
return <h1>{t('welcome.title')}</h1>;

// Never hardcode strings
// BAD: <button>Zarezerwuj</button>
// GOOD: <button>{t('common.book')}</button>
```

### Translation Files

```
src/locales/
├── pl/translation.json   # Polish (primary)
└── en/translation.json   # English (secondary)
```

---

## Security Checklist

- [ ] Validate all inputs with Zod schemas
- [ ] Use Supabase Auth guards for protected routes
- [ ] Verify purchase ownership before content access
- [ ] Sanitize HTML content (DOMPurify)
- [ ] Use parameterized Drizzle queries (built-in SQL injection protection)
- [ ] Validate Stripe webhook signatures
- [ ] Keep secrets in environment variables (not in code)
- [ ] Run as non-root in Docker containers
- [ ] Supabase RLS policies for row-level security

---

## Code Review Checklist

Before completing any task, verify:

- [ ] No code duplication (DRY)
- [ ] Single responsibility per component/function (SRP)
- [ ] No prop drilling (use Context/stores)
- [ ] All text uses i18n `t()` function
- [ ] TypeScript strict mode passes
- [ ] Zod validation for inputs
- [ ] Error boundaries for async components
- [ ] Loading states handled
- [ ] Mobile responsive
- [ ] Accessibility (ARIA, keyboard nav)
- [ ] Feature flags checked for hidden features

---

## Working with Claude

### Before Writing Code

1. **Search first**: Check `src/hooks/`, `src/components/`, `src/clients/` for existing code
2. **Extend, don't duplicate**: Modify existing utilities rather than creating new ones
3. **Plan the approach**: Identify which files to modify
4. **Consider impact**: Changes to shared code affect multiple features
5. **Check feature flags**: Don't modify hidden feature code unless specifically asked

### Code Style

- Functional components only
- Hooks for all side effects
- shadcn/ui for UI components
- TanStack Query for server state
- Drizzle ORM for database queries
- Zod for validation
- Tailwind for styling (use `spirala-*` theme tokens)

### Commit Messages

```
feat: add booking calendar component
fix: correct payment amount calculation
refactor: migrate bookings module to Drizzle ORM
style: apply Spirala theme to blog cards
chore: update Supabase client configuration
```

---

## Quick Reference

### Tech Stack Versions

| Package | Version |
|---------|---------|
| React | 19.x |
| TypeScript | 5.9+ |
| Vite | 7.x |
| NestJS | 11.x |
| Drizzle ORM | Latest |
| Supabase JS | 2.x |
| Stripe | 19.x |
| TanStack Query | 5.x |
| Zustand | 5.x |
| i18next | 25.x |
| Zod | 3.x (FE) / 4.x (BE) |
| @aws-sdk/client-s3 | 3.x |
| Tailwind CSS | 3.x |
| shadcn/ui | Latest |

### Key Files

| Purpose | Location |
|---------|----------|
| Routes | `src/App.tsx` |
| Auth Context | `src/contexts/AuthContext.tsx` |
| Feature Flags | `src/config/features.ts` |
| API Clients | `src/clients/` |
| Hooks | `src/hooks/` |
| UI Components | `src/components/ui/` |
| Drizzle Schema | `backend/src/db/schema.ts` |
| Supabase Config | `backend/src/config/supabase.config.ts` |
| Storage Service | `backend/src/core/storage.service.ts` |
| Design Reference | `spirala.pen` (Pencil MCP) |
| Migration Plan | `plan/` directory |

### Reference Project

The original BeWonderMe codebase is at `ref/BeWonderMeFE/` for reference. Read-only - do not modify.

<!-- ORIONOPS:BEGIN -->
## OrionOps Integration

This project is connected to OrionOps for AI-assisted development.

### How to Determine What to Do Next (PRIORITY ORDER)

When the user asks "what's next?", "continue", "what should I do?", or starts a new session:

1. **OrionOps Context** (ALWAYS first): Call `get_context(project_id)` + `list_tasks(project_id)`
   - ANY status is relevant: `blocked`, `in_progress`, `completed` — all contain useful info
   - A `blocked` context tells you what went wrong and what to fix
   - A `completed` context tells you what was done and what comes next
   - An `in_progress` context tells you what to continue working on
   - `list_tasks` shows the full backlog with states and priorities
2. **Local files**: Check for `plans/`, `PLAN.md`, `tasks/`, `TODO.md` in the project root
3. **Git history**: `git log --oneline -10` to understand recent changes

### Session Lifecycle (MUST FOLLOW)

1. **Session Start**: Call `get_context(project_id)` to retrieve prior work — regardless of status.
2. **Before Coding**: Call `search_guidelines` and `search_project_config` for patterns.
3. **Task Claim**: Call `task_claim(task_id, agent_id)` before starting any task.
4. **During Work**: Call `task_progress(task_id, agent_id, progress)` periodically.
5. **Task Done**: Call `task_complete(task_id, agent_id, summary, files_modified)` when finished.
6. **Session End**: **ALWAYS** call `save_context(...)` to persist progress — even if blocked or incomplete.

### After `/clear` or New Conversation

**CRITICAL**: ALWAYS call `get_context(project_id)` FIRST before doing anything else. Do NOT skip this step. Do NOT say "no prior context" without actually calling the tool. The context contains decisions, blockers, files modified, and the current task state. Any status (blocked, in_progress, completed) is valuable — do not ignore context because of its status.

### Available MCP Tools

| Tool | When to Use |
|------|-------------|
| `get_context` | **Start of every session** — retrieve prior work (any status) |
| `save_context` | **End of every session** — persist progress for next time |
| `list_tasks` | See current tasks, backlog, and priorities |
| `search_guidelines` | Before implementing — get coding patterns and standards |
| `search_project_config` | Architecture decisions — find existing conventions |
| `get_role_context` | When switching roles — get full agent profile |
| `get_documentation` | Technical docs about frameworks and libraries |
| `create_task` | Create new tasks in the project backlog |
| `set_project` | Select the active project for all operations |

### Project: spirala

<!-- ORIONOPS:END -->















