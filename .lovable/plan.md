
# Duas Novas Areas: Donativos e Inscricao de Beneficiarios

## Resumo

Adicionar duas funcionalidades novas ao PrintImpact Connect:

1. **Pagina de Donativos** -- para quem quer ajudar financeiramente (comprar filamento, custos de envio, futuras acoes)
2. **Pagina de Inscricao de Beneficiarios** -- para familias/instituicoes que precisam de cadeiras de rodas (ou futuros projetos similares)

---

## 1. Pagina de Donativos (`/donate`)

Uma pagina simples e emocional com:
- Explicacao do impacto de cada donativo (ex: "10EUR = 1kg de PETG = ~3 pecas")
- Botao para contactar o criador Gabriel da Smart 3d da facilidade esta parte por agora
- Opcao de deixar nome e email para agradecimento publico (opcional)
- Contador de donativos recebidos (opcional, fase futura)


## 2. Pagina de Inscricao de Beneficiarios (`/request`)

Formulario para quem precisa de uma cadeira de rodas (ou equipamento similar):
- Nome do responsavel / instituicao
- Email e telefone de contacto
- Localizacao (regiao)
- Para quem e (crianca/adulto, idade aproximada)
- Descricao da necessidade
- Como soube do projeto
- Estado: "pendente" ate um organizador validar

---

## Detalhes Tecnicos

### Base de Dados -- 2 novas tabelas

**Tabela `donations`:**
- `id` (uuid, PK)
- `donor_name` (text, nullable -- anonimo se quiser)
- `donor_email` (text, nullable)
- `amount_cents` (integer) -- valor em centimos
- `method` (text) -- "mbway", "transferencia", "paypal", "outro"
- `message` (text, nullable) -- mensagem opcional
- `public_name` (boolean, default false) -- se quer nome visivel
- `created_at` (timestamp)

RLS: Qualquer pessoa pode inserir. So organizadores podem ver/gerir.

**Tabela `beneficiary_requests`:**
- `id` (uuid, PK)
- `contact_name` (text)
- `contact_email` (text)
- `contact_phone` (text, nullable)
- `region` (text)
- `beneficiary_age` (text) -- ex: "3 anos", "adulto"
- `beneficiary_type` (text) -- "crianca", "adulto"
- `description` (text) -- descricao da necessidade
- `how_found_us` (text, nullable)
- `status` (text, default "pendente") -- pendente, em_avaliacao, aprovado, concluido
- `notes` (text, nullable) -- notas internas dos organizadores
- `created_at` (timestamp)
- `updated_at` (timestamp)

RLS: Qualquer pessoa pode inserir. So organizadores podem ver/gerir.

### Novas Paginas

1. **`src/pages/Donate.tsx`** -- Pagina de donativos com:
   - Secao hero emocional explicando o impacto
   - Cards com metodos de pagamento (MBWay, IBAN, PayPal)
   - Formulario opcional para registar donativo (nome, email, valor, metodo)
   - Design consistente com o resto da app

2. **`src/pages/Request.tsx`** -- Formulario de inscricao de beneficiarios com:
   - Formulario multi-step (3-4 passos) seguindo o padrao do `/contribute`
   - Passo 1: Dados de contacto (nome, email, telefone)
   - Passo 2: Localizacao (regiao)
   - Passo 3: Detalhes da necessidade (tipo, idade, descricao)
   - Passo 4: Submissao
   - Mensagem de confirmacao apos submissao

### Alteracoes a Ficheiros Existentes

1. **`src/App.tsx`** -- Adicionar rotas `/donate` e `/request`
2. **`src/components/Navbar.tsx`** -- Adicionar links "Doar" e "Pedir Ajuda" na navegacao
3. **`src/components/CTASection.tsx`** -- Adicionar botoes secundarios para donativos e pedidos de ajuda
4. **`src/components/HeroSection.tsx`** -- Adicionar stat de donativos ou pedidos (opcional)
5. **`src/pages/Admin.tsx`** -- Adicionar tab/seccao para gerir pedidos de beneficiarios e ver donativos

### Ficheiros Novos

1. `supabase/migrations/` -- Migracao com 2 tabelas novas + RLS
2. `src/pages/Donate.tsx`
3. `src/pages/Request.tsx`
