# Plano: Otimização de Realtime e Renderização de Atendimentos

## Visão Geral
Refatorar a lógica de recebimento de mensagens e renderização da lista de conversas para migrar de um modelo de "Refetch Total" (caro em performance) para um modelo de "Patch Local" (reatividade instantânea) e "Memoização" (economia de re-renders).

**Tipo de Projeto**: WEB (React + Supabase)

## Critérios de Sucesso
- [ ] Novas mensagens aparecem no dashboard sem disparar uma nova requisição `SELECT` ao banco.
- [ ] A lista de conversas (`ConversationList`) não re-renderiza todos os itens quando apenas um recebe uma mensagem.
- [ ] Inscrição em tempo real na tabela `mensagens` funcionando corretamente.
- [ ] Nenhuma quebra na lógica de notificações ou status global.

## Arquitetura de Solução
1. **Contexto (Fluxo de Dados)**:
   - Adição de `useEffect` para ouvir a tabela `mensagens`.
   - Implementação de lógica de merge no estado `atendimentos`.
   - Uso de `useCallback` para estabilizar referências de funções.
2. **UI (Componentização)**:
   - Extração de `ConversationItem` como componente memoizado.
   - Separação de lógicas de "Cálculo de Tempo" para evitar computação pesada no render principal.

## Estrutura de Arquivos Previsa
- `src/contexts/AtendimentosContext.tsx` (Alteração de lógica Realtime)
- `src/components/atendimentos/ConversationItem.tsx` (Novo Componente)
- `src/components/atendimentos/ConversationList.tsx` (Refatoração para usar o novo componente)

## Cronograma de Tarefas

### Fase 1: Refatoração do Contexto (Backend & Core)
| Task ID | Nome | Agente | Skills | Prioridade | Dependências |
|---------|------|--------|--------|------------|--------------|
| T1 | **Subscrição Tabela Mensagens** | `@backend-specialist` | `api-patterns` | P0 | - |
| **INPUT** | `AtendimentosContext.tsx` atual. |
| **OUTPUT** | Canal Realtime ouvindo `INSERT` em `mensagens`. |
| **VERIFY** | Log no console ao chegar nova mensagem externa via Supabase Dashboard. |

| Task ID | Nome | Agente | Skills | Prioridade | Dependências |
|---------|------|--------|--------|------------|--------------|
| T2 | **Lógica de Patch Local** | `@frontend-specialist` | `clean-code` | P1 | T1 |
| **INPUT** | Evento Realtime do Supabase. |
| **OUTPUT** | `setAtendimentos(prev => ...)` atualizando apenas a conversa específica. |
| **VERIFY** | A lista de conversas atualiza o texto da "última mensagem" sem recarregar (Network Tab do Chrome permanece limpa). |

### Fase 2: Otimização de UI (Frontend)
| Task ID | Nome | Agente | Skills | Prioridade | Dependências |
|---------|------|--------|--------|------------|--------------|
| T3 | **Extração do ConversationItem** | `@frontend-specialist` | `frontend-design` | P2 | - |
| **INPUT** | Loop `.map` em `ConversationList.tsx`. |
| **OUTPUT** | Novo arquivo `ConversationItem.tsx` com `React.memo`. |
| **VERIFY** | Código limpo e props tipadas. |

| Task ID | Nome | Agente | Skills | Prioridade | Dependências |
|---------|------|--------|--------|------------|--------------|
| T4 | **Implementação da Memoização** | `@frontend-specialist` | `performance-profiling` | P2 | T3 |
| **INPUT** | `ConversationList.tsx`. |
| **OUTPUT** | Lista utilizando `ConversationItem`. |
| **VERIFY** | Usar React DevTools Profiler para garantir que apenas o item alterado re-renderiza. |

## Fase X: Verificação Final
- [ ] Rodar `npm run lint` para garantir padrões.
- [ ] Testar envio de mensagem pelo dashboard e verificar se o estado local reflete sem `fetch`.
- [ ] Simular mensagem recebida pelo banco de dados (lado cliente) e ver reatividade.
