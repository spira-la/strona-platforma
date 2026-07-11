# Spirala — Guía del Proyecto

> Esta sección es específica de Spirala y describe cómo funciona realmente el sistema. La sección "OrionOps" más abajo es la herramienta interna de gestión de tareas/equipo — es genérica, no describe la arquitectura de Spirala. **Si estás resolviendo un pedido de la clienta sobre el sitio, esta sección de arriba es la que importa.**

## Qué es Spirala

Spirala (dominio `spira-la`) es una plataforma de coaching/terapia para una sola coach, migrada desde un producto anterior ("BeWonderMe") que era multi-coach/marketplace. Ver `plan/01-estrategia-general.md` para el detalle completo.

**Filosofía central — "Ocultar, no eliminar":** todo el código de features que hoy no se usan (multi-coach, marketplace, webinars, audio courses/ebooks, YouTube, gift purchases, Stripe Connect, panel de coach completo, reviews, CMS avanzado) **se mantiene en el codebase**, oculto detrás de feature flags (`plan/02-feature-flags.md`). Nunca borres ni reescribas ese código pensando que "no se usa" — está ahí para reactivarse en el futuro sin rehacer nada. Si una tarea parece requerir borrar un módulo entero, es casi seguro que la respuesta correcta es un feature flag, no un `rm`.

## Stack real (verificado contra el código, no contra los planes originales)

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite 7 + TypeScript, Tailwind + shadcn/ui + Radix |
| Estado | Zustand (global) + TanStack Query (server state) |
| Backend | NestJS 11 + Node 22 + TypeScript |
| Base de datos | PostgreSQL (Supabase) + **TypeORM** (`@nestjs/typeorm`) — no Drizzle, aunque los docs originales en `plan/03-base-de-datos.md` y `plan/06-backend.md` lo mencionen; el equipo pivoteó a TypeORM durante la implementación |
| Auth | Supabase Auth (JWT) |
| Storage | Cloudflare R2 (S3-compatible, `@aws-sdk/client-s3`) |
| Pagos | Stripe |
| i18n | i18next — **PL (principal) + EN + ES, siempre las 3** |
| Diseño de referencia | `spirala.pen` (Pencil) — dorado/tierra, Playfair Display + sans, fotografía de naturaleza |

Los agentes en `.claude/agents/` ya reflejan este stack real. Si algún documento en `plan/` contradice el código (p. ej. menciona Drizzle), **el código gana** — esos planes son históricos, no la fuente de verdad actual.

## El sistema de CMS — cada sección nueva debe ser editable

Esto es lo más importante para cualquier pedido de la clienta: **todo texto visible en cualquier página debe pasar por el sistema de CMS inline-editing**, nunca un string JSX crudo. Esto es lo que le permite a la clienta editar el contenido de su sitio sin tocar código, y lo que dispara la auto-traducción a EN/ES.

Regla de oro:
```tsx
// MAL — nunca así
<h1>Matka, żona, kochanka</h1>

// BIEN
<EditableText section="motherWifeLover" fieldPath="hero.title">
  Matka, żona, kochanka
</EditableText>
```

Al crear o modificar cualquier página:
1. Todo texto visible envuelto en `<EditableText section="X" fieldPath="y.z">fallback en PL</EditableText>`
2. Nueva sección registrada en `CMSSectionKey` (`frontend/src/types/cms.types.ts`) — TypeScript debe fallar si usás una key no registrada, es intencional
3. Si la página tiene hero oscuro con overlay dorado, agregar su ruta a `DARK_HERO_PAGES` en `frontend/src/components/layout/Layout.tsx`
4. Claves de traducción agregadas a **las tres** locales: `frontend/src/locales/{pl,en,es}/translation.json`
5. Después de desplegar: la clienta (como admin) navega la página → `/admin/languages` → "Seed + Translate"

Guía completa, con todos los archivos clave y el flujo de seed/translate: skill **`cms-editable-text`** (`.claude/skills/cms-editable-text/SKILL.md`) — se carga automáticamente en los agentes de frontend/fullstack, pero aplica siempre, sin excepción, para cualquier página nueva.

