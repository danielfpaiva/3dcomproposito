-- ============================================
-- Migration 003: Fix RLS for project_instance_parts
-- ============================================
-- Purpose: Allow anonymous users (volunteers) to view their assigned parts
-- The volunteer portal uses anon key, not authenticated users

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Anon users can view assigned parts" ON project_instance_parts;
DROP POLICY IF EXISTS "Anon users can update assigned parts status" ON project_instance_parts;

-- Create new policies that allow anon access to assigned parts
CREATE POLICY "Anon users can view assigned parts"
    ON project_instance_parts FOR SELECT
    USING (assigned_contributor_id IS NOT NULL);

CREATE POLICY "Anon users can update assigned parts status"
    ON project_instance_parts FOR UPDATE
    USING (assigned_contributor_id IS NOT NULL)
    WITH CHECK (assigned_contributor_id IS NOT NULL);

-- Verify RLS is enabled
ALTER TABLE project_instance_parts ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY "Anon users can view assigned parts" ON project_instance_parts
IS 'Volunteers can view parts assigned to them via portal (anon access)';

COMMENT ON POLICY "Anon users can update assigned parts status" ON project_instance_parts
IS 'Volunteers can update status of their assigned parts via portal (anon access)';
