---
status: testing
phase: 01-optimization
source: optimize-atendimentos-realtime.md
started: 2026-03-29T14:58:00Z
updated: 2026-03-29T14:58:00Z
---

## Current Test
number: 1
name: Simulação de Stream de Pensamentos (Alta Frequência)
expected: |
  A UI deve receber múltiplas mensagens por segundo (INSERT na tabela mensagens) sem travar.
  Apenas o card da conversa ativa deve mostrar o "spinner" ou atualização de texto.
  O scroll não deve "pular" erraticamente.
awaiting: user response

## Tests

### 1. Simulação de Stream de Pensamentos (Alta Frequência)
expected: Recebimento de 5-10 mensagens por segundo no mesmo atendimento. O card deve atualizar o sumário e o timestamp sem afetar a performance global.
result: [pending]

### 2. Estabilidade do ScrollArea
expected: Durante o stream, se o usuário estiver com o chat aberto, o scroll automático (se houver) ou manual deve permanecer fluido.
result: [pending]

### 3. Eficiência da Memoização
expected: Usando o React DevTools, apenas o ConversationItem do atendimento que recebeu a mensagem deve piscar (re-render). Os outros 50+ itens devem permanecer estáticos.
result: [pending]

## Summary
total: 3
passed: 0
issues: 0
pending: 3
skipped: 0

## Gaps
<!-- No issues reported yet -->
