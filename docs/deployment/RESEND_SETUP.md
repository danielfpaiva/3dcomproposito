# 📧 Configuração Resend - E-mails Automáticos

> **Serviço**: Resend.com
> **Finalidade**: Envio de e-mails transacionais (registo, recuperação password, notificações)
> **Custo**: Free tier (3,000 emails/mês)

---

## 🎯 Casos de Uso

### **E-mails a Implementar:**

1. **✉️ Registo de Voluntário**
   - Assunto: "Bem-vindo ao Impact Print Connect!"
   - Conteúdo: Confirmação de registo + token de acesso ao portal
   - Trigger: Formulário de voluntário submetido

2. **🔐 Token de Acesso ao Portal**
   - Assunto: "Acesso ao Portal de Voluntário"
   - Conteúdo: Link mágico com token para aceder sem password
   - Trigger: Voluntário pede acesso

3. **🦽 Atribuição a Projeto**
   - Assunto: "Novo Projeto: Cadeira de Rodas para [Nome]"
   - Conteúdo: Detalhes do beneficiário + peças a imprimir
   - Trigger: Admin atribui voluntário a projeto

4. **✅ Confirmação de Submissão (Beneficiário)**
   - Assunto: "Pedido Recebido - Impact Print Connect"
   - Conteúdo: Confirmação + próximos passos
   - Trigger: Formulário de beneficiário submetido

5. **📦 Notificação de Envio**
   - Assunto: "Peças Enviadas - Detalhes de Tracking"
   - Conteúdo: Informação de envio + tracking number
   - Trigger: Voluntário marca peças como enviadas

---

## 💰 Resend Free Tier

### **Limites Generosos:**
- ✅ **3,000 e-mails/mês** (grátis para sempre)
- ✅ **100 e-mails/dia**
- ✅ **Domínio verificado** incluído
- ✅ **API simples** (muito fácil de usar)
- ✅ **Analytics básico**
- ✅ **Templates** ilimitados

### **Projeção para o Projeto:**
- Registo voluntários: ~10-20/mês = 20 e-mails
- Tokens de acesso: ~50/mês = 50 e-mails
- Atribuições: ~5/mês = 10 e-mails
- Beneficiários: ~5/mês = 5 e-mails
- **Total estimado**: ~85 e-mails/mês

**Conclusão**: ✅ **Muito dentro do limite!** (3% do free tier)

---

## 🚀 FASE 1: Setup Inicial

### 1.1 Criar Conta Resend

