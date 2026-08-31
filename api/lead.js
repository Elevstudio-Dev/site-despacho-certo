const crypto = require("node:crypto");
const { getSupabaseHeaders, getSupabaseKey } = require("./supabase-config.js");

const RESEND_ENDPOINT = "https://api.resend.com/emails/batch";
const TURNSTILE_VERIFY_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RATE_LIMIT_WINDOW_SECONDS = 900;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const DEFAULT_TO_EMAIL = "contato@elevstudio.com.br";
const DEFAULT_FROM_EMAIL = "DespachoCerto <contato@elevstudio.com.br>";
const DEFAULT_REPLY_TO_EMAIL = "contato@elevstudio.com.br";
const LOGO_URL = "https://despachocerto.com.br/despachocerto-logo-horizontal-fundo-azul.png";
const ALLOWED_VOLUMES = new Set([
  "Até 50 OS",
  "De 51 a 150 OS",
  "De 151 a 300 OS",
  "Mais de 300 OS",
]);

function normalizeText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseBody(body) {
  if (body && typeof body === "object" && !Buffer.isBuffer(body)) {
    return body;
  }

  if (typeof body !== "string" && !Buffer.isBuffer(body)) {
    return {};
  }

  try {
    return JSON.parse(body.toString());
  } catch {
    return {};
  }
}

function validateLead(body) {
  const lead = {
    name: normalizeText(body.name, 100),
    email: normalizeText(body.email, 254).toLowerCase(),
    phone: normalizeText(body.phone, 30),
    company: normalizeText(body.company, 120),
    volume: normalizeText(body.volume, 40),
    challenge: normalizeText(body.challenge, 1000),
    website: normalizeText(body.website, 200),
    submissionId: normalizeText(body.submissionId, 80),
    turnstileToken: normalizeText(body.turnstileToken || body["cf-turnstile-response"], 2048),
  };
  const phoneDigits = lead.phone.replace(/\D/g, "");
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email);

  if (
    lead.name.length < 2 ||
    !validEmail ||
    lead.company.length < 2 ||
    phoneDigits.length < 10 ||
    phoneDigits.length > 15 ||
    !ALLOWED_VOLUMES.has(lead.volume)
  ) {
    return { ok: false };
  }

  return { ok: true, lead };
}

function safeSubjectPart(value) {
  return value.replace(/[\r\n\t]+/g, " ").slice(0, 80);
}

function emailHeader(title, eyebrow) {
  return `<div style="padding:22px 24px;background:#0b3454;color:#ffffff;">
    <img src="${LOGO_URL}" width="270" height="71" alt="DespachoCerto" style="display:block;width:270px;max-width:100%;height:auto;margin:0 0 18px;border:0;" />
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#91d8ef;">${eyebrow}</p>
    <h1 style="margin:0;font-size:24px;line-height:1.25;">${title}</h1>
  </div>`;
}

