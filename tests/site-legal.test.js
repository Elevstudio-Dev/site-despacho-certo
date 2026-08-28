const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

const legalPages = [
  {
    file: 'privacidade.html',
    title: 'Política de Privacidade | DespachoCerto',
    canonical: 'https://despachocerto.com.br/privacidade',
  },
  {
    file: 'cookies.html',
    title: 'Política de Cookies | DespachoCerto',
    canonical: 'https://despachocerto.com.br/cookies',
  },
  {
    file: 'termos.html',
    title: 'Termos de Uso | DespachoCerto',
    canonical: 'https://despachocerto.com.br/termos',
  },
];

test('publishes three standalone legal pages with consistent ownership', () => {
  for (const page of legalPages) {
    const html = read(page.file);

    assert.match(html, new RegExp(`<title>${page.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</title>`));
    assert.match(html, new RegExp(`<link rel="canonical" href="${page.canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" \\/>`));
    assert.match(html, /62\.574\.201 Carlos Eduardo Filho da Conceição/);
    assert.match(html, /62\.574\.201\/0001-50/);
    assert.match(html, /Tubarão\/SC/);
    assert.match(html, /contato@elevstudio\.com\.br/);
    assert.match(html, /<link rel="stylesheet" href="legal\.css" \/>/);
    assert.match(html, /<script src="site-preferences\.js"><\/script>/);
    assert.match(html, /<script src="legal\.js"><\/script>/);
    assert.doesNotMatch(html, /<style\b/i);
    assert.doesNotMatch(html, /\sstyle=/i);
  }
});

test('links privacy, cookies and terms from every public footer', () => {
  const pages = [read('index.html'), ...legalPages.map((page) => read(page.file))];

  for (const html of pages) {
    assert.match(html, /href="\/privacidade"/);
    assert.match(html, /href="\/cookies"/);
    assert.match(html, /href="\/termos"/);
    assert.match(html, /id="privacySettings"/);
  }
});

test('documents providers, legal rights and international transfers', () => {
  const privacy = read('privacidade.html');

  assert.match(privacy, /Vercel/);
  assert.match(privacy, /Resend/);
  assert.match(privacy, /Google Analytics/);
  assert.match(privacy, /bases legais/i);
  assert.match(privacy, /transferências internacionais/i);
  assert.match(privacy, /Seus direitos/);
  assert.match(privacy, /14 meses/);
});

test('documents necessary storage and optional analytics cookies', () => {
  const cookies = read('cookies.html');

  assert.match(cookies, /despachocerto_consent_v3/);
  assert.match(cookies, /_ga/);
  assert.match(cookies, /_ga_&lt;container-id&gt;/);
  assert.match(cookies, /Até 2 anos/);
  assert.match(cookies, /Não usamos cookies publicitários/i);
  assert.match(cookies, /Preferências de cookies/);
});

test('limits the terms to the institutional website', () => {
  const terms = read('termos.html');

  assert.match(terms, /site institucional/i);
  assert.match(terms, /propriedade intelectual/i);
  assert.match(terms, /legislação brasileira/i);
  assert.match(
    terms,
    /A contratação, o licenciamento, o suporte, os níveis de serviço e o tratamento de dados dentro do sistema DespachoCerto serão regidos por instrumento comercial próprio\./,
  );
});

test('adds every legal URL to the sitemap', () => {
  const sitemap = read('sitemap.xml');

  assert.match(sitemap, /https:\/\/despachocerto\.com\.br\/privacidade/);
  assert.match(sitemap, /https:\/\/despachocerto\.com\.br\/cookies/);
  assert.match(sitemap, /https:\/\/despachocerto\.com\.br\/termos/);
});
