import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json" };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Método não permitido." }), { status: 405, headers: cors });
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "A integração de IA ainda não foi ativada: configure OPENAI_API_KEY como segredo nas Edge Functions do Supabase." }), { status: 503, headers: cors });
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authorization = req.headers.get("Authorization") || "";
  if (!supabaseUrl || !anonKey || !authorization.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Entre na sua conta para solicitar a explicação." }), { status: 401, headers: cors });
  const authCheck = await fetch(supabaseUrl + "/auth/v1/user", { headers: { apikey: anonKey, Authorization: authorization } });
  if (!authCheck.ok) return new Response(JSON.stringify({ error: "Sua sessão expirou. Entre novamente." }), { status: 401, headers: cors });
  let q: Record<string, unknown>;
  try { q = await req.json(); } catch { return new Response(JSON.stringify({ error: "Dados da questão inválidos." }), { status: 400, headers: cors }); }
  for (const key of ["statement", "answerKey", "options"]) if (typeof q[key] !== "string" || !(q[key] as string).trim()) return new Response(JSON.stringify({ error: "A questão precisa conter enunciado, alternativas e gabarito para gerar a explicação." }), { status: 400, headers: cors });
  const prompt = [
    "Você é um professor especialista em concursos públicos brasileiros. Explique a questão abaixo de forma didática, completa e acessível, em português brasileiro.",
    "REGRAS: Analise a legislação vigente pertinente; não invente artigos, súmulas ou precedentes. Explique se o gabarito informado é juridicamente consistente e sinalize qualquer incerteza. Explique por que a resposta correta está correta e, em múltipla escolha, por que CADA alternativa restante está errada. Em Certo/Errado, explique o ponto decisivo. Use a referência e o comentário oficial como contexto, mas não os trate como infalíveis. Termine com um resumo curto para memorizar.",
    "DISCIPLINA: " + (q.discipline || "não informada"),
    "ASSUNTO/FILTRO: " + (q.subject || "não informado"),
    "REFERÊNCIA LEGAL CADASTRADA: " + (q.reference || "não informada"),
    "MODALIDADE: " + (q.modality || "não informada"),
    "ENUNCIADO:\n" + q.statement,
    "ALTERNATIVAS:\n" + q.options,
    "RESPOSTA MARCADA PELO ALUNO:\n" + (q.studentAnswer || "não identificada"),
    "GABARITO REGISTRADO:\n" + q.answerKey,
    "GABARITO COMENTADO CADASTRADO:\n" + (q.registeredComment || "não informado"),
    "Apresente agora a explicação detalhada, com fundamento legal e linguagem clara."
  ].join("\n\n");
  const ai = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" }, body: JSON.stringify({ model: "gpt-4.1-mini", input: prompt, max_output_tokens: 1800 }) });
  const data = await ai.json().catch(() => ({}));
  if (!ai.ok) {
    const message = ai.status === 401 ? "A chave da API de IA configurada no servidor é inválida." : ai.status === 429 ? "Limite ou crédito da API de IA atingido. Confira a conta de API." : "Não foi possível gerar a explicação agora. Tente novamente.";
    return new Response(JSON.stringify({ error: message }), { status: 502, headers: cors });
  }
  const explanation = typeof data.output_text === "string" ? data.output_text : (data.output || []).flatMap((item: any) => item.content || []).filter((part: any) => part.type === "output_text").map((part: any) => part.text).join("\n");
  if (!explanation) return new Response(JSON.stringify({ error: "A IA não retornou texto. Tente novamente." }), { status: 502, headers: cors });
  return new Response(JSON.stringify({ explanation }), { status: 200, headers: cors });
});