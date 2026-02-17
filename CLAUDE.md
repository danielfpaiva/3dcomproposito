# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# PrintImpact Connect - Architectural Guide

## Project Overview

PrintImpact Connect is a web application that coordinates 3D printing volunteers to manufacture wheelchair parts for children in Portugal. The app manages:
- Volunteer registration and tracking (contributors)
- Wheelchair project management with individual parts
- Beneficiary requests for wheelchairs
- Part allocation workflow from unassigned → assigned → printing → printed → shipped → complete
- Token-based volunteer portals (no auth required for volunteers)
- Admin dashboard with authentication

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, React Router v6
- **UI**: shadcn/ui (Radix primitives), Tailwind CSS, Framer Motion
- **State**: React Query v5 (TanStack Query) for server state
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Testing**: Vitest + React Testing Library

## Common Commands

```bash
# Development
npm install           # Install dependencies
npm run dev          # Start dev server on port 8080

# Build & Test
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run ESLint
npm test             # Run tests once
npm test:watch       # Run tests in watch mode
npm run preview      # Preview production build
```

## Architecture

### Routes & Pages

The app has 7 main routes defined in [src/App.tsx](src/App.tsx):

- `/` → [Index.tsx](src/pages/Index.tsx) - Landing page with hero, CTA, progress
- `/contribute` → [Contribute.tsx](src/pages/Contribute.tsx) - 8-step volunteer registration form
- `/portal?token=...` → [Portal.tsx](src/pages/Portal.tsx) - Token-based volunteer portal (no auth)
- `/request` → [Request.tsx](src/pages/Request.tsx) - 4-step beneficiary request form
- `/auth` → [Auth.tsx](src/pages/Auth.tsx) - Admin login/signup
- `/admin` → [Admin.tsx](src/pages/Admin.tsx) - Admin dashboard (requires auth)
- `/donate` → [Donate.tsx](src/pages/Donate.tsx) - Donation info page

### Database Schema (Supabase)

**Core tables:**
- `contributors` - Volunteers who can print parts (token-based access, no auth)
  - Has unique `token` UUID for portal access
  - Tracks: printer models, materials, build plate size, region, experience level, shipping capability
- `wheelchair_projects` - Wheelchair projects (e.g., "TMT - Toddler Mobility Trainer")
- `parts` - Individual parts within projects with status workflow and optional assignment to contributors
- `beneficiary_requests` - Requests from families/institutions for wheelchairs
- `donations` - Donation tracking
- `profiles` - Admin user profiles (linked to auth.users)
- `user_roles` - Role-based access control (admin, organizer)

**Views (for stats):**
- `dashboard_stats` - Aggregate statistics for admin dashboard
- `regional_stats` - Per-region contributor counts

**Enums:**
- `part_status`: unassigned, assigned, printing, printed, shipped, complete
- `project_status`: planning, active, complete
- `app_role`: admin, organizer

**RLS (Row Level Security):**
- Contributors table: token-based access via URL param (no Supabase auth)
- Admin tables: protected by `is_organizer()` function checking user_roles
- Parts/projects: require organizer role

### 🚨 IMPORTANT: Database Schema Changes

**⚠️ MANDATORY PROCESS** for ANY database structure changes:

When adding/removing/altering tables, columns, constraints, indexes, views, RLS policies, triggers, functions, or enums:

1. **MUST follow**: [backup/docs/guides/DATABASE_CHANGES_WORKFLOW.md](backup/docs/guides/DATABASE_CHANGES_WORKFLOW.md)
2. **MUST update**: `backup/database/schema/schema.sql` (current schema)
3. **MUST update**: `src/integrations/supabase/types.ts` (TypeScript types)
4. **MUST update**: This file (CLAUDE.md) if structure changed
5. **MUST test**: `npm run build` (TypeScript compilation)
6. **MUST commit**: All changes together with descriptive message

**Quick export schema:**
```bash
./backup/scripts/export_schema.sh "description of change"
```

