const assert = require("node:assert/strict");
const test = require("node:test");

const { createLeadHandler } = require("../api/lead.js");

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    payload: undefined,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

function validLead(overrides = {}) {
  return {
    name: "Maria Souza",
    email: "maria@despachante.com.br",
    phone: "(11) 99999-1234",
    company: "Despachante Central",
    volume: "De 51 a 150 OS",
    challenge: "Quero organizar os processos da equipe.",
    website: "",
    turnstileToken: "turnstile-test-token",
    submissionId: "lead_test_12345678",
    ...overrides,
  };
}

function configuredEnv(overrides = {}) {
  return {
    RESEND_API_KEY: "re_test",
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_SECRET_KEY: "sb_secret_test",
    TURNSTILE_SECRET_KEY: "turnstile_secret_test",
    LEAD_RATE_LIMIT_SECRET: "rate_limit_secret_test",
    ...overrides,
  };
}

function successfulServices(requests) {
  return async (url, options) => {
    requests.push({ url, options });
    if (url.includes("/turnstile/v0/siteverify")) {
      return { ok: true, json: async () => ({ success: true, hostname: "despachocerto.com.br" }) };
    }
    if (url.includes("/rpc/check_marketing_lead_rate_limit")) {
      return { ok: true, json: async () => true };
    }
    return { ok: true, status: 200, json: async () => ({ data: [{ id: "email_batch_1" }] }) };
  };
}

test("recusa métodos diferentes de POST", async () => {
  const handler = createLeadHandler({ env: configuredEnv(), fetchImpl: async () => { throw new Error("unexpected fetch"); } });
  const response = createResponse();
  await handler({ method: "GET" }, response);
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, "POST");
});

test("valida os campos obrigatórios antes de chamar serviços", async () => {
  let fetchCalls = 0;
  const handler = createLeadHandler({
    env: configuredEnv(),
    fetchImpl: async () => { fetchCalls += 1; return { ok: true }; },
  });
  const response = createResponse();
  await handler({ method: "POST", body: validLead({ name: "A", phone: "123", volume: "Outro" }) }, response);
  assert.equal(response.statusCode, 400);
  assert.equal(fetchCalls, 0);
});

test("recusa endereço de e-mail inválido", async () => {
  let fetchCalls = 0;
  const handler = createLeadHandler({
    env: configuredEnv(),
    fetchImpl: async () => { fetchCalls += 1; return { ok: true }; },
  });
  const response = createResponse();
  await handler({ method: "POST", body: validLead({ email: "email-invalido" }) }, response);
  assert.equal(response.statusCode, 400);
  assert.equal(fetchCalls, 0);
});

test("descarta silenciosamente submissões preenchidas por robôs", async () => {
  let fetchCalls = 0;
  const handler = createLeadHandler({
    env: configuredEnv(),
    fetchImpl: async () => { fetchCalls += 1; return { ok: true }; },
  });
  const response = createResponse();
  await handler({ method: "POST", body: validLead({ website: "https://spam.example" }) }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.ok, true);
  assert.equal(fetchCalls, 0);
});

test("valida, limita, persiste e envia o lead com conteúdo escapado", async () => {
  const requests = [];
  const handler = createLeadHandler({
    env: configuredEnv({ LEAD_FROM_EMAIL: "DespachoCerto <site@despachocerto.com.br>" }),
    fetchImpl: successfulServices(requests),
  });
  const response = createResponse();
  await handler({
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.10" },
    body: validLead({
      company: "Central <script>alert('x')</script>",
      challenge: "Usamos <b>planilhas</b> hoje.",
    }),
  }, response);

  assert.equal(response.statusCode, 200);
  const turnstileRequest = requests.find(({ url }) => url.includes("/turnstile/v0/siteverify"));
  assert.equal(JSON.parse(turnstileRequest.options.body).response, "turnstile-test-token");

  const rateLimitRequest = requests.find(({ url }) => url.includes("/rpc/check_marketing_lead_rate_limit"));
  const rateLimitBody = JSON.parse(rateLimitRequest.options.body);
  assert.match(rateLimitBody.p_ip_hash, /^[a-f0-9]{64}$/);
  assert.equal(rateLimitBody.p_limit, 5);

  const storageRequest = requests.find(({ url }) => url.endsWith("/rest/v1/marketing_leads"));
  assert.equal(storageRequest.options.headers.apikey, "sb_secret_test");
  assert.equal(storageRequest.options.headers.Authorization, undefined);
  const storedLead = JSON.parse(storageRequest.options.body);
  assert.equal(storedLead.submission_id, "lead_test_12345678");
  assert.equal(storedLead.email, "maria@despachante.com.br");
  assert.equal(storedLead.source, "site_institucional");

  const resendRequest = requests.find(({ url }) => url === "https://api.resend.com/emails/batch");
  assert.equal(resendRequest.options.headers.Authorization, "Bearer re_test");
  assert.equal(resendRequest.options.headers["Idempotency-Key"], "lead-demo/lead_test_12345678");
  const emails = JSON.parse(resendRequest.options.body);
  assert.equal(emails.length, 2);
  assert.doesNotMatch(emails[0].html, /<script>/i);
  assert.match(emails[0].html, /&lt;script&gt;/i);
  assert.match(emails[0].html, /&lt;b&gt;planilhas&lt;\/b&gt;/i);
  assert.deepEqual(emails[1].to, ["maria@despachante.com.br"]);
  assert.match(emails[1].html, /despachocerto-logo-horizontal-fundo-azul\.png/);

  const successUpdate = requests.find(({ url }) => url.includes("marketing_leads?submission_id=eq."));
  assert.deepEqual(JSON.parse(successUpdate.options.body), { email_status: "queued" });
});

