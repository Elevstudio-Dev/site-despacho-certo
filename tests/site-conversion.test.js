const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const home = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const contact = fs.readFileSync(path.join(projectRoot, 'contato.html'), 'utf8');
const leadFormScriptPath = path.join(projectRoot, 'lead-form.js');

test('keeps the complete lead form on the contact page only', () => {
  assert.doesNotMatch(home, /id="leadForm"/);
  assert.match(home, /href="\/contato"/);
  assert.match(home, /Leve um processo do seu escritório para a demonstração\./);
  assert.match(home, /href="\/contato"[^>]*>\s*Preparar minha demonstração/);
  const finalSection = home.match(/<section class="final-section"[\s\S]*?<\/section>/i)?.[0] || '';
  assert.doesNotMatch(finalSection, /<(?:input|textarea|select)\b/i);
  assert.doesNotMatch(home, /mailto:/i);
  assert.match(contact, /id="leadForm"[^>]+action="\/api\/lead"[^>]+data-clarity-mask="true"/);
  assert.match(contact, /name="email"[^>]+type="email"/);
  assert.match(contact, /src="\/lead-form\.js"/);
  assert.match(contact, /Demonstração preparada para o seu escritório/);
  assert.match(contact, /Mostre uma OS real\. Veja como ela fica no DespachoCerto\./);
  assert.match(contact, /Conte onde a equipe perde contexto hoje\. A demonstração percorre esse processo, sem apresentação genérica e sem compromisso\./);
  for (const outcome of ['Diagnóstico da rotina', 'Fluxo aplicado', 'Dúvidas técnicas', 'Próximos passos']) {
    assert.match(contact, new RegExp(outcome));
  }
  assert.match(contact, /id="leadSubmitLabel">Preparar minha demonstração/);
});

test('redirects a successful lead to a dedicated thank-you page', () => {
  const thankYouPath = path.join(projectRoot, 'obrigado.html');
  assert.ok(fs.existsSync(thankYouPath));
  const thankYou = fs.readFileSync(thankYouPath, 'utf8');
  const leadFormScript = fs.readFileSync(leadFormScriptPath, 'utf8');

  assert.match(leadFormScript, /location\.assign\("\/obrigado"\)/);
  assert.match(thankYou, /<meta name="robots" content="noindex, nofollow"/);
  assert.match(thankYou, /Recebemos seu pedido de demonstração/);
  assert.match(thankYou, /href="\/sistema-para-despachante"/);
});

test('protects the lead form without falling back to an email application', () => {
  const leadFormScript = fs.readFileSync(leadFormScriptPath, 'utf8');

  assert.match(contact, /id="turnstileWidget"/);
  assert.match(leadFormScript, /\/api\/public-config/);
  assert.match(leadFormScript, /cf-turnstile-response/);
  assert.doesNotMatch(contact, /id="formFallback"/);
  assert.doesNotMatch(leadFormScript, /formFallback|mailto:/);
});
