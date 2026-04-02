# Testing Map

## Test Runner
- **Vitest** (v3.2.4): Runner for unit and integration testing.
- **Vite Plugin React SDK**: Used for React ecosystem testing.

## Test Environment
- **Browser emulation**: `jsdom` (via devDependencies).
- **Libraries**:
  - `@testing-library/react`.
  - `@testing-library/jest-dom`.

## Test Structure
- **Global setup**: `src/test/setup.ts` (observed from common patterns/package.json).
- **File location**: Co-located with code (`*.test.tsx`) or globally in `src/test/`.
- **Scripts**:
  - `npm run test`: Run all tests once.
  - `npm run test:watch`: Run tests in watch mode.

## Observed Coverage
- The project is configured for testing, though specific coverage results were not yet audited.
- Focus: Critical logic (contexts, hooks).

## Target Testing Pyramid
- **Unit (Lower)**: Utilities, components (via Vitest).
- **Integration (Middle)**: Context providers, custom hooks (via Vitest).
- **E2E (Top)**: Not explicitly configured/implemented in codebase root (no Playwright/Cypress root folder), but supported by Antigravity's `webapp-testing` skill.
