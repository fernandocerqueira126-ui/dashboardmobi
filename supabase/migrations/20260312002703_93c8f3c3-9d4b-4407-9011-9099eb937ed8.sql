
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
