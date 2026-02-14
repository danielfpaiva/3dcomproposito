import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as encodeHex } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return new TextDecoder().decode(encodeHex(new Uint8Array(hashBuffer)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password, action } = await req.json();

    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Email inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const normalizedEmail = email.trim().toLowerCase();

    // Look up contributor
    const { data: contributor, error: lookupErr } = await supabase
      .from("contributors")
      .select("id, token, password_hash, name")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (lookupErr || !contributor) {
      return new Response(
        JSON.stringify({ error: "Não encontrámos nenhum voluntário com esse email." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: check — just check if contributor exists and has password
    if (action === "check") {
      return new Response(
        JSON.stringify({
          exists: true,
          has_password: !!contributor.password_hash,
          name: contributor.name,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: set-password — set password for first time
    if (action === "set-password") {
      if (!password || password.length < 4) {
        return new Response(
          JSON.stringify({ error: "A password deve ter pelo menos 4 caracteres." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const hash = await hashPassword(password);
      const { error: updateErr } = await supabase
        .from("contributors")
        .update({ password_hash: hash })
        .eq("id", contributor.id);

      if (updateErr) {
        return new Response(
          JSON.stringify({ error: "Erro ao guardar password." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ token: contributor.token }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: login — verify password
    if (action === "login") {
      if (!password) {
        return new Response(
          JSON.stringify({ error: "Introduza a sua password." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!contributor.password_hash) {
        return new Response(
          JSON.stringify({ error: "Ainda não definiu password. Por favor defina uma." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const hash = await hashPassword(password);
      if (hash !== contributor.password_hash) {
        return new Response(
          JSON.stringify({ error: "Password incorreta." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ token: contributor.token }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
