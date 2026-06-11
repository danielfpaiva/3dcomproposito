import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOGO_URL = "https://www.3dcomproposito.pt/3D_com_Prop%C3%B3sito-sem-fundo.png";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "3D com Propósito <onboarding@resend.dev>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  request_id: string;
  reason: string;
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

  const { request_id, reason } = body;
  if (!request_id || !reason) {
    return new Response(
      JSON.stringify({ error: "request_id and reason are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data: request, error: reqError } = await supabase
    .from("beneficiary_requests")
    .select("id, contact_name, contact_email")
    .eq("id", request_id)
    .single();

  if (reqError || !request?.contact_email) {
    return new Response(
      JSON.stringify({ error: "Request not found or missing email" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const subject = "Atualização sobre o seu pedido — 3D com Propósito";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #333; max-width: 560px; margin: 0 auto;">
  <div style="background: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; border-bottom: 4px solid #1a3353;">
    <img src="${LOGO_URL}" alt="3D com Propósito" style="max-width: 220px; height: auto; margin-bottom: 15px;" />
    <h1 style="margin: 0; font-size: 24px; color: #1f2937;">Atualização do Pedido</h1>
  </div>

  <div style="padding: 30px; background: #f9f9f9;">
    <p>Olá <strong>${escapeHtml(request.contact_name)}</strong>,</p>

    <p>Antes de mais, agradecemos por ter entrado em contacto connosco e por confiar no projeto <strong>3D com Propósito</strong>.</p>

    <p>Após análise cuidada do seu pedido, lamentamos informar que <strong>não nos é possível avançar com o mesmo neste momento</strong>.</p>

    <div style="background: white; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <h3 style="margin-top: 0; color: #1f2937;">Motivo:</h3>
      <p style="margin-bottom: 0; color: #4b5563;">${escapeHtml(reason)}</p>
    </div>

    <p>Compreendemos que esta não é a resposta que esperava. Se a sua situação se alterar ou se tiver dúvidas, não hesite em contactar-nos respondendo a este email ou através de <strong>geral@3dcomproposito.pt</strong>.</p>

    <p style="margin-top: 30px;">
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
      to: [request.contact_email],
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
