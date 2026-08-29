const assert = require("node:assert/strict");
const test = require("node:test");

const { createPublicConfigHandler } = require("../api/public-config.js");

function createResponse() {
  return {
    headers: {}, statusCode: 200, payload: undefined,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

test("expõe apenas a chave pública do Turnstile", async () => {
  const response = createResponse();
  const handler = createPublicConfigHandler({
    env: {
      TURNSTILE_SITE_KEY: "public_site_key",
      TURNSTILE_SECRET_KEY: "private_secret_key",
      SUPABASE_SERVICE_ROLE_KEY: "private_supabase_key",
    },
  });
  await handler({ method: "GET" }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["Cache-Control"], "public, max-age=300, s-maxage=300");
  assert.deepEqual(response.payload, { turnstileSiteKey: "public_site_key" });
  assert.doesNotMatch(JSON.stringify(response.payload), /private_/);
});
