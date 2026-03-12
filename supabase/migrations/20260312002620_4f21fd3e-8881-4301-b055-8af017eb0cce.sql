
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
