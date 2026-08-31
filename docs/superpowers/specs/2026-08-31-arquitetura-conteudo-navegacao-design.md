# Redesenho de Conteúdo e Navegação do Site DespachoCerto

**Data:** 31 de agosto de 2026  
**Status:** Aprovado para planejamento  
**Objetivo principal:** transformar o site em uma jornada clara de descoberta e conversão, com páginas especializadas, não redundantes e visualmente relacionadas ao trabalho do despachante.

## 1. Contexto

A página inicial atual já apresenta praticamente todo o produto. As páginas internas repetem a mesma estrutura visual e argumentativa: hero, três princípios, seis recursos, quatro etapas, uma faixa de destaque, três links relacionados e um CTA. Embora os textos mudem, a experiência permanece igual e faz cada URL parecer uma variação genérica da home.

O menu também mistura navegação global com âncoras da página inicial, esconde módulos importantes sob o rótulo amplo “Sistema” e leva o contato de volta ao formulário da home. Isso reduz orientação, cria caminhos circulares e dificulta entender por que visitar uma página interna.

## 2. Metas

- Dar a cada página uma pergunta central, um argumento e uma ação principal próprios.
- Reduzir a home a uma visão geral convincente, sem recontar todas as páginas internas.
- Tornar módulos e temas encontráveis no cabeçalho em desktop e mobile.
- Mostrar o produto com interfaces e situações reconhecíveis para um despachante.
- Manter identidade, desempenho, acessibilidade, consentimento e fundamentos de SEO existentes.
- Preservar afirmações responsáveis, sem criar métricas, depoimentos ou integrações inexistentes.

## 3. Fora do escopo

- Alterações no produto `app.despachocerto.com.br`.
- Criação de planos ou preços que ainda não foram definidos comercialmente.
- Publicação de depoimentos ou resultados não autorizados.
- Divulgação da Ohana Consultoria nesta versão.
- Mudança da infraestrutura de leads, Supabase, Resend ou Turnstile, além da transferência do formulário para `/contato`.

## 4. Arquitetura de informação

### Navegação principal

1. **Início** → `/`
2. **Produto** → menu com:
   - Visão geral → `/sistema-para-despachante`
   - Ordens de serviço → `/ordem-de-servico-para-despachante`
   - Financeiro → `/controle-financeiro-para-despachante`
   - Documentos → `/gestao-de-documentos`
   - Integrações → `/integracoes`
3. **Segurança** → `/seguranca`
4. **Preços** → `/precos`
5. **Conteúdo** → menu com:
   - Sobre o DespachoCerto → `/sobre`
   - Blog → `/blog`
6. **Agendar demonstração** → `/contato`

O item “Clientes” não será exibido enquanto não houver autorização para publicar um caso. O contato será representado pelo CTA principal, sem item duplicado dentro de outro menu.

### Comportamento do menu

- Desktop: menus “Produto” e “Conteúdo” abrem por botão, permanecem acessíveis por teclado e fecham com Escape, clique externo ou escolha de destino.
- Mobile: um painel único apresenta seções expansíveis para Produto e Conteúdo, com todos os destinos em uma coluna legível.
- A página ativa aparece destacada. Páginas de módulos também mantêm “Produto” identificado como grupo ativo.
- O cabeçalho usa a mesma arquitetura em todas as páginas públicas.
- Breadcrumbs permanecem nas páginas internas, mas não substituem a navegação global.

## 5. Papel de cada página

### Home

**Pergunta:** “O DespachoCerto é adequado para o meu escritório?”  
**Papel:** posicionar o produto, reconhecer os principais problemas da rotina, apresentar uma visão compacta dos módulos e direcionar cada intenção à página correta.  
**Assinatura visual:** uma visão operacional do dia com OS prioritárias, documentos pendentes e valores a receber.  
**CTA:** “Agendar uma demonstração”.  
**Remoções:** explicações extensas de cada módulo, formulário completo e blocos que já serão aprofundados em páginas especializadas.

### Sistema para despachante

**Pergunta:** “Como as partes do sistema trabalham juntas?”  
**Papel:** ser o mapa da plataforma, explicar o fluxo entre cliente, veículo, OS, documentos, equipe e financeiro.  
**Assinatura visual:** mapa interativo da plataforma; selecionar um módulo destaca quais dados entram, o que ele controla e quais módulos recebem o resultado.  
**CTA:** “Ver o sistema com uma OS real”.

### Ordens de serviço

