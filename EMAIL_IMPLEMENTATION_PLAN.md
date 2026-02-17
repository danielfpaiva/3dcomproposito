# 📧 Plano de Implementação de Emails - 3D com Propósito

> **Data da análise**: 2026-02-17
> **Estado do Resend**: ✅ Configurado (API Key, domínio verificado)
> **Estado da Edge Function**: ⚠️ Código atualizado mas **NÃO DEPLOYADA** no Supabase

---

## 📊 ANÁLISE COMPLETA: Pontos de Envio de Emails

### 1️⃣ **REGISTO DE VOLUNTÁRIO** (`src/pages/Contribute.tsx`)

**Quando**: Após voluntário submeter formulário de registo
**Localização**: Linha 135-164
**Estado atual**: ❌ **Sem email automático**

#### Email a enviar:
- **Para**: Email do voluntário
- **Assunto**: `"Bem-vindo ao 3D com Propósito! 🎉"`
- **Conteúdo**:
  - Mensagem de boas-vindas personalizada
  - Link do portal com token único
  - Guia rápido (próximos passos)
  - Links para recursos (Guia do Maker PDF, MakerWorld STLs)
  - Informação sobre como definir password

**Código atual**:
```typescript
// src/pages/Contribute.tsx - linha 135-164
const { data, error } = await supabase
  .from("contributors")
  .insert({
    name: formData.name.trim(),
    email: formData.email.trim(),
    // ... outros campos
  })
  .select("token")
  .single();

if (error) {
  toast({ title: "Erro ao submeter", description: error.message, variant: "destructive" });
  return;
}

// ✅ AQUI: Enviar email de boas-vindas
setPortalLink(`${window.location.origin}/portal?token=${data.token}`);
setSubmitted(true);
```

**Implementação necessária**:
- Criar Edge Function: `volunteer-welcome`
- Chamar após `insert` bem-sucedido
- Template HTML com design consistente

---

### 2️⃣ **PEDIDO DE BENEFICIÁRIO** (`src/pages/Request.tsx`)

**Quando**: Após beneficiário/responsável submeter pedido de ajuda
**Localização**: Linha 65-85
**Estado atual**: ❌ **Sem email automático**

#### Email a enviar:
- **Para**: Email do contacto/responsável
- **Assunto**: `"Pedido Recebido — 3D com Propósito"`
- **Conteúdo**:
  - Confirmação de receção do pedido
  - Resumo do pedido (região, tipo, idade)
  - Próximos passos (análise pela equipa, contacto)
  - Tempo estimado de resposta
  - Informação de contacto da organização

**Código atual**:
```typescript
// src/pages/Request.tsx - linha 67-84
const { error } = await supabase
  .from("beneficiary_requests")
  .insert({
    contact_name: form.name.trim(),
    contact_email: form.email.trim(),
    contact_phone: form.phone.trim() || null,
    region: form.region,
    beneficiary_type: form.type,
    beneficiary_age: form.age.trim(),
    description: form.description.trim(),
    how_found_us: form.howFound || null,
  });

if (error) {
  toast({ title: "Erro ao submeter", description: error.message, variant: "destructive" });
  return;
}

// ✅ AQUI: Enviar email de confirmação
setSubmitted(true);
```

**Implementação necessária**:
- Criar Edge Function: `beneficiary-confirmation`
- Chamar após `insert` bem-sucedido
- Template HTML com mensagem de esperança

---

### 3️⃣ **ATRIBUIÇÃO DE PEÇAS A VOLUNTÁRIO** (`src/components/admin/AllocateVolunteerDialog.tsx`)

**Quando**: Admin atribui peças a um voluntário no painel admin
**Localização**: Linha 151-177
**Estado atual**: ⚠️ **Edge function existe mas NÃO está deployada e NÃO está a ser chamada**

#### Email a enviar:
- **Para**: Email do voluntário
- **Assunto**:
  - 1 peça: `"Foi-lhe atribuída uma peça — 3D com Propósito"`
  - Múltiplas: `"Foram-lhe atribuídas X peças — 3D com Propósito"`
- **Conteúdo**:
  - Notificação de nova atribuição
  - Nome do projeto
  - Lista de peças atribuídas (nome, material)
  - Link para o portal
  - Links para recursos:
    - Guia do Maker (PDF)
    - Ficheiros STL no MakerWorld

