
# Recuperacao do Portal + Multiplas Impressoras

## O que vamos fazer

1. **Recuperar acesso ao portal por email** -- quando alguem vai a `/portal` sem token (ou com token invalido), em vez de so mostrar erro, mostra um formulario simples para inserir o email e receber o link do portal.
2. **Selecao de multiplas impressoras** -- permitir que os voluntarios selecionem mais do que uma impressora 3D no formulario de inscricao e no painel admin.

---

## 1. Recuperacao do Portal

### Como funciona

Na pagina `/portal`, quando nao ha token ou e invalido:
- Mostra um formulario com campo de email
- Ao submeter, faz lookup na tabela `contributors` pelo email
- Se encontrar, mostra o link do portal diretamente na pagina (ou redireciona)
- Se nao encontrar, mostra mensagem de erro amigavel

Sem necessidade de enviar emails -- mostra o link diretamente apos validar o email. Isto e seguro porque o portal so mostra dados do proprio voluntario.

### Ficheiros afetados

- **`src/pages/Portal.tsx`** -- Adicionar formulario de recuperacao na secao de erro (quando nao ha token)

---

## 2. Multiplas Impressoras

### Alteracoes na base de dados

Converter a coluna `printer_model` (text) para `printer_models` (text array), com migracao que preserva dados existentes:

```sql
ALTER TABLE contributors ADD COLUMN printer_models text[] DEFAULT '{}';
UPDATE contributors SET printer_models = ARRAY[printer_model] WHERE printer_model IS NOT NULL;
ALTER TABLE contributors DROP COLUMN printer_model;
```

### Alteracoes no formulario de inscricao (`Contribute.tsx`)

- Mudar `formData.printer` de `string` para `string[]`
- Trocar o `Select` (single) por botoes toggle (como ja fazemos para materiais)
- Agrupar impressoras por marca para facilitar a navegacao
- Atualizar a validacao e o insert para usar array

### Alteracoes no Portal (`Portal.tsx`)

- Mostrar lista de impressoras em vez de uma so

### Alteracoes no Admin

- **`AddContributorDialog.tsx`** -- Mudar select de impressora para multi-select
- **`Admin.tsx`** -- Atualizar display de impressoras nos cards/tabelas de voluntarios

### Ficheiros afetados

1. `supabase/migrations/` -- Migracao para converter coluna
2. `src/pages/Contribute.tsx` -- Multi-select de impressoras
3. `src/pages/Portal.tsx` -- Recuperacao por email + display de multiplas impressoras
4. `src/components/admin/AddContributorDialog.tsx` -- Multi-select de impressoras
5. `src/pages/Admin.tsx` -- Display de multiplas impressoras (se aplicavel)