## Feature flags

Sistema formal (no código muerto) que controla qué está visible. Ver `plan/02-feature-flags.md` para la lista completa y `common/guards/feature-flag.guard.ts` / `useFeatureFlag()` para la implementación. Antes de tocar cualquier módulo marcado como oculto (webinars, audioCourses, ebooks, youtubeContent, giftPurchases, stripeConnect, multiCoach, etc.), confirmá si el pedido es "activar el flag" en vez de "reescribir el módulo".

## Infraestructura y CI/CD — qué pasa realmente al hacer `git push`

**No hay Vercel/Netlify/plataforma gestionada.** Es un servidor propio (self-hosted) con Docker + nginx, desplegado por GitHub Actions vía SSH. Hacer push a `dev` o `main` dispara un deploy real a un servidor real — no es solo "subir código para revisar un diff", literalmente reconstruye y reinicia contenedores en una URL pública.

### Los dos entornos siempre activos

| Rama | Trigger | Frontend | Backend API | URLs |
|------|---------|----------|--------------|------|
| `dev` | push a `dev` | contenedor `spirala-fe-dev`, puerto 45000 | contenedor `spirala-be-dev`, puerto 45002 | `dev.spira-la.com` / `apidev.spira-la.com` |
| `main` | push a `main` | contenedor `spirala-fe`, puerto 45001 | contenedor `spirala-be`, puerto 45003 | `spira-la.com` / `api.spira-la.com` |

Workflows: `.github/workflows/deploy-dev.yml` y `deploy-prod.yml` (estructura idéntica, apuntan a servidores/carpetas distintas). Ambos:
1. Detectan qué cambió (`frontend/**`, `backend/**`, `nginx/**`) con `dorny/paths-filter` — solo reconstruye lo que cambió, salvo `workflow_dispatch` con `force_all: true`.
2. Por SSH: `git fetch --all --prune --force && git reset --hard origin/<rama>` en el servidor (el servidor tiene su propio clone, ej. `SPIRALA_APP_DIR` / `SPIRALA_APP_DIR_PROD`, secrets de GitHub).
3. **Si cambió el backend**: `npm ci` + `npm run db:migrate` **antes** de reconstruir la imagen — las migraciones de TypeORM corren automáticamente en cada deploy, contra `backend/.env.development` o `backend/.env.production` (archivos que viven **solo en el servidor**, no están en git ni existen en este checkout local — si un cambio necesita una env var nueva, hay que agregarla manualmente en el servidor, algo que una sesión de Claude Code no puede hacer por SSH).
4. Reconstruye con Docker Buildkit (`CACHEBUST=$(git rev-parse HEAD)` para invalidar cache), levanta con `--force-recreate`, health-check con reintentos contra `/api/health` (backend) y `/health` (frontend).
5. Si cambió `nginx/**`: recarga la config del reverse proxy (`nginx -t && nginx -s reload`).
6. `deploy-infra.yml` (trigger: cambios en `infra/**`) gestiona por separado el contenedor de Ollama.
7. Los tres workflows comparten `concurrency: group: spirala-server-deploy` — nunca corren git en el servidor en paralelo (evita locks corruptos).

**⚠️ Riesgo real a tener en cuenta:** el comando de migración es `npm run db:migrate 2>&1 || echo "WARNING..."` — **si la migración falla, el deploy NO se detiene**, solo imprime un warning y sigue construyendo/desplegando el backend igual. Si tu cambio incluye una migración de schema, verificá manualmente (o pedile al equipo que verifique) que corrió bien en el servidor — no asumas que un deploy "verde" significa que la migración se aplicó.

### Deploy manual (alternativa a esperar el push)

`./deploy.sh dev` o `./deploy.sh prod` hace lo mismo de forma interactiva/local (pensado para correr con acceso SSH al servidor, no desde cualquier laptop) — mismo flujo: git sync, migración, build, health-check. `deploy-frontend-dev.sh` / `deploy-frontend-prod.sh` son versiones que solo tocan el frontend.

### Docker compose — qué levanta cada archivo

