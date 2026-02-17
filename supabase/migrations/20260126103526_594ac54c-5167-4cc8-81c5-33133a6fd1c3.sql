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