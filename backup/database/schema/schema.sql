-- ============================================
-- SCHEMA CREATION SCRIPT
-- Impact Print Connect - Supabase Migration
-- ============================================
-- Source: Lovable Cloud (gbfahkeamspmzptetkqc)
-- Target: New Supabase (bsbqmqfznkozqagdhvoj)
-- Date: 2026-02-16
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CUSTOM ENUMS
-- ============================================

CREATE TYPE part_status AS ENUM (
    'unassigned',
    'assigned',
    'printing',
    'printed',
    'shipped',
    'complete'
);

CREATE TYPE project_status AS ENUM (
    'planning',
    'in_progress',
    'completed',
    'cancelled'
);

CREATE TYPE user_role AS ENUM (
    'admin',
    'coordinator',
    'volunteer'
);

-- ============================================
-- TABLES
-- ============================================

-- Profiles table
CREATE TABLE profiles (
    id uuid PRIMARY KEY,
    full_name text,
    email text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- User roles table
CREATE TABLE user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL
);

-- Contributors table
CREATE TABLE contributors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    location text NOT NULL,
    region text DEFAULT 'centro' NOT NULL,
    availability text NOT NULL,
    can_ship boolean DEFAULT false NOT NULL,
    shipping_carrier text,
    token uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    phone text,
    materials text[] DEFAULT '{PETG}' NOT NULL,
    build_volume_ok boolean DEFAULT false NOT NULL,
    experience_level text DEFAULT 'intermediate' NOT NULL,
    turnaround_time text,
    willing_to_collaborate boolean DEFAULT false NOT NULL,
    printer_models text[],
    build_plate_size text,
    password_hash text
);

-- Wheelchair projects table
CREATE TABLE wheelchair_projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    target_parts integer DEFAULT 0 NOT NULL,
    status project_status DEFAULT 'planning' NOT NULL,
    coordinator_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Parts table
CREATE TABLE parts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    part_name text NOT NULL,
    project_id uuid NOT NULL REFERENCES wheelchair_projects(id) ON DELETE CASCADE,
    assigned_contributor_id uuid REFERENCES contributors(id) ON DELETE SET NULL,
    status part_status DEFAULT 'unassigned' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    category text,
    material text,
    file_url text
);

-- Part templates table
CREATE TABLE part_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name text NOT NULL,
    part_name text NOT NULL,
    category text NOT NULL,
    material text NOT NULL,
    print_time_hours numeric DEFAULT 0,
    sort_order integer DEFAULT 0 NOT NULL
);

-- Beneficiary requests table
CREATE TABLE beneficiary_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_name text NOT NULL,
    contact_email text NOT NULL,
    contact_phone text,
    region text DEFAULT 'centro' NOT NULL,
    beneficiary_age text NOT NULL,
    beneficiary_type text DEFAULT 'crianca' NOT NULL,
    description text NOT NULL,
    how_found_us text,
    status text DEFAULT 'pendente' NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Donations table
CREATE TABLE donations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_name text,
    donor_email text,
    amount_cents integer DEFAULT 0 NOT NULL,
    method text DEFAULT 'outro' NOT NULL,
    message text,
    public_name boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

CREATE INDEX idx_contributors_email ON contributors(email);
CREATE INDEX idx_contributors_region ON contributors(region);
CREATE INDEX idx_contributors_token ON contributors(token);

CREATE INDEX idx_parts_project_id ON parts(project_id);
CREATE INDEX idx_parts_assigned_contributor_id ON parts(assigned_contributor_id);
CREATE INDEX idx_parts_status ON parts(status);

CREATE INDEX idx_wheelchair_projects_coordinator_id ON wheelchair_projects(coordinator_id);
CREATE INDEX idx_wheelchair_projects_status ON wheelchair_projects(status);

CREATE INDEX idx_beneficiary_requests_status ON beneficiary_requests(status);
CREATE INDEX idx_beneficiary_requests_region ON beneficiary_requests(region);

CREATE INDEX idx_donations_created_at ON donations(created_at);

-- ============================================
-- VIEWS
-- ============================================

-- Dashboard stats view
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM contributors) as total_contributors,
    (SELECT COUNT(*) FROM wheelchair_projects) as total_projects,
    (SELECT COUNT(*) FROM parts) as total_parts,
    (SELECT COUNT(*) FROM parts WHERE status = 'printed') as parts_completed,
    (SELECT COUNT(*) FROM parts WHERE status = 'printing') as parts_in_progress,
    (SELECT COUNT(*) FROM wheelchair_projects WHERE status = 'in_progress') as wheelchairs_completed,
    (SELECT COUNT(*) FROM donations) as total_donations,
    (SELECT COALESCE(SUM(amount_cents), 0) FROM donations) as total_donated_cents;

-- Regional stats view
CREATE OR REPLACE VIEW regional_stats AS
SELECT
    region,
    COUNT(*) as contributor_count,
    COUNT(*) as printer_count
FROM contributors
GROUP BY region;

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_contributors_updated_at
    BEFORE UPDATE ON contributors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wheelchair_projects_updated_at
    BEFORE UPDATE ON wheelchair_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_updated_at
    BEFORE UPDATE ON parts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beneficiary_requests_updated_at
    BEFORE UPDATE ON beneficiary_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMPLETED
-- ============================================
-- Next steps:
-- 1. Execute this script in new Supabase SQL editor
-- 2. Export data from Lovable tables as CSV
-- 3. Import CSV data to new tables
-- 4. Configure RLS policies
-- 5. Update environment variables
-- ============================================