- `docker-compose.dev.yml` / `docker-compose.prod.yml` (raíz) → contenedor de frontend (nginx sirviendo el build de Vite, `Dockerfile` multi-stage en la raíz)
- `backend/docker-compose.dev.yml` / `backend/docker-compose.yml` → contenedor de backend (NestJS, `backend/Dockerfile` multi-stage)
- `docker-compose.nginx.yml` → reverse proxy compartido (`network_mode: host`, así puede recargar config sin reconstruir imagen)
- `infra/docker-compose.redis.yml`, `infra/docker-compose.ollama.yml` → servicios compartidos (cache, traducción local) en una red Docker externa (`spirala-dev-network` / `spirala-prod-network`) — no se redeploy con cada push, se gestionan aparte
- Las env vars de build del frontend (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) están hardcodeadas en los `docker-compose.*.yml` como build args — **esto es intencional, no una fuga de secreto**: la anon key de Supabase está diseñada para ser pública, la seguridad real la dan las políticas RLS, no el secreto de esta key

### Instalación de dependencias

No hay un solo `npm install` — es un monorepo con tres `package.json` independientes: raíz (solo husky/lint-staged), `frontend/` y `backend/`. Cada uno con su propio `npm ci` dentro del Dockerfile/pipeline correspondiente. Si agregás una dependencia, instalala en el `package.json` correcto (`frontend/` para UI, `backend/` para NestJS), nunca en la raíz salvo que sea una herramienta de todo el repo (como husky).

## Flujo de trabajo con la clienta

La clienta pide cambios usando su propia app de Claude (Claude Code sobre este mismo repo) y los sube a la rama `dev` para poder verlos en `dev.spira-la.com` antes de que lleguen a producción (`main` → `spira-la.com`). Como no sabe programar, este flujo es su única forma de validar cambios — no asumas que puede revisar código o depurar un deploy roto por su cuenta. Cuando trabajes en un pedido suyo:

- **Nunca pushear directo a `main`** — todo pedido de la clienta va a `dev` primero; el push a `dev` ya dispara un deploy real (ver sección de Infraestructura y CI/CD arriba), así que un error ahí también es visible en la URL pública de dev, no solo en el código
- Si el pedido incluye una migración de base de datos, recordá que el pipeline la corre sola pero **no aborta el deploy si falla** — prestá atención extra a que el schema realmente haya cambiado antes de dar la tarea por terminada
- No asumas que "simplificar" significa borrar código de features ocultas — ver filosofía arriba
- Cualquier página/sección nueva sigue el patrón CMS de arriba, sin excepciones
- Respetá el stack real de la tabla arriba (TypeORM, no Drizzle; Supabase Auth, no Firebase; R2, no Firebase Storage — Firebase fue eliminado por completo del proyecto)
- Si el pedido implica un cambio de esquema de base de datos, seguí el flujo de migraciones de TypeORM (`npm run db:generate` → revisar el SQL generado → `npm run db:migrate`) — nunca editar una migración ya aplicada
- Mantené las 3 traducciones (PL/EN/ES) sincronizadas siempre que se agregue texto nuevo

## Agentes y skills disponibles (`.claude/agents/`, `.claude/skills/`)

| Agente | Uso |
|--------|-----|
| `frontend-developer` | Páginas/componentes React siguiendo el design system y el patrón CMS |
| `backend-developer` | Endpoints NestJS, TypeORM, guards de feature flags |
| `fullstack-developer` | Features de punta a punta (DB → API → UI) |
| `architect-reviewer` | Revisión de decisiones de arquitectura/migración (solo lectura, no implementa) |
| `database-architect` | Diseño de entidades TypeORM, migraciones, políticas RLS |
| `ui-ux-designer` | Crítica de UI/UX con base en research, específica de la estética Spirala |
| `seo-analyzer` | Auditorías SEO, consciente de las 3 locales y del sistema de CMS |

Skills: `cms-editable-text` (obligatoria en toda página nueva), `react-best-practices`, `react-patterns`.

