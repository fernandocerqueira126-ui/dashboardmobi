# Convention Map

## Code Standards
- **Naming**:
  - Components: `PascalCase`.
  - Files: `PascalCase` for React components (`.tsx`), `camelCase` for utilities (`.ts`).
  - Style: Functional components with arrow functions.
- **Organization**:
  - Group exports in `index` files or export directly.
  - Subcomponents located inside folders matching the parent (e.g., `src/components/atendimentos/`).
- **Imports**:
  - Aliases: Use `@/` for `src/`.
  - Logical order: React, Hooks, Contexts, Components, Constants, Types, Styles.

## Styling & UX
- **Class Management**: `tailwind-merge` + `clsx` (via `cn` utility in `src/lib/utils.ts`).
- **Responsive Philosophy**: Mobile-first breakpoints.
- **Theme**: Dark-first, but supports system/light (via `next-themes`).
- **UI State**: Visual feedback via transitions, hover effects, and skeleton loaders.

## Git & Commits
- Use meaningful commit messages (implied GSD convention).
- Keep code clean, minimal, and self-documenting.

## State Management Convention
- **Server state**: Prefers TanStack Query (`useQuery`, `useMutation`) for caching and revalidation.
- **Client shared state**: Prefers Context API over Redux or external libs.
- **Local component state**: Prefers `useState`, `useReducer`, or `shadcn/ui` provided patterns.

## Type Policy
- Explicit typing for all component props.
- Use of interfaces/types from `src/types/` for data models.
- Avoid broad `any` where possible.
