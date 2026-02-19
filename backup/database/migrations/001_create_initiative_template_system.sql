-- ============================================================================
-- MIGRATION: Initiative Template System
-- ============================================================================
--
-- Cria as 4 novas tabelas do sistema de iniciativas e templates.
-- Este sistema substitui wheelchair_projects, parts, e part_templates.
--
-- Data: 2026-02-19
-- Author: Generated with Claude Code
-- ============================================================================

-- 1. INITIATIVES TABLE
-- ====================
-- Templates de iniciativas (ex: TMT, outras cadeiras de rodas)

CREATE TABLE IF NOT EXISTS initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for active initiatives
CREATE INDEX IF NOT EXISTS idx_initiatives_is_active ON initiatives(is_active);

COMMENT ON TABLE initiatives IS 'Templates de iniciativas (ex: TMT Toddler Mobility Trainer)';
COMMENT ON COLUMN initiatives.name IS 'Nome da iniciativa (ex: 3D Toddler Mobility Trainer)';
COMMENT ON COLUMN initiatives.description IS 'Descrição da iniciativa';
COMMENT ON COLUMN initiatives.is_active IS 'Se false, não aparece no dropdown de criação de projetos';


-- 2. INITIATIVE_PARTS TABLE
-- ==========================
-- Peças que compõem cada iniciativa (template)

CREATE TABLE IF NOT EXISTS initiative_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    part_name TEXT NOT NULL,
    category TEXT,
    material TEXT,
    file_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_initiative_parts_initiative_id ON initiative_parts(initiative_id);
CREATE INDEX IF NOT EXISTS idx_initiative_parts_sort_order ON initiative_parts(initiative_id, sort_order);

COMMENT ON TABLE initiative_parts IS 'Peças que compõem uma iniciativa (template)';
COMMENT ON COLUMN initiative_parts.initiative_id IS 'FK para initiatives';
COMMENT ON COLUMN initiative_parts.part_name IS 'Nome da peça (ex: Suporte Roda Frontal Esquerdo)';
COMMENT ON COLUMN initiative_parts.category IS 'Categoria da peça (ex: ESTRUTURA (PETG))';
COMMENT ON COLUMN initiative_parts.material IS 'Material sugerido (ex: PETG, PLA)';
COMMENT ON COLUMN initiative_parts.file_url IS 'URL do ficheiro STL/3MF (Google Drive, etc)';
COMMENT ON COLUMN initiative_parts.sort_order IS 'Ordem de apresentação (0, 1, 2, ...)';


-- 3. PROJECT_INSTANCES TABLE
-- ===========================
-- Projetos criados a partir de iniciativas (instâncias)

