

# Campos em Falta no Formulario de Contribuicao

## Comparacao com o formulario oficial da 3D-Mobility.org

Depois de analisar o formulario oficial dos criadores do TMT, identifiquei campos importantes que faltam na nossa aplicacao e que sao relevantes para o contexto portugues.

### Campos que devemos adicionar

1. **Volume de impressao (build volume)** -- CRITICO
   - O TMT exige no minimo 256 x 256 x 256 mm de volume de construcao
   - Sem isto, podemos atribuir pecas a alguem cuja impressora nao as consegue imprimir
   - Implementacao: campo numerico simples ou checkbox "A minha impressora tem pelo menos 256x256x256mm"

2. **Nivel de experiencia**
   - Iniciante / Intermedio / Experiente
   - Ajuda a decidir a quem atribuir pecas mais complexas ou criticas
   - Implementacao: selecao visual com 3 opcoes (como o passo de disponibilidade)

3. **Tempo estimado de entrega (turnaround)**
   - 1-2 semanas / 2-4 semanas / 4-6 semanas / 6+ semanas
   - Essencial para planear prazos de conclusao de cadeiras
   - Implementacao: selecao visual com 4 opcoes

4. **Disponibilidade para colaborar com outros makers**
   - Checkbox simples: "Disponivel para ajudar outros makers / builds partilhadas"
   - Util para o agrupamento regional que ja temos

### Campos do formulario oficial que NAO precisamos

- Password/conta (usamos sistema de token)
- Pais (somos so Portugal)
- Tipo de maker (individual vs makerspace -- comunidade pequena, nao e relevante)
- Verificacao de qualidade com test prints (demasiado complexo para o MVP)
- Portfolio/redes sociais
- Termos e condicoes legais (nao somos a MakeGood INC)
- Marcas de impressora multiplas (ja capturamos o modelo especifico)

## Detalhes Tecnicos

### 1. Migracao SQL
Adicionar colunas a tabela `contributors`:
- `build_volume_ok` (boolean, default false) -- confirma que tem pelo menos 256x256x256mm
- `experience_level` (text, default 'intermediate') -- beginner, intermediate, expert
- `turnaround_time` (text, nullable) -- estimativa de tempo de entrega
- `willing_to_collaborate` (boolean, default false) -- disponivel para builds partilhadas

### 2. Formulario de contribuicao (Contribute.tsx)
Reorganizar os passos:
- Passo 1: Nome (sem alteracao)
- Passo 2: Localizacao (sem alteracao)
- Passo 3: Impressora + novo checkbox de volume minimo (256x256x256mm)
- Passo 4: Materiais (sem alteracao)
- Passo 5: Experiencia (NOVO) -- 3 opcoes visuais
- Passo 6: Disponibilidade + tempo de entrega estimado (ATUALIZADO -- juntar turnaround aqui)
- Passo 7: Envio + colaboracao (ATUALIZADO -- adicionar checkbox de colaboracao)
- Passo 8: Ativar (email + telefone, sem alteracao)

### 3. Dialogo de adicao manual (AddContributorDialog.tsx)
- Adicionar campos: volume de impressao (checkbox), experiencia (select), turnaround (select), colaboracao (checkbox)

### 4. Admin (Admin.tsx)
- Mostrar nivel de experiencia e turnaround na tabela de voluntarios
- Mostrar aviso visual se o volume de impressao nao esta confirmado

### 5. Filtros (ContributorsFilters.tsx)
- Adicionar filtro por nivel de experiencia
- Adicionar filtro por volume de impressao confirmado

### 6. Atribuicao de pecas (PartAssignmentSelect.tsx)
- Mostrar badge de experiencia junto ao nome
- Destacar/avisar se o voluntario nao confirmou volume de impressao suficiente

### Ficheiros afetados
1. `supabase/migrations/` -- nova migracao (4 colunas novas)
2. `src/pages/Contribute.tsx` -- novos passos e campos
3. `src/components/admin/AddContributorDialog.tsx` -- novos campos
4. `src/pages/Admin.tsx` -- colunas e badges adicionais
5. `src/components/admin/ContributorsFilters.tsx` -- filtros novos
6. `src/components/admin/PartAssignmentSelect.tsx` -- badges e avisos
7. `src/pages/Portal.tsx` -- mostrar/editar novos campos no portal do voluntario

