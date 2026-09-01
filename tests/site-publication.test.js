const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('keeps the Ohana case outside the public deployment', () => {
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const publicHtml = fs.readdirSync(root)
    .filter((name) => name.endsWith('.html'))
    .map((name) => fs.readFileSync(path.join(root, name), 'utf8'))
    .join('\n');

  assert.equal(fs.existsSync(path.join(root, 'clientes', 'ohana-consultoria.html')), false);
  assert.equal(fs.existsSync(path.join(root, 'drafts', 'clientes', 'ohana-consultoria.html')), true);
  assert.doesNotMatch(sitemap, /ohana-consultoria/i);
  assert.doesNotMatch(publicHtml, /Ohana|clientes\/ohana-consultoria/i);
  assert.match(fs.readFileSync(path.join(root, '.vercelignore'), 'utf8'), /^drafts\/$/m);
});

test('keeps the withdrawn case out of generator sources and generated output', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'despachocerto-publication-'));
  const tempScripts = path.join(tempRoot, 'scripts');
  fs.mkdirSync(tempScripts);

  const generatorFiles = ['generate-seo-pages.cjs', 'seo-pages-data.cjs'];
  generatorFiles.forEach((name) => {
    fs.copyFileSync(path.join(root, 'scripts', name), path.join(tempScripts, name));
  });

  try {
    childProcess.execFileSync(process.execPath, [path.join(tempScripts, 'generate-seo-pages.cjs')], {
      cwd: tempRoot,
      stdio: 'pipe',
    });

    const generatedHtml = fs.readdirSync(tempRoot, { recursive: true })
      .filter((name) => name.endsWith('.html'))
      .map((name) => fs.readFileSync(path.join(tempRoot, name), 'utf8'))
      .join('\n');
    const generatedSitemap = fs.readFileSync(path.join(tempRoot, 'sitemap.xml'), 'utf8');
    const generatorSources = generatorFiles
      .map((name) => fs.readFileSync(path.join(tempScripts, name), 'utf8'))
      .join('\n');

    assert.equal(fs.existsSync(path.join(tempRoot, 'clientes', 'ohana-consultoria.html')), false);
    assert.doesNotMatch(generatedSitemap, /ohana|clientes\/ohana-consultoria/i);
    assert.doesNotMatch(generatedHtml, /ohana|clientes\/ohana-consultoria/i);
    assert.doesNotMatch(generatorSources, /ohana|clientes\/ohana-consultoria/i);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('keeps contact conversion intact when SEO pages are regenerated', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'despachocerto-contact-generation-'));
  const tempScripts = path.join(tempRoot, 'scripts');
  fs.mkdirSync(tempScripts);

  for (const name of ['generate-seo-pages.cjs', 'seo-pages-data.cjs']) {
    fs.copyFileSync(path.join(root, 'scripts', name), path.join(tempScripts, name));
  }

  try {
    childProcess.execFileSync(process.execPath, [path.join(tempScripts, 'generate-seo-pages.cjs')], {
      cwd: tempRoot,
      stdio: 'pipe',
    });

    const contact = fs.readFileSync(path.join(tempRoot, 'contato.html'), 'utf8');
    const generatorSources = ['generate-seo-pages.cjs', 'seo-pages-data.cjs']
      .map((name) => fs.readFileSync(path.join(tempScripts, name), 'utf8'))
      .join('\n');

    assert.match(contact, /id="leadForm"[^>]+action="\/api\/lead"[^>]+data-clarity-mask="true"/);
    assert.match(contact, /id="turnstileWidget"/);
    assert.match(contact, /src="\/lead-form\.js"/);
    assert.match(contact, /Mostre uma OS real\. Veja como ela fica no DespachoCerto\./);
    assert.doesNotMatch(contact, /\/#contato|formulário da página inicial/i);
    assert.doesNotMatch(generatorSources, /\/#contato|formulário da página inicial/i);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