**Código atual**:
```typescript
// src/components/admin/AllocateVolunteerDialog.tsx - linha 151-177
const handleSave = async () => {
  if (!contributor || selectedPartIds.size === 0) return;
  setSaving(true);
  const partIds = Array.from(selectedPartIds);

  const { error } = await supabase
    .from("parts")
    .update({
      assigned_contributor_id: contributor.id,
      status: "assigned",
    })
    .in("id", partIds);

  if (error) {
    toast({
      title: "Erro ao atribuir",
      description: error.message,
      variant: "destructive",
    });
    setSaving(false);
    return;
  }

  // ✅ AQUI: Chamar edge function notify-part-allocated
  // ⚠️ ATUALMENTE NÃO ESTÁ A SER CHAMADA!

  queryClient.invalidateQueries({ queryKey: ["admin-parts"] });
  queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
  setSaving(false);
  setAllocated(true);
};
```

**Edge Function existente**: `supabase/functions/notify-part-allocated/index.ts`
- ✅ Código atualizado com novo branding "3D com Propósito"
- ✅ URLs de produção atualizados
- ❌ **NÃO foi deployada no Supabase**
- ❌ **NÃO está a ser chamada no código**

**Implementação necessária**:
1. **Deploy manual da edge function** (via Supabase Dashboard)
2. **Integrar chamada** no `handleSave`:
   ```typescript
   // Após update bem-sucedido
   try {
     const { error: emailError } = await supabase.functions.invoke('notify-part-allocated', {
       body: {
         contributor_id: contributor.id,
         part_ids: partIds,
       }
     });

     if (emailError) {
       console.error('Erro ao enviar email:', emailError);
       // Não bloquear a operação se email falhar
     }
   } catch (e) {
     console.error('Erro ao enviar notificação:', e);
   }
   ```

---

### 4️⃣ **PEDIDO DE ACESSO AO PORTAL** (Portal.tsx)

**Quando**: Voluntário esquece token e pede novo acesso por email
**Estado atual**: ❓ **A analisar** (preciso ver código do Portal.tsx)

#### Email a enviar:
- **Para**: Email do voluntário
- **Assunto**: `"Acesso ao Portal — 3D com Propósito"`
- **Conteúdo**:
  - Link mágico com token
  - Validade do link (ex: 24 horas)
  - Instruções de acesso
  - Opção de criar password

**Implementação necessária**:
- Criar Edge Function: `portal-access-token`
- Criar endpoint para pedido de acesso
- Template HTML simples e claro

---

### 5️⃣ **SUBMISSÃO DE PEÇAS IMPRESSAS** (Portal do Voluntário)

**Quando**: Voluntário marca peças como "printed" ou "shipped"
**Estado atual**: ❓ **A analisar**

#### Emails a enviar:

**A) Email para Admin:**
- **Para**: Email(s) dos admins
- **Assunto**: `"Peça concluída por [Nome Voluntário]"`
- **Conteúdo**:
  - Notificação de peça pronta
  - Nome do voluntário
  - Projeto e peça
  - Status (impressa/enviada)

**B) Email para Beneficiário (opcional):**
- **Para**: Email do beneficiário
- **Assunto**: `"Progresso do seu pedido — 3D com Propósito"`
- **Conteúdo**:
  - Atualização de progresso
  - Peças concluídas
  - Tempo estimado restante

**Implementação necessária**:
- Criar Edge Function: `part-completed-notification`
- Trigger ao mudar status da peça

---

### 6️⃣ **MUDANÇA DE STATUS DE PEDIDO** (Admin Dashboard)

**Quando**: Admin aprova/rejeita/muda status de pedido de beneficiário
**Estado atual**: ❓ **A analisar**

#### Emails a enviar:

**A) Pedido Aprovado:**
- **Assunto**: `"Pedido Aprovado — 3D com Propósito"`
- **Conteúdo**: Confirmação, próximos passos, contacto

**B) Pedido em Análise:**
- **Assunto**: `"Pedido em Análise — 3D com Propósito"`
- **Conteúdo**: Informação adicional necessária

**C) Pedido Concluído:**
- **Assunto**: `"Projeto Concluído — 3D com Propósito"`
- **Conteúdo**: Agradecimento, feedback, fotos

**Implementação necessária**:
- Criar Edge Function: `beneficiary-status-update`
- Trigger ao mudar status do pedido

---

## 🎯 PLANO DE IMPLEMENTAÇÃO

### **FASE 1: Ativar Edge Function Existente** ⚡ *PRIORITÁRIO*

**Objetivo**: Fazer funcionar o email de atribuição de peças que já está pronto

**Tarefas**:
1. ✅ Código da edge function já atualizado localmente
2. ⏳ **Deploy manual da edge function no Supabase Dashboard**:
   - Ir a: https://supabase.com/dashboard/project/bsbqmqfznkozqagdhvoj/functions
   - Criar/editar função `notify-part-allocated`
   - Copiar código de `supabase/functions/notify-part-allocated/index.ts`
   - Deploy
