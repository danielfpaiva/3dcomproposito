
# Contador de Donativos + Opcoes de Acao na Pagina Inicial

## O que vamos fazer

1. **Contador publico de donativos** no ProgressSection (junto aos outros stats)
2. **Nova seccao de escolha** na pagina inicial entre "Imprimir 3D" e "Doar Dinheiro" (substituir ou complementar o CTA atual)

---

## Detalhes Tecnicos

### 1. Atualizar a view `dashboard_stats` no banco de dados

A view atual nao inclui dados de donativos. Vamos recria-la para adicionar:
- `total_donations` -- numero total de donativos registados
- `total_donated_cents` -- soma total em centimos

```sql
CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT
  (SELECT count(*) FROM contributors) AS total_contributors,
  (SELECT count(*) FROM wheelchair_projects) AS total_projects,
  (SELECT count(*) FROM parts) AS total_parts,
  (SELECT count(*) FROM parts WHERE status = 'complete') AS parts_completed,
  (SELECT count(*) FROM parts WHERE status IN ('assigned','printing','printed','shipped')) AS parts_in_progress,
  (SELECT count(*) FROM wheelchair_projects WHERE status = 'complete') AS wheelchairs_completed,
  (SELECT count(*) FROM donations) AS total_donations,
  (SELECT COALESCE(sum(amount_cents), 0) FROM donations) AS total_donated_cents;
```

### 2. ProgressSection -- adicionar metrica de donativos

Adicionar um 4o card na grelha de metricas:
- Icone: Heart (ou Euro)
- Label: "Total Doado"
- Valor: formatar `total_donated_cents / 100` como euros (ex: "150€")

### 3. HeroSection ou nova seccao -- dual CTA

Atualizar a seccao CTA (ou a HeroSection) para apresentar duas opcoes claras lado a lado:
- **Card 1**: "Tenho uma impressora 3D" -> link para `/contribute`
- **Card 2**: "Quero ajudar com donativo" -> link para `/donate`
- Manter tambem o link "Pedir Ajuda" para `/request`

Vamos adicionar isto como uma nova seccao entre o ProgressSection e o CTASection existente, com dois cards visuais grandes.

### Ficheiros afetados

1. `supabase/migrations/` -- recriar view dashboard_stats com colunas de donativos
2. `src/hooks/useDashboardStats.ts` -- tipos ja vao ser atualizados automaticamente
3. `src/components/ProgressSection.tsx` -- adicionar metrica de donativos
4. `src/pages/Index.tsx` -- adicionar nova seccao de escolha dual
5. Novo ficheiro `src/components/DualCTASection.tsx` -- seccao com os dois cards de acao