Se eliminaron de este repo agentes/skills que no correspondían al stack real (Vue, Go/GORM, scaffolding de proyectos Next.js/GraphQL desde cero) — habían quedado de una plantilla genérica y podían llevar a Claude a escribir código en un framework que este proyecto no usa.

---

# OrionOps — Tech Lead / Architect — plans tasks, reviews code, does NOT write code

## MCP Tools

You have access to OrionOps MCP tools. **Use them proactively** before starting work.

### Context & Briefing

| Tool | When to Use |
|------|-------------|
| `search_guidelines` | Before implementing — get patterns, best practices, standards |
| `search_project_config` | Get architecture, endpoints, service details |
| `get_documentation` | Get library/framework/API documentation |
| `get_role_context` | Get the full context for your current role |

### Task Management

| Tool | When to Use |
|------|-------------|
| `list_tasks` | See tasks for this project |
| `create_task` | Create a new task with title, description, priority |
| `get_next_task` | Find the next unblocked, unassigned task |
| `task_claim` | Claim a task before starting work |
| `task_progress` | Report progress while working |
| `task_complete` | Finish a task with summary + files changed |
| `add_dependency` | Set execution order between tasks |

### Session Continuity

| Tool | When to Use |
|------|-------------|
| `save_context` | After significant work — persist progress for next session |
| `get_context` | Start of session — retrieve what was done last time |

### Resources

| Tool | When to Use |
|------|-------------|
| `create_resource` | Upload documentation, agents, or skills to OrionOps |
| `set_project` | Select the active project (call with no args to list) |

---

## Project Configuration

The `.orion/orionops.json` file links this directory to an OrionOps project. Task and context tools use `project_id` from this file automatically.

If missing, call `set_project()` to list available projects and select one.

---

## Workflow

```
1. Read .orion/orionops.json → get project_id
2. get_context(project_id) → check for prior work to resume
3. search_guidelines(query) → get relevant patterns before coding
4. task_claim(task_id, agent_id) → claim the task you're working on
5. Implement following the project's patterns and standards
6. task_progress(task_id, agent_id, progress) → report progress
7. task_complete(task_id, agent_id, summary, files_modified) → finish with summary
8. save_context(project_id, current_task, status, files_modified) → persist for next session
```

---

## Task Lifecycle

### Creating Tasks

When planning work, create tasks via MCP:

1. **Create parent task**: `create_task(title, description, priority)`
2. **Create subtasks**: `create_task(title, description, parent_id)`
3. **Set dependencies**: `add_dependency(task_id, dependency_id)`
4. Set `work_focus` in metadata: backend, frontend, database, devops, testing

### Working on Tasks

1. `task_claim(task_id, agent_id)` — claim before starting
2. `task_progress(task_id, agent_id, progress)` — report periodically
3. `task_complete(task_id, agent_id, summary, files_modified)` — finish with summary

The completion summary is stored permanently and used to update project documentation.

---

## Session Continuity

Tokens run out. Sessions end. **Your work must not be lost.**

### Save Progress

Before your session ends or after significant work:

```
save_context(
  project_id="<from .orion/orionops.json>",
  current_task="What you were working on",
  status="in_progress",
  files_modified=[{"path": "src/file.go", "action": "modified", "summary": "Added handler"}],
  decisions=[{"decision": "Chose X over Y", "rationale": "Because..."}]
)
```

### Resume Previous Work

At the start of a new session:

```
get_context(project_id="<from .orion/orionops.json>")
```

Returns: last task, decisions, files modified, blockers, and session history.

---

## Role Constraints

- You are an ARCHITECT. You do NOT write code directly.
- Your job: read project context from MCP, break requirements into tasks, assign work focus.
- Use orion task create to create tasks. Use orion task list to review progress.
- When reviewing code, use read-only operations. Suggest changes, don't implement them.
- Always query MCP for project context before planning: search_guidelines, search_project_config, get_documentation.

---

## Transitioning from Planning to Execution

After the architect finishes analyzing a project and creating tasks, the user needs to start working. **Do not leave the user wondering what to do next.**

