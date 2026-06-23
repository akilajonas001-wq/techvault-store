const fs = require('fs');
const path = require('path');

const margens = {
  'Celulares e Smartphones': 0.15,
  'Informática': 0.20,
  'Moda e Vestuário': 0.50,
  'Esportes e Fitness': 0.35,
  'Casa e Decoração': 0.40,
  'Cozinha e Utensílios': 0.40,
  'Livros e Papelaria': 0.30,
  'Eletrônicos': 0.20,
  'Móveis': 0.35,
  'Beleza e Perfumaria': 0.45,
  'Games': 0.20,
  'Eletrodomésticos': 0.20
};

const PICPAY_FEE = 0.0099;
const TAX_RATE = 0.06;
const DIVISOR = 1 - PICPAY_FEE - TAX_RATE;

function calcPreco(custo, categoria) {
  const margem = margens[categoria] || 0.20;
  return Math.round((custo * (1 + margem)) / DIVISOR);
}

// Produtos removidos (só disponíveis no exterior)
const REMOVER_IDS = [241, 252, 258, 259];

// Correção dos custos para preço médio brasileiro (revenda)
const custosBrasil = {
  // === CELULARES ===
  242: 2599,    // Realme 12 Pro+ - preço médio ML/Amazon BR
  243: 1999,    // Xiaomi Redmi Note 14 Pro - disponível lojas BR
  244: 1799,    // Samsung Galaxy M55 - mercadobr
  245: 2199,    // Motorola Edge 50 Fusion - Motorola no BR
  246: 7999,    // iPhone 17 - apple BR preço premium
  247: 5299,    // Google Pixel 10 - importado via ML
  248: 6299,    // ASUS ROG Phone 9 - ASUS Brasil
  249: 4999,    // Xiaomi 15 - Xiaomi Brasil
  250: 3799,    // Samsung Galaxy S25 FE - Samsung Brasil
  251: 5499,    // OnePlus 13 - importado via ML
  253: 5999,    // Motorola Razr 60 - Motorola Brasil
  254: 1399,    // Samsung Galaxy A16 5G - Samsung Brasil
  255: 1899,    // Xiaomi Poco X7 Pro - Xiaomi Brasil
  256: 999,     // Realme C75 - Realme Brasil
  257: 1699,    // Samsung Galaxy F55 - Samsung Brasil
  260: 1199,    // TCL 40 NXTPAPER - TCL Brasil

  // === INFORMÁTICA ===
  261: 5499,    // Dell Inspiron 16 - Dell Brasil
  262: 3799,    // Lenovo IdeaPad 3 - Lenovo Brasil
  263: 5999,    // Acer Nitro 5 - Acer Brasil
  264: 6999,    // ASUS ZenBook 14 OLED - ASUS Brasil
  265: 15999,   // MacBook Pro M4 - Apple Brasil
  266: 4299,    // HP Pavilion 15 - HP Brasil
  267: 3799,    // Desktop Intel i5 - mercado BR
  268: 5999,    // All-in-One Dell 27" - Dell Brasil
  269: 2699,    // Monitor Dell 27" 4K - Dell Brasil
  270: 999,     // Teclado Corsair K70 - Corsair no BR
  271: 169,     // Mousepad RGB XXL - mercado BR
  272: 449,     // Razer DeathAdder V3 - Razer Brasil
  273: 1399,    // SSD Samsung 990 Pro 2TB - Samsung Brasil
  274: 749,     // HD Externo WD 5TB - WD Brasil
  275: 7999,    // RTX 5070 Ti - NVIDIA parceiras BR
  276: 749,     // Fonte Cooler Master 850W - CM Brasil
  277: 649,     // Gabinete Corsair 4000D - Corsair Brasil
  278: 8999,    // Samsung Galaxy Book 3 Ultra - Samsung Brasil
  279: 3299,    // Intel NUC 13 Pro - Intel Brasil
  280: 899,     // TP-Link Deco X60 - TP-Link Brasil

  // === MODA ===
  281: 219,     // Camiseta Lacoste - Lacoste Brasil
  282: 269,     // Vestido Zara - Zara Brasil
  283: 549,     // New Balance 574 - NB Brasil
  284: 429,     // Puma Suede - Puma Brasil
  285: 199,     // Calça Sarja - mercado BR
  286: 329,     // Jaqueta Jeans - mercado BR
  287: 379,     // Blazer Slim - mercado BR
  288: 329,     // Bolsa Tote - mercado BR
  289: 749,     // Ray-Ban Aviator - Ray-Ban Brasil
  290: 379,     // Casio G-Shock - Casio Brasil
  291: 329,     // Tommy Hilfiger - Tommy Brasil
  292: 149,     // Shorts Jeans - mercado BR
  293: 219,     // Macacão - mercado BR
  294: 379,     // Vans Old Skool - Vans Brasil
  295: 119,     // Sandália Rasteira - mercado BR
  296: 199,     // Mochila Jansport - Jansport Brasil
  297: 149,     // Carteira Couro - mercado BR
  298: 59,      // Meia Social Kit - mercado BR
  299: 169,     // Pijama Seda - mercado BR
  300: 149,     // Biquíni Salinas - mercado BR

  // === ESPORTES ===
  301: 329,     // Kit Anilhas 20kg - mercado BR
  302: 169,     // Barra Fixa - mercado BR
  303: 59,      // Corda Speed - mercado BR
  304: 79,      // Luvas Academia - mercado BR
  305: 99,      // Caneleira 3kg - mercado BR
  306: 59,      // Faixa Elástica - mercado BR
  307: 89,      // Roupão Microfibra - mercado BR
  308: 79,      // Bolsa Térmica - mercado BR
  309: 99,      // Creatina 300g - mercado BR
  310: 89,      // Pré-Treino 300g - mercado BR
  311: 69,      // Barra Proteína 12un - mercado BR
  312: 35,      // Coqueteleira - mercado BR
  313: 109,     // Tapete Yoga - mercado BR
  314: 89,      // Bola Pilates - mercado BR
  315: 49,      // Elástico Tubo - mercado BR
  316: 45,      // Tornozeleira - mercado BR
  317: 329,     // Caixa CrossFit - mercado BR
  318: 169,     // Kit Yoga - mercado BR
  319: 649,     // Bicicleta Infantil - mercado BR
  320: 229,     // Patins Infantil - mercado BR

  // === CASA ===
  321: 99,      // Luminária Mesa LED - mercado BR
  322: 149,     // Tapete Felpudo - mercado BR
  323: 79,      // Vaso Decorativo - mercado BR
  324: 169,     // Kit Quadros 3pç - mercado BR
  325: 49,      // Almofada Bordada - mercado BR
  326: 99,      // Cortina Romana - mercado BR
  327: 169,     // Espelho Oval - mercado BR
  328: 89,      // Prateleira Flutuante - mercado BR
  329: 59,      // Cesto Palha - mercado BR
  330: 109,     // Jardim Vertical - mercado BR
  331: 149,     // Abajur Pendente - mercado BR
  332: 89,      // Manta Sofá - mercado BR
  333: 219,     // Porta-Retrato Digital - mercado BR
  334: 49,      // Vaso Autoirrigável - mercado BR
  335: 79,      // Luminária Parede - mercado BR
  336: 379,     // Cadeira Balanço - mercado BR
  337: 219,     // Mesa Lateral - mercado BR
  338: 99,      // Nicho Hexagonal - mercado BR
  339: 35,      // Mini Vaso Kit - mercado BR
  340: 59,      // Kit Velas - mercado BR

  // === COZINHA ===
  341: 169,     // Jogo Facas 6pç - mercado BR
  342: 149,     // Panela Arroz - mercado BR
  343: 89,      // Mixer 500W - mercado BR
  344: 79,      // Jarra Elétrica - mercado BR
  345: 229,     // Panelas Antiaderentes - mercado BR
  346: 119,     // Faqueiro 24pç - mercado BR
  347: 99,      // Jogo Pratos - mercado BR
  348: 79,      // Taças Vinho - mercado BR
  349: 25,      // Medidores - mercado BR
  350: 35,      // Peneira - mercado BR
  351: 25,      // Descanso Panela - mercado BR
  352: 35,      // Abridor Garrafas - mercado BR
  353: 49,      // Pilão Madeira - mercado BR
  354: 35,      // Rolo Massa - mercado BR
  355: 45,      // Espátula Silicone - mercado BR
  356: 35,      // Saco Confeitar - mercado BR
  357: 35,      // Fôrma Bolo - mercado BR
  358: 59,      // Tigela Vidro - mercado BR
  359: 49,      // Escorredor - mercado BR
  360: 59,      // Pote Hermético - mercado BR

  // === LIVROS ===
  361: 44,      // Biblioteca Meia-Noite - mercado BR
  362: 44,      // Verity - mercado BR
  363: 39,      // Tudo é Rio - mercado BR
  364: 34,      // Homem Mais Rico - mercado BR
  365: 39,      // Mente Milionária - mercado BR
  366: 49,      // Hábitos Atômicos - mercado BR
  367: 39,      // Poder do Agora - mercado BR
  368: 219,     // Box HP 7 livros - mercado BR
  369: 99,      // Box Sherlock - mercado BR
  370: 109,     // Box Jogos Vorazes - mercado BR
  371: 69,      // Agenda 2027 - mercado BR
  372: 25,      // Bloco Notas - mercado BR
  373: 19,      // Canetas 10 cores - mercado BR
  374: 22,      // Marcador Texto - mercado BR
  375: 35,      // Fichário - mercado BR
  376: 169,     // Mochila Universitária - mercado BR
  377: 35,      // Estojo - mercado BR
  378: 79,      // Caderno Inteligente - mercado BR
  379: 35,      // Sulfite A4 500fl - mercado BR
  380: 69,      // Calculadora CASIO - mercado BR

  // === ELETRÔNICOS ===
  381: 999,     // Soundbar Samsung - Samsung Brasil
  382: 1699,    // Home Theater LG - LG Brasil
  383: 1799,    // Projetor Full HD - mercado BR
  384: 649,     // JBL Flip 6 - JBL Brasil
  385: 549,     // JBL 660NC - JBL Brasil
  386: 329,     // Edifier W820NB - Edifier Brasil
  387: 999,     // Amazfit T-Rex 3 - Amazfit Brasil
  388: 279,     // Mi Band 10 - Xiaomi Brasil
  389: 3599,    // Canon EOS R100 - Canon Brasil
  390: 4999,    // Sony ZV-1 II - Sony Brasil
  391: 7999,    // DJI Mini 5 - DJI Brasil
  392: 89,      // Carregador Wireless - mercado BR
  393: 229,     // Power Bank Anker - Anker Brasil
  394: 49,      // Adaptador BT 5.3 - mercado BR
  395: 169,     // Hub USB-C 9 em 1 - mercado BR
  396: 59,      // Smart Plug - mercado BR
  397: 49,      // Lâmpada RGB - mercado BR
  398: 1499,    // Echo Studio - Amazon Brasil
  399: 449,     // Fire TV Stick 4K - Amazon Brasil
  400: 379,     // JBL Tune 720BT - JBL Brasil

  // === MÓVEIS ===
  401: 1699,    // Sofá-Cama 2L - mercado BR
  402: 399,     // Mesa Cabeceira - mercado BR
  403: 2299,    // Armário Cozinha - mercado BR
  404: 349,     // Prateleira Industrial - mercado BR
  405: 229,     // Banco Alto - mercado BR
  406: 1499,    // Poltrona Leitura - mercado BR
  407: 1499,    // Mesa L Shape - mercado BR
  408: 549,     // Gaveteiro - mercado BR
  409: 999,     // Painel TV - mercado BR
  410: 649,     // Mesa Centro - mercado BR
  411: 899,     // Aparador - mercado BR
  412: 399,     // Cadeira Jantar - mercado BR
  413: 349,     // Carrinho Chá - mercado BR
  414: 99,      // Cabideiro Chão - mercado BR
  415: 229,     // Espelho Corpo Inteiro - mercado BR
  416: 279,     // Baú Organizador - mercado BR
  417: 999,     // Cama Box Solteiro - mercado BR
  418: 1699,    // Colchão Ortopédico - mercado BR
  419: 1099,    // Colchão D33 - mercado BR
  420: 349,     // Mesa Piquenique - mercado BR

  // === BELEZA ===
  421: 549,     // Invictus Paco Rabanne - mercado BR
  422: 649,     // Miss Dior - mercado BR
  423: 649,     // Sauvage Dior - mercado BR
  424: 549,     // La Vie Est Belle - mercado BR
  425: 379,     // 212 NYC Men - mercado BR
  426: 499,     // Bad Boy Carolina - mercado BR
  427: 169,     // Kit Maquiagem 20pç - mercado BR
  428: 35,      // Base Vult - mercado BR
  429: 25,      // Corretivo - mercado BR
  430: 35,      // Pó Compacto - mercado BR
  431: 29,      // Rímel - mercado BR
  432: 15,      // Lápis Olho - mercado BR
  433: 29,      // Blush Líquido - mercado BR
  434: 35,      // Iluminador - mercado BR
  435: 49,      // Kit Pincéis - mercado BR
  436: 29,      // Demaquilante - mercado BR
  437: 35,      // Esfoliante - mercado BR
  438: 25,      // Máscara Facial - mercado BR
  439: 79,      // Sérum Vitamina C - mercado BR
  440: 35,      // Hidratante Nivea - mercado BR

  // === GAMES ===
  441: 4499,    // Nintendo Switch 2 - Nintendo Brasil
  442: 3799,    // PS VR2 - Sony Brasil
  443: 999,     // Xbox Elite 2 - Microsoft Brasil
  444: 549,     // Pro Switch - Nintendo Brasil
  445: 279,     // Elden Ring PS5 - mercado BR
  446: 379,     // Spider-Man 3 PS5 - mercado BR
  447: 329,     // God of War Ragnarok - mercado BR
  448: 229,     // Halo Infinite Xbox - mercado BR
  449: 329,     // Forza Horizon 6 - mercado BR
  450: 379,     // Mario Wonder 2 - mercado BR
  451: 1699,    // Astro A50 - mercado BR
  452: 799,     // Logitech G Pro X - Logitech Brasil
  453: 1099,    // Razer Huntsman - Razer Brasil
  454: 2799,    // Monitor 27" 240Hz - mercado BR
  455: 1299,    // Mesa Gamer RGB - mercado BR
  456: 229,     // Suporte Monitor - mercado BR
  457: 2299,    // DXRacer Master - mercado BR
  458: 200,     // Cartão PS Store - mercado BR
  459: 200,     // Cartão Xbox - mercado BR
  460: 99,      // Mouse Bungee - mercado BR

  // === ELETRODOMÉSTICOS ===
  461: 3999,    // Geladeira Inverse 420L - Electrolux BR
  462: 1999,    // Fogão 4 Bocas - Electrolux BR
  463: 799,     // Micro-ondas 30L Panasonic - Panasonic BR
  464: 2799,    // Lava-Louças 8 serv - Brastemp BR
  465: 3299,    // Secadora 10kg Samsung - Samsung BR
  466: 699,     // Centrífuga 8kg - mercado BR
  467: 229,     // Ventilador Coluna - mercado BR
  468: 449,     // Climatizador - mercado BR
  469: 549,     // Purificador Ar - mercado BR
  470: 169,     // Umidificador - mercado BR
  471: 229,     // Liquidificador 1200W - mercado BR
  472: 449,     // Batedeira Planetária - mercado BR
  473: 349,     // Processador Alimentos - mercado BR
  474: 179,     // Panela Arroz 5L - mercado BR
  475: 279,     // Fogão Elétrico - mercado BR
  476: 349,     // Grill Elétrico - mercado BR
  477: 449,     // Churrasqueira Elétrica - mercado BR
  478: 549,     // Air Fryer 8L - Mondial BR
  479: 149,     // Iogurteira - mercado BR
  480: 349,     // Máquina Pão - mercado BR
};

