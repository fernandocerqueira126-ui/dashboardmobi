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
-- Corrigir os status dos leads existentes para o formato correto
UPDATE public.leads SET status = 'novo' WHERE status = 'Novo Lead';
UPDATE public.leads SET status = 'novo' WHERE status = 'novo_lead';
UPDATE public.leads SET status = 'novo' WHERE status = 'Novo';

-- Também corrigir outros possíveis valores inconsistentes
UPDATE public.leads SET status = 'contato' WHERE status = 'Contato Inicial';
UPDATE public.leads SET status = 'proposta' WHERE status = 'Proposta Enviada';
UPDATE public.leads SET status = 'negociacao' WHERE status = 'Negociação';
UPDATE public.leads SET status = 'ganho' WHERE status = 'Fechado Ganho';
UPDATE public.leads SET status = 'perdido' WHERE status = 'Fechado Perdido';

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

-- Step 1: Create enum
CREATE TYPE public.app_role AS ENUM ('admin', 'corretor');

-- Step 2: Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 3: Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'corretor',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Step 4: Create has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Step 5: Admin policy on user_roles (now that has_role exists)
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Step 6: get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Step 7: Add user_id to colaboradores
ALTER TABLE public.colaboradores ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE;

-- Step 8: Auto-create profile + corretor + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.colaboradores (nome, email, status, user_id)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NEW.email, 'ativo', NEW.id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'corretor');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 9: Update RLS policies
DROP POLICY IF EXISTS "Allow all access to leads" ON public.leads;
CREATE POLICY "Admin leads" ON public.leads FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth view leads" ON public.leads FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth insert leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update leads" ON public.leads FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow all access to agendamentos" ON public.agendamentos;
CREATE POLICY "Admin agendamentos" ON public.agendamentos FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth view agendamentos" ON public.agendamentos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth insert agendamentos" ON public.agendamentos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update agendamentos" ON public.agendamentos FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow all access to colaboradores" ON public.colaboradores;
CREATE POLICY "Auth view colaboradores" ON public.colaboradores FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin manage colaboradores" ON public.colaboradores FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Allow all access to atendimentos" ON public.atendimentos;
CREATE POLICY "Auth atendimentos" ON public.atendimentos FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow all access to mensagens" ON public.mensagens;
CREATE POLICY "Auth mensagens" ON public.mensagens FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;

-- Seed: 3 corretores fictícios
INSERT INTO public.colaboradores (id, nome, email, telefone, cargo, status) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Carlos Mendes', 'carlos@imobiliariapro.com', '(11) 99888-1001', 'Corretor Sênior', 'ativo'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Fernanda Lima', 'fernanda@imobiliariapro.com', '(11) 98777-2002', 'Corretora', 'ativo'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Ricardo Souza', 'ricardo@imobiliariapro.com', '(21) 97666-3003', 'Captador', 'ativo');

-- Seed: 10 leads distribuídos pelo funil
INSERT INTO public.leads (name, phone, email, value, description, date, source, status, link_imovel_interesse) VALUES
  ('Ana Beatriz Rocha', '(11) 99111-0001', 'ana.rocha@email.com', 450000, 'Interessada em apartamento 2 quartos no Jardins', '2026-02-15', 'WhatsApp', 'novo', 'https://imoveis.com/apt-jardins-2q'),
  ('Pedro Augusto Silva', '(11) 99222-0002', 'pedro.silva@email.com', 680000, 'Procura casa com quintal na Zona Norte', '2026-02-14', 'Instagram', 'novo', 'https://imoveis.com/casa-zn-quintal'),
  ('Mariana Costa Santos', '(21) 98333-0003', 'mariana.santos@email.com', 320000, 'Studio para investimento no Centro', '2026-02-13', 'Google Ads', 'contato', NULL),
  ('João Carlos Ferreira', '(11) 97444-0004', 'joao.ferreira@email.com', 890000, 'Cobertura duplex na Vila Mariana', '2026-02-12', 'Indicação', 'contato', 'https://imoveis.com/cobertura-vm'),
  ('Luciana Martins', '(21) 96555-0005', 'luciana.m@email.com', 550000, 'Apartamento 3 quartos com varanda gourmet', '2026-02-11', 'WhatsApp', 'visita', 'https://imoveis.com/apt-3q-varanda'),
  ('Roberto Almeida Jr.', '(11) 95666-0006', 'roberto.jr@email.com', 1200000, 'Casa em condomínio fechado Alphaville', '2026-02-10', 'Site', 'visita', 'https://imoveis.com/casa-alphaville'),
  ('Camila Oliveira', '(11) 94777-0007', 'camila.o@email.com', 720000, 'Apartamento garden com 4 suítes', '2026-02-09', 'LinkedIn', 'proposta', 'https://imoveis.com/garden-4s'),
  ('Thiago Nascimento', '(21) 93888-0008', 'thiago.n@email.com', 380000, 'Sala comercial no Brooklin', '2026-02-08', 'Google Ads', 'documentacao', NULL),
  ('Isabela Ribeiro', '(11) 92999-0009', 'isabela.r@email.com', 950000, 'Penthouse com vista para o parque', '2026-02-05', 'Indicação', 'ganho', 'https://imoveis.com/penthouse-parque'),
  ('Marcos Vinícius Dias', '(21) 91000-0010', 'marcos.d@email.com', 420000, 'Apartamento 2 quartos reformado', '2026-02-03', 'WhatsApp', 'perdido', NULL);