**Schema documentation location:**
- Current schema: [backup/database/schema/schema.sql](backup/database/schema/schema.sql)
- Migrations: [backup/database/schema/migrations/](backup/database/schema/migrations/)
- Archived schemas: [backup/database/schema/archive/](backup/database/schema/archive/)

**Never skip this process!** Database and code must stay in sync for scalability.

### State Management Pattern

React Query handles all server state. Pattern used throughout the app:

```tsx
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Fetching data
const { data, isLoading, error } = useQuery({
  queryKey: ["contributors"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("contributors")
      .select("*");
    if (error) throw error;
    return data;
  },
  enabled: !!someCondition, // Optional conditional fetching
});

// Invalidating cache after mutations
const queryClient = useQueryClient();
await supabase.from("parts").update(...);
queryClient.invalidateQueries({ queryKey: ["admin-parts"] });
```

**Important query keys:**
- `["admin-contributors"]` - All contributors (admin view)
- `["admin-projects"]` - All projects
- `["admin-parts"]` - All parts
- `["admin-requests"]` - Beneficiary requests
- `["dashboard-stats"]` - Dashboard aggregates
- `["regional-stats"]` - Regional breakdown

### Authentication & Authorization

**Two separate access models:**

1. **Volunteers (contributors)**: Token-based, no authentication
   - Each contributor gets a unique UUID `token` on registration
   - Portal access via `/portal?token=<uuid>`
   - Can view/update their own data only

2. **Admins**: Supabase Auth with RLS
   - Use [useAuth](src/hooks/useAuth.ts) hook for sign in/out
   - Protected routes redirect to `/auth` if not authenticated
   - RLS policies check `is_organizer()` function

### Form Handling

Multi-step forms use local state + Framer Motion transitions:

**Pattern** (see [Contribute.tsx](src/pages/Contribute.tsx:80-100)):
```tsx
const [currentStep, setCurrentStep] = useState(1);
const [formData, setFormData] = useState({ /* fields */ });

const updateField = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};

const canProceed = () => {
  // Step-specific validation
  switch (currentStep) {
    case 1: return formData.name.trim().length > 0;
    // ...
  }
};

// On submit: insert to Supabase, show success, generate portal link
```

Form submissions:
- Validate client-side per step
- Submit to Supabase on final step
- Show toast feedback (using shadcn sonner)
- Generate portal link for contributors

### Admin Dashboard Features

[Admin.tsx](src/pages/Admin.tsx) provides:

1. **Filtering/Sorting/Grouping** contributors
   - Filter by: region, printer, material, experience, build volume, shipping capability
   - Sort by: any column (asc/desc)
   - Group by: region, experience, shipping capability

2. **Project Management**
   - Create projects, add parts
   - Allocate parts to volunteers
   - Track part status workflow
   - Copy portal links to send to volunteers

3. **Beneficiary Requests**
   - View requests, add notes
   - Filter by status and region

Key components:
- [ProjectProgressCard.tsx](src/components/admin/ProjectProgressCard.tsx) - Project overview
- [ProjectPartsList.tsx](src/components/admin/ProjectPartsList.tsx) - Part status table
- [AllocateVolunteerDialog.tsx](src/components/admin/AllocateVolunteerDialog.tsx) - Assign parts
- [AddContributorDialog.tsx](src/components/admin/AddContributorDialog.tsx) - Manual contributor entry
- [ContributorsFilters.tsx](src/components/admin/ContributorsFilters.tsx) - Filtering UI

### Printer & Build Plate Management

The app tracks specific printer models and build plates:

- [src/lib/printerBuildPlates.ts](src/lib/printerBuildPlates.ts) defines:
  - `PRINTER_BUILD_PLATES` - Mapping of printer models to default build volumes
  - `getSuggestedBuildPlate()` - Auto-suggest build plate when user selects printer
  - `BUILD_PLATE_OPTIONS` - Predefined size options (prefers 256×256×256 for TMT project)