function buildInternalEmail(lead, env) {
  const fields = [
    ["Nome", lead.name],
    ["E-mail", lead.email],
    ["Telefone / WhatsApp", lead.phone],
    ["Empresa", lead.company],
    ["Volume mensal", lead.volume],
    ["Principal desafio", lead.challenge || "Não informado"],
  ];
  const text = fields.map(([label, value]) => `${label}: ${value}`).join("\n");
  const rows = fields
    .map(
      ([label, value]) => `
        <tr>
          <th style="padding:10px 12px;text-align:left;vertical-align:top;color:#163955;background:#f1f7fb;border-bottom:1px solid #dbe8f0;">${escapeHtml(label)}</th>
          <td style="padding:10px 12px;color:#243746;border-bottom:1px solid #dbe8f0;white-space:pre-wrap;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  return {
    from: env.LEAD_FROM_EMAIL || DEFAULT_FROM_EMAIL,
    to: [env.LEAD_TO_EMAIL || DEFAULT_TO_EMAIL],
    subject: `Nova demonstração DespachoCerto | ${safeSubjectPart(lead.company)}`,
    text: `Novo pedido de demonstração pelo site da DespachoCerto.\n\n${text}`,
    html: `
      <div style="margin:0;padding:24px;background:#f4f8fb;font-family:Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe8f0;">
          ${emailHeader("Novo pedido de demonstração", "Uma solução Elev Studio")}
          <div style="padding:24px;">
            <p style="margin:0 0 18px;color:#415466;line-height:1.5;">Um novo contato foi enviado pelo site da DespachoCerto.</p>
            <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.45;">${rows}</table>
          </div>
        </div>
      </div>`,
    reply_to: lead.email,
    tags: [{ name: "category", value: "lead_notification" }],
  };
}

function buildConfirmationEmail(lead, env) {
  const from = env.LEAD_FROM_EMAIL || DEFAULT_FROM_EMAIL;
  const replyTo = env.LEAD_REPLY_TO_EMAIL || DEFAULT_REPLY_TO_EMAIL;
  return {
    from,
    to: [lead.email],
    reply_to: replyTo,
    subject: "Recebemos seu pedido de demonstração | DespachoCerto",
    text: `Olá, ${lead.name}!\n\nRecebemos seu pedido de demonstração do DespachoCerto. Nossa equipe vai analisar as informações do ${lead.company} e entrar em contato para combinar o próximo passo.\n\nEnquanto isso, conheça o sistema: https://despachocerto.com.br/sistema-para-despachante\n\nDespachoCerto — Uma solução Elev Studio`,
    html: `
      <div style="margin:0;padding:24px;background:#f4f8fb;font-family:Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe8f0;">
          ${emailHeader("Recebemos seu pedido de demonstração", "DespachoCerto")}
          <div style="padding:24px;color:#243746;line-height:1.6;">
            <p style="margin:0 0 16px;font-size:17px;"><strong>Olá, ${escapeHtml(lead.name)}!</strong></p>
            <p style="margin:0 0 16px;">Recebemos as informações do <strong>${escapeHtml(lead.company)}</strong>. Nossa equipe vai revisar o contexto informado e entrar em contato para combinar uma demonstração útil para a rotina do escritório.</p>
            <div style="margin:22px 0;padding:16px;background:#f1f7fb;border-left:4px solid #38bfe8;">
              <strong style="display:block;margin-bottom:6px;color:#0b3454;">O que acontece agora</strong>
              <span>Vamos analisar volume, equipe e principal dificuldade para selecionar os fluxos mais relevantes da apresentação.</span>
            </div>
            <p style="margin:0 0 22px;"><a href="https://despachocerto.com.br/sistema-para-despachante" style="display:inline-block;padding:12px 18px;color:#ffffff;background:#155a9c;text-decoration:none;font-weight:bold;">Conhecer o DespachoCerto</a></p>
            <p style="margin:0;color:#607482;font-size:13px;">Você recebeu esta confirmação porque informou este e-mail no pedido de demonstração. Para corrigir algum dado, responda diretamente a esta mensagem.</p>
          </div>
        </div>
      </div>`,
    tags: [{ name: "category", value: "lead_confirmation" }],
  };
}

function buildEmails(lead, env) {
  return [buildInternalEmail(lead, env), buildConfirmationEmail(lead, env)];
}

function getHeader(request, name) {
  const value = request?.headers?.[name] ?? request?.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : normalizeText(value, 500);
}

function getClientIp(request) {
  const forwarded = getHeader(request, "x-forwarded-for");
  return forwarded.split(",")[0]?.trim() || getHeader(request, "x-real-ip") || "unknown";
}

function createIpHash(request, secret) {
  return crypto.createHmac("sha256", secret).update(getClientIp(request)).digest("hex");
}

function supabaseRequest(env, path, options = {}) {
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, "");
  return {
    url: `${baseUrl}/rest/v1/${path}`,
    options: {
      ...options,
      headers: {
        ...getSupabaseHeaders(env),
        "Content-Type": "application/json",
        ...options.headers,
      },
    },
  };
}

async function parseJson(response, fallback = null) {
  try {
    return await response.json();
  } catch {
    return fallback;
  }
}

function writeLog(logger, level, event, details) {
  const method = typeof logger?.[level] === "function" ? logger[level] : logger?.log;
  method?.call(logger, { event, ...details });
}

