# Integration Map

## External Services
- **Supabase**: Primary data store, authentication, and backend functions.
  - Client instance: `src/integrations/supabase/client.ts`.
  - Schema/Types: `src/integrations/supabase/types.ts`.
- **Lucide Icons**: Integrated across all UI (`lucide-react`).
- **Google Fonts**: Inter, Roboto, Outfit (as per system instructions - wait, let me check `index.html`).
- **Recharts**: Integrated in `Financeiro.tsx`, `Relatorios.tsx`, `Index.tsx`.
- **Evolution API** (Indirectly inferred from the task summary): Integrated for WhatsApp interactions (external service).
- **Vite Plugin React SWC**: Used as the build/optimization system.

## Injected Contexts (Core Integrations)
- `AuthContext`: Manages identity session with Supabase.
- `LeadsContext`: Central lead management (CRM).
- `AtendimentosContext`: Central messaging management.
- `TimeContext`: Unified project time.

## Key APIs
- Native Web APIs (Local Storage, Intersection Observer).
- Supabase SDK (Realtime, PostgREST).
