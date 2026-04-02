# Stack Map

## Core
- **Frontend Framework**: React (v18.3.1)
- **Language**: TypeScript (v5.8.3)
- **Build Tool**: Vite (v5.4.19)
- **Package Manager**: NPM (with `package-lock.json` and some `bun.lock` files, though `package.json` seems primary for NPM tools)

## UI & Styling
- **Styling**: Tailwind CSS (v3.4.17)
- **Component Library**: Radix UI (various primitives)
- **Icons**: Lucide React
- **Animations**: Tailwind CSS Animate, Framer Motion (though not in dependencies, standard for shadcn projects - wait, I didn't see it, let me check package.json again - ah, not explicitly in dependencies, likely using native CSS or `tailwindcss-animate`).
- **Data Table/Form**: React Hook Form, Zod (v3.23.8).
- **Charts**: Recharts.

## Data & State
- **Backend Database/Auth**: Supabase (@supabase/supabase-js v2.95.3)
- **State Management**: TanStack React Query (v5.83.0), React Context API.
- **Routing**: React Router DOM (v6.30.1).

## Quality & Testing
- **Linter**: ESLint (v9.32.0).
- **Testing**: Vitest (v3.2.4), React Testing Library.

## Key Integrations
- **Supabase Client**: Standard client integration in `src/integrations/supabase/client.ts`.
- **Kanban Board**: @dnd-kit/core, @dnd-kit/sortable for lead management.
