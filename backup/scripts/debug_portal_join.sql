-- Debug: Check if project_instance exists for the part

-- 1. Check the part and its project_instance_id
SELECT
  pip.id as part_id,
  pip.part_name,
  pip.project_instance_id,
  pip.assigned_contributor_id,
  c.email,
  c.name
FROM project_instance_parts pip
JOIN contributors c ON c.id = pip.assigned_contributor_id
WHERE c.email = 'paulojtavares@hotmail.com';

-- 2. Check if the project_instance exists
SELECT
  pi.id,
  pi.name,
  pi.initiative_id,
  pi.status
FROM project_instances pi
WHERE pi.id = (
  SELECT project_instance_id
  FROM project_instance_parts pip
  JOIN contributors c ON c.id = pip.assigned_contributor_id
  WHERE c.email = 'paulojtavares@hotmail.com'
  LIMIT 1
);

-- 3. Check the full join that Portal.tsx uses
SELECT
  pip.*,
  pi.name as project_name,
  i.name as initiative_name
FROM project_instance_parts pip
INNER JOIN project_instances pi ON pi.id = pip.project_instance_id
LEFT JOIN initiatives i ON i.id = pi.initiative_id
WHERE pip.assigned_contributor_id = (
  SELECT id FROM contributors WHERE email = 'paulojtavares@hotmail.com'
);
