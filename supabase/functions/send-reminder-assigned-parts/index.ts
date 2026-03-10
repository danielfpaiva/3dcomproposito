// Send reminder email to contributors with parts still in "assigned" status
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
  project_id: string;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return text.replace(/[&<>"']/g, (m) => map[m]);
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

  const { project_id } = body;
  if (!project_id) {
    return new Response(
      JSON.stringify({ error: "project_id required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Get project info
  const { data: project, error: projectError } = await supabase
    .from("project_instances")
    .select("id, name")
    .eq("id", project_id)
    .single();

  if (projectError || !project) {
    return new Response(
      JSON.stringify({ error: "Project not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get all parts with status "assigned" in this project
  const { data: parts, error: partsError } = await supabase
    .from("project_instance_parts")
    .select("id, part_name, file_url, assigned_contributor_id")
    .eq("project_instance_id", project_id)
    .eq("status", "assigned");

  if (partsError) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch parts" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!parts || parts.length === 0) {
    return new Response(
      JSON.stringify({ message: "No parts with status 'assigned' found in this project" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Group parts by contributor
  const partsByContributor = new Map<string, typeof parts>();
  parts.forEach((part) => {
    if (part.assigned_contributor_id) {
      const existing = partsByContributor.get(part.assigned_contributor_id) || [];
      existing.push(part);
      partsByContributor.set(part.assigned_contributor_id, existing);
    }
  });

  const contributorIds = Array.from(partsByContributor.keys());

  if (contributorIds.length === 0) {
    return new Response(
      JSON.stringify({ message: "No assigned contributors found" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Fetch contributors
  const { data: contributors, error: contributorsError } = await supabase
    .from("contributors")
    .select("id, name, email, token")
    .in("id", contributorIds);

  if (contributorsError || !contributors) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch contributors" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Send emails
  const results = [];
  for (const contributor of contributors) {
    if (!contributor.email || !contributor.token) {
      results.push({ contributor_id: contributor.id, status: "skipped", reason: "missing email or token" });
      continue;
    }

    const contributorParts = partsByContributor.get(contributor.id) || [];
    const partCount = contributorParts.length;
    const portalUrl = `${PORTAL_BASE}/portal?token=${encodeURIComponent(contributor.token)}`;

    const subject = partCount === 1
      ? `Lembrete: Peça atribuída — ${escapeHtml(project.name)}`
      : `Lembrete: ${partCount} peças atribuídas — ${escapeHtml(project.name)}`;

    // Render parts list
    const partsListHtml = contributorParts.map((p) => {
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
    <h1 style="margin: 0; font-size: 24px; color: #1f2937;">🔔 Lembrete — ${partCount === 1 ? "Peça Atribuída" : "Peças Atribuídas"}</h1>
  </div>

  <div style="padding: 30px; background: #f9f9f9;">
    <p>Olá <strong>${escapeHtml(contributor.name)}</strong>,</p>

    <p>
      Este é um <strong>lembrete amigável</strong> sobre ${partCount === 1 ? "a peça que lhe foi atribuída" : `as <strong>${partCount} peças</strong> que lhe foram atribuídas`}
      no projeto <strong>${escapeHtml(project.name)}</strong>.
    </p>

    <p>
      Verificámos que ${partCount === 1 ? "a peça ainda está" : "as peças ainda estão"} com o estado <strong>"Atribuído"</strong>,
      o que indica que ainda não ${partCount === 1 ? "começou" : "começaram"} a ser ${partCount === 1 ? "impressa" : "impressas"}.
    </p>

    <div style="background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <h3 style="margin-top: 0; font-size: 15px; color: #1f2937;">📦 ${partCount === 1 ? "Peça pendente:" : "Peças pendentes:"}</h3>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${partsListHtml}
      </ul>
    </div>

    <div style="background: white; padding: 20px; border-left: 4px solid #6366f1; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <h3 style="margin-top: 0; font-size: 15px; color: #1f2937;">🔑 Portal do Voluntário</h3>
      <p style="margin: 0 0 12px;">Aceda ao seu portal para atualizar o estado das suas peças:</p>
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
      <li>Descarregue o ficheiro de cada peça pelo link acima (se ainda não o fez)</li>
      <li>Imprima a peça com as especificações indicadas</li>
      <li><strong>Aceda ao portal e atualize o estado para "A Imprimir"</strong></li>
      <li>Quando terminar, atualize para "Impresso" e depois "Enviado"</li>
      <li>Envie a peça para a <strong>Smart3D</strong></li>
    </ol>

    <div style="background: #dbeafe; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 14px; color: #1e3a8a;">
        <strong>💡 Tem alguma dificuldade?</strong>
        <br/>Se não conseguir imprimir ${partCount === 1 ? "esta peça" : "estas peças"} ou tiver algum problema,
        por favor contacte-nos para podermos reatribuir a ${partCount === 1 ? "outra pessoa" : "outros voluntários"}.
        A sua ajuda é importante! 💚
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
    <p style="margin: 10px 0 0;">📧 <a href="mailto:3dcomproposito@gmail.com" style="color: #94a3b8;">3dcomproposito@gmail.com</a></p>
  </div>

</body>
</html>`;

    // Send via Resend
    try {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: contributor.email,
          subject,
          html,
        }),
      });

      const resendData = await resendResponse.json();
      if (!resendResponse.ok) {
        results.push({ contributor_id: contributor.id, status: "error", error: resendData });
      } else {
        results.push({ contributor_id: contributor.id, status: "sent", email_id: resendData.id });
      }
    } catch (error) {
      results.push({ contributor_id: contributor.id, status: "error", error: String(error) });
    }
  }

  return new Response(
    JSON.stringify({ message: "Reminder emails processed", results }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