1. Ir a [resend.com](https://resend.com)
2. **Sign Up** (GitHub recomendado)
3. Verificar email

### 1.2 Adicionar e Verificar Domínio

#### **Opção A: Domínio Próprio** (Recomendado)
1. **API Keys** → **Domains** → "Add Domain"
2. Adicionar: `impactprintconnect.pt` (exemplo)
3. Configurar DNS records:
   ```
   Type: TXT
   Name: _resend
   Value: [fornecido pela Resend]

   Type: MX
   Name: @
   Priority: 10
   Value: feedback-smtp.resend.com
   ```
4. Aguardar verificação (~1-2 min)

#### **Opção B: Subdomínio Resend** (Temporário)
1. Usar: `onboarding@resend.dev`
2. **Limitação**: Marca como "via resend.dev"
3. Upgrade para domínio próprio depois

### 1.3 Criar API Key

1. **API Keys** → "Create API Key"
2. **Name**: `Impact Print Connect - Production`
3. **Permission**: `Sending access`
4. **Domain**: Selecionar o domínio verificado
5. Copiar e guardar: `re_xxxxxxxxxxxxxxxxxxxxx`

⚠️ **IMPORTANTE**: Guardar em local seguro! Não será mostrado novamente.

---

## 📝 FASE 2: Templates de E-mail

### 2.1 Criar Templates no Resend

**No Dashboard → Templates:**

#### **Template 1: Bem-vindo Voluntário**
```typescript
// Nome: volunteer-welcome
// Subject: Bem-vindo ao Impact Print Connect! 🎉
```

**HTML**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a3353; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .token-box { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Bem-vindo!</h1>
    </div>
    <div class="content">
      <p>Olá <strong>{{name}}</strong>,</p>

      <p>Obrigado por te juntares ao <strong>Impact Print Connect</strong>! A tua impressora 3D vai ajudar a transformar vidas.</p>

      <div class="token-box">
        <h3>🔑 Token de Acesso ao Portal</h3>
        <p>Usa este link para aceder ao teu portal de voluntário:</p>
        <p><a href="{{portal_url}}" class="button">Aceder ao Portal</a></p>
        <p style="font-size: 12px; color: #666; margin-top: 10px;">
          Ou copia este código: <code>{{token}}</code>
        </p>
      </div>

      <h3>📋 Próximos Passos:</h3>
      <ol>
        <li>Acede ao portal com o link acima</li>
        <li>Verifica os teus dados</li>
        <li>Aguarda atribuição de projetos</li>
        <li>Recebe notificações de novos pedidos</li>
      </ol>

      <p><strong>Obrigado por fazer parte desta causa! 💚</strong></p>
    </div>
    <div class="footer">
      <p>Impact Print Connect - Impressão 3D Solidária</p>
      <p>Este é um e-mail automático. Não responder.</p>
    </div>
  </div>
</body>
</html>
```

#### **Template 2: Token de Acesso**
```typescript
// Nome: portal-access-token
// Subject: Acesso ao Portal de Voluntário
```

**HTML**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    /* Mesmo CSS do template anterior */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Acesso ao Portal</h1>
    </div>
    <div class="content">
      <p>Olá <strong>{{name}}</strong>,</p>

      <p>Pediste acesso ao teu portal de voluntário. Clica no botão abaixo para entrar:</p>

      <div class="token-box">
        <p><a href="{{portal_url}}" class="button">Entrar no Portal</a></p>
        <p style="font-size: 12px; color: #666; margin-top: 15px;">
          Este link é válido por 24 horas.
        </p>
      </div>

      <p style="color: #666; font-size: 14px;">
        Se não pediste este acesso, ignora este e-mail.
      </p>
    </div>
    <div class="footer">
      <p>Impact Print Connect</p>
    </div>
  </div>
</body>
</html>
```

#### **Template 3: Atribuição a Projeto**
```typescript
// Nome: project-assignment
// Subject: Novo Projeto: Cadeira de Rodas 🦽
```

**HTML**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    /* Mesmo CSS */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🦽 Novo Projeto Atribuído</h1>
    </div>
    <div class="content">
      <p>Olá <strong>{{volunteer_name}}</strong>,</p>

      <p>Foi-te atribuído um novo projeto de impressão 3D!</p>

      <div class="token-box">
        <h3>Detalhes do Beneficiário:</h3>
        <p><strong>Nome:</strong> {{beneficiary_name}}</p>
        <p><strong>Idade:</strong> {{beneficiary_age}}</p>
        <p><strong>Região:</strong> {{region}}</p>
      </div>

      <h3>🔧 Peças a Imprimir:</h3>
      <ul>
        {{#each parts}}
        <li>{{this.name}} - {{this.material}} ({{this.color}})</li>
        {{/each}}
      </ul>

      <p><a href="{{portal_url}}" class="button">Ver Detalhes no Portal</a></p>

      <p><strong>Obrigado pela tua disponibilidade! 💚</strong></p>
    </div>
    <div class="footer">
      <p>Impact Print Connect</p>
    </div>
  </div>
</body>
</html>
```

#### **Template 4: Confirmação Beneficiário**
```typescript
// Nome: beneficiary-confirmation
// Subject: Pedido Recebido - Impact Print Connect
```

**HTML**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    /* Mesmo CSS */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Pedido Recebido</h1>
    </div>
    <div class="content">
      <p>Olá <strong>{{contact_name}}</strong>,</p>

      <p>Recebemos o teu pedido para o programa Impact Print Connect.</p>

      <div class="token-box">
        <h3>📋 Resumo do Pedido:</h3>
        <p><strong>Tipo:</strong> {{beneficiary_type}}</p>
        <p><strong>Região:</strong> {{region}}</p>
        <p><strong>Idade:</strong> {{beneficiary_age}}</p>
      </div>

      <h3>📅 Próximos Passos:</h3>
      <ol>
        <li>A nossa equipa vai analisar o pedido</li>
        <li>Vamos entrar em contacto nos próximos dias</li>
        <li>Encontraremos voluntários na tua região</li>
        <li>Coordenaremos a impressão das peças necessárias</li>
      </ol>

      <p><strong>Obrigado pela confiança! 💚</strong></p>
    </div>
    <div class="footer">
      <p>Impact Print Connect - Impressão 3D Solidária</p>
      <p>Contacto: info@impactprintconnect.pt</p>
    </div>
  </div>
</body>
</html>
```

---

## 💻 FASE 3: Implementação no Código

### 3.1 Instalar Resend Package

```bash
npm install resend
```

### 3.2 Criar Serviço de E-mail

Criar ficheiro `src/services/emailService.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export const emailService = {
  /**
   * Envia e-mail de boas-vindas a voluntário
   */
  async sendVolunteerWelcome(params: {
    to: string;
    name: string;
    token: string;
  }) {
    const portalUrl = `${window.location.origin}/portal?token=${params.token}`;

    return resend.emails.send({
      from: 'Impact Print Connect <noreply@impactprintconnect.pt>',
      to: params.to,
      subject: 'Bem-vindo ao Impact Print Connect! 🎉',
      html: `
        <!-- Template volunteer-welcome aqui -->
        <!-- Substituir {{name}} por ${params.name} -->
        <!-- Substituir {{portal_url}} por ${portalUrl} -->
        <!-- Substituir {{token}} por ${params.token} -->
      `,
    });
  },

  /**
   * Envia token de acesso ao portal
   */
  async sendPortalAccessToken(params: {
    to: string;
    name: string;
    token: string;
  }) {
    const portalUrl = `${window.location.origin}/portal?token=${params.token}`;

    return resend.emails.send({
      from: 'Impact Print Connect <noreply@impactprintconnect.pt>',
      to: params.to,
      subject: 'Acesso ao Portal de Voluntário',
      html: `
        <!-- Template portal-access-token aqui -->
      `,
    });
  },

  /**
   * Notifica voluntário de atribuição a projeto
   */
  async sendProjectAssignment(params: {
    to: string;
    volunteerName: string;
    beneficiaryName: string;
    beneficiaryAge: string;
    region: string;
    parts: Array<{ name: string; material: string; color: string }>;
    projectId: string;
  }) {
    const portalUrl = `${window.location.origin}/portal/projects/${params.projectId}`;

    return resend.emails.send({
      from: 'Impact Print Connect <noreply@impactprintconnect.pt>',
      to: params.to,
      subject: 'Novo Projeto: Cadeira de Rodas 🦽',
      html: `
        <!-- Template project-assignment aqui -->
      `,
    });
  },

  /**
   * Confirma receção de pedido de beneficiário
   */
  async sendBeneficiaryConfirmation(params: {
    to: string;
    contactName: string;
    beneficiaryType: string;
    region: string;
    beneficiaryAge: string;
  }) {
    return resend.emails.send({
      from: 'Impact Print Connect <noreply@impactprintconnect.pt>',
      to: params.to,
      subject: 'Pedido Recebido - Impact Print Connect',
      html: `
        <!-- Template beneficiary-confirmation aqui -->
      `,
    });
  },

  /**
   * Notifica envio de peças (com tracking)
   */
  async sendShippingNotification(params: {
    to: string;
    recipientName: string;
    carrier: string;
    trackingNumber: string;
    estimatedDelivery: string;
  }) {
    return resend.emails.send({
      from: 'Impact Print Connect <noreply@impactprintconnect.pt>',
      to: params.to,
      subject: 'Peças Enviadas - Detalhes de Tracking 📦',
      html: `
        <h1>Peças Enviadas!</h1>
        <p>Olá ${params.recipientName},</p>
        <p>As peças foram enviadas!</p>
        <p><strong>Transportadora:</strong> ${params.carrier}</p>
        <p><strong>Nº Tracking:</strong> ${params.trackingNumber}</p>
        <p><strong>Entrega estimada:</strong> ${params.estimatedDelivery}</p>
      `,
    });
  },
};
```

### 3.3 Integrar no Formulário de Voluntários

Atualizar `src/pages/Contribute.tsx`:

```typescript
import { emailService } from '@/services/emailService';

// No handleSubmit, após criar contributor:
try {
  const { data, error } = await supabase
    .from('contributors')
    .insert([contributorData])
    .select()
    .single();

  if (error) throw error;

  // 🆕 Enviar e-mail de boas-vindas
  try {
    await emailService.sendVolunteerWelcome({
      to: data.email,
      name: data.name,
      token: data.token,
    });
    console.log('✅ E-mail de boas-vindas enviado');
  } catch (emailError) {
    console.error('❌ Erro ao enviar e-mail:', emailError);
    // Não bloquear o registo se e-mail falhar
  }

  toast.success('Registo efetuado com sucesso! Verifica o teu e-mail.');
} catch (error) {
  // ...
}
```

### 3.4 Integrar no Formulário de Beneficiários

Atualizar `src/pages/Index.tsx`:

```typescript
// Após criar beneficiary_request:
try {
  await emailService.sendBeneficiaryConfirmation({
    to: data.contact_email,
    contactName: data.contact_name,
    beneficiaryType: data.beneficiary_type,
    region: data.region,
    beneficiaryAge: data.beneficiary_age,
  });
} catch (emailError) {
  console.error('Erro ao enviar confirmação:', emailError);
}
```

---

## 🔒 FASE 4: Environment Variables

### 4.1 Atualizar .env Local

```env
# Supabase
VITE_SUPABASE_PROJECT_ID="[PROJECT_ID]"
VITE_SUPABASE_URL="https://[PROJECT_ID].supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="[ANON_KEY]"

# Resend
VITE_RESEND_API_KEY="re_xxxxxxxxxxxxx"
```

### 4.2 Adicionar na Vercel

**Vercel Dashboard → Settings → Environment Variables:**

Adicionar:
```
VITE_RESEND_API_KEY = re_xxxxxxxxxxxxx
```

---

## ✅ FASE 5: Testes

### 5.1 Testar Localmente

```bash
npm run dev
```

1. Submeter formulário de voluntário
2. Verificar console: "✅ E-mail de boas-vindas enviado"
3. Verificar inbox do e-mail usado
4. Confirmar que e-mail chegou

### 5.2 Testar em Produção

Após deploy na Vercel:
1. Submeter formulário real
2. Verificar Resend Dashboard → Logs
3. Confirmar entrega

### 5.3 Resend Dashboard - Monitorizar

**Emails → Logs:**
- Ver e-mails enviados
- Status (delivered, bounced, failed)
- Open rate (se ativado)
- Click rate

---

## 💰 Custos Resend

### **Free Tier (Para Sempre):**
| Feature | Limite Free | Teu Uso Estimado |
|---------|-------------|------------------|
| E-mails/mês | 3,000 | ~85 (3%) ✅ |
| E-mails/dia | 100 | ~3 ✅ |
| Domínios | 1 | 1 ✅ |
| API calls | Ilimitado | ~85/mês ✅ |
| Templates | Ilimitado | 5 ✅ |

**Conclusão**: ✅ **Grátis para sempre!**

### **Se Crescer (improvável):**
- **Pro**: $20/mês = 50,000 e-mails
- Só precisas se enviares >3,000/mês (35x o uso atual)

---

## 📊 Resumo da Stack Completa

```
Frontend:  Vercel Free ✅ (€0)
Database:  Supabase Free ✅ (€0)
E-mails:   Resend Free ✅ (€0)
Storage:   Supabase Storage ✅ (incluído)
Auth:      Supabase Auth ✅ (incluído)

TOTAL: €0/mês 🎉
```

---

## 🆘 Troubleshooting

### **E-mails não chegam:**
1. Verificar Resend Dashboard → Logs
2. Confirmar domínio verificado
3. Verificar spam folder
4. Testar com outro e-mail

### **API Key inválida:**
1. Verificar que copiaste a key completa
2. Confirmar que está em `.env` como `VITE_RESEND_API_KEY`
3. Restart do dev server

### **Domínio não verifica:**
1. Aguardar propagação DNS (~1-24h)
2. Verificar records com: `dig TXT _resend.teudominio.pt`
3. Usar `onboarding@resend.dev` temporariamente

---

## ✅ Checklist Final

- [ ] Conta Resend criada
- [ ] Domínio verificado (ou usar resend.dev)
- [ ] API Key criada e guardada
- [ ] Templates criados (5 templates)
- [ ] Package `resend` instalado
- [ ] `emailService.ts` criado
- [ ] Integrado em formulários
- [ ] `.env` atualizado
- [ ] Testado localmente
- [ ] Environment var na Vercel
- [ ] Testado em produção
- [ ] Monitorização configurada

---

**Pronto para enviar e-mails profissionais! 📧**
