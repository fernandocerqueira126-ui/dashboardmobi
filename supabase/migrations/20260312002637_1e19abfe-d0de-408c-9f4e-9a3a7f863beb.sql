
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
