
-- Table: corretores (UI: Corretores, replaces "colaboradores" in code)
CREATE TABLE public.colaboradores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  cargo TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: leads (CRM leads with imobiliária fields)
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  value NUMERIC DEFAULT 0,
  paid_value NUMERIC DEFAULT 0,
  description TEXT,
  date TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD'),
  source TEXT DEFAULT 'WhatsApp',
  status TEXT NOT NULL DEFAULT 'novo',
  is_paid BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  link_imovel_interesse TEXT,
  ultima_mensagem TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: agendamentos (visitas agendadas)
CREATE TABLE public.agendamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT,
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  data TEXT NOT NULL,
  horario TEXT NOT NULL,
  duracao TEXT DEFAULT '60',
  servico TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'agendado',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: atendimentos
CREATE TABLE public.atendimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id TEXT,
  cliente_nome TEXT NOT NULL,
  cliente_email TEXT,
  cliente_telefone TEXT,
  assunto TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberto',
  prioridade TEXT NOT NULL DEFAULT 'media',
  colaborador TEXT,
  origem TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: mensagens (for atendimentos)
CREATE TABLE public.mensagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  atendimento_id UUID NOT NULL REFERENCES public.atendimentos(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  remetente TEXT NOT NULL DEFAULT 'atendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.colaboradores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agendamentos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.atendimentos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;
