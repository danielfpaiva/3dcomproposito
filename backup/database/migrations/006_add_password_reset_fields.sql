-- Migration: Add password reset fields to contributors table
-- Date: 2026-02-22
-- Description: Add reset_code and reset_code_expires_at fields for password recovery flow

-- Add reset code fields to contributors table
ALTER TABLE contributors
ADD COLUMN IF NOT EXISTS reset_code TEXT,
ADD COLUMN IF NOT EXISTS reset_code_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reset_code_attempts INTEGER DEFAULT 0;

-- Add index for faster lookups during password reset
CREATE INDEX IF NOT EXISTS idx_contributors_reset_code
ON contributors(reset_code)
WHERE reset_code IS NOT NULL;

-- Add comments
COMMENT ON COLUMN contributors.reset_code IS 'Temporary 6-digit code for password recovery';
COMMENT ON COLUMN contributors.reset_code_expires_at IS 'Expiration timestamp for reset code (15 minutes from generation)';
COMMENT ON COLUMN contributors.reset_code_attempts IS 'Number of failed attempts to verify reset code (max 3)';