3. ⏳ **Integrar chamada no AllocateVolunteerDialog.tsx**:
   - Adicionar chamada à edge function após atribuir peças
   - Tratar erros sem bloquear operação principal
4. ⏳ **Testar**:
   - Atribuir peça de teste a um voluntário
   - Verificar email recebido
   - Verificar logs no Resend Dashboard

**Tempo estimado**: 30 minutos

---

### **FASE 2: Email de Boas-Vindas a Voluntários** 🎉

**Objetivo**: Enviar email automático quando voluntário se regista

**Tarefas**:
1. ⏳ **Criar edge function `volunteer-welcome`**:
   - Copiar estrutura de `notify-part-allocated`
   - Adaptar template HTML
   - Incluir link do portal com token
   - Incluir links para recursos
2. ⏳ **Deploy no Supabase**
3. ⏳ **Integrar em Contribute.tsx**:
   - Chamar edge function após criar contributor
   - Passar: email, nome, token
4. ⏳ **Testar**:
   - Registar voluntário de teste
   - Verificar email recebido

**Tempo estimado**: 1 hora

**Template sugerido**:
```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #333; max-width: 560px;">
  <div style="background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">🎉 Bem-vindo ao 3D com Propósito!</h1>
  </div>

  <div style="padding: 30px; background: #f9f9f9;">
    <p>Olá <strong>{{name}}</strong>,</p>

    <p>Obrigado por te juntares à nossa comunidade! A tua impressora 3D vai ajudar a transformar vidas de crianças com mobilidade reduzida.</p>

    <div style="background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0;">
      <h3 style="margin-top: 0;">🔑 Acesso ao Portal de Voluntário</h3>
      <p>Guarda este link para acederes ao teu portal:</p>
      <p style="text-align: center;">
        <a href="{{portal_url}}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Abrir o Meu Portal</a>
      </p>
      <p style="font-size: 12px; color: #666; margin-top: 15px;">
        Link: <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">{{portal_url}}</code>
      </p>
    </div>

    <h3>📋 Próximos Passos:</h3>
    <ol style="line-height: 1.8;">
      <li>Acede ao portal com o link acima</li>
      <li>Revê os teus dados de registo</li>
      <li>Aguarda atribuição de projetos (vais receber email)</li>
      <li>Consulta os recursos para impressão</li>
    </ol>

    <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #0369a1;">📄 Recursos para Impressão:</h4>
      <p style="margin: 5px 0;">
        <a href="{{maker_guide_url}}" style="color: #0369a1; text-decoration: underline;">📥 Descarregar Guia do Maker (PDF)</a>
      </p>
      <p style="margin: 5px 0;">
        <a href="{{makerworld_url}}" style="color: #0369a1; text-decoration: underline;">🔗 Ver Ficheiros STL no MakerWorld</a>
      </p>
    </div>

    <p style="margin-top: 30px;"><strong>Obrigado por fazeres parte desta causa!</strong> 💚</p>

    <p style="margin-top: 20px; font-size: 14px; color: #666;">
      Com os melhores cumprimentos,<br>
      <strong>Equipa 3D com Propósito</strong>
    </p>
  </div>

  <div style="background: #1a3353; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 12px 12px;">
    <p style="margin: 0;">3D com Propósito — Impressão 3D Solidária</p>
    <p style="margin: 5px 0;">Este é um email automático. Para questões, responda a este email.</p>
  </div>
</body>
</html>
```

---

### **FASE 3: Email de Confirmação para Beneficiários** 🦽

**Objetivo**: Confirmar receção de pedidos de ajuda

**Tarefas**:
1. ⏳ **Criar edge function `beneficiary-confirmation`**
2. ⏳ **Deploy no Supabase**
3. ⏳ **Integrar em Request.tsx**
4. ⏳ **Testar**

**Tempo estimado**: 45 minutos

