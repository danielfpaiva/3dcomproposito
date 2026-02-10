
-- Create part_templates table
CREATE TABLE public.part_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  part_name text NOT NULL,
  category text NOT NULL,
  material text NOT NULL,
  print_time_hours numeric DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.part_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view templates" ON public.part_templates FOR SELECT USING (true);
CREATE POLICY "Organizers can manage templates" ON public.part_templates FOR ALL USING (is_organizer());

-- Add category and material columns to parts table
ALTER TABLE public.parts ADD COLUMN category text;
ALTER TABLE public.parts ADD COLUMN material text;

-- Insert the 24 TMT parts as templates
INSERT INTO public.part_templates (template_name, part_name, category, material, print_time_hours, sort_order) VALUES
  ('TMT v1', 'Pega Direita (Handle Right)', 'Estrutura', 'PETG', 4, 1),
  ('TMT v1', 'Pega Esquerda (Handle Left)', 'Estrutura', 'PETG', 4, 2),
  ('TMT v1', 'Pega Central (Handle Center)', 'Estrutura', 'PETG', 5, 3),
  ('TMT v1', 'Estrutura Direita (Frame Right)', 'Estrutura', 'PETG', 8, 4),
  ('TMT v1', 'Estrutura Esquerda (Frame Left)', 'Estrutura', 'PETG', 8, 5),
  ('TMT v1', 'Estrutura Central (Frame Center)', 'Estrutura', 'PETG', 6, 6),
  ('TMT v1', 'Base Frontal (Frame Base Front)', 'Estrutura', 'PETG', 7, 7),
  ('TMT v1', 'Base Traseira (Frame Base Rear)', 'Estrutura', 'PETG', 7, 8),
  ('TMT v1', 'Suporte Eixo Direito (Axle Mount Right)', 'Estrutura', 'PETG', 3, 9),
  ('TMT v1', 'Suporte Eixo Esquerdo (Axle Mount Left)', 'Estrutura', 'PETG', 3, 10),
  ('TMT v1', 'Suporte Roda Frontal Direito (Caster Mount FR)', 'Estrutura', 'PETG', 2, 11),
  ('TMT v1', 'Suporte Roda Frontal Esquerdo (Caster Mount FL)', 'Estrutura', 'PETG', 2, 12),
  ('TMT v1', 'Apoio Pé Direito (Footrest Right)', 'Estrutura', 'PETG', 3, 13),
  ('TMT v1', 'Apoio Pé Esquerdo (Footrest Left)', 'Estrutura', 'PETG', 3, 14),
  ('TMT v1', 'Base do Assento (Seat Base)', 'Estrutura', 'PETG', 10, 15),
  ('TMT v1', 'Encosto (Seat Back)', 'Estrutura', 'PETG', 8, 16),
  ('TMT v1', 'Painel Lateral Direito (Side Panel Right)', 'Estrutura', 'PETG', 5, 17),
  ('TMT v1', 'Painel Lateral Esquerdo (Side Panel Left)', 'Estrutura', 'PETG', 5, 18),
  ('TMT v1', 'Tabuleiro (Tray)', 'Estrutura', 'PETG', 6, 19),
  ('TMT v1', 'Roda Direita (Wheel Right)', 'Estrutura', 'PETG', 4, 20),
  ('TMT v1', 'Roda Esquerda (Wheel Left)', 'Estrutura', 'PETG', 4, 21),
  ('TMT v1', 'Almofada do Assento (Seat Cushion)', 'Peças Macias', 'TPU', 6, 22),
  ('TMT v1', 'Almofada do Encosto (Back Cushion)', 'Peças Macias', 'TPU', 5, 23),
  ('TMT v1', 'Pegas Macias (Grip Pads)', 'Peças Macias', 'TPU', 2, 24);

-- Update the dashboard_stats view to reflect actual part counts
CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT
  (SELECT count(*) FROM public.contributors) AS total_contributors,
  (SELECT count(*) FROM public.wheelchair_projects WHERE status = 'complete') AS wheelchairs_completed,
  (SELECT count(*) FROM public.wheelchair_projects) AS total_projects,
  (SELECT count(*) FROM public.parts WHERE status = 'complete') AS parts_completed,
  (SELECT count(*) FROM public.parts WHERE status IN ('assigned','printing','printed','shipped')) AS parts_in_progress,
  (SELECT count(*) FROM public.parts) AS total_parts;
