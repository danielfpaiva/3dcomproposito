-- Add part_code column to project_instance_parts
ALTER TABLE project_instance_parts
ADD COLUMN part_code TEXT;

-- Backfill existing parts with codes based on region
DO $$
DECLARE
  proj RECORD;
  part RECORD;
  region_prefix TEXT;
  project_seq INT;
  part_seq INT;
  region_map JSONB := '{
    "norte": "NOR",
    "centro": "CEN",
    "lisboa": "LIS",
    "alentejo": "ALT",
    "algarve": "ALG",
    "acores": "ACO",
    "madeira": "MAD"
  }'::JSONB;
  region_counters JSONB := '{}'::JSONB;
BEGIN
  -- Process each project ordered by creation date
  FOR proj IN
    SELECT pi.id, pi.created_at, br.region
    FROM project_instances pi
    LEFT JOIN beneficiary_requests br ON br.id = pi.request_id
    ORDER BY pi.created_at ASC
  LOOP
    -- Get region prefix (default to 'GEN' if no region)
    region_prefix := COALESCE(region_map ->> proj.region, 'GEN');

    -- Increment region counter
    IF region_counters ? region_prefix THEN
      project_seq := (region_counters ->> region_prefix)::INT + 1;
    ELSE
      project_seq := 1;
    END IF;
    region_counters := jsonb_set(region_counters, ARRAY[region_prefix], to_jsonb(project_seq));

    -- Number each part within the project
    part_seq := 0;
    FOR part IN
      SELECT id FROM project_instance_parts
      WHERE project_instance_id = proj.id
      ORDER BY part_name ASC
    LOOP
      part_seq := part_seq + 1;
      UPDATE project_instance_parts
      SET part_code = region_prefix || LPAD(project_seq::TEXT, 2, '0') || '-' || LPAD(part_seq::TEXT, 3, '0')
      WHERE id = part.id;
    END LOOP;
  END LOOP;
END $$;
