# Dashboard Imobiliária (dashboardmobi)

## What This Is

Um CRM imobiliário moderno focado em gestão de leads e sincronização com agentes de IA. O sistema permite o acompanhamento de interessados em imóveis, agendamento de visitas e integração em tempo real com o banco de dados Supabase.

## Core Value

Centralizar a gestão de leads e garantir que nenhum interessado fique sem resposta através de automação e interface intuitiva.

## Requirements

### Validated

- ✓ **REQ-01**: Dashboard Kanban funcional para gestão de leads.
- ✓ **REQ-02**: Integração com Supabase para persistência de dados.
- ✓ **REQ-03**: Sistema de filtragem e busca de imóveis.
- ✓ **REQ-04**: Provedor de tempo global (TimeContext) para sincronização de cards.

### Active

- [ ] **REQ-05**: Otimização da sincronização de dados de interesse do lead.
- [ ] **REQ-06**: Implementação de logging de erros para perda de contexto de propriedade.
- [ ] **REQ-07**: Finalização da branch `feat/clean-sync-v2`.

### Out of Scope

- **Gestão Financeira Completa**: Focado apenas no CRM e pré-venda inicial.
- **App Nativo Android/iOS**: Atualmente focado em Web (React/Vite).

## Context

O projeto utiliza um stack moderno (React 18 + Vite + Tailwind + Radix UI). Recentemente, houve um foco em estabilizar a persistência de dados de leads vindos de interações de conversa via LangGraph.

## Constraints

- **Tech Stack**: React 18, Vite, Supabase, Tailwind CSS.
- **Database**: PostgreSQL (Supabase).
- **Hosting**: Easypanel (VPS).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React Context API | Gerenciamento de tempo global sem prop-drilling. | ✓ Good |
| Supabase Realtime | Atualização instantânea do Kanban sem refresh. | ✓ Good |
| Branching feat/sync | Isolar mudanças críticas de dados de leads. | — Pending |

---
*Last updated: 2026-03-30 (Reinstalação do GSD)*
