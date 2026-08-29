function createPublicConfigHandler({ env = process.env } = {}) {
  return async function publicConfigHandler(request, response) {
    if (request.method !== "GET") {
      response.setHeader("Allow", "GET");
      return response.status(405).json({ ok: false });
    }

    if (!env.TURNSTILE_SITE_KEY) {
      return response.status(503).json({ ok: false });
    }

    response.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    return response.status(200).json({ turnstileSiteKey: env.TURNSTILE_SITE_KEY });
  };
}

const handler = createPublicConfigHandler();

module.exports = handler;
module.exports.createPublicConfigHandler = createPublicConfigHandler;