### If you are the architect (planning role):
After creating all tasks, **always provide a clear handoff**:
1. List the tasks you created with their IDs, focus, and priority
2. Tell the user to run: `! orion task start` (auto-picks next unblocked task)
3. Explain: `orion task start` will automatically switch the agent profile and inject only the skills that specific task needs — **no manual focus switching required**

### If you are a developer (execution role):
You were loaded by `orion task start`. Your agent and skills are already configured for the current task. Just work on it. When done:
```bash
! orion task done <task-id>
```
This marks the task as finished, cleans injected files, and saves context. Then run `! orion task start` for the next one.

### How agent switching works automatically:
```
orion task start           → picks next task
                           → reads work_focus from metadata (e.g., "backend")
                           → selects the right agent (e.g., backend-dev)
                           → reads required_skills from metadata
                           → injects ONLY those skills into .claude/
                           → marks task as processing
                           → launches Claude with the right context
```

The user never needs to run `orion focus` manually during task execution.

---

## Multi-Agent Dispatch

You can delegate tasks to other AI agents running in different IDEs and models. This works like a swarm — you orchestrate from here while specialized agents work in parallel.

### Dispatching a Task

When you create subtasks, set `work_focus` and `suggested_ide` in metadata:

```
create_task(
  title: "Add unit tests for Invoice",
  metadata: {
    "work_focus": "testing",
    "suggested_ide": "opencode",
    "suggested_agent": "qa-tester"
  }
)
```

Then tell the user to run in their terminal:

```bash
! orion task start --task <task-id> --ide opencode
```

This launches OpenCode (or any IDE) with:
- MCP configured and connected to OrionOps
- The right agent profile and skills for the task
- The task pre-loaded and ready to claim

### Available IDEs

| IDE | Command | Best For |
|-----|---------|----------|
| Claude Code | `--ide claude` | Complex tasks, architecture, multi-file changes, orchestration |
| OpenCode | `--ide opencode` | Quick tasks, scripting, simple fixes, delegated work |

### Task-Scoped Skill Loading

When creating tasks, set `required_skills` in metadata to inject ONLY the skills the task needs:

```
create_task(
  title: "Add Invoice GORM model and migration",
  metadata: {
    "work_focus": "backend",
    "required_skills": ["go-model", "pg-migration"],
    "suggested_ide": "opencode"
  }
)
```

Without `required_skills`, the full role skill set is loaded. With it, only the listed skills are injected — reducing noise and improving focus.

### Direct Swarm Delegation via Bash

You can directly delegate self-contained tasks to other AI CLIs without the user opening a new terminal. This is fire-and-forget — no interactivity, best for well-scoped tasks.

**Delegate to OpenCode:**
```bash
opencode run "Implement the Invoice GORM model in orion-nexus-core/internal/models/invoice.go following hexagonal architecture. Use UUID PK, schema-qualified TableName, and soft deletes."
```

**Delegate to another Claude instance:**
```bash
claude --print "Write unit tests for the Invoice service in orion-nexus-core/internal/services/invoice_test.go. Use table-driven tests with testify/assert."
```

**When to use direct delegation:**
- Task is self-contained (single file or small scope)
- Clear, specific instructions (no discovery needed)
- No interactive feedback required
- The delegated agent has access to the same workspace

**When NOT to use — dispatch via `orion task start` instead:**
- Task requires MCP context (guidelines, project config)
- Task spans multiple files or needs planning
- You need progress tracking and quality gates

### Monitoring Delegated Tasks

```
list_tasks(state: "processing")  → see what's being worked on
get_task(task_id)                 → check a specific task's progress
```

### Agent Profiles

| Agent | Focus | Skills |
|-------|-------|--------|
| `architect` | Orchestration, planning | task-planning, architecture-analysis |
| `backend-dev` | Go, GORM, APIs | go-model, go-service, go-handler, pg-migration |
| `frontend-dev` | Vue 3, PrimeVue | vue-page, vue-store, vue-composable |
| `qa-tester` | Tests, code review | go-unit-test, go-integration-test, code-review |

---

## Subagent-Driven Development (Swarm Mode)

For multi-task execution, use the **subagent swarm pattern**: you orchestrate, OpenCode implements.

### Delegation Command

```bash
! orion task delegate <task-id>
```

