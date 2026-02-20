-- ============================================
-- Debug: Volunteer Portal Issue
-- ============================================
-- Email: paulojtavares@hotmail.com

-- 1. Get contributor info and token
SELECT
  id,
  name,
  email,
  token,
  'https://www.3dcomproposito.pt/portal?token=' || token as portal_link
FROM contributors
WHERE email = 'paulojtavares@hotmail.com';

-- 2. Check parts assigned to this contributor (OLD system - wheelchair_projects)
SELECT
  p.id,
  p.part_name,
  p.status,
  p.assigned_contributor_id,
  wp.name as project_name
FROM parts p
LEFT JOIN wheelchair_projects wp ON wp.id = p.project_id
WHERE p.assigned_contributor_id = (
  SELECT id FROM contributors WHERE email = 'paulojtavares@hotmail.com'
);

-- 3. Check parts assigned to this contributor (NEW system - project_instances)
SELECT
  pip.id,
  pip.part_name,
  pip.status,
  pip.assigned_contributor_id,
  pip.file_url,
  pi.name as project_name,
  i.name as initiative_name
FROM project_instance_parts pip
LEFT JOIN project_instances pi ON pi.id = pip.project_instance_id
LEFT JOIN initiatives i ON i.id = pi.initiative_id
WHERE pip.assigned_contributor_id = (
  SELECT id FROM contributors WHERE email = 'paulojtavares@hotmail.com'
);

-- 4. Verify contributor ID matches
SELECT
  'Contributor ID from contributors table:' as check_type,
  id as contributor_id
FROM contributors
WHERE email = 'paulojtavares@hotmail.com'

UNION ALL

SELECT
  'Contributor ID in project_instance_parts:' as check_type,
  assigned_contributor_id as contributor_id
FROM project_instance_parts
WHERE assigned_contributor_id = (
  SELECT id FROM contributors WHERE email = 'paulojtavares@hotmail.com'
)
LIMIT 1;