**Pergunta:** “Como acompanho um processo sem depender da memória da equipe?”  
**Papel:** mostrar a OS como centro operacional, da abertura ao encerramento.  
**Assinatura visual:** linha do tempo detalhada de uma OS fictícia, com mudança de responsável, documento pendente, prazo, comunicação e pagamento.  
**Copy:** usar situações concretas, como retorno esquecido, troca de responsável e busca por placa.  
**CTA:** “Montar uma OS na demonstração”.

### Controle financeiro

**Pergunta:** “Como saber o que entrou, o que falta receber e quanto cada serviço deixou?”  
**Papel:** separar venda, pagamento, custo de terceiros, saldo e margem sem prometer contabilidade completa.  
**Assinatura visual:** livro de movimentações de uma OS com fechamento explicado linha a linha e visão consolidada do período.  
**Copy:** abordar conferência de caixa, custo pago por fora, recebimentos parciais e lucro bruto.  
**CTA:** “Ver o fechamento de uma OS”.

### Gestão de documentos

**Pergunta:** “Como saber o que chegou, o que falta e onde o arquivo foi guardado?”  
**Papel:** mostrar checklist, anexos, origem, contexto, permissões e recuperação.  
**Assinatura visual:** mesa de conferência documental com estados “pendente”, “recebido” e “conferido”, vinculados a cliente, veículo ou OS.  
**CTA:** “Montar um checklist de documentos”.

### Integrações

**Pergunta:** “Com o que o sistema se conecta hoje e do que cada conexão depende?”  
**Papel:** reduzir expectativa incorreta e explicar disponibilidade técnica e institucional.  
**Assinatura visual:** matriz de integração com estados “disponível”, “depende de fornecedor”, “depende de credenciamento” e “sob análise”.  
**Copy:** diferenciar consulta, importação, automação e simples registro manual.  
**CTA:** “Avaliar uma integração do escritório”.

### Segurança

**Pergunta:** “Como clientes, documentos e valores ficam separados e quem pode acessar?”  
**Papel:** funcionar como um centro de confiança do produto.  
**Assinatura visual:** diagrama de camadas entre usuário, perfil, empresa, dados e arquivos; tabela clara de responsabilidades entre DespachoCerto e empresa cliente.  
**CTA:** “Conversar sobre segurança e implantação”.

### Preços

**Pergunta:** “Como o investimento é formado e o que preciso informar para receber uma proposta?”  
**Papel:** explicar composição e processo comercial, mesmo antes de existir tabela pública de planos.  
**Assinatura visual:** configurador explicativo, sem calcular preço fictício, mostrando impacto de usuários, armazenamento, migração, implantação e integrações.  
**CTA:** “Solicitar demonstração e proposta”.

### Sobre

**Pergunta:** “Quem está por trás do produto e por que ele existe?”  
**Papel:** apresentar origem, relação com a Elev Studio, princípios de produto e compromisso com o setor.  
**Assinatura visual:** narrativa editorial curta com marcos reais do desenvolvimento, sem usar a Ohana como prova pública.  
**CTA:** “Conhecer o sistema”.

### Contato

**Pergunta:** “O que acontece depois que eu pedir uma demonstração?”  
**Papel:** concentrar conversão e eliminar o redirecionamento circular para a home.  
**Assinatura visual:** formulário completo ao lado de uma agenda clara da conversa: diagnóstico, demonstração, dúvidas e próximos passos.  
**CTA:** envio do próprio formulário com “Preparar minha demonstração”.

## 6. Página da Ohana

A rota `/clientes/ohana-consultoria` deixará de ser pública nesta versão.

- Remover do sitemap, navegação, rodapé, dados estruturados e links relacionados.
- Retirar o arquivo da saída publicada para que a rota responda 404 na produção atual.
- Preservar o conteúdo no repositório em uma área de rascunhos ignorada pela Vercel.
- Não usar nome, serviços, logo, participação ou contexto da Ohana em nenhuma outra página pública.
- A futura publicação exigirá autorização e uma revisão específica do conteúdo.

## 7. Sistema visual

### Paleta

- **Azul Registro** `#0B3454`: confiança, cabeçalhos e superfícies estruturais.
- **Azul Ação** `#155A9C`: comandos, links e estados ativos.
- **Ciano Sinal** `#38BFE8`: direção, seleção e fluxo.
- **Verde Conferido** `#17745B`: conclusão, recebimento e resultado positivo.
- **Coral Pendência** `#C94F3D`: bloqueio, custo ou documento pendente.
- **Papel Frio** `#F5F8FA`: base neutra inspirada em fichas e documentos administrativos.

