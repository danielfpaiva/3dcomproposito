-- Migration: Add is_active column to contributors table
-- Date: 2026-03-17
-- Description: Add is_active boolean field to allow deactivating volunteers
--              Deactivated volunteers should not appear in part assignment dropdowns

-- Add is_active column with default true (all existing volunteers are active)
ALTER TABLE contributors
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Create index for performance when filtering active volunteers
CREATE INDEX idx_contributors_is_active ON contributors(is_active);

-- Add comment for documentation
COMMENT ON COLUMN contributors.is_active IS 'Indicates if volunteer is active in the system. Inactive volunteers should not appear in assignment dropdowns.';
