-- ============================================
-- Script: Resend allocation emails to volunteers
-- ============================================
-- Purpose: Trigger notify-part-allocated edge function for all already allocated parts
-- Usage: Run this SQL in Supabase SQL Editor ONCE to resend emails to all volunteers
--        who have parts assigned but may not have received the email yet.

-- This query groups parts by contributor and calls the edge function
-- Note: You need to execute this manually via a script or admin UI because
--       SQL cannot directly call edge functions with authentication.

-- Step 1: Get list of all contributors with allocated parts
-- Copy this result and use it to manually trigger emails from admin UI

SELECT
    assigned_contributor_id as contributor_id,
    c.name as contributor_name,
    c.email as contributor_email,
    array_agg(pip.id) as part_ids,
    array_agg(pip.part_name) as part_names,
    count(*) as parts_count
FROM project_instance_parts pip
INNER JOIN contributors c ON c.id = pip.assigned_contributor_id
WHERE pip.assigned_contributor_id IS NOT NULL
GROUP BY assigned_contributor_id, c.name, c.email
ORDER BY c.name;

-- ============================================
-- ALTERNATIVE: JavaScript snippet to run in browser console
-- ============================================
-- Copy this and run in browser console while logged in as admin on the site:
--
-- (async () => {
--   const { data: allocations } = await supabase
--     .from('project_instance_parts')
--     .select('assigned_contributor_id, id')
--     .not('assigned_contributor_id', 'is', null);
--
--   const grouped = allocations.reduce((acc, row) => {
--     if (!acc[row.assigned_contributor_id]) {
--       acc[row.assigned_contributor_id] = [];
--     }
--     acc[row.assigned_contributor_id].push(row.id);
--     return acc;
--   }, {});
--
--   for (const [contributorId, partIds] of Object.entries(grouped)) {
--     console.log(`Sending email to contributor ${contributorId} for ${partIds.length} parts...`);
--     const { error } = await supabase.functions.invoke('notify-part-allocated', {
--       body: { contributor_id: contributorId, part_ids: partIds }
--     });
--     if (error) {
--       console.error(`Failed for contributor ${contributorId}:`, error);
--     } else {
--       console.log(`✅ Sent to contributor ${contributorId}`);
--     }
--     await new Promise(r => setTimeout(r, 1000)); // 1s delay between emails
--   }
--   console.log('✅ All emails sent!');
-- })();