As cores funcionais aparecem juntas nas interfaces. Nenhuma página será dominada apenas por variações de azul.

### Tipografia

- **Archivo:** títulos e chamadas, relacionando a identidade à linguagem de formulários, registros e documentação.
- **Inter:** navegação, texto corrido e controles.
- **UI monospace do sistema:** placas, IDs de OS, valores e estados técnicos.

Tamanhos serão definidos por faixa responsiva, sem escalar tipografia diretamente com a largura do viewport.

### Assinatura compartilhada

Cada página abre com uma demonstração funcional do assunto, não com a mesma janela genérica renomeada. Elementos recorrentes do sistema, como OS, placa, responsável, pendência e valor, criam familiaridade entre páginas sem repetir composição.

O risco visual escolhido é tratar dados operacionais como material editorial: números, carimbos de estado, linhas de registro e relações entre documentos formam a identidade visual, sem imitar literalmente papel ou criar uma estética burocrática pesada.

## 8. Direção de copy

- Tom profissional, direto e próximo da rotina do despachante.
- Uma promessa central por página.
- Benefícios demonstrados por situações, não por adjetivos genéricos.
- Verbos e termos reconhecíveis: abrir OS, conferir documento, cobrar saldo, registrar custo, trocar responsável, localizar por placa.
- Evitar “centralize”, “otimize”, “transforme sua gestão” e outras frases que serviriam para qualquer software.
- Não fabricar estatísticas, depoimentos, integrações, garantias ou resultados.
- CTAs descrevem o que será visto ou preparado na demonstração.
- Links de continuação serão escolhidos pelo contexto da página, sem repetir a seção genérica “Continue explorando” em todas as URLs.

## 9. Componentes e implementação

- Criar cabeçalho e rodapé visualmente consistentes para home e páginas internas.
- Criar navegação desktop com menus acessíveis e navegação mobile com grupos expansíveis.
- Manter HTML estático, CSS e JavaScript sem introduzir framework novo.
- Criar componentes visuais reutilizáveis apenas para padrões reais: shell de produto, identificador de OS, status, valor e CTA.
- Permitir composições específicas por página em vez de um único template rígido.
- Transferir o formulário e sua integração existente para `/contato`, preservando IDs, Turnstile, validação, Supabase, Resend e eventos de conversão.
- A home direciona para `/contato` e não mantém um segundo formulário.

## 10. SEO e mensuração

- Manter URLs e intenção principal das páginas atuais.
- Reescrever títulos, descrições, H1 e conteúdo para reduzir sobreposição semântica.
- Manter breadcrumbs, canonical, sitemap e dados estruturados coerentes.
- Atualizar links internos para refletir a nova arquitetura.
- Preservar eventos de CTA e `generate_lead`, adicionando identificadores específicos por página e intenção.
- Remover a Ohana do índice e da saída publicada.

## 11. Acessibilidade, responsividade e desempenho

- Menu operável por teclado, com foco visível, Escape, `aria-expanded` e sem conteúdo focável quando fechado.
- Alvos de toque com pelo menos 44 px.
- Controles semânticos: botão para abrir menus, links para navegar.
- Títulos hierárquicos, skip link, breadcrumbs e âncoras sem encobrimento pelo cabeçalho.
- Estados e informações não dependem apenas de cor.
- Respeitar `prefers-reduced-motion`.
- Garantir texto sem sobreposição em 360 px, 768 px, 1280 px e 1440 px.
- Manter Analytics e Clarity bloqueados antes do consentimento.
- Preservar metas de Lighthouse e evitar que as novas demonstrações aumentem de forma relevante LCP, TBT ou CLS.

## 12. Critérios de aceite

1. A navegação global é idêntica e compreensível em todas as páginas públicas.
2. Produto e Conteúdo funcionam por mouse, toque e teclado.
3. Cada página possui estrutura, visual, promessa e CTA próprios.
4. Nenhuma página repete integralmente a argumentação da home.
5. O formulário funciona diretamente em `/contato` e não depende de redirecionamento para a home.
6. A rota pública da Ohana deixa de existir e não aparece em sitemap ou links.
7. Todos os testes existentes e novos testes de navegação, SEO, consentimento e conversão passam.
8. As páginas são verificadas visualmente em desktop e mobile.
9. Lighthouse mantém acessibilidade, boas práticas e SEO em nível excelente, sem regressão importante de desempenho.

