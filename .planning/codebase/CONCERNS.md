# Concern Map

## Current Technical Concerns
1. **Context Overload**: The `App.tsx` has a deep nesting of context providers (`AuthProvider`, `NotificationsProvider`, `ColaboradoresProvider`, `LeadsProvider`, `AgendaProvider`, `FinanceiroProvider`, `AtendimentosProvider`, `TimeProvider`). This might lead to performance issues or difficulty in debugging state changes.
2. **Bundle Size**: `Recharts`, `Supabase SDK`, `@dnd-kit`, and multiple Radix UI primitives on the same route can significantly increase the initial build size.
3. **Data Freshness**: The project relies heavily on React Query. Proper invalidation of stale cache (e.g., after changing Kanban columns) must be consistently implemented.
4. **Real-time Handling**: Messaging (`Atendimentos`) requires careful management of Supabase Realtime channels to avoid duplicate messages or missed updates.
5. **Layout Performance**: The main layout calculation for complex tables/Kanban maps with responsive heights can be expensive on lower-spec hardware.

## Known Gaps
- **Error Boundaries**: A global or project-wide error boundary across layout levels is not yet explicitly identified.
- **Empty States**: Most pages (Clientes, Leads, Agenda) have basic skeletons, but consistent "No Results" and "Initial Loading" states should be audited across all modules.
- **Form Validation**: Complex multi-step forms (e.g., Lead creation) require centralized Zod schema management to avoid duplication.

## Business Concerns
- Ensuring data privacy across different `Colaboradores` roles via RLS in Supabase.
- Scalability of the CRM dashboard for thousands of lead cards.
