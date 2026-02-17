

# Plano de Correção: Conexão Supabase e Erros de Build

## Resumo do Problema

Sua dashboard está desaparecendo porque há dois problemas críticos:

1. **Conexão com Supabase quebrada**: O código foi alterado para usar variáveis de ambiente que não funcionam no Lovable
2. **Erros de TypeScript**: Propriedades `clienteEmail` e `clienteTelefone` são usadas no código mas não existem na definição de tipos

---

## Correção 1: Restaurar Conexão Supabase

### O que aconteceu
O arquivo de cliente Supabase foi alterado para usar `import.meta.env.VITE_*`, que não é suportado pelo Lovable e retorna strings vazias.

### Solução
Usar os valores diretos da URL e chave do Supabase (que você forneceu):

**Arquivo**: `src/integrations/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ygoszrmhvbqvhpwpnghj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnb3N6cm1odmJxdmhwd3BuZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzOTgxMzIsImV4cCI6MjA4NDk3NDEzMn0.CX8z61ok4CWnZ9qOpINt2bWHpWLyObER0IZyuBfQ0xQ";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

---

## Correção 2: Corrigir Interface de Atendimento

### O que aconteceu
O código tenta usar `clienteEmail` e `clienteTelefone`, mas essas propriedades não existem na interface `Atendimento`.

### Solução
Adicionar as propriedades opcionais na interface e no mapeamento de dados.

**Arquivo**: `src/contexts/AtendimentosContext.tsx`

Adicionar na interface `Atendimento`:
```typescript
export interface Atendimento {
  id: string;
  clienteId: string | null;
  clienteNome: string;
  clienteEmail?: string | null;      // NOVO
  clienteTelefone?: string | null;   // NOVO
  assunto: string;
  status: "aberto" | "em_andamento" | "resolvido";
  prioridade: "alta" | "media" | "baixa";
  colaborador?: string | null;
  origem: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
  mensagens: Mensagem[];
}
```

---

## Correção 3: Atualizar Página de Atendimentos

**Arquivo**: `src/pages/Atendimentos.tsx`

Remover as linhas 120-121 do `addAtendimento` que passam propriedades inexistentes, ou torná-las opcionais no tipo da função.

---

## Correção 4: Corrigir Sheet de Detalhes

**Arquivo**: `src/components/atendimentos/AtendimentoDetailSheet.tsx`

A verificação de `clienteEmail` e `clienteTelefone` nas linhas 120-131 já usa condicionais (`&&`), então funcionará corretamente após adicionar as propriedades na interface.

---

## Detalhes Técnicos

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/integrations/supabase/client.ts` | Substituir variáveis de ambiente por valores diretos |
| `src/contexts/AtendimentosContext.tsx` | Adicionar `clienteEmail` e `clienteTelefone` na interface e no mapeamento |
| `src/pages/Atendimentos.tsx` | Remover propriedades inexistentes ou garantir que são opcionais |

### Por que isso funciona

1. **Chave pública (anon key)**: É seguro usar diretamente no código - é uma chave pública projetada para ser exposta
2. **Propriedades opcionais**: Usar `?` na interface permite que os campos sejam `undefined` sem causar erros de tipo

---

## Resultado Esperado

Após as correções:
- A dashboard voltará a aparecer normalmente
- A conexão com o Supabase funcionará
- Os erros de build serão resolvidos
- Todas as funcionalidades de atendimentos funcionarão corretamente

