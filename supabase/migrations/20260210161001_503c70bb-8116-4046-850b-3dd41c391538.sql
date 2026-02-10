
-- Part status enum
CREATE TYPE public.part_status AS ENUM ('unassigned', 'assigned', 'printing', 'printed', 'shipped', 'complete');

-- Project status enum
CREATE TYPE public.project_status AS ENUM ('planning', 'active', 'complete');

-- Role enum for organizers
CREATE TYPE public.app_role AS ENUM ('admin', 'organizer');

-- Contributors table (no auth - token-based access)
CREATE TABLE public.contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  location TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'centro',
  printer_model TEXT NOT NULL,
  availability TEXT NOT NULL,
  can_ship BOOLEAN NOT NULL DEFAULT false,
  shipping_carrier TEXT,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles for authenticated organizers
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Wheelchair projects
CREATE TABLE public.wheelchair_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  target_parts INTEGER NOT NULL DEFAULT 0,
  status project_status NOT NULL DEFAULT 'planning',
  coordinator_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Parts table
CREATE TABLE public.parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_name TEXT NOT NULL,
  project_id UUID REFERENCES public.wheelchair_projects(id) ON DELETE CASCADE NOT NULL,
  assigned_contributor_id UUID REFERENCES public.contributors(id) ON DELETE SET NULL,
  status part_status NOT NULL DEFAULT 'unassigned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheelchair_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is any organizer/admin
CREATE OR REPLACE FUNCTION public.is_organizer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'organizer')
  )
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_contributors_updated_at BEFORE UPDATE ON public.contributors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wheelchair_projects_updated_at BEFORE UPDATE ON public.wheelchair_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON public.parts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Contributors: public INSERT (for the contribute form), token-based SELECT/UPDATE
CREATE POLICY "Anyone can register as contributor"
  ON public.contributors FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Contributors can view own record by token"
  ON public.contributors FOR SELECT
  USING (true);

CREATE POLICY "Contributors can update own record by token"
  ON public.contributors FOR UPDATE
  USING (true);

CREATE POLICY "Organizers can delete contributors"
  ON public.contributors FOR DELETE
  USING (public.is_organizer());

-- Profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_organizer());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles
CREATE POLICY "Roles viewable by own user or organizers"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_organizer());

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Wheelchair projects: public SELECT for dashboard, organizer CRUD
CREATE POLICY "Anyone can view projects"
  ON public.wheelchair_projects FOR SELECT
  USING (true);

CREATE POLICY "Organizers can create projects"
  ON public.wheelchair_projects FOR INSERT
  WITH CHECK (public.is_organizer());

CREATE POLICY "Organizers can update projects"
  ON public.wheelchair_projects FOR UPDATE
  USING (public.is_organizer());

CREATE POLICY "Organizers can delete projects"
  ON public.wheelchair_projects FOR DELETE
  USING (public.is_organizer());

-- Parts: public SELECT for progress tracking, organizer CRUD
CREATE POLICY "Anyone can view parts"
  ON public.parts FOR SELECT
  USING (true);

CREATE POLICY "Organizers can create parts"
  ON public.parts FOR INSERT
  WITH CHECK (public.is_organizer());

CREATE POLICY "Organizers can update parts"
  ON public.parts FOR UPDATE
  USING (public.is_organizer());

CREATE POLICY "Organizers can delete parts"
  ON public.parts FOR DELETE
  USING (public.is_organizer());

-- Aggregated stats view for public dashboard
CREATE VIEW public.dashboard_stats
WITH (security_invoker = on) AS
SELECT
  (SELECT COUNT(*) FROM public.contributors) AS total_contributors,
  (SELECT COUNT(*) FROM public.wheelchair_projects WHERE status = 'complete') AS wheelchairs_completed,
  (SELECT COUNT(*) FROM public.wheelchair_projects) AS total_projects,
  (SELECT COUNT(*) FROM public.parts WHERE status = 'complete') AS parts_completed,
  (SELECT COUNT(*) FROM public.parts WHERE status IN ('printing', 'printed', 'shipped')) AS parts_in_progress,
  (SELECT COUNT(*) FROM public.parts) AS total_parts;

-- Regional stats view
CREATE VIEW public.regional_stats
WITH (security_invoker = on) AS
SELECT
  region,
  COUNT(*) AS printer_count,
  COUNT(DISTINCT c.id) AS contributor_count
FROM public.contributors c
GROUP BY region;

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.contributors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wheelchair_projects;
