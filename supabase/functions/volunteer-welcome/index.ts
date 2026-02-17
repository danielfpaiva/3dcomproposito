// Send welcome email to new volunteer with portal access link.
// Uses Resend. Requires RESEND_API_KEY and optional FROM_EMAIL in Supabase Edge Function secrets.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PORTAL_BASE = "https://www.3dcomproposito.pt";
const LOGO_URL = "https://www.3dcomproposito.pt/3D_com_Prop%C3%B3sito-sem-fundo.png";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "3D com Propósito <onboarding@resend.dev>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  contributor_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { contributor_id } = body;
  if (!contributor_id) {
    return new Response(
      JSON.stringify({ error: "contributor_id required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data: contributor, error: contributorError } = await supabase
    .from("contributors")
    .select("id, name, email, token")
    .eq("id", contributor_id)
    .single();

  if (contributorError || !contributor?.email || !contributor?.token) {
    return new Response(
      JSON.stringify({ error: "Contributor not found or missing email/token" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const portalUrl = `${PORTAL_BASE}/portal?token=${encodeURIComponent(contributor.token)}`;

  const subject = "Bem-vindo ao 3D com Propósito! 🎉";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #333; max-width: 560px; margin: 0 auto;">
  <div style="background: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; border-bottom: 4px solid #10b981;">
    <img src="${LOGO_URL}" alt="3D com Propósito" style="max-width: 220px; height: auto; margin-bottom: 15px;" />
    <h1 style="margin: 0; font-size: 24px; color: #1f2937;">🎉 Bem-vindo!</h1>
  </div>

  <div style="padding: 30px; background: #f9f9f9;">
    <p>Olá <strong>${escapeHtml(contributor.name)}</strong>,</p>

    <p>Obrigado por te juntares à nossa missão! A tua impressora 3D vai ajudar a transformar vidas de crianças com mobilidade reduzida.</p>

    <div style="background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0;">
      <h3 style="margin-top: 0;">🔑 Acesso ao Portal de Voluntário</h3>
      <p>Guarda este link para acederes ao teu portal:</p>
      <p style="text-align: center;">
        <a href="${portalUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Abrir o Meu Portal</a>
      </p>
      <p style="font-size: 12px; color: #666; margin-top: 15px; word-break: break-all;">
        Link: <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${portalUrl}</code>
      </p>
    </div>

    <h3>📋 Próximos Passos:</h3>
    <ol style="line-height: 1.8;">
      <li>Acede ao portal com o link acima</li>
      <li>Revê os teus dados de registo</li>
      <li>Define uma password para acesso futuro</li>
      <li>Aguarda atribuição de projetos (vais receber email)</li>
    </ol>

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
`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [contributor.email],
      subject,
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
