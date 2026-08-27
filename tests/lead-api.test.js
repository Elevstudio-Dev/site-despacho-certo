const assert = require("node:assert/strict");
const test = require("node:test");

const { createLeadHandler } = require("../api/lead.js");

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    payload: undefined,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

function validLead(overrides = {}) {
  return {
    name: "Maria Souza",
    phone: "(11) 99999-1234",
    company: "Despachante Central",
    volume: "De 51 a 150 OS",
    challenge: "Quero organizar os processos da equipe.",
    website: "",
    ...overrides,
  };
}

test("recusa métodos diferentes de POST", async () => {
  const handler = createLeadHandler({
    env: { RESEND_API_KEY: "re_test" },
    fetchImpl: async () => {
      throw new Error("fetch não deveria ser chamado");
    },
  });
  const response = createResponse();

  await handler({ method: "GET" }, response);

  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, "POST");
  assert.deepEqual(response.payload, {
    ok: false,
    message: "Método não permitido.",
  });
});

test("valida os campos obrigatórios antes de enviar", async () => {
  let fetchCalls = 0;
  const handler = createLeadHandler({
    env: { RESEND_API_KEY: "re_test" },
    fetchImpl: async () => {
      fetchCalls += 1;
      return { ok: true };
    },
  });
  const response = createResponse();

  await handler(
    {
      method: "POST",
      body: validLead({ name: "A", phone: "123", volume: "Outro" }),
    },
    response,
  );

  assert.equal(response.statusCode, 400);
  assert.equal(response.payload.ok, false);
  assert.match(response.payload.message, /dados informados/i);
  assert.equal(fetchCalls, 0);
});

test("descarta silenciosamente submissões preenchidas por robôs", async () => {
  let fetchCalls = 0;
  const handler = createLeadHandler({
    env: { RESEND_API_KEY: "re_test" },
    fetchImpl: async () => {
      fetchCalls += 1;
      return { ok: true };
    },
  });
  const response = createResponse();

  await handler(
    { method: "POST", body: validLead({ website: "https://spam.example" }) },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.ok, true);
  assert.equal(fetchCalls, 0);
});

test("envia o lead ao Resend com conteúdo escapado", async () => {
  const requests = [];
  const handler = createLeadHandler({
    env: {
      RESEND_API_KEY: "re_test",
      LEAD_FROM_EMAIL: "DespachoCerto <site@despachocerto.com.br>",
    },
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return { ok: true };
    },
  });
  const response = createResponse();

  await handler(
    {
      method: "POST",
      body: validLead({
        company: "Central <script>alert('x')</script>",
        challenge: "Usamos <b>planilhas</b> hoje.",
      }),
    },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.ok, true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://api.resend.com/emails");
  assert.equal(requests[0].options.method, "POST");
  assert.equal(requests[0].options.headers.Authorization, "Bearer re_test");

  const email = JSON.parse(requests[0].options.body);
  assert.deepEqual(email.to, ["contato@elevstudio.com.br"]);
  assert.equal(email.from, "DespachoCerto <site@despachocerto.com.br>");
  assert.match(email.subject, /Nova demonstração DespachoCerto/);
  assert.doesNotMatch(email.html, /<script>/i);
  assert.match(email.html, /&lt;script&gt;/i);
  assert.match(email.html, /&lt;b&gt;planilhas&lt;\/b&gt;/i);
});

test("retorna erro temporário quando o Resend falha", async () => {
  const handler = createLeadHandler({
    env: { RESEND_API_KEY: "re_test" },
    fetchImpl: async () => ({ ok: false, status: 429 }),
  });
  const response = createResponse();

  await handler({ method: "POST", body: validLead() }, response);

  assert.equal(response.statusCode, 502);
  assert.deepEqual(response.payload, {
    ok: false,
    message: "Não foi possível enviar agora. Tente novamente em instantes.",
  });
});

test("informa quando o serviço de e-mail não está configurado", async () => {
  const handler = createLeadHandler({
    env: {},
    fetchImpl: async () => ({ ok: true }),
  });
  const response = createResponse();

  await handler({ method: "POST", body: validLead() }, response);

  assert.equal(response.statusCode, 503);
  assert.equal(response.payload.ok, false);
});
