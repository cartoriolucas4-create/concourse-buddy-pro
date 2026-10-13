import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: cors });

async function syntheticEmail(identifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identifier));
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `cc-${hex}@alunos.concurso-central.app`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Método não permitido." });

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !serviceKey || !anonKey) return reply(500, { error: "Autenticação do servidor não está configurada." });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply(400, { error: "Requisição inválida." }); }
  const mode = body.mode === "signup" ? "signup" : body.mode === "login" ? "login" : "";
  const identifier = typeof body.identifier === "string" ? body.identifier.trim().normalize("NFKC").toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const fullName = typeof body.full_name === "string" ? body.full_name.trim().slice(0, 120) : "";

  if (!mode) return reply(400, { error: "Operação inválida." });
  if (!identifier || identifier.length > 120 || /\s/.test(identifier)) return reply(400, { error: "Informe um identificador de aluno sem espaços (pode ser e-mail ou nome de usuário)." });
  if (password.length < 6 || password.length > 128) return reply(400, { error: "A senha deve ter entre 6 e 128 caracteres." });
  if (mode === "signup" && !fullName) return reply(400, { error: "Informe o nome completo." });

  const adminIdentifier = "cartoriolucas4@gmail.com";
  if (mode === "signup" && identifier === adminIdentifier) return reply(409, { error: "Este identificador é reservado para a administração." });
  const authEmail = identifier === adminIdentifier ? identifier : await syntheticEmail(identifier);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const publicAuth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

  if (mode === "signup") {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, student_identifier: identifier },
    });
    if (createError) {
      if (/already been registered|already exists|duplicate/i.test(createError.message)) return reply(409, { error: "Este identificador já possui conta. Entre com a mesma senha." });
      if (/password/i.test(createError.message)) return reply(400, { error: "A senha não atende aos requisitos de segurança do servidor." });
      return reply(400, { error: createError.message });
    }
    if (!created.user) return reply(500, { error: "O servidor não confirmou a criação da conta." });
  }

  const { data: signed, error: signError } = await publicAuth.auth.signInWithPassword({ email: authEmail, password });
  if (signError || !signed.session || !signed.user) {
    const msg = signError?.message || "Não foi possível iniciar a sessão.";
    if (/invalid login credentials/i.test(msg)) return reply(401, { error: "Identificador ou senha incorretos." });
    return reply(400, { error: msg });
  }

  return reply(200, {
    access_token: signed.session.access_token,
    refresh_token: signed.session.refresh_token,
    expires_in: signed.session.expires_in,
    token_type: signed.session.token_type,
    user: signed.user,
  });
});
