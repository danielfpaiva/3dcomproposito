// contributor-auth edge function
// Handles contributor authentication via email + password (SHA-256 hash)
// Always returns HTTP 200 — errors are indicated via { ok: false, error: "..." } in body
// This is intentional: supabase.functions.invoke() discards res.data on non-200 responses

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as encodeHex } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "3D com Propósito <onboarding@resend.dev>";
const ADMIN_EMAIL = "geral@3dcomproposito.pt";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function ok(data: object) {
  return new Response(JSON.stringify({ ok: true, ...data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(message: string) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status: 200, // Always 200 so supabase client keeps res.data accessible
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Send error alert to admin — fire-and-forget, never blocks the response
async function alertAdmin(context: string, detail: string, extra?: object) {
  if (!RESEND_API_KEY) return;
  const timestamp = new Date().toISOString();
  const extraHtml = extra
    ? `<pre style="background:#f4f4f4;padding:12px;border-radius:6px;font-size:12px;">${JSON.stringify(extra, null, 2)}</pre>`
    : "";
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: `⚠️ Erro no Login de Voluntário — ${context}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
            <div style="background:#dc2626;color:white;padding:20px;border-radius:8px 8px 0 0;">
              <h2 style="margin:0;">⚠️ Erro no Login de Voluntário</h2>
            </div>
            <div style="background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px;">
              <p><strong>Contexto:</strong> ${context}</p>
              <p><strong>Detalhe:</strong> ${detail}</p>
              <p><strong>Timestamp:</strong> ${timestamp}</p>
              ${extraHtml}
              <hr style="margin:20px 0;border:none;border-top:1px solid #eee;">
              <p style="font-size:12px;color:#666;">
                Este é um email automático de monitorização.<br>
                <strong>3D com Propósito</strong> — contributor-auth edge function
              </p>
            </div>
          </div>`,
      }),
    });
  } catch {
    // Silently ignore — alerting must never break the main flow
  }
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return new TextDecoder().decode(encodeHex(new Uint8Array(hashBuffer)));
}

