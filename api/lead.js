const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_TO_EMAIL = "contato@elevstudio.com.br";
const DEFAULT_FROM_EMAIL = "DespachoCerto <contato@elevstudio.com.br>";
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
    phone: normalizeText(body.phone, 30),
    company: normalizeText(body.company, 120),
    volume: normalizeText(body.volume, 40),
    challenge: normalizeText(body.challenge, 1000),
    website: normalizeText(body.website, 200),
  };
  const phoneDigits = lead.phone.replace(/\D/g, "");

  if (
    lead.name.length < 2 ||
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

function buildEmail(lead, env) {
  const fields = [
    ["Nome", lead.name],
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
          <div style="padding:22px 24px;background:#0b3454;color:#ffffff;">
            <p style="margin:0 0 6px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#91d8ef;">Uma solução Elev Studio</p>
            <h1 style="margin:0;font-size:24px;">Novo pedido de demonstração</h1>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 18px;color:#415466;line-height:1.5;">Um novo contato foi enviado pelo site da DespachoCerto.</p>
            <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.45;">${rows}</table>
          </div>
        </div>
      </div>`,
  };
}

function createLeadHandler({
  env = process.env,
  fetchImpl = globalThis.fetch,
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

    if (!env.RESEND_API_KEY || typeof fetchImpl !== "function") {
      return response.status(503).json({
        ok: false,
        message: "O envio está temporariamente indisponível.",
      });
    }

    try {
      const resendResponse = await fetchImpl(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "User-Agent": "DespachoCerto-Site/1.0",
        },
        body: JSON.stringify(buildEmail(validation.lead, env)),
      });

      if (!resendResponse.ok) {
        console.error("Resend recusou o lead", { status: resendResponse.status });
        return response.status(502).json({
          ok: false,
          message: "Não foi possível enviar agora. Tente novamente em instantes.",
        });
      }

      return response.status(200).json({
        ok: true,
        message: "Solicitação recebida. Nossa equipe entrará em contato em breve.",
      });
    } catch (error) {
      console.error("Falha ao enviar lead", {
        message: error instanceof Error ? error.message : "Erro desconhecido",
      });
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
