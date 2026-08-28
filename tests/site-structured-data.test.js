const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');

function structuredGraph() {
  const match = index.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
  assert.ok(match, 'Expected a JSON-LD block');
  const data = JSON.parse(match[1]);
  assert.equal(data['@context'], 'https://schema.org');
  return data['@graph'];
}

function nodeById(graph, id) {
  const node = graph.find((item) => item['@id'] === id);
  assert.ok(node, `Expected structured-data node ${id}`);
  return node;
}

test('identifies DespachoCerto as the website name and brand', () => {
  const graph = structuredGraph();
  const website = nodeById(graph, 'https://despachocerto.com.br/#website');
  const brand = nodeById(graph, 'https://despachocerto.com.br/#brand');

  assert.equal(website['@type'], 'WebSite');
  assert.equal(website.name, 'DespachoCerto');
  assert.deepEqual(website.alternateName, ['Despacho Certo', 'despachocerto.com.br']);
  assert.deepEqual(website.publisher, { '@id': 'https://despachocerto.com.br/#organization' });
  assert.equal(brand['@type'], 'Brand');
  assert.equal(brand.name, 'DespachoCerto');
  assert.deepEqual(brand.logo, { '@id': 'https://despachocerto.com.br/#logo' });
});

test('publishes the legal identity and official logo of Elev Studio', () => {
  const graph = structuredGraph();
  const organization = nodeById(graph, 'https://despachocerto.com.br/#organization');
  const logo = nodeById(graph, 'https://despachocerto.com.br/#logo');

  assert.equal(organization['@type'], 'Organization');
  assert.equal(organization.name, 'Elev Studio');
  assert.equal(organization.legalName, '62.574.201 Carlos Eduardo Filho da Conceição');
  assert.equal(organization.taxID, '62.574.201/0001-50');
  assert.equal(organization.email, 'contato@elevstudio.com.br');
  assert.equal(organization.telephone, '+55 48 99952-3175');
  assert.deepEqual(organization.logo, { '@id': 'https://despachocerto.com.br/#logo' });
  assert.equal(organization.address.addressLocality, 'Tubarão');
  assert.equal(organization.address.addressRegion, 'SC');
  assert.equal(organization.address.addressCountry, 'BR');
  assert.equal(logo['@type'], 'ImageObject');
  assert.equal(logo.url, 'https://despachocerto.com.br/despachocerto-logo-512.png');
  assert.equal(logo.width, 512);
  assert.equal(logo.height, 512);
});

test('connects the software to its publisher and brand', () => {
  const graph = structuredGraph();
  const software = nodeById(graph, 'https://despachocerto.com.br/#software');

  assert.equal(software['@type'], 'SoftwareApplication');
  assert.deepEqual(software.publisher, { '@id': 'https://despachocerto.com.br/#organization' });
  assert.deepEqual(software.brand, { '@id': 'https://despachocerto.com.br/#brand' });
  assert.equal(software.url, 'https://despachocerto.com.br/');
});

test('keeps FAQ structured data aligned with every visible question', () => {
  const graph = structuredGraph();
  const faq = nodeById(graph, 'https://despachocerto.com.br/#faq');
  const visibleQuestions = [...index.matchAll(/<details class="faq-item reveal"><summary>(.*?)<span class="faq-toggle"/g)]
    .map((match) => match[1]);
  const visibleAnswers = [...index.matchAll(/<div class="faq-answer">(.*?)<\/div><\/details>/g)]
    .map((match) => match[1]);
  const structuredQuestions = faq.mainEntity.map((item) => item.name);
  const structuredAnswers = faq.mainEntity.map((item) => item.acceptedAnswer.text);

  assert.equal(faq['@type'], 'FAQPage');
  assert.deepEqual(structuredQuestions, visibleQuestions);
  assert.deepEqual(structuredAnswers, visibleAnswers);
  assert.equal(faq.mainEntity.length, 7);
  for (const item of faq.mainEntity) {
    assert.equal(item['@type'], 'Question');
    assert.equal(item.acceptedAnswer['@type'], 'Answer');
    assert.ok(item.acceptedAnswer.text.length > 40);
  }
});