function generateResetCode(): string {
  // Generate random 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendResetCodeEmail(email: string, name: string, code: string) {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured");
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [email],
      subject: "Código de Recuperação de Password — 3D com Propósito",
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
          <div style="background:#10b981;color:white;padding:20px;border-radius:8px 8px 0 0;">
            <h2 style="margin:0;">🔑 Recuperação de Password</h2>
          </div>
          <div style="background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px;">
            <p>Olá, <strong>${name}</strong>!</p>
            <p>Recebemos um pedido de recuperação de password para a sua conta de voluntário.</p>
            <div style="background:white;border:2px solid #10b981;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:14px;color:#666;">O seu código de recuperação é:</p>
              <p style="margin:0;font-size:32px;font-weight:bold;color:#10b981;letter-spacing:4px;">${code}</p>
            </div>
            <p style="font-size:14px;color:#666;">
              ⏱ Este código expira em <strong>15 minutos</strong>.<br>
              🔒 Tem no máximo <strong>3 tentativas</strong> para introduzir o código correto.
            </p>
            <p style="font-size:13px;color:#999;margin-top:20px;">
              Se não solicitou esta recuperação, pode ignorar este email em segurança.
            </p>
            <hr style="margin:24px 0;border:none;border-top:1px solid #e0e0e0;">
            <p style="font-size:12px;color:#666;text-align:center;margin:0;">
              <strong>3D com Propósito</strong><br>
              Feito com ❤️ para comunidades que constroem juntas
            </p>
          </div>
        </div>
      `,
    }),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, password, action, code, new_password } = body;

    if (!email || !email.includes("@")) {
      return err("Email inválido.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const normalizedEmail = email.trim().toLowerCase();

    // Look up contributor
    const { data: contributor, error: lookupErr } = await supabase
      .from("contributors")
      .select("id, token, password_hash, name, reset_code, reset_code_expires_at, reset_code_attempts")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (lookupErr) {
      alertAdmin("Erro na query à BD", "Falha ao procurar contributor por email", { email: normalizedEmail, error: lookupErr.message });
      return err("Erro interno. Tente novamente.");
    }

    if (!contributor) {
      return err("Não encontrámos nenhum voluntário com esse email.");
    }

    // Action: check — check if contributor exists and has password set
    if (action === "check") {
      return ok({
        exists: true,
        has_password: !!contributor.password_hash,
        name: contributor.name,
      });
    }

    // Action: set-password — define password for the first time
    if (action === "set-password") {
      if (!password || password.length < 4) {
        return err("A password deve ter pelo menos 4 caracteres.");
      }

      const hash = await hashPassword(password);
      const { error: updateErr } = await supabase
        .from("contributors")
        .update({ password_hash: hash })
        .eq("id", contributor.id);

      if (updateErr) {
        alertAdmin("Erro ao guardar password", "Falha no UPDATE de password_hash", { contributor_id: contributor.id, error: updateErr.message });
        return err("Erro ao guardar password.");
      }

      return ok({ token: contributor.token });
    }

    // Action: login — verify password
    if (action === "login") {
      if (!password) {
        return err("Introduza a sua password.");
      }

      if (!contributor.password_hash) {
        return err("Ainda não definiu password. Por favor defina uma.");
      }

      const hash = await hashPassword(password);
      if (hash !== contributor.password_hash) {
        alertAdmin(
          "Password incorreta no login",
          `O voluntário tentou fazer login mas a password não corresponde.`,
          {
            email: normalizedEmail,
            name: contributor.name,
          }
        );
        return err("Password incorreta.");
      }

      return ok({ token: contributor.token });
    }

    // Action: request-reset — generate code and send via email
    if (action === "request-reset") {
      const code = generateResetCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

      // Update contributor with reset code
      const { error: updateErr } = await supabase
        .from("contributors")
        .update({
          reset_code: code,
          reset_code_expires_at: expiresAt.toISOString(),
          reset_code_attempts: 0,
        })
        .eq("id", contributor.id);

      if (updateErr) {
        alertAdmin("Erro ao gerar código de recuperação", "Falha no UPDATE de reset_code", { contributor_id: contributor.id, error: updateErr.message });
        return err("Erro ao gerar código. Tente novamente.");
      }

      // Send email with code
      try {
        await sendResetCodeEmail(normalizedEmail, contributor.name, code);
      } catch (emailErr) {
        alertAdmin("Erro ao enviar email de recuperação", "Falha no envio de email via Resend", { email: normalizedEmail, error: String(emailErr) });
        return err("Erro ao enviar email. Tente novamente.");
      }

      return ok({ code_sent: true });
    }

    // Action: verify-code — validate the 6-digit code
    if (action === "verify-code") {
      if (!code || code.length !== 6) {
        return err("Código inválido. Deve ter 6 dígitos.");
      }

      if (!contributor.reset_code || !contributor.reset_code_expires_at) {
        return err("Nenhum código de recuperação ativo. Solicite um novo código.");
      }

      // Check if code expired
      const expiresAt = new Date(contributor.reset_code_expires_at);
      if (expiresAt < new Date()) {
        return err("Código expirado. Solicite um novo código.");
      }

      // Check attempts limit
      if (contributor.reset_code_attempts >= 3) {
        return err("Excedeu o limite de tentativas. Solicite um novo código.");
      }

      // Verify code
      if (code.trim() !== contributor.reset_code) {
        // Increment attempts
        await supabase
          .from("contributors")
          .update({ reset_code_attempts: contributor.reset_code_attempts + 1 })
          .eq("id", contributor.id);

        const remainingAttempts = 3 - (contributor.reset_code_attempts + 1);
        if (remainingAttempts > 0) {
          return err(`Código incorreto. Tem mais ${remainingAttempts} ${remainingAttempts === 1 ? "tentativa" : "tentativas"}.`);
        } else {
          return err("Código incorreto. Excedeu o limite de tentativas. Solicite um novo código.");
        }
      }

      // Code is valid
      return ok({ code_valid: true });
    }

    // Action: reset-password — set new password after code verification
    if (action === "reset-password") {
      if (!code || code.length !== 6) {
        return err("Código inválido.");
      }

      if (!new_password || new_password.length < 4) {
        return err("A password deve ter pelo menos 4 caracteres.");
      }

      if (!contributor.reset_code || !contributor.reset_code_expires_at) {
        return err("Nenhum código de recuperação ativo.");
      }

      // Verify code one more time (security)
      const expiresAt = new Date(contributor.reset_code_expires_at);
      if (expiresAt < new Date() || code.trim() !== contributor.reset_code || contributor.reset_code_attempts >= 3) {
        return err("Código inválido ou expirado.");
      }

      // Hash new password and clear reset code
      const hash = await hashPassword(new_password);
      const { error: updateErr } = await supabase
        .from("contributors")
        .update({
          password_hash: hash,
          reset_code: null,
          reset_code_expires_at: null,
          reset_code_attempts: 0,
        })
        .eq("id", contributor.id);

      if (updateErr) {
        alertAdmin("Erro ao redefinir password", "Falha no UPDATE de password após reset", { contributor_id: contributor.id, error: updateErr.message });
        return err("Erro ao guardar nova password.");
      }

      return ok({ token: contributor.token });
    }

    return err("Ação inválida.");

  } catch (_err) {
    alertAdmin("Erro interno (exception)", "Exception não capturada na edge function", { error: String(_err) });
    return err("Erro interno. Tente novamente.");
  }
});
