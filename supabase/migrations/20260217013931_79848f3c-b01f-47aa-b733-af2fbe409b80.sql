
-- Enable RLS on all tables with public access policies (no auth yet)
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- Public access policies (since there's no auth implemented)
CREATE POLICY "Allow all access to colaboradores" ON public.colaboradores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to agendamentos" ON public.agendamentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to atendimentos" ON public.atendimentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to mensagens" ON public.mensagens FOR ALL USING (true) WITH CHECK (true);
