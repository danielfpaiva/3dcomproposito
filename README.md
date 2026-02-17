# 3D com Propósito

A web application that coordinates 3D printing volunteers to manufacture parts for children with reduced mobility in Portugal.

**Production URL**: https://www.3dcomproposito.pt
**Contact**: geral@3dcomproposito.pt

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui (Radix primitives) + Tailwind CSS + Framer Motion |
| Server State | TanStack Query v5 |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Email | Resend via Supabase Edge Functions |
| Deployment | Vercel (auto-deploy on push to `main`) |

---

## Running Locally

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev        # starts on http://localhost:8080
```

### Environment variables

Create a `.env` file at the root:

```bash
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>

# Optional
VITE_DONATE_IBAN=PT50...
VITE_PAYPAL_LINK=https://paypal.me/...
```

---

## Routes

| Route | Page | Access |
|-------|------|--------|
| `/` | `Index.tsx` | Public — landing page |
| `/contribute` | `Contribute.tsx` | Public — 8-step volunteer registration |
| `/portal?token=<uuid>` | `Portal.tsx` | Token-based — volunteer portal |
| `/request` | `Request.tsx` | Public — 4-step beneficiary request form |
| `/auth` | `Auth.tsx` | Public — admin login |
| `/admin` | `Admin.tsx` | Protected — admin dashboard |
| `/donate` | `Donate.tsx` | Public — donation info |
| `/recursos` | `Recursos.tsx` | Public — resources page |

---

## Access Models

Two completely separate access models coexist in the app:

**1. Volunteers (contributors) — token-based, no Supabase Auth**
- On registration a UUID `token` is generated and stored in `contributors.token`
- Portal access via `/portal?token=<uuid>` — the app reads the token from the URL and queries the DB
- Volunteers can only view and update their own data

**2. Admins — Supabase Auth + RLS**
- Login via `/auth` using Supabase email/password auth
- All admin operations are protected by the `is_organizer()` RLS function which checks the `user_roles` table
- The `useAuth` hook (`src/hooks/useAuth.ts`) manages session state

---

## Database Schema

### Core tables

| Table | Purpose |
|-------|---------|
| `contributors` | Volunteers — stores printer specs, materials, region, token, `password_hash` |
| `wheelchair_projects` | Projects (e.g. "Cadeira Lisboa #1") |
| `parts` | Individual parts within a project, assigned to contributors |
| `part_templates` | Template parts used when creating a new project (currently TMT v1, 24 parts) |
| `beneficiary_requests` | Requests from families/institutions for wheelchairs |
| `profiles` | Admin user profiles (linked to `auth.users`) |
| `user_roles` | Role assignments (`admin`, `coordinator`, `volunteer`) |
| `donations` | Donation records |

### Views

| View | Purpose |
|------|---------|
| `dashboard_stats` | Aggregate counts for the admin dashboard |
| `regional_stats` | Per-region contributor breakdown |

### Enums

| Enum | Values |
|------|--------|
| `part_status` | `unassigned` → `assigned` → `in_progress` → `completed` → `delivered` |
| `project_status` | `planning` → `in_progress` → `completed` → `cancelled` |
| `user_role` | `admin`, `coordinator`, `volunteer` |

### Schema files

- Current schema: `backup/database/schema/schema.sql`
- RLS policies: `backup/database/schema/rls_policies.sql`
- Migrations: `backup/database/schema/migrations/`

> **Any schema change must follow the workflow in `backup/docs/guides/DATABASE_CHANGES_WORKFLOW.md`.**

---

## State Management

TanStack Query is the single source of truth for all server data. Direct `supabase` calls must be encapsulated in custom hooks under `src/hooks/queries/`.

Key query keys:

| Key | Data |
|-----|------|
| `["admin-contributors"]` | All contributors (admin view) |
| `["admin-projects"]` | All projects |
| `["admin-parts"]` | All parts |
| `["admin-requests"]` | Beneficiary requests |
| `["dashboard-stats"]` | Dashboard aggregate stats |
| `["regional-stats"]` | Regional breakdown |
| `["part-templates"]` | Part templates for project creation |

Always invalidate the relevant key after a mutation:

```ts
queryClient.invalidateQueries({ queryKey: ["admin-parts"] });
```

---

## Supabase Edge Functions

Located in `supabase/functions/`. All functions use the `RESEND_API_KEY` secret configured in the Supabase dashboard.

### `volunteer-welcome`

Sends a welcome email to a new contributor with their portal link.

- **Trigger**: called manually from the admin after a contributor registers
- **Input**: `{ contributor_id: string }`
- **Sends to**: contributor's email
- **Contains**: portal link, next steps

### `notify-part-allocated`

Notifies a contributor by email when one or more parts are assigned to them.

- **Trigger**: called from `AllocateVolunteerDialog.tsx` after saving an allocation
- **Input**: `{ contributor_id: string, part_ids: string[] }`
- **Sends to**: contributor's email
- **Contains**: part names, project name, portal link, links to STL files and Maker Guide PDF

### `contributor-auth`

Handles contributor login and password management (separate from Supabase Auth).

- **Trigger**: called from `Portal.tsx` login flow
- **Actions**:
  - `check` — verify if contributor exists and has a password set
  - `set-password` — hash and store a new password (SHA-256)
  - `login` — verify password hash, return portal token
- **Always returns HTTP 200** — errors are indicated via `{ ok: false, error: "..." }` in the response body (intentional, to keep `supabase.functions.invoke()` returning `data`)
- **On failed login**: sends an alert email to `geral@3dcomproposito.pt`

### Deploying a function

```bash
supabase functions deploy <function-name>
```

---

## Admin Dashboard

`src/pages/Admin.tsx` is the main admin interface. Key features:

- **Contributors tab**: filterable/sortable table with allocation action per row. Filters: region, printer model, material, experience, build volume, shipping capability.
- **Projects tab**: project progress cards with per-part status. Part allocation via `AllocateVolunteerDialog.tsx`.
- **Requests tab**: beneficiary requests with status and notes management.
- **Stats**: dashboard aggregates from the `dashboard_stats` view.

Key admin components in `src/components/admin/`:

| Component | Purpose |
|-----------|---------|
| `ProjectProgressCard.tsx` | Project overview with progress bar |
| `ProjectPartsList.tsx` | Part status table per project |
| `AllocateVolunteerDialog.tsx` | Assign parts to a contributor + send email |
| `AddContributorDialog.tsx` | Manual contributor entry |
| `ContributorsFilters.tsx` | Filtering UI for contributors table |

---

## Volunteer Portal

`src/pages/Portal.tsx` — accessed via `/portal?token=<uuid>`.

The token is read from the URL and used to fetch the contributor's data. The contributor can:
- View their profile and assigned parts
- Update their own details (printer, availability, etc.)
- Login with email + password (via `contributor-auth` edge function) for repeat access without the URL token

Portal link format: `https://www.3dcomproposito.pt/portal?token=<uuid>`

---

## Future Plans

See `plans/` for planned architectural improvements:

- [`plans/INITIATIVE_TEMPLATE_SYSTEM.md`](plans/INITIATIVE_TEMPLATE_SYSTEM.md) — refactor to a Template → Instance model to support multiple initiative types beyond wheelchairs