- Printer models list maintained in [Contribute.tsx](src/pages/Contribute.tsx:30-56) (Bambu Lab, Prusa, Creality, Elegoo, QIDI, Anycubic, Voron, others)

### Regional Organization

Portugal is divided into 7 regions (see [src/lib/regions.ts](src/lib/regions.ts)):
- Norte, Centro, Lisboa, Alentejo, Algarve, Açores, Madeira

Contributors and beneficiary requests are tagged by region for geographic matching.

### Volunteer Workflow

1. User fills out `/contribute` form (8 steps: name, location, printer, materials, experience, availability, shipping, email)
2. Backend inserts into `contributors` table with generated `token`
3. User receives portal link: `https://www.3dcomproposito.pt/portal?token=<uuid>`
4. Admin allocates a part to this volunteer
5. Volunteer visits portal to:
   - See assigned parts with status
   - Update their own details (printer, availability, etc.)
   - Update part status as they progress

**Email notifications:**
- The app does NOT use email APIs (no Resend, etc.)
- After allocation, admin copies portal link and sends manually via email client or WhatsApp

## Development Workflows

### Adding a New Page

1. Create `src/pages/MyPage.tsx`
2. Add route in [src/App.tsx](src/App.tsx)
3. Add nav link in [src/Navbar.tsx](src/components/Navbar.tsx) if needed

### Adding a Form Field

1. Update Supabase schema via migration in `supabase/migrations/`
2. Regenerate types: Supabase CLI or manual update in [src/integrations/supabase/types.ts](src/integrations/supabase/types.ts)
3. Update form component state and UI
4. Update Portal.tsx if volunteers should edit it
5. Update Admin.tsx filters/display if relevant

### Modifying Database Schema

- Schema changes go in `supabase/migrations/*.sql`
- Migrations are ordered by timestamp prefix
- After migration, update [types.ts](src/integrations/supabase/types.ts) (auto-generated or manual)
- Types are exported as `Database` interface with `Tables`, `Views`, `Enums`

### Working with Types

```tsx
import type { Tables } from "@/integrations/supabase/types";

type Contributor = Tables<"contributors">;
type Part = Tables<"parts">;
```

### Styling Conventions

- **Tailwind CSS** for all styling
- Custom CSS variables defined in [src/index.css](src/index.css):
  - `--navy-deep`, `--emerald-bright`, `--coral-soft`, `--sky-light`, `--charcoal`, `--cream`
- Custom utility classes:
  - `.btn-lift` - Hover effect for buttons
  - `.text-gradient-hero` - Gradient text effect
  - `.card-hover` - Card hover animation
- shadcn components in `src/components/ui/` (don't edit directly, regenerate via shadcn CLI)

## Environment Variables

Create a `.env` file with:

```bash
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>

# Optional (for donate page)
VITE_DONATE_IBAN=PT50...
VITE_PAYPAL_LINK=https://paypal.me/...
```

## Testing

- Tests live in `src/**/*.{test,spec}.{ts,tsx}`
- Setup file: [src/test/setup.ts](src/test/setup.ts)
- Run with `npm test` or `npm test:watch`
- Uses jsdom environment for React component testing

## Deployment

This project is deployed on Vercel:
- Pushing to git automatically triggers deployment
- Build command: `npm run build`
- Dev server runs on port 8080
- Custom domain: https://www.3dcomproposito.pt

## Important Notes

- **Portal security**: Contributors access via token URL param, not auth. Token is UUID stored in `contributors.token` column.
- **Admin security**: All admin operations protected by RLS using `is_organizer()` function checking `user_roles` table.
- **Cache invalidation**: After mutations, always invalidate relevant React Query keys using `queryClient.invalidateQueries()`.
- **Form validation**: Manual validation per step, no react-hook-form (multi-step forms use local state).
- **No email API**: Notifications are manual (copy portal link, send via email client).
- **Build plate requirement**: TMT project parts require 256×256×256 build volume minimum.