-- Primeiro criar o enum para status
DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('planning', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS project_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE RESTRICT,
    request_id UUID REFERENCES beneficiary_requests(id) ON DELETE SET NULL,
    status project_status DEFAULT 'planning',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_instances_initiative_id ON project_instances(initiative_id);
CREATE INDEX IF NOT EXISTS idx_project_instances_request_id ON project_instances(request_id);
CREATE INDEX IF NOT EXISTS idx_project_instances_status ON project_instances(status);
CREATE INDEX IF NOT EXISTS idx_project_instances_created_at ON project_instances(created_at DESC);

COMMENT ON TABLE project_instances IS 'Projetos criados a partir de iniciativas (ex: Cadeira 1 Norte)';
COMMENT ON COLUMN project_instances.name IS 'Nome do projeto (ex: Cadeira Lisboa #1)';
COMMENT ON COLUMN project_instances.initiative_id IS 'FK para initiatives (template usado)';
COMMENT ON COLUMN project_instances.request_id IS 'FK para beneficiary_requests (pedido associado - obrigatório)';
COMMENT ON COLUMN project_instances.status IS 'Estado: planning, in_progress, completed, cancelled';


-- 4. PROJECT_INSTANCE_PARTS TABLE
-- ================================
-- Peças de cada projeto (snapshot do template no momento da criação)

-- Primeiro criar o enum para part_status (se ainda não existir)
DO $$ BEGIN
    CREATE TYPE part_status AS ENUM ('unassigned', 'assigned', 'printing', 'printed', 'shipped', 'complete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS project_instance_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_instance_id UUID NOT NULL REFERENCES project_instances(id) ON DELETE CASCADE,
    initiative_part_id UUID REFERENCES initiative_parts(id) ON DELETE SET NULL,
    part_name TEXT NOT NULL,
    category TEXT,
    material TEXT,
    file_url TEXT,
    status part_status DEFAULT 'unassigned',
    assigned_contributor_id UUID REFERENCES contributors(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_instance_parts_project_id ON project_instance_parts(project_instance_id);
CREATE INDEX IF NOT EXISTS idx_project_instance_parts_initiative_part_id ON project_instance_parts(initiative_part_id);
CREATE INDEX IF NOT EXISTS idx_project_instance_parts_contributor_id ON project_instance_parts(assigned_contributor_id);
CREATE INDEX IF NOT EXISTS idx_project_instance_parts_status ON project_instance_parts(status);

COMMENT ON TABLE project_instance_parts IS 'Peças de cada projeto (snapshot do template)';
COMMENT ON COLUMN project_instance_parts.project_instance_id IS 'FK para project_instances';
COMMENT ON COLUMN project_instance_parts.initiative_part_id IS 'FK para initiative_parts (referência ao template original)';
COMMENT ON COLUMN project_instance_parts.part_name IS 'Nome da peça (copiado do template)';
COMMENT ON COLUMN project_instance_parts.category IS 'Categoria (copiado do template)';
COMMENT ON COLUMN project_instance_parts.material IS 'Material (copiado do template)';
COMMENT ON COLUMN project_instance_parts.file_url IS 'URL do ficheiro (copiado do template)';
COMMENT ON COLUMN project_instance_parts.status IS 'Estado: unassigned, assigned, printing, printed, shipped, complete';
COMMENT ON COLUMN project_instance_parts.assigned_contributor_id IS 'FK para contributors (voluntário atribuído)';


-- 5. CREATE HELPER FUNCTION FOR RLS
-- ===================================
-- Função para verificar se o user atual é organizer

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

COMMENT ON FUNCTION is_organizer() IS 'Verifica se o utilizador autenticado tem role admin ou organizer';


-- 6. ROW LEVEL SECURITY (RLS)
-- ============================
-- Aplicar RLS igual às outras tabelas (apenas organizers)

ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_instance_parts ENABLE ROW LEVEL SECURITY;

-- Policies: apenas organizers podem ver/editar
CREATE POLICY "Organizers can view initiatives"
    ON initiatives FOR SELECT
    USING (is_organizer());

CREATE POLICY "Organizers can insert initiatives"
    ON initiatives FOR INSERT
    WITH CHECK (is_organizer());

CREATE POLICY "Organizers can update initiatives"
    ON initiatives FOR UPDATE
    USING (is_organizer());

CREATE POLICY "Organizers can delete initiatives"
    ON initiatives FOR DELETE
    USING (is_organizer());

-- Repetir para as outras 3 tabelas
CREATE POLICY "Organizers can view initiative_parts"
    ON initiative_parts FOR SELECT
    USING (is_organizer());

CREATE POLICY "Organizers can insert initiative_parts"
    ON initiative_parts FOR INSERT
    WITH CHECK (is_organizer());

CREATE POLICY "Organizers can update initiative_parts"
    ON initiative_parts FOR UPDATE
    USING (is_organizer());

CREATE POLICY "Organizers can delete initiative_parts"
    ON initiative_parts FOR DELETE
    USING (is_organizer());

CREATE POLICY "Organizers can view project_instances"
    ON project_instances FOR SELECT
    USING (is_organizer());

CREATE POLICY "Organizers can insert project_instances"
    ON project_instances FOR INSERT
    WITH CHECK (is_organizer());

CREATE POLICY "Organizers can update project_instances"
    ON project_instances FOR UPDATE
    USING (is_organizer());

CREATE POLICY "Organizers can delete project_instances"
    ON project_instances FOR DELETE
    USING (is_organizer());

CREATE POLICY "Organizers can view project_instance_parts"
    ON project_instance_parts FOR SELECT
    USING (is_organizer());

CREATE POLICY "Organizers can insert project_instance_parts"
    ON project_instance_parts FOR INSERT
    WITH CHECK (is_organizer());

CREATE POLICY "Organizers can update project_instance_parts"
    ON project_instance_parts FOR UPDATE
    USING (is_organizer());

CREATE POLICY "Organizers can delete project_instance_parts"
    ON project_instance_parts FOR DELETE
    USING (is_organizer());

-- Policy adicional: Anon users podem ver peças atribuídas (para portal do voluntário)
-- Nota: O frontend filtra por contributor token na query
CREATE POLICY "Anon users can view assigned parts"
    ON project_instance_parts FOR SELECT
    USING (assigned_contributor_id IS NOT NULL);

-- Policy adicional: Anon users podem atualizar estado das peças atribuídas
-- Nota: O frontend valida que o contributor_id corresponde ao token
CREATE POLICY "Anon users can update assigned parts status"
    ON project_instance_parts FOR UPDATE
    USING (assigned_contributor_id IS NOT NULL)
    WITH CHECK (assigned_contributor_id IS NOT NULL);


-- 7. ADICIONAR NOVO ESTADO AO ENUM beneficiary_request_status
-- =============================================================
-- COMENTADO: Verificar primeiro se a coluna status usa TEXT ou ENUM
-- Se a coluna for TEXT, não é necessário este passo
-- Se for ENUM, descomentar e executar separadamente após verificar

-- ALTER TYPE beneficiary_request_status ADD VALUE IF NOT EXISTS 'em_andamento';

-- Nota: Se a coluna status em beneficiary_requests for TEXT,
-- o valor 'em_andamento' pode ser usado diretamente sem alterar enum


-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================
-- Executar para confirmar que as tabelas foram criadas:
--
-- SELECT tablename
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('initiatives', 'initiative_parts', 'project_instances', 'project_instance_parts')
-- ORDER BY tablename;
--
-- Deves ver as 4 tabelas novas.
-- ============================================================================
