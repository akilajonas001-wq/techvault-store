require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../backend/db');
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', '..', 'Downloads', 'analise_100_produtos_com_preco_final.txt');

function parseProducts(text) {
  const lines = text.split('\n');
  const products = [];
  let currentCat = 'Geral';
  let current = null;

  for (const raw of lines) {
    const line = raw.trim();

    if (line.startsWith('---') && line.endsWith('---')) {
      const m = line.match(/---\s*(.+?)\s*---/);
      if (m) currentCat = m[1];
      continue;
    }

    const numMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      if (current) products.push(current);
      current = { num: parseInt(numMatch[1]), name: numMatch[2].trim(), category: currentCat, cost: 0, price: 0, link: '' };
      continue;
    }

    if (current) {
      const costMatch = line.match(/Custo:\s*R\$\s*([\d.,]+)/);
      if (costMatch) current.cost = parseFloat(costMatch[1].replace('.', '').replace(',', '.'));

      const priceMatch = line.match(/Preço Final:\s*R\$\s*([\d.,]+)/);
      if (priceMatch) current.price = parseFloat(priceMatch[1].replace('.', '').replace(',', '.'));

      if (line.startsWith('Link:')) current.link = line.replace(/^Link:\s*/, '');
    }
  }
  if (current) products.push(current);
  return products;
}

const CATEGORY_MAP = {
  'CASA & ORGANIZAÇÃO': 'Casa e Organização',
  'BELEZA, CUIDADOS & BEM-ESTAR': 'Beleza e Bem-Estar',
  'ACESSÓRIOS & MODA': 'Acessórios e Moda',
  'ELETRÔNICOS & ACESSÓRIOS TECH': 'Eletrônicos',
  'FERRAMENTAS & UTILIDADES': 'Ferramentas',
  'PETS': 'Pets',
  'ESCRITÓRIO, PAPELARIA & HOBBY': 'Escritório e Papelaria',
  'MISC / CURIOSIDADES': 'Diversos'
};

function genDesc(name, cat) {
  const d = {
    'Casa e Organização': `Mantenha sua casa organizada com estilo e praticidade. ${name} é a solução ideal para quem busca otimizar espaços e manter tudo no lugar certo. Fabricado com materiais de alta qualidade e design funcional, este produto é perfeito para o dia a dia. Fácil de limpar, resistente e versátil, se adapta a diferentes ambientes da sua casa.`,
    'Beleza e Bem-Estar': `Realce sua beleza natural e cuide do seu bem-estar com ${name}. Desenvolvido com tecnologia moderna e ingredientes selecionados, oferece resultados visíveis desde a primeira aplicação. Ideal para uso diário, proporciona conforto, praticidade e aquele cuidado especial que você merece. Aproveite cada momento de autocuidado!`,
    'Acessórios e Moda': `Transforme seu visual com ${name}! Este acessório combina elegância, conforto e estilo para compor looks incríveis em qualquer ocasião. Confeccionado com materiais de alta durabilidade e acabamento impecável, é a escolha certa para quem valoriza moda sem abrir mão da qualidade. Versátil e prático, combina com diversas produções.`,
    'Eletrônicos': `Tecnologia e praticidade se encontram em ${name}. Projetado para facilitar sua rotina digital, este dispositivo possui componentes de alto desempenho e design moderno. Compatível com diversos aparelhos, oferece a conectividade e eficiência que você precisa no seu dia a dia. Perfeito para uso profissional ou pessoal.`,
    'Ferramentas': `Facilite seus reparos e projetos com ${name}. Esta ferramenta foi projetada para oferecer precisão, durabilidade e conforto durante o uso. Com acabamento robusto e materiais selecionados, é a companheira ideal para pequenos consertos, trabalhos manuais e aventuras DIY. Leve, prática e sempre pronta para usar.`,
    'Pets': `Seu pet merece o melhor, e ${name} foi feito pensando no bem-estar e felicidade dele. Produto de alta qualidade, seguro e confortável, ideal para cães e gatos de todos os portes. Proporcione mais conforto, diversão e saúde para seu companheiro com este item especialmente desenvolvido para atender às necessidades dos animais.`,
    'Escritório e Papelaria': `Aumente sua produtividade e organize seu espaço de trabalho com ${name}. Ideal para profissionais, estudantes e creativos, este produto combina funcionalidade e design para tornar sua rotina mais eficiente. Feito com materiais de qualidade, oferece durabilidade e praticidade no uso diário.`,
    'Diversos': `Descubra a versatilidade de ${name}! Um produto que reúne praticidade, design inovador e funcionalidades surpreendentes para facilitar seu dia a dia. Ideal para presentear ou para uso pessoal, agrada a todos os gostos com seu acabamento impecável e durabilidade excepcional.`
  };
  return d[cat] || `${name} é a escolha perfeita para quem busca qualidade, praticidade e bom gosto. Desenvolvido com materiais premium e design moderno, este produto atende às suas necessidades com excelência. Ideal para uso diário, oferece durabilidade e funcionalidades que fazem a diferença no seu dia a dia.`;
}

async function main() {
  const text = fs.readFileSync(FILE, 'utf8');
  const products = parseProducts(text);

  console.log(`Encontrados ${products.length} produtos no arquivo.`);

  await db.initDb();

  let created = 0;
  for (const p of products) {
    const categoria = CATEGORY_MAP[p.category] || 'Diversos';
    const descricao = genDesc(p.name, categoria);
    const preco = Math.round(p.price * 100) / 100;
    const now = Date.now();
    const id = now + Math.floor(Math.random() * 10000) + created;

    try {
      await db.createProduct({
        id,
        nome: p.name,
        descricao,
        preco,
        categoria,
        imagem: '',
        imagens: '[]',
        estoque: 'N/A',
        destaque: 0,
        paused: 1,
        precoAlterado: 0,
        precoOriginal: null,
        specs: JSON.stringify({ link_fornecedor: p.link }),
        variants: '[]',
        frete: '',
        checkoutLink: '',
        createdAt: new Date().toISOString()
      });
      created++;
      console.log(`[${created}/100] OK: ${p.name} (${categoria}) - R$ ${preco.toFixed(2)}`);
    } catch (err) {
      console.error(`ERRO ao criar "${p.name}":`, err.message);
    }
  }

  console.log(`\nConcluído! ${created} produtos criados (pausados).`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
