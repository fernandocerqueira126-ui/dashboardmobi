# Structure Map

## Root Structure
- `.agent/`: GSD and agent configuration.
- `.planning/`: GSD project state and documentation.
- `public/`: Static assets.
- `src/`: Application source.
- `supabase/`: Local Supabase development or migration files.

## Source Structure (`src/`)
- `components/`:
  - `layout/`: MainLayout, Sidemenu, Sidebar.
  - `ui/`: Local shadcn-based components (Buttons, Cards, Inputs, etc.).
  - `atendimentos/`: Chat-specific components.
  - `leads/`: CRM/Kanban-specific components.
- `contexts/`: React context providers (Auth, Notifications, Leads, Atendimentos, Time, etc.).
- `hooks/`: Custom hooks (Supabase query wrappers).
- `integrations/`: Third-party SDK clients (Supabase, etc.).
- `lib/`: Shared utility libraries.
- `pages/`: Page components for application routes.
- `types/`: Global and local TypeScript definitions.
- `test/`: Project-wide testing setup.

## Key Files
- `src/App.tsx`: Main router and context provider tree.
- `src/main.tsx`: App entrypoint.
- `src/index.css`: Global styles (Tailwind base + shadcn theme).
- `package.json`: Project manifest.
- `vite.config.ts`: Build and dev server configuration.
