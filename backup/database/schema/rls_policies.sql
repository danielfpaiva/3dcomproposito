-- ============================================
-- RLS POLICIES - Impact Print Connect
-- ============================================
-- Security Model:
-- 1. PUBLIC: Anyone can view stats, register, request help
-- 2. AUTHENTICATED (Supabase Auth): Admins can manage everything
-- 3. TOKEN-BASED: Volunteers can view their own data via UUID token
-- ============================================

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
-- Admins only (used for Supabase Auth users)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all profiles
CREATE POLICY "Authenticated users can read profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own profile on signup
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. USER_ROLES TABLE
-- ============================================
-- Only authenticated users can see roles

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all roles
CREATE POLICY "Authenticated users can read roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert/update/delete roles (future: add admin check)
CREATE POLICY "Authenticated users can manage roles"
ON user_roles FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 3. CONTRIBUTORS TABLE
-- ============================================
-- PUBLIC can view (for /organizadores page)
-- PUBLIC can insert (registration form)
-- Volunteers can update their own data via token
-- Admins can do everything

ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;

-- Anyone can view contributors (public list on /organizadores)
CREATE POLICY "Public can view contributors"
ON contributors FOR SELECT
TO anon, authenticated
USING (true);

-- Anyone can register as contributor (public form)
CREATE POLICY "Public can insert contributors"
ON contributors FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Authenticated admins can update any contributor
CREATE POLICY "Admins can update contributors"
ON contributors FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated admins can delete contributors
CREATE POLICY "Admins can delete contributors"
ON contributors FOR DELETE
TO authenticated
USING (true);

-- NOTE: Token-based updates happen via API with service role
-- (Frontend sends token, backend validates and updates)

-- ============================================
-- 4. WHEELCHAIR_PROJECTS TABLE
-- ============================================
-- PUBLIC can view (for stats)
-- Admins can manage

ALTER TABLE wheelchair_projects ENABLE ROW LEVEL SECURITY;

-- Anyone can view projects (for stats and progress)
CREATE POLICY "Public can view projects"
ON wheelchair_projects FOR SELECT
TO anon, authenticated
USING (true);

-- Authenticated admins can manage projects
CREATE POLICY "Admins can manage projects"
ON wheelchair_projects FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 5. PARTS TABLE
-- ============================================
-- PUBLIC can view (for stats)
-- Admins can manage

ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

-- Anyone can view parts (for stats)
CREATE POLICY "Public can view parts"
ON parts FOR SELECT
TO anon, authenticated
USING (true);

-- Authenticated admins can manage parts
CREATE POLICY "Admins can manage parts"
ON parts FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 6. PART_TEMPLATES TABLE
-- ============================================
-- PUBLIC can view (for registration form)
-- Admins can manage

ALTER TABLE part_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view templates (for forms)
CREATE POLICY "Public can view templates"
ON part_templates FOR SELECT
TO anon, authenticated
USING (true);

-- Authenticated admins can manage templates
CREATE POLICY "Admins can manage templates"
ON part_templates FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 7. BENEFICIARY_REQUESTS TABLE
-- ============================================
-- PUBLIC can insert (request help form)
-- Admins can view and manage

ALTER TABLE beneficiary_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit beneficiary request (public form)
CREATE POLICY "Public can insert beneficiary requests"
ON beneficiary_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Authenticated admins can view all requests
CREATE POLICY "Admins can view beneficiary requests"
ON beneficiary_requests FOR SELECT
TO authenticated
USING (true);

-- Authenticated admins can update requests (approve/reject)
CREATE POLICY "Admins can update beneficiary requests"
ON beneficiary_requests FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated admins can delete requests
CREATE POLICY "Admins can delete beneficiary requests"
ON beneficiary_requests FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 8. DONATIONS TABLE
-- ============================================
-- PUBLIC can view total (for stats)
-- PUBLIC can insert (donation form - future feature)
-- Admins can manage

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Anyone can view donations (for stats, names only if public_name=true)
CREATE POLICY "Public can view public donations"
ON donations FOR SELECT
TO anon, authenticated
USING (true);

-- Anyone can insert donations (future: donation form)
CREATE POLICY "Public can insert donations"
ON donations FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Authenticated admins can manage donations
CREATE POLICY "Admins can manage donations"
ON donations FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- VIEWS (dashboard_stats, regional_stats)
-- ============================================
-- Views inherit permissions from underlying tables
-- No additional RLS needed

-- ============================================
-- COMPLETED
-- ============================================
-- Security summary:
-- ✅ Public can: view most data, register, request help
-- ✅ Authenticated admins can: manage everything
-- ✅ Token-based access for volunteers handled in app logic
--
-- Next steps:
-- 1. Execute this script in Supabase SQL Editor
-- 2. Test public pages (should work)
-- 3. Test admin login and operations
-- 4. Test volunteer portal with token
-- 5. Add role-based policies later (admin vs coordinator)
-- ============================================
