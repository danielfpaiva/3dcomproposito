// Notify a contributor by email when they are allocated part(s).
// Uses Resend. Requires RESEND_API_KEY and optional FROM_EMAIL in Supabase Edge Function secrets.
// Portal link uses: https://3dcomproposito.vercel.app

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PORTAL_BASE = "https://3dcomproposito.vercel.app";
const MAKERWORLD_URL = "https://makerworld.com/en/models/2066081-3d-toddler-mobility-trainer";
const MAKER_GUIDE_URL = "https://bsbqmqfznkozqagdhvoj.supabase.co/storage/v1/object/public/resources/TMT_MAKER_GUIDE_rev_A_compressed.pdf";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "3D com Propósito <onboarding@resend.dev>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  contributor_id: string;
  part_ids: string[];
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

  const { contributor_id, part_ids } = body;
  if (!contributor_id || !part_ids?.length) {
    return new Response(
      JSON.stringify({ error: "contributor_id and part_ids required" }),
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

  const { data: parts, error: partsError } = await supabase
    .from("parts")
    .select("id, part_name, wheelchair_projects(name)")
    .in("id", part_ids);

  if (partsError || !parts?.length) {
    return new Response(
      JSON.stringify({ error: "Parts not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  type PartRow = { part_name: string; wheelchair_projects: { name: string }[] | null };
  const projectNames = [...new Set((parts as unknown as PartRow[]).map((p) => p.wheelchair_projects?.[0]?.name).filter(Boolean))] as string[];
  const partNames = (parts as unknown as PartRow[]).map((p) => p.part_name);
  const portalUrl = `${PORTAL_BASE}/portal?token=${encodeURIComponent(contributor.token)}`;

  const subject = partNames.length === 1
    ? `Foi-lhe atribuída uma peça — 3D com Propósito`
    : `Foram-lhe atribuídas ${partNames.length} peças — 3D com Propósito`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #333; max-width: 560px;">
  <p>Olá <strong>${escapeHtml(contributor.name)}</strong>,</p>
  <p>Foi-lhe atribuída ${partNames.length === 1 ? "uma peça" : partNames.length + " peças"} no projeto de impressão 3D solidária.</p>
  ${projectNames.length ? `<p><strong>Projeto(s):</strong> ${escapeHtml(projectNames.join(", "))}</p>` : ""}
  <p><strong>Peça(s):</strong> ${escapeHtml(partNames.join(", "))}</p>
  <p>Aceda ao seu portal para ver detalhes e atualizar o estado:</p>
  <p><a href="${portalUrl}" style="display: inline-block; background: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Abrir portal do voluntário</a></p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
  <p><strong>📄 Recursos para impressão:</strong></p>
  <p>
    <a href="${MAKER_GUIDE_URL}" style="color: #0d9488; text-decoration: underline;">Descarregar Guia do Maker (PDF)</a><br/>
    <a href="${MAKERWORLD_URL}" style="color: #0d9488; text-decoration: underline;">Ficheiros STL no MakerWorld</a>
  </p>
  <p style="font-size: 12px; color: #666;">Se o botão não funcionar, copie e cole no browser: ${portalUrl}</p>
  <p style="margin-top: 24px;">Obrigado,<br><strong>3D com Propósito</strong></p>
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
