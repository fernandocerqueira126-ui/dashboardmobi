
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