-- Confirmar email do Fernando
UPDATE auth.users 
SET email_confirmed_at = now(),
    raw_user_meta_data = raw_user_meta_data || '{"email_verified": true}'::jsonb
WHERE id = '5fcefc51-d288-4a0b-9d8f-06e3f58e1efe';

-- Promover para admin
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = '5fcefc51-d288-4a0b-9d8f-06e3f58e1efe';

-- Drop existing foreign key and recreate with CASCADE
ALTER TABLE public.agendamentos
  DROP CONSTRAINT IF EXISTS agendamentos_lead_id_fkey;

ALTER TABLE public.agendamentos
  ADD CONSTRAINT agendamentos_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES public.leads(id)
  ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.auto_move_lead_on_agendamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When an agendamento is created, find the lead by phone and update status to 'visita'
  IF NEW.lead_id IS NOT NULL THEN
    UPDATE public.leads SET status = 'visita' WHERE id = NEW.lead_id;
  ELSE
    -- Try to match by phone number
    UPDATE public.leads 
    SET status = 'visita' 
    WHERE phone = NEW.cliente_telefone 
      AND status NOT IN ('ganho', 'perdido', 'visita')
      AND NEW.cliente_telefone IS NOT NULL
      AND NEW.cliente_telefone != '';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_move_lead_on_agendamento ON public.agendamentos;

CREATE TRIGGER trigger_auto_move_lead_on_agendamento
  AFTER INSERT ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_move_lead_on_agendamento();
UPDATE public.leads SET status = 'visita' WHERE phone = '5521989732007' AND status NOT IN ('ganho', 'perdido');

