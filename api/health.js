const { getSupabaseHeaders, getSupabaseKey } = require("./supabase-config.js");

const REQUIRED_ENVIRONMENT = [
  "RESEND_API_KEY",
  "SUPABASE_URL",
  "TURNSTILE_SECRET_KEY",
  "LEAD_RATE_LIMIT_SECRET",
];

function createHealthHandler({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  return async function healthHandler(request, response) {
    if (!new Set(["GET", "HEAD"]).has(request.method)) {
      response.setHeader("Allow", "GET, HEAD");
      return response.status(405).json({ ok: false, service: "lead-form" });
    }

    response.setHeader("Cache-Control", "no-store");
    const configured = REQUIRED_ENVIRONMENT.every((key) => Boolean(env[key]))
      && Boolean(getSupabaseKey(env));
    if (!configured || typeof fetchImpl !== "function") {
      return response.status(503).json({ ok: false, service: "lead-form" });
    }

    try {
      const supabaseUrl = env.SUPABASE_URL.replace(/\/$/, "");
      const databaseResponse = await fetchImpl(
        `${supabaseUrl}/rest/v1/marketing_leads?select=id&limit=1`,
        {
          method: "HEAD",
          headers: getSupabaseHeaders(env),
        },
      );
      const healthy = databaseResponse.ok;
      return response.status(healthy ? 200 : 503).json({ ok: healthy, service: "lead-form" });
    } catch {
      return response.status(503).json({ ok: false, service: "lead-form" });
    }
  };
}

const handler = createHealthHandler();

module.exports = handler;
module.exports.createHealthHandler = createHealthHandler;