**Template sugerido**:
```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #333; max-width: 560px;">
  <div style="background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">✅ Pedido Recebido</h1>
  </div>

  <div style="padding: 30px; background: #f9f9f9;">
    <p>Olá <strong>{{contact_name}}</strong>,</p>

    <p>Recebemos o seu pedido para o programa <strong>3D com Propósito</strong> e queremos agradecer por nos contactar.</p>

    <div style="background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0;">
      <h3 style="margin-top: 0;">📋 Resumo do Seu Pedido:</h3>
      <p style="margin: 5px 0;"><strong>Tipo:</strong> {{beneficiary_type}}</p>
      <p style="margin: 5px 0;"><strong>Região:</strong> {{region}}</p>
      <p style="margin: 5px 0;"><strong>Idade:</strong> {{beneficiary_age}}</p>
    </div>

    <h3>📅 Próximos Passos:</h3>
    <ol style="line-height: 1.8;">
      <li>A nossa equipa vai analisar o pedido nos próximos dias</li>
      <li>Entraremos em contacto caso precisemos de informações adicionais</li>
      <li>Encontraremos voluntários na sua região</li>
      <li>Coordenaremos a impressão das peças necessárias</li>
    </ol>

    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; color: #92400e;">
        <strong>⏱️ Tempo estimado:</strong> Normalmente respondemos em 3-5 dias úteis.
      </p>
    </div>

    <p style="margin-top: 30px;"><strong>Obrigado pela sua confiança!</strong> 💚</p>

    <p style="margin-top: 20px; font-size: 14px; color: #666;">
      Com os melhores cumprimentos,<br>
      <strong>Equipa 3D com Propósito</strong>
    </p>
  </div>

  <div style="background: #1a3353; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 12px 12px;">
    <p style="margin: 0;">3D com Propósito — Impressão 3D Solidária</p>
    <p style="margin: 5px 0;">Para questões, responda a este email ou contacte-nos.</p>
  </div>
</body>
</html>
```

---

### **FASE 4: Emails Adicionais** (Futuro) 📬

**A implementar mais tarde conforme necessidade**:

1. ⏳ **Portal Access Token** - Recuperação de acesso
2. ⏳ **Part Completed** - Notificação de peça pronta
3. ⏳ **Status Updates** - Mudanças de status de pedidos
4. ⏳ **Project Completed** - Projeto concluído com sucesso
5. ⏳ **Reminders** - Lembretes para voluntários inativos

**Tempo estimado**: 3-4 horas (total)

---

## 🔧 NOTAS TÉCNICAS

### **Estrutura das Edge Functions**

Todas as edge functions devem seguir esta estrutura:

```typescript
// Imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuração
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "3D com Propósito <onboarding@resend.dev>";
const PORTAL_BASE = "https://3dcomproposito.vercel.app";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Handler
Deno.serve(async (req) => {
  // OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Validar RESEND_API_KEY
  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Parse body
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validar parâmetros
  // ... validações específicas

  // Buscar dados do Supabase se necessário
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Construir HTML do email
  const html = `...`;

  // Enviar via Resend
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [destinatario],
      subject: "...",
      html,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return new Response(
      JSON.stringify({ error: "Resend error", details: data }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ ok: true, messageId: data.id }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

// Helper functions
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
```

### **Secrets necessários no Supabase**

Já configurados:
- ✅ `RESEND_API_KEY`: `re_KX9CrciE_48muEBKnZ2nmoq66kTMJiED7`
- ✅ `FROM_EMAIL`: Email configurado com domínio verificado no Resend

Auto-configurados pelo Supabase:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### **URLs importantes**

- **Produção**: `https://3dcomproposito.vercel.app`
- **Guia Maker**: `https://bsbqmqfznkozqagdhvoj.supabase.co/storage/v1/object/public/resources/TMT_MAKER_GUIDE_rev_A_compressed.pdf`
- **MakerWorld**: `https://makerworld.com/en/models/2066081-3d-toddler-mobility-trainer`

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Edge Function de Atribuição (PRIORITÁRIO)
- [ ] Deploy manual de `notify-part-allocated` no Supabase Dashboard
- [ ] Integrar chamada em `AllocateVolunteerDialog.tsx`
- [ ] Testar envio de email
- [ ] Verificar logs no Resend Dashboard
- [ ] Commit e push das alterações

### Fase 2: Email de Boas-Vindas
- [ ] Criar edge function `volunteer-welcome`
- [ ] Deploy no Supabase
- [ ] Integrar em `Contribute.tsx`
- [ ] Testar registo de voluntário
- [ ] Commit e push

### Fase 3: Email de Confirmação Beneficiário
- [ ] Criar edge function `beneficiary-confirmation`
- [ ] Deploy no Supabase
- [ ] Integrar em `Request.tsx`
- [ ] Testar submissão de pedido
- [ ] Commit e push

### Fase 4: Emails Adicionais (Futuro)
- [ ] Portal access token
- [ ] Part completed notification
- [ ] Status updates
- [ ] Project completed
- [ ] Reminders

---

## 🚀 COMEÇAR AGORA

**Primeiro passo**: Deploy da edge function `notify-part-allocated`

1. Ir a: https://supabase.com/dashboard/project/bsbqmqfznkozqagdhvoj/functions
2. Criar nova função ou editar existente com nome: `notify-part-allocated`
3. Copiar código de: `supabase/functions/notify-part-allocated/index.ts`
4. Deploy
5. Integrar chamada no código

Vamos começar?
