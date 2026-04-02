

## Problema

A tela está em branco porque o arquivo `src/integrations/supabase/client.ts` está lendo variáveis de ambiente com nomes diferentes das definidas no `.env`:

| `.env` define | `client.ts` lê |
|---|---|
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `VITE_SUPABASE_ANON_KEY` ← **não existe** |

Isso faz o Supabase crashar com `"supabaseUrl is required"` e a aplicação inteira não renderiza.

## Plano

**1 arquivo, 1 mudança:**

Corrigir `src/integrations/supabase/client.ts` linha 6 para ler `VITE_SUPABASE_PUBLISHABLE_KEY` em vez de `VITE_SUPABASE_ANON_KEY`, alinhando com o que está definido no `.env`.

Isso resolve o erro imediato e restaura a visualização do dashboard.

