# 03-01 + 03-02 Summary — Lead Proposal Flow

**Status:** ✅ Complete  
**Date:** 2026-03-30  
**Phase:** 03 — Lead Detail & Proposta Flow

---

## O que foi entregue

### 03-01 — Novos botões no LeadDetailSheet
- **Criar Proposta** (btn-primary, largura total) adicionado entre Editar/Mover e Converter/Excluir
- **Ir para Atendimento** (outline + ícone MessageCircle) adicionado abaixo de Criar Proposta
- Separador visual entre os novos botões e o bloco Converter/Excluir
- Props `onCreateProposal` e `onGoToAtendimento` adicionadas como opcionais (backward compatible)
- `LeadDetailSheet` usage em `LeadsCRM.tsx` atualizado com handlers de navegação

### 03-02 — Página de Proposta (`/proposta/:id`)
- Nova rota registrada em `App.tsx`
- Carrega dados do lead (name, phone, value, link_imovel_interesse) via Supabase
- **Busca RAG**: campo de pesquisa com debounce 350ms → busca via `supabase.ilike('link_imovel_interesse')`
- **Gerador Gemini**: campo de instruções + botão "Gerar Minuta com IA" usando REST API
- Minuta editável in-place + botões Copiar e Regenerar
- Aviso amigável quando `VITE_GEMINI_API_KEY` não está configurado

## Arquivos modificados
- `src/pages/LeadsCRM.tsx` — props e layout do LeadDetailSheet
- `src/App.tsx` — rota /proposta/:id
- `src/pages/Proposta.tsx` — criado (novo arquivo)

## Configuração necessária (único pendente)
```
# .env
VITE_GEMINI_API_KEY=sua_chave_aqui
# Obter em: https://aistudio.google.com/app/apikey
```

## Verificação TypeScript
```
npx tsc --noEmit → 0 erros
```
