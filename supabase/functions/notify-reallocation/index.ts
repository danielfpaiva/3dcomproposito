// notify-reallocation edge function
// Sends email to previous volunteer when their part is reallocated
// Includes opt-out link to deactivate volunteer account

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "3D com Propósito <onboarding@resend.dev>";
const PORTAL_BASE = "https://www.3dcomproposito.pt";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { previous_contributor_id, part_id } = await req.json();

    if (!previous_contributor_id || !part_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: previous_contributor_id, part_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch contributor details
    const { data: contributor, error: contribError } = await supabase
      .from("contributors")
      .select("id, name, email, token")
      .eq("id", previous_contributor_id)
      .single();

    if (contribError || !contributor) {
      return new Response(
        JSON.stringify({ error: "Contributor not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch part details
    const { data: part, error: partError } = await supabase
      .from("project_instance_parts")
      .select("part_name, project_instance_id, project_instances(name)")
      .eq("id", part_id)
      .single();

    if (partError || !part) {
      return new Response(
        JSON.stringify({ error: "Part not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const projectName = (part as any).project_instances?.name || "Projeto";
    const optOutLink = `${PORTAL_BASE}/unsubscribe?token=${contributor.token}`;

    // Send email via Resend
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [contributor.email],
        subject: `📦 Peça Realocada — ${projectName}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
            <div style="background:#f59e0b;color:white;padding:20px;border-radius:8px 8px 0 0;">
              <h2 style="margin:0;">📦 Peça Realocada</h2>
            </div>
            <div style="background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px;">
              <p>Olá, <strong>${contributor.name}</strong>!</p>
              <p>Informamos que a peça <strong>${part.part_name}</strong> do projeto <strong>${projectName}</strong> foi <strong>realocada a outro voluntário</strong> devido à falta de feedback.</p>

              <div style="background:white;border-left:4px solid #f59e0b;padding:16px;margin:20px 0;border-radius:4px;">
                <p style="margin:0 0 12px;font-size:14px;color:#666;">
                  <strong>🔍 Motivo:</strong> Sem atualização de status ou resposta à alocação inicial.
                </p>
              </div>

              <p style="font-size:14px;color:#666;">
                Se não consegue continuar a ajudar neste momento, <strong>não há problema!</strong>
                Compreendemos que imprevistos acontecem.
              </p>

              <p style="font-size:14px;color:#666;">
                Se preferir <strong>sair da iniciativa</strong> temporariamente e não receber mais notificações,
                pode clicar no botão abaixo:
              </p>

              <div style="text-align:center;margin:24px 0;">
                <a href="${optOutLink}" style="display:inline-block;background:#dc2626;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">
                  🚪 Sair da Iniciativa
                </a>
              </div>

              <p style="font-size:13px;color:#999;margin-top:20px;">
                <strong>Nota:</strong> Clicar no botão acima irá desativar a sua conta de voluntário.
                Pode sempre voltar a juntar-se mais tarde!
              </p>

              <hr style="margin:24px 0;border:none;border-top:1px solid #e0e0e0;">

              <p style="font-size:14px;color:#666;">
                Esperamos contar contigo em futuras missões! 🚀
              </p>

              <p style="font-size:12px;color:#666;text-align:center;margin:0;">
                <strong>3D com Propósito</strong><br>
                Feito com ❤️ para comunidades que constroem juntas
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Reallocation email sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
