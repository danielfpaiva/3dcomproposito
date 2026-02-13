-- Create storage bucket for project resources (guides, docs)
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true);

-- Allow anyone to view/download resources
CREATE POLICY "Anyone can view resources"
ON storage.objects FOR SELECT
USING (bucket_id = 'resources');

-- Only organizers can upload resources
CREATE POLICY "Organizers can upload resources"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resources' AND is_organizer());

CREATE POLICY "Organizers can delete resources"
ON storage.objects FOR DELETE
USING (bucket_id = 'resources' AND is_organizer());