function createLeadHandler({
  env = process.env,
  fetchImpl = globalThis.fetch,
  logger = console,
} = {}) {
  return async function leadHandler(request, response) {
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      return response.status(405).json({
        ok: false,
        message: "Método não permitido.",
      });
    }

    const body = parseBody(request.body);

    if (normalizeText(body.website, 200)) {
      return response.status(200).json({
        ok: true,
        message: "Solicitação recebida.",
      });
    }

    const validation = validateLead(body);
    if (!validation.ok) {
      return response.status(400).json({
        ok: false,
        message: "Revise os dados informados e tente novamente.",
      });
    }

    const requiredConfiguration = [
      env.RESEND_API_KEY,
      env.SUPABASE_URL,
      getSupabaseKey(env),
      env.TURNSTILE_SECRET_KEY,
      env.LEAD_RATE_LIMIT_SECRET,
    ];
    if (requiredConfiguration.some((value) => !value) || typeof fetchImpl !== "function") {
      return response.status(503).json({
        ok: false,
        message: "O formulário está temporariamente indisponível.",
      });
    }

    const submissionId = /^[a-zA-Z0-9_-]{8,80}$/.test(validation.lead.submissionId)
      ? validation.lead.submissionId
      : crypto.randomUUID();
    const startedAt = Date.now();
    const log = (level, event, details = {}) => writeLog(logger, level, event, {
      submissionId,
      durationMs: Date.now() - startedAt,
      ...details,
    });

    try {
      log("info", "lead_request_received");

      const rateLimitCall = supabaseRequest(env, "rpc/check_marketing_lead_rate_limit", {
        method: "POST",
        body: JSON.stringify({
          p_ip_hash: createIpHash(request, env.LEAD_RATE_LIMIT_SECRET),
          p_limit: RATE_LIMIT_MAX_ATTEMPTS,
          p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
        }),
      });
      const rateLimitResponse = await fetchImpl(rateLimitCall.url, rateLimitCall.options);
      const allowed = await parseJson(rateLimitResponse, false);
      if (!rateLimitResponse.ok) {
        log("error", "lead_dependency_failed", { stage: "rate_limit", status: rateLimitResponse.status });
        return response.status(503).json({ ok: false, message: "O formulário está temporariamente indisponível." });
      }
      if (allowed !== true) {
        response.setHeader("Retry-After", String(RATE_LIMIT_WINDOW_SECONDS));
        log("info", "lead_rate_limited");
        return response.status(429).json({
          ok: false,
          message: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.",
        });
      }

      if (!validation.lead.turnstileToken) {
        return response.status(400).json({
          ok: false,
          message: "Conclua a verificação de segurança e tente novamente.",
        });
      }
      const turnstileResponse = await fetchImpl(TURNSTILE_VERIFY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: env.TURNSTILE_SECRET_KEY,
          response: validation.lead.turnstileToken,
          idempotency_key: submissionId,
        }),
      });
      const turnstileResult = await parseJson(turnstileResponse, { success: false });
      if (!turnstileResponse.ok || turnstileResult?.success !== true) {
        log("info", "lead_turnstile_rejected", { status: turnstileResponse.status });
        return response.status(400).json({
          ok: false,
          message: "Não foi possível concluir a verificação de segurança. Tente novamente.",
        });
      }

      const storageCall = supabaseRequest(env, "marketing_leads", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify({
          submission_id: submissionId,
          name: validation.lead.name,
          email: validation.lead.email,
          phone: validation.lead.phone,
          company: validation.lead.company,
          volume: validation.lead.volume,
          challenge: validation.lead.challenge || null,
          source: "site_institucional",
        }),
      });
      const storageResponse = await fetchImpl(storageCall.url, storageCall.options);
      if (!storageResponse.ok) {
        log("error", "lead_dependency_failed", { stage: "storage", status: storageResponse.status });
        return response.status(503).json({ ok: false, message: "O formulário está temporariamente indisponível." });
      }
      log("info", "lead_persisted");

      const updateEmailStatus = async (emailStatus) => {
        try {
          const statusCall = supabaseRequest(
            env,
            `marketing_leads?submission_id=eq.${encodeURIComponent(submissionId)}`,
            {
              method: "PATCH",
              headers: { Prefer: "return=minimal" },
              body: JSON.stringify({ email_status: emailStatus }),
            },
          );
          const statusResponse = await fetchImpl(statusCall.url, statusCall.options);
          if (!statusResponse.ok) {
            log("error", "lead_dependency_failed", { stage: "status_update", status: statusResponse.status });
          }
        } catch {
          log("error", "lead_dependency_failed", { stage: "status_update" });
        }
      };

      const resendResponse = await fetchImpl(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "User-Agent": "DespachoCerto-Site/1.0",
          "Idempotency-Key": `lead-demo/${submissionId}`,
        },
        body: JSON.stringify(buildEmails(validation.lead, env)),
      });

      if (!resendResponse.ok) {
        await updateEmailStatus("failed");
        log("error", "lead_email_failed", { status: resendResponse.status });
        return response.status(502).json({
          ok: false,
          message: "Não foi possível enviar agora. Tente novamente em instantes.",
        });
      }

      await updateEmailStatus("queued");
      log("info", "lead_email_queued");
      return response.status(200).json({
        ok: true,
        message: "Solicitação recebida. Nossa equipe entrará em contato em breve.",
      });
    } catch (error) {
      log("error", "lead_processing_failed", { stage: "unexpected" });
      return response.status(502).json({
        ok: false,
        message: "Não foi possível enviar agora. Tente novamente em instantes.",
      });
    }
  };
}

const handler = createLeadHandler();

module.exports = handler;
module.exports.createLeadHandler = createLeadHandler;
module.exports.validateLead = validateLead;
module.exports.buildEmails = buildEmails;