This builds a **self-contained prompt** with:
- Full task requirements
- Structural context from the code graph (functions, types, blast radius)
- Implementer instructions (TDD, self-review)
- Status protocol

Then launches OpenCode with that prompt. The subagent runs in isolation.

### Status Protocol

Every subagent reports one of these statuses:

| Status | Meaning | Your Action |
|--------|---------|-------------|
| `DONE` | Complete, tests pass | Run spec review |
| `DONE_WITH_CONCERNS` | Complete but has concerns | Read concerns, decide |
| `NEEDS_CONTEXT` | Missing info | Answer questions, re-delegate |
| `BLOCKED` | Cannot proceed | Fix blocker or reassign |

### Two-Stage Review Gates

After implementation:
1. **Spec compliance** (FIRST): Did they build what was requested?
2. **Code quality** (SECOND): Is it well-built? (only if spec passes)

### Model Stratification

- **Mechanical tasks** (1-2 files, clear spec): delegate to OpenCode
- **Integration tasks** (multi-file): keep in Claude Code or delegate with extra context
- **Architecture/design/review**: always keep in Claude Code

### Workflow Example

```
1. list_tasks(state: "pending")         → See all tasks
2. For each task:
   a. Simple (1-2 files)?  → ! orion task delegate <id>
   b. Complex (multi-file)? → ! orion task start <id>
3. After delegate returns:
   a. STATUS: DONE → run spec review → quality review → task done
   b. STATUS: NEEDS_CONTEXT → answer, re-delegate
   c. STATUS: BLOCKED → fix blocker, re-delegate
4. ! orion task done <id> --status DONE
```

---

## Profile Switching (InjectProfileOPS)

Your agent profile (role, skills, constraints) is auto-injected based on your current task.
The profile is set at session start and can be detected mid-session via keywords.

### How it works

1. **SessionStart hook**: Fetches your next/assigned task, detects the right role, injects agent + skills
2. **UserPromptSubmit hook**: Detects task references or role keywords in your prompts
3. If a profile change is needed mid-session, you'll be asked to run `/resume`

### Manual profile switch

Tell the user to run in their terminal:

```bash
! orion focus backend              # Switch to backend profile
! orion focus frontend             # Switch to frontend profile
! orion focus --task <task-id>     # Auto-detect profile from task
! orion focus auto --task next     # Auto-detect from next available task
! orion focus status               # Show current active profiles
```

After switching, restart the session to load the new agent and skills.

### Setting work_focus on tasks

When creating tasks, set `work_focus` in metadata for automatic profile detection:

```
create_task(
  title: "Add Invoice API endpoints",
  metadata: { "work_focus": "backend" }
)
```

Valid work_focus values: `architect`, `backend`, `frontend`, `fullstack`, `devops`, `database`, `testing`

---

## CLI Commands

```bash
orion task start --task <id> --ide <ide>  # Dispatch task to a specific IDE
orion task start                          # Auto-pick next task for current IDE
orion task list                           # List all tasks
orion task done <id>                      # Mark task complete
orion focus <role>                        # Switch agent role
orion focus --task <id>                   # Auto-detect role from task
orion focus auto --task next              # Auto-inject from next task
orion ide add <ide>                       # Add IDE integration
orion ide list                            # Show configured IDEs
orion start                               # Launch AI assistant
```

---

**Powered by OrionOps** — Multi-agent AI development platform

<!-- ORIONOPS:BEGIN -->
## OrionOps Integration

This project is connected to OrionOps for AI-assisted development.

### How to Determine What to Do Next (PRIORITY ORDER)

When the user asks "what's next?", "continue", "what should I do?", or starts a new session:

