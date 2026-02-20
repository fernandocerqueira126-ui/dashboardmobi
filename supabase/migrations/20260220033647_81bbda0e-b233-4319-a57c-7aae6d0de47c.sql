
-- Drop existing foreign key and recreate with CASCADE
ALTER TABLE public.agendamentos
  DROP CONSTRAINT IF EXISTS agendamentos_lead_id_fkey;

ALTER TABLE public.agendamentos
  ADD CONSTRAINT agendamentos_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES public.leads(id)
  ON DELETE CASCADE;