test("recusa token antispam inválido antes de armazenar o lead", async () => {
  const requests = [];
  const handler = createLeadHandler({
    env: configuredEnv(),
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      if (url.includes("/rpc/check_marketing_lead_rate_limit")) return { ok: true, json: async () => true };
      if (url.includes("/turnstile/v0/siteverify")) return { ok: true, json: async () => ({ success: false }) };
      throw new Error("unexpected fetch");
    },
  });
  const response = createResponse();
  await handler({ method: "POST", body: validLead(), headers: {} }, response);
  assert.equal(response.statusCode, 400);
  assert.match(response.payload.message, /verificação de segurança/i);
  assert.equal(requests.some(({ url }) => url.endsWith("/rest/v1/marketing_leads")), false);
});

test("limita excesso de tentativas antes da validação externa", async () => {
  const requests = [];
  const handler = createLeadHandler({
    env: configuredEnv(),
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      if (url.includes("/rpc/check_marketing_lead_rate_limit")) return { ok: true, json: async () => false };
      throw new Error("unexpected fetch");
    },
  });
  const response = createResponse();
  await handler({ method: "POST", body: validLead(), headers: { "x-forwarded-for": "203.0.113.10" } }, response);
  assert.equal(response.statusCode, 429);
  assert.equal(response.headers["Retry-After"], "900");
  assert.equal(requests.length, 1);
});

test("mantém o lead salvo e marca falha quando o Resend recusa", async () => {
  const requests = [];
  const handler = createLeadHandler({
    env: configuredEnv(),
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      if (url.includes("/turnstile/v0/siteverify")) return { ok: true, json: async () => ({ success: true }) };
      if (url.includes("/rpc/check_marketing_lead_rate_limit")) return { ok: true, json: async () => true };
      if (url === "https://api.resend.com/emails/batch") return { ok: false, status: 429 };
      return { ok: true, status: 204, json: async () => ({}) };
    },
  });
  const response = createResponse();
  await handler({ method: "POST", body: validLead(), headers: {} }, response);
  assert.equal(response.statusCode, 502);
  const failureUpdate = requests.find(({ url, options }) => url.includes("marketing_leads?submission_id=eq.") && JSON.parse(options.body).email_status === "failed");
  assert.ok(failureUpdate);
});

test("não registra dados pessoais nos eventos operacionais", async () => {
  const logs = [];
  const handler = createLeadHandler({
    env: configuredEnv(),
    fetchImpl: successfulServices([]),
    logger: { info: (event) => logs.push(event), error: (event) => logs.push(event) },
  });
  const response = createResponse();
  await handler({ method: "POST", body: validLead(), headers: {} }, response);
  const serialized = JSON.stringify(logs);
  assert.doesNotMatch(serialized, /Maria Souza|maria@despachante\.com\.br|Despachante Central/);
  assert.match(serialized, /lead_email_queued/);
  assert.match(serialized, /lead_test_12345678/);
});

test("confirma o envio mesmo se a atualização do status falhar depois do Resend", async () => {
  const requests = [];
  const handler = createLeadHandler({
    env: configuredEnv(),
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      if (url.includes("/turnstile/v0/siteverify")) return { ok: true, json: async () => ({ success: true }) };
      if (url.includes("/rpc/check_marketing_lead_rate_limit")) return { ok: true, json: async () => true };
      if (url.includes("marketing_leads?submission_id=eq.")) throw new Error("status unavailable");
      return { ok: true, status: 200, json: async () => ({}) };
    },
    logger: { info() {}, error() {} },
  });
  const response = createResponse();
  await handler({ method: "POST", body: validLead(), headers: {} }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.ok, true);
});

test("informa quando os serviços obrigatórios não estão configurados", async () => {
  const handler = createLeadHandler({ env: {}, fetchImpl: async () => ({ ok: true }) });
  const response = createResponse();
  await handler({ method: "POST", body: validLead() }, response);
  assert.equal(response.statusCode, 503);
});
