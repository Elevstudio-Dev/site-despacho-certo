const assert = require("node:assert/strict");
const test = require("node:test");

const { createHealthHandler } = require("../api/health.js");

function createResponse() {
  return {
    headers: {}, statusCode: 200, payload: undefined,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

test("responde saudável sem expor valores sensíveis", async () => {
  const response = createResponse();
  const handler = createHealthHandler({
    env: {
      RESEND_API_KEY: "secret_resend",
      SUPABASE_URL: "https://secret.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "secret_supabase",
      TURNSTILE_SECRET_KEY: "secret_turnstile",
      LEAD_RATE_LIMIT_SECRET: "secret_rate_limit",
    },
    fetchImpl: async (url, options) => {
      assert.equal(url, "https://secret.supabase.co/rest/v1/marketing_leads?select=id&limit=1");
      assert.equal(options.method, "HEAD");
      return { ok: true };
    },
  });
  await handler({ method: "GET" }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["Cache-Control"], "no-store");
  assert.deepEqual(response.payload, { ok: true, service: "lead-form" });
  assert.doesNotMatch(JSON.stringify(response.payload), /secret/);
});

test("sinaliza configuração incompleta", async () => {
  const response = createResponse();
  const handler = createHealthHandler({ env: {} });
  await handler({ method: "GET" }, response);
  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.payload, { ok: false, service: "lead-form" });
});

test("sinaliza indisponibilidade real do banco", async () => {
  const response = createResponse();
  const handler = createHealthHandler({
    env: {
      RESEND_API_KEY: "configured",
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "configured",
      TURNSTILE_SECRET_KEY: "configured",
      LEAD_RATE_LIMIT_SECRET: "configured",
    },
    fetchImpl: async () => ({ ok: false, status: 503 }),
  });
  await handler({ method: "GET" }, response);
  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.payload, { ok: false, service: "lead-form" });
});
