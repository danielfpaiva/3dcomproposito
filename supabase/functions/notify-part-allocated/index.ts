// Notify a contributor by email when they are allocated part(s).
// Uses Resend. Requires RESEND_API_KEY and optional FROM_EMAIL in Supabase Edge Function secrets.
// Portal link uses: https://www.3dcomproposito.pt

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
    .from("project_instance_parts")
    .select("id, part_name, file_url, project_instances(name)")
    .in("id", part_ids);

  if (partsError || !parts?.length) {
    return new Response(
      JSON.stringify({ error: "Parts not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  type PartRow = { part_name: string; file_url: string | null; project_instances: { name: string } | null };
  const typedParts = parts as unknown as PartRow[];
  const projectNames = [...new Set(typedParts.map((p) => p.project_instances?.name).filter(Boolean))] as string[];
  const portalUrl = `${PORTAL_BASE}/portal?token=${encodeURIComponent(contributor.token)}`;
  const partCount = typedParts.length;

  const subject = partCount === 1
    ? `Foi-lhe atribuída uma peça — 3D com Propósito`
    : `Foram-lhe atribuídas ${partCount} peças — 3D com Propósito`;

  // Render each part as a list item, with file link if available
  const partsListHtml = typedParts.map((p) => {
    const name = escapeHtml(p.part_name);
    if (p.file_url) {
      return `<li style="padding: 6px 0; border-bottom: 1px solid #f0f0f0;">
        <span style="font-weight: 500;">${name}</span>
        <br/>
        <a href="${escapeHtml(p.file_url)}" style="color: #10b981; font-size: 13px; text-decoration: none;">
          ⬇ Descarregar ficheiro para impressão
        </a>
      </li>`;
    }
    return `<li style="padding: 6px 0; border-bottom: 1px solid #f0f0f0;">
      <span style="font-weight: 500;">${name}</span>
    </li>`;
  }).join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #333; max-width: 560px; margin: 0 auto;">

  <div style="background: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; border-bottom: 4px solid #10b981;">
    <img src="${LOGO_URL}" alt="3D com Propósito" style="max-width: 220px; height: auto; margin-bottom: 15px;" />
    <h1 style="margin: 0; font-size: 24px; color: #1f2937;">🔧 ${partCount === 1 ? "Peça Atribuída!" : "Peças Atribuídas!"}</h1>
  </div>

  <div style="padding: 30px; background: #f9f9f9;">
    <p>Olá <strong>${escapeHtml(contributor.name)}</strong>,</p>

    <p>
      Foi-lhe atribuída${partCount === 1 ? " uma peça" : `s <strong>${partCount} peças</strong>`}
      ${projectNames.length ? ` no projeto <strong>${escapeHtml(projectNames.join(", "))}</strong>` : " no projeto de impressão 3D solidária"}.
      Obrigado por contribuir para esta causa! 💚
    </p>

    <div style="background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <h3 style="margin-top: 0; font-size: 15px; color: #1f2937;">📦 ${partCount === 1 ? "Peça a imprimir:" : "Peças a imprimir:"}</h3>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${partsListHtml}
      </ul>
    </div>

    <div style="background: white; padding: 20px; border-left: 4px solid #6366f1; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <h3 style="margin-top: 0; font-size: 15px; color: #1f2937;">🔑 Portal do Voluntário</h3>
      <p style="margin: 0 0 12px;">Aceda ao seu portal para acompanhar o estado das suas peças:</p>
      <p style="text-align: center; margin: 0;">
        <a href="${portalUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Abrir o Meu Portal
        </a>
      </p>
      <p style="font-size: 11px; color: #999; margin-top: 12px; word-break: break-all;">
        Se o botão não funcionar, copie: <code style="background: #f0f0f0; padding: 2px 4px; border-radius: 3px;">${portalUrl}</code>
      </p>
    </div>

    <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <h3 style="margin-top: 0; font-size: 15px; color: #92400e;">⚠️ Importante — Configurações de Impressão</h3>
      <p style="margin: 0; font-size: 14px; color: #78350f;">
        <strong>Respeite as configurações definidas no ficheiro 3MF/STL pelo criador:</strong>
        <br/>• <strong>Infill (enchimento)</strong>
        <br/>• <strong>Walls (paredes/perímetros)</strong>
        <br/>• <strong>Layer height (altura de camada)</strong>
        <br/>• <strong>Outros parâmetros estruturais</strong>
        <br/><br/>
        Estas configurações garantem a resistência e segurança da peça. <strong>Não as altere</strong> sem autorização do coordenador.
      </p>
    </div>

    <h3 style="font-size: 15px; color: #1f2937;">📋 Próximos Passos:</h3>
    <ol style="line-height: 2;">
      <li>Descarregue o ficheiro de cada peça pelo link acima</li>
      <li>Imprima a peça com as especificações indicadas</li>
      <li>Aceda ao portal e atualize o estado da peça</li>
      <li>Quando estiver pronto, envie a peça para o coordenador</li>
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