// ===== CARREGAR PRODUTOS ATUAIS =====
const productsPath = path.join(__dirname, '../backend/data/products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

console.log(`📦 Carregados ${products.length} produtos atuais`);

// ===== REMOVER PRODUTOS SÓ DISPONÍVEIS NO EXTERIOR =====
const filtrados = products.filter(p => !REMOVER_IDS.includes(p.id));
console.log(`🗑️  Removidos ${products.length - filtrados.length} produtos (IDs: ${REMOVER_IDS.join(', ')})`);

// ===== ATUALIZAR PREÇOS DOS NOVOS PRODUTOS COM CUSTO BR =====
let atualizados = 0;
let idsAtualizados = [];

for (const p of filtrados) {
  if (custosBrasil[p.id]) {
    const custoBr = custosBrasil[p.id];
    const novoPreco = calcPreco(custoBr, p.categoria);
    if (novoPreco !== p.preco) {
      idsAtualizados.push(p.id);
      p.preco = novoPreco;
      atualizados++;
    }
  }
}

console.log(`💰 Preços recalculados para ${atualizados} produtos (IDs: ${idsAtualizados.join(', ')})`);

// ===== SALVAR =====
fs.writeFileSync(productsPath, JSON.stringify(filtrados, null, 2), 'utf-8');
console.log(`💾 Arquivo salvo: ${productsPath}`);
console.log(`📊 Total final: ${filtrados.length} produtos`);

// ===== RESUMO =====
const sumario = {};
for (const p of filtrados) {
  sumario[p.categoria] = (sumario[p.categoria] || 0) + 1;
}
console.log('\n📊 Resumo por categoria:');
for (const [cat, qtd] of Object.entries(sumario)) {
  console.log(`   ${cat}: ${qtd} produtos`);
}

// ===== AMOSTRA DE PREÇOS =====
console.log('\n📋 Amostra de preços recalculados:');
const amostraIds = [241, 246, 261, 265, 281, 301, 341, 361, 381, 401, 421, 441, 461];
for (const id of amostraIds) {
  const p = filtrados.find(x => x.id === id);
  if (p) console.log(`   ${p.id}. ${p.nome}: R$ ${p.preco}`);
}
