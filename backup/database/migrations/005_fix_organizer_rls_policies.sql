-- ============================================
-- Migration 005: Fix RLS policies for organizer access
-- ============================================
-- Author: Claude Code
-- Date: 2026-02-21
-- Description: Ensures organizers can view and manage all initiatives and projects
--              Fixes issue where organizers couldn't see existing data in dashboard
-- ============================================

-- 1. Recreate is_organizer() function to ensure it exists and works correctly
CREATE OR REPLACE FUNCTION is_organizer()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_roles
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'organizer')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_organizer() IS 'Checks if authenticated user has admin or organizer role';

-- 2. RLS policies for initiatives
DROP POLICY IF EXISTS "Organizers can manage initiatives" ON initiatives;
DROP POLICY IF EXISTS "Organizers can view initiatives" ON initiatives;
DROP POLICY IF EXISTS "Organizers can insert initiatives" ON initiatives;
DROP POLICY IF EXISTS "Organizers can update initiatives" ON initiatives;
DROP POLICY IF EXISTS "Organizers can delete initiatives" ON initiatives;

CREATE POLICY "Organizers can manage initiatives"
    ON initiatives
    FOR ALL
    TO authenticated
    USING (is_organizer())
    WITH CHECK (is_organizer());

-- 3. RLS policies for initiative_parts
DROP POLICY IF EXISTS "Organizers can manage initiative parts" ON initiative_parts;
DROP POLICY IF EXISTS "Organizers can view initiative parts" ON initiative_parts;
DROP POLICY IF EXISTS "Organizers can insert initiative parts" ON initiative_parts;
DROP POLICY IF EXISTS "Organizers can update initiative parts" ON initiative_parts;
DROP POLICY IF EXISTS "Organizers can delete initiative parts" ON initiative_parts;

CREATE POLICY "Organizers can manage initiative parts"
    ON initiative_parts
    FOR ALL
    TO authenticated
    USING (is_organizer())
    WITH CHECK (is_organizer());

-- 4. RLS policies for project_instances
DROP POLICY IF EXISTS "Organizers can manage project instances" ON project_instances;
DROP POLICY IF EXISTS "Organizers can view project instances" ON project_instances;
DROP POLICY IF EXISTS "Organizers can insert project instances" ON project_instances;
DROP POLICY IF EXISTS "Organizers can update project instances" ON project_instances;
DROP POLICY IF EXISTS "Organizers can delete project instances" ON project_instances;

CREATE POLICY "Organizers can manage project instances"
    ON project_instances
    FOR ALL
    TO authenticated
    USING (is_organizer())
    WITH CHECK (is_organizer());

-- 5. RLS policies for project_instance_parts
DROP POLICY IF EXISTS "Organizers can manage project instance parts" ON project_instance_parts;
DROP POLICY IF EXISTS "Organizers can view project instance parts" ON project_instance_parts;
DROP POLICY IF EXISTS "Organizers can insert project instance parts" ON project_instance_parts;
DROP POLICY IF EXISTS "Organizers can update project instance parts" ON project_instance_parts;
DROP POLICY IF EXISTS "Organizers can delete project instance parts" ON project_instance_parts;

CREATE POLICY "Organizers can manage project instance parts"
    ON project_instance_parts
    FOR ALL
    TO authenticated
    USING (is_organizer())
    WITH CHECK (is_organizer());

-- 6. RLS policies for beneficiary_requests
DROP POLICY IF EXISTS "Organizers can manage beneficiary requests" ON beneficiary_requests;
DROP POLICY IF EXISTS "Organizers can view beneficiary requests" ON beneficiary_requests;
DROP POLICY IF EXISTS "Organizers can insert beneficiary requests" ON beneficiary_requests;
DROP POLICY IF EXISTS "Organizers can update beneficiary requests" ON beneficiary_requests;
DROP POLICY IF EXISTS "Organizers can delete beneficiary requests" ON beneficiary_requests;

CREATE POLICY "Organizers can manage beneficiary requests"
    ON beneficiary_requests
    FOR ALL
    TO authenticated
    USING (is_organizer())
    WITH CHECK (is_organizer());

-- 7. Ensure RLS is enabled on all tables
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_instance_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiary_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION QUERIES (for testing)
-- ============================================

-- Test as organizer (run this while logged in as organizer):
-- SELECT is_organizer() as am_i_organizer;
-- SELECT COUNT(*) as initiatives_count FROM initiatives;
-- SELECT COUNT(*) as projects_count FROM project_instances;
-- SELECT COUNT(*) as requests_count FROM beneficiary_requests;
