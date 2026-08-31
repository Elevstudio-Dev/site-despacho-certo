const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const vercel = JSON.parse(fs.readFileSync(path.join(projectRoot, 'vercel.json'), 'utf8'));
const secureSiteSource = '/((?!blog(?:/.*)?|_next(?:/.*)?).*)';

function responseHeaders() {
  const siteRule = vercel.headers.find((rule) => rule.source === secureSiteSource);
  assert.ok(siteRule, 'Expected security headers to exclude the proxied blog');
  return Object.fromEntries(siteRule.headers.map(({ key, value }) => [key, value]));
}

test('keeps the blog proxy outside the static site CSP', () => {
  const rewrites = Object.fromEntries(vercel.rewrites.map(({ source, destination }) => [source, destination]));

  assert.equal(rewrites['/blog'], 'https://app.despachocerto.com.br/blog');
  assert.equal(rewrites['/blog/:path*'], 'https://app.despachocerto.com.br/blog/:path*');
  assert.equal(rewrites['/_next/:path*'], 'https://app.despachocerto.com.br/_next/:path*');
  assert.equal(vercel.headers.some((rule) => rule.source === '/(.*)'), false);
});

test('allows only the site and consented analytics resources', () => {
  const headers = responseHeaders();
  const csp = headers['Content-Security-Policy'];
  assert.ok(csp, 'Expected a Content-Security-Policy header');

  const jsonLdBody = index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)[1];
  const digest = crypto.createHash('sha256').update(jsonLdBody, 'utf8').digest('base64');
  const expectedHash = `'sha256-${digest}'`;

  assert.ok(csp.includes(expectedHash), `CSP precisa conter ${expectedHash}`);
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self' https:\/\/www\.googletagmanager\.com/);
  assert.match(csp, /script-src[^;]+https:\/\/challenges\.cloudflare\.com/);
  assert.match(csp, /script-src[^;]+https:\/\/www\.clarity\.ms/);
  assert.match(csp, /connect-src 'self' https:\/\/\*\.google-analytics\.com https:\/\/\*\.analytics\.google\.com https:\/\/\*\.googletagmanager\.com/);
  assert.match(csp, /connect-src[^;]+https:\/\/\*\.clarity\.ms[^;]+https:\/\/c\.bing\.com/);
  assert.match(csp, /img-src[^;]+https:\/\/\*\.clarity\.ms[^;]+https:\/\/c\.bing\.com/);
  assert.match(csp, /style-src 'self'/);
  assert.match(csp, /font-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'self'/);
  assert.match(csp, /form-action 'self'/);
  assert.match(csp, /frame-src https:\/\/challenges\.cloudflare\.com/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /upgrade-insecure-requests/);
});

test('prevents framing, MIME sniffing and unnecessary browser capabilities', () => {
  const headers = responseHeaders();

  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.equal(headers['Cross-Origin-Opener-Policy'], 'same-origin');
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.equal(headers['Permissions-Policy'], 'camera=(), microphone=(), geolocation=()');
  assert.equal(headers['Strict-Transport-Security'], 'max-age=63072000; includeSubDomains; preload');
});
