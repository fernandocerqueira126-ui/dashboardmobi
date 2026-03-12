
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
