
-- Confirmar email do Fernando
UPDATE auth.users 
SET email_confirmed_at = now(),
    raw_user_meta_data = raw_user_meta_data || '{"email_verified": true}'::jsonb
WHERE id = '5fcefc51-d288-4a0b-9d8f-06e3f58e1efe';

-- Promover para admin
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = '5fcefc51-d288-4a0b-9d8f-06e3f58e1efe';