-- 1. Helper function: get funnel stage order (higher = more advanced)
CREATE OR REPLACE FUNCTION public.lead_stage_order(p_status text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_status
    WHEN 'novo' THEN 1
    WHEN 'Novo Lead' THEN 1
    WHEN 'contato' THEN 2
    WHEN 'Contato Inicial' THEN 2
    WHEN 'visita' THEN 3
    WHEN 'Visita Marcada' THEN 3
    WHEN 'proposta' THEN 4
    WHEN 'Proposta Enviada' THEN 4
    WHEN 'documentacao' THEN 5
    WHEN 'Documentação/Análise' THEN 5
    WHEN 'ganho' THEN 6
    WHEN 'Fechado/Contrato' THEN 6
    WHEN 'perdido' THEN 0
    ELSE -1
  END;
$$;

-- 2. Regression protection trigger on leads table
CREATE OR REPLACE FUNCTION public.protect_lead_status_regression()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lead_stage_order(NEW.status) = 0 THEN
    RETURN NEW;
  END IF;
  IF lead_stage_order(NEW.status) > 0 
     AND lead_stage_order(OLD.status) > 0
     AND lead_stage_order(NEW.status) < lead_stage_order(OLD.status) THEN
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_protect_lead_regression ON public.leads;
CREATE TRIGGER trigger_protect_lead_regression
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.protect_lead_status_regression();

-- 3. RPC function for n8n: mover_lead_contato_inicial
CREATE OR REPLACE FUNCTION public.mover_lead_contato_inicial(p_phone text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leads
  SET status = 'contato'
  WHERE phone = p_phone
    AND status IN ('novo', 'Novo Lead');
END;
$$;

-- 4. Improved agendamento trigger (INSERT + UPDATE for cancellation)
CREATE OR REPLACE FUNCTION public.auto_move_lead_on_agendamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.lead_id IS NOT NULL THEN
      UPDATE public.leads SET status = 'visita' WHERE id = NEW.lead_id;
    ELSIF NEW.cliente_telefone IS NOT NULL AND NEW.cliente_telefone != '' THEN
      UPDATE public.leads SET status = 'visita' WHERE phone = NEW.cliente_telefone;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelado' AND OLD.status != 'cancelado' THEN
    IF NEW.lead_id IS NOT NULL THEN
      v_lead_id := NEW.lead_id;
    ELSIF NEW.cliente_telefone IS NOT NULL AND NEW.cliente_telefone != '' THEN
      SELECT id INTO v_lead_id FROM public.leads WHERE phone = NEW.cliente_telefone LIMIT 1;
    END IF;

    IF v_lead_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.agendamentos
        WHERE id != NEW.id
          AND status IN ('agendado', 'confirmado')
          AND (lead_id = v_lead_id OR cliente_telefone = NEW.cliente_telefone)
      ) THEN
        -- No active agendamentos, revert to contato (only from visita)
        -- Need to bypass regression trigger for this specific case
        UPDATE public.leads 
        SET status = 'contato' 
        WHERE id = v_lead_id 
          AND status IN ('visita', 'Visita Marcada');
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_move_lead_on_agendamento ON public.agendamentos;
CREATE TRIGGER trigger_auto_move_lead_on_agendamento
  AFTER INSERT OR UPDATE ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_move_lead_on_agendamento();

-- Fix search_path warning on lead_stage_order
CREATE OR REPLACE FUNCTION public.lead_stage_order(p_status text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_status
    WHEN 'novo' THEN 1
    WHEN 'Novo Lead' THEN 1
    WHEN 'contato' THEN 2
    WHEN 'Contato Inicial' THEN 2
    WHEN 'visita' THEN 3
    WHEN 'Visita Marcada' THEN 3
    WHEN 'proposta' THEN 4
    WHEN 'Proposta Enviada' THEN 4
    WHEN 'documentacao' THEN 5
    WHEN 'Documentação/Análise' THEN 5
    WHEN 'ganho' THEN 6
    WHEN 'Fechado/Contrato' THEN 6
    WHEN 'perdido' THEN 0
    ELSE -1
  END;
$$;

-- Update the agendamento trigger to disable regression check temporarily for cancellation flow
CREATE OR REPLACE FUNCTION public.auto_move_lead_on_agendamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id uuid;
  v_current_status text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.lead_id IS NOT NULL THEN
      UPDATE public.leads SET status = 'visita' WHERE id = NEW.lead_id;
    ELSIF NEW.cliente_telefone IS NOT NULL AND NEW.cliente_telefone != '' THEN
      UPDATE public.leads SET status = 'visita' WHERE phone = NEW.cliente_telefone;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelado' AND OLD.status != 'cancelado' THEN
    IF NEW.lead_id IS NOT NULL THEN
      v_lead_id := NEW.lead_id;
    ELSIF NEW.cliente_telefone IS NOT NULL AND NEW.cliente_telefone != '' THEN
      SELECT id INTO v_lead_id FROM public.leads WHERE phone = NEW.cliente_telefone LIMIT 1;
    END IF;

    IF v_lead_id IS NOT NULL THEN
      SELECT status INTO v_current_status FROM public.leads WHERE id = v_lead_id;
      
      -- Only revert if lead is currently in 'visita' stage
      IF v_current_status IN ('visita', 'Visita Marcada') THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.agendamentos
          WHERE id != NEW.id
            AND status IN ('agendado', 'confirmado')
            AND (lead_id = v_lead_id OR cliente_telefone = NEW.cliente_telefone)
        ) THEN
          -- Use session variable to signal regression trigger to allow this specific downgrade
          PERFORM set_config('app.allow_regression', 'true', true);
          UPDATE public.leads SET status = 'contato' WHERE id = v_lead_id;
          PERFORM set_config('app.allow_regression', 'false', true);
        END IF;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- Update regression trigger to check the session variable
CREATE OR REPLACE FUNCTION public.protect_lead_status_regression()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow if explicitly permitted by another trigger
  IF current_setting('app.allow_regression', true) = 'true' THEN
    RETURN NEW;
  END IF;
  
  -- Allow setting to 'perdido' from any stage
  IF lead_stage_order(NEW.status) = 0 THEN
    RETURN NEW;
  END IF;
  
  -- Block regression
  IF lead_stage_order(NEW.status) > 0 
     AND lead_stage_order(OLD.status) > 0
     AND lead_stage_order(NEW.status) < lead_stage_order(OLD.status) THEN
    NEW.status := OLD.status;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Webhooks configuration table
CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  url text NOT NULL,
  evento text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  secret_key text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  total_eventos integer NOT NULL DEFAULT 0,
  eventos_sucesso integer NOT NULL DEFAULT 0,
  ultima_execucao timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Webhook events log table
CREATE TABLE public.webhook_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  webhook_nome text NOT NULL,
  evento text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'sucesso',
  status_code integer,
  tempo_resposta integer,
  erro text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_eventos ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can manage webhooks
CREATE POLICY "Auth manage webhooks" ON public.webhooks FOR ALL TO public
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth view webhook_eventos" ON public.webhook_eventos FOR SELECT TO public
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth insert webhook_eventos" ON public.webhook_eventos FOR INSERT TO public
  WITH CHECK (auth.uid() IS NOT NULL);

-- Service role can insert eventos (from edge function)
CREATE POLICY "Service insert webhook_eventos" ON public.webhook_eventos FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service select webhooks" ON public.webhooks FOR SELECT TO service_role
  USING (true);

CREATE POLICY "Service update webhooks" ON public.webhooks FOR UPDATE TO service_role
  USING (true);
