
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
