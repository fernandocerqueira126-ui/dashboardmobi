# Architecture Map

## Overview
- **Pattern**: Component-based Architecture (React) with Atomic UI (via Shadcn + Radix).
- **Communication**: Event-driven (via Contexts/Callbacks) and Pull-based (via TanStack Query).
- **Persistence**: Hybrid. Client state in Context API, Server state in React Query, Permanent state in Supabase.

## High-Level Flow
1. **User Request**: Browser navigates to a route in `src/pages/`.
2. **Layout Rendering**: `MainLayout` wraps the content, injecting shared UI and sidebar navigation.
3. **Data Fetching**: Page components use custom hooks or direct React Query `useQuery` calls (through `src/hooks/`) to fetch data from Supabase.
4. **State Management**:
   - `AuthProvider`: Manages Supabase session.
   - `LeadsProvider`, `AtendimentosProvider`: Coordinate complex shared client logic for CRM and chat.
   - `TimeProvider`: Provides a consistent "now" for relative time calculations.
5. **UI Execution**:
   - Complex interactive elements (Kanban) use `dnd-kit`.
   - Visual feedback via `Toast`, `Sonner`, `Alert` (Radix/Shadcn).
6. **Integration**: Supabase Edge Functions / Backend interactions (though mostly client-side logic observed).

## Key Principles Observed
- **Separation of Concerns**: UI in `components`, Logic in `hooks`/`contexts`, Routing in `App.tsx`.
- **Type Safety**: Full TypeScript integration for frontend and database schema (auto-generated in `src/integrations/supabase/types.ts`).
- **Responsive Design**: Tailwind-first approach across all pages.
- **Component Reusability**: Extensive use of `src/components/ui/` for cross-cutting primitives.
- **Global Time Consistency**: Centralized `TimeProvider` ensures relative time indicators (e.g., "5 hours ago") are synchronized.
