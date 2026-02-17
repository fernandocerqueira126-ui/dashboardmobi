-- Remover a política restritiva existente
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.leads;

-- Criar política permissiva para permitir leitura pública
CREATE POLICY "Allow public read access"
ON public.leads
FOR SELECT
TO public
USING (true);

-- Criar política para permitir inserção/atualização/deleção pública (temporário até implementar auth)
CREATE POLICY "Allow public write access"
ON public.leads
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Habilitar RLS nas outras tabelas que estão sem
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- Políticas temporárias para acesso público (até implementar auth)
CREATE POLICY "Allow public access" ON public.agendamentos FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.atendimentos FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.clientes FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.colaboradores FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.mensagens FOR ALL TO public USING (true) WITH CHECK (true);