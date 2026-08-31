function getSupabaseKey(env) {
  return env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function getSupabaseHeaders(env) {
  const key = getSupabaseKey(env);
  const headers = { apikey: key };

  if (key && !key.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${key}`;
  }

  return headers;
}

module.exports = { getSupabaseHeaders, getSupabaseKey };