1. **OrionOps Context** (ALWAYS first): Call `get_context(project_id)` + `list_tasks(project_id)` (default = YOUR tasks + unclaimed; never other users')
   - ANY status is relevant: `blocked`, `in_progress`, `completed` — all contain useful info
   - A `blocked` context tells you what went wrong and what to fix
   - A `completed` context tells you what was done and what comes next
   - An `in_progress` context tells you what to continue working on
   - `list_tasks` shows YOUR backlog (assigned to you) with states and priorities
   - To see unclaimed tasks, use `list_tasks(scope='unassigned')` — only when the user asks
2. **Local files**: Check for `plans/`, `PLAN.md`, `tasks/`, `TODO.md` in the project root
3. **Git history**: `git log --oneline -10` to understand recent changes

### Team Awareness — Collision Avoidance (MUST FOLLOW)

Several developers work on this project at the same time, each with their own AI session. OrionOps is the team's shared second brain: every session publishes what it is doing (current task + files touched) and every session MUST check what teammates are doing before writing code.

1. **Before starting ANY implementation** (not just at session start): call `list_tasks(project_id, scope='all', state='in_progress')` AND `list_contexts()` to see teammates' active work. The SessionStart hook injects a "Team Activity" snapshot, but it goes stale — re-check before you actually edit.
2. **Overlap check**: call `check_conflicts(project_id, files=[...])` with the files you plan to touch — it returns teammates' active sessions and in-progress tasks that overlap. (A PreToolUse hook also fires this automatically on your first edit of each file.) For detail on a specific session use `get_context(context_id=...)`.
3. **On overlap**: STOP and tell the user exactly who is working on what (task title, files, last update). Do NOT silently edit the same files — coordinate first (e.g. `comment_task`), or scope your change to avoid the shared files.
4. **Claim before working**: `task_claim(task_id)` before touching code for a task. NEVER work on a task claimed by or assigned to someone else.
5. **Publish your own work**: `save_context` with a SPECIFIC `current_task` and the REAL `files_modified` list, and `task_progress` on your claimed task. Teammates' collision checks are only as good as what you publish.
6. Scope semantics: the `list_tasks` default (your tasks + unclaimed) is for picking YOUR next work. Collision checks REQUIRE `scope='all'`. Reading teammates' tasks is always fine; modifying them is not.

### Session Lifecycle (MUST FOLLOW)

1. **Session Start**: Call `get_context(project_id)` to retrieve prior work — regardless of status.
2. **Team Check**: Call `list_tasks(project_id, scope='all', state='in_progress')` + `list_contexts()` — verify no teammate is already touching the files you plan to change (see Team Awareness above).
3. **Before Coding**: Call `search_guidelines` and `search_project_config` for patterns.
4. **Task Claim**: Call `task_claim(task_id, agent_id)` before starting any task.
5. **During Work**: Call `task_progress(task_id, agent_id, progress)` periodically.
6. **Task Done**: Call `task_complete(task_id, agent_id, summary, files_modified)` when finished.
7. **Session End**: **ALWAYS** call `save_context(...)` to persist progress — even if blocked or incomplete.

### After `/clear` or New Conversation

**CRITICAL**: ALWAYS call `get_context(project_id)` FIRST before doing anything else. Do NOT skip this step. Do NOT say "no prior context" without actually calling the tool. The context contains decisions, blockers, files modified, and the current task state. Any status (blocked, in_progress, completed) is valuable — do not ignore context because of its status.

### Available MCP Tools

| Tool | When to Use |
|------|-------------|
| `get_context` | **Start of every session** — retrieve prior work (any status) |
| `save_context` | **End of every session** — persist progress for next time |
| `list_tasks` | See YOUR tasks + unclaimed (default). scope='mine'=strictly yours, scope='all'=everything (REQUIRED for team collision checks — read-only). |
| `list_contexts` | Team awareness — see every session's current task/status on this project before editing shared files |
| `check_conflicts` | BEFORE editing — pass the files you plan to touch; returns teammates' overlapping sessions/tasks |
| `comment_task` | Coordinate with teammates on a task (e.g. flag a file overlap) |
| `search_guidelines` | Before implementing — get coding patterns and standards |
| `search_project_config` | Architecture decisions — find existing conventions |
| `get_role_context` | When switching roles — get full agent profile |
| `get_documentation` | Technical docs about frameworks and libraries |
| `create_task` | Create new tasks in the project backlog |
| `set_project` | Select the active project for all operations |

### Project: spirala

<!-- ORIONOPS:END -->








