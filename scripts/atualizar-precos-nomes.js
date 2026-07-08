const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const match = envContent.match(/DATABASE_URL=(.+)/);
const url = match[1].trim();

const pool = new Pool({ connectionString: url.replace(':5432', ':6543'), ssl: { rejectUnauthorized: false }, max: 2 });

const FATOR_CARTAO = 1.53;
const FATOR_PIX = 1.41;
const PRECO_ORIGINAL_FATOR = 1.15;

const produtos = [
  { nome: "Organizador de gavetas com divisórias ajustáveis", nomeNovo: "Kit Organizador de Gavetas com Divisórias Ajustáveis - Acrimet (7 Peças)", custo: 75.10 },
  { nome: "Suporte para rolo de papel toalha de parede (adesivo)", nomeNovo: "Suporte Adesivo para Papel Toalha - Inox Escovado (Sem Furos)", custo: 49.28 },
  { nome: "Suporte adesivo para celular na cozinha (com receitas)", nomeNovo: "Suporte Adesivo para Celular Tomate - Cozinha com Base Giratória", custo: 42.82 },
  { nome: "Kit de unhas em gel UV (lâmpada + esmaltes)", nomeNovo: "Kit Completo Unhas em Gel UV LED - Lâmpada 48W + 6 Esmaltes", custo: 171.94 },
  { nome: "Difusor de óleos essenciais ultrassônico portátil", nomeNovo: "Difusor Ultrassônico de Óleos Essenciais - 100ml com LED", custo: 96.62 },
  { nome: "Tornozeleira de compressão para alívio de dor", nomeNovo: "Tornozeleira de Compressão Elástica - Alívio de Dor e Suporte", custo: 70.80 },
  { nome: "Tampa de silicone universal para potes", nomeNovo: "Kit Tampa de Silicone Universal para Potes - 6 Tamanhos", custo: 32.06 },
  { nome: "Lâmpada de sal do Himalaia (pequena)", nomeNovo: "Lâmpada de Sal do Himalaia - Pequena 2kg com LED", custo: 96.62 },
  { nome: "Cushion de gel para joelhos", nomeNovo: "Almofada de Gel para Joelhos - Yoga e Alongamento", custo: 85.86 },
  { nome: "Kit de etiquetas adesivas para organização", nomeNovo: "Kit Etiquetas Adesivas Organização - 300 unidades Sortidas", custo: 42.82 },
  { nome: "Escova de dentes elétrica recarregável", nomeNovo: "Escova de Dentes Elétrica Sônica Recarregável - 5 Modos", custo: 118.14 },
  { nome: "Fita adesiva para lifting facial instantâneo", nomeNovo: "Fita Adesiva para Lifting Facial Instantâneo - 60 Unidades", custo: 42.82 },
  { nome: "Aspirador de mão portátil recarregável (mini)", nomeNovo: "Aspirador Portátil Recarregável - Mini 6000Pa Sem Fio", custo: 171.94 },
  { nome: "Tapete antiderrapante para banheiro", nomeNovo: "Tapete Antiderrapante para Banheiro com Ventosas - 40x80cm", custo: 60.04 },
  { nome: "Pote hermético a vácuo para alimentos", nomeNovo: "Pote Hermético a Vácuo para Alimentos - 1L com Tampa", custo: 85.86 },
  { nome: "Cinto reversível de couro sintético", nomeNovo: "Cinto Reversível Couro Sintético Dupla Face - 2 Cores", custo: 85.86 },
  { nome: "Kit de meias invisíveis antiderrapantes (5 pares)", nomeNovo: "Kit Meias Invisíveis Antiderrapantes - 5 Pares Algodão", custo: 42.82 },
  { nome: "Carteira inteligente com bloqueio RFID", nomeNovo: "Carteira Inteligente com Bloqueio RFID - Couro Sintético", custo: 96.62 },
  { nome: "Anel ajustável de aço inoxidável (vários modelos)", nomeNovo: "Kit Anéis Ajustáveis Aço Inoxidável - 5 Modelos", custo: 32.06 },
  { nome: "Bolsa transversal minimalista em couro sintético", nomeNovo: "Bolsa Transversal Minimalista Couro Sintético - 3 Cores", custo: 139.66 },
  { nome: "Canivete multifuncional 12 em 1 (cartão de crédito)", nomeNovo: "Canivete Multifuncional 12 em 1 - Formato Cartão de Crédito", custo: 70.80 },
  { nome: "Escorredor de louça dobrável de silicone", nomeNovo: "Escorredor de Louça Dobrável Silicone - Expansível", custo: 64.34 },
  { nome: "Espelho de maquiagem com LED e zoom 10x", nomeNovo: "Espelho de Maquiagem com LED 10x Zoom - Recarregável USB", custo: 139.66 },
  { nome: "Hub USB-C 6 em 1 (leitor de cartão + HDMI + USB)", nomeNovo: "Hub USB-C 6 em 1 Multifuncional - HDMI 4K + USB 3.0", custo: 139.66 },
  { nome: "Frasco squeeze para óleo de cozinha (com bico dosador)", nomeNovo: "Squeeze para Óleo de Cozinha - 300ml com Bico Dosador", custo: 42.82 },
  { nome: "Fechadura digital com impressão digital (porta)", nomeNovo: "Fechadura Digital Biométrica - Impressão Digital + Senha", custo: 204.22 },
  { nome: "Bijuterias douradas/fosco - kit de argolas e brincos", nomeNovo: "Kit Bijuterias Douradas - Argolas e Brincos Hipoalergênicos", custo: 49.28 },
  { nome: "Relógio digital feminino (modelo fashion)", nomeNovo: "Relógio Digital Feminino Fashion - Pulseira Silicone", custo: 107.38 },
  { nome: "Cabide magnético para eletrodomésticos", nomeNovo: "Cabide Magnético Ultraforte - Suporta 3kg", custo: 53.58 },
  { nome: "Hidratante labial colorido (gloss com efeito)", nomeNovo: "Hidratante Labial Colorido Gloss - Vitamina E 5ml", custo: 32.06 },
  { nome: "Escova alisadora de cabelo elétrica portátil", nomeNovo: "Escova Alisadora Elétrica Portátil - Cerâmica Íons Negativos", custo: 161.18 },
  { nome: "Fone Bluetooth 5.3 (cápsula/mini)", nomeNovo: "Fone Bluetooth 5.3 Mini TWS - Estojo Carregador LED", custo: 96.62 },
  { nome: "Lixeira automática com sensor (infravermelho)", nomeNovo: "Lixeira Automática com Sensor Infravermelho - 8L", custo: 279.55 },
  { nome: "Amaciante de roupas em folha reutilizável", nomeNovo: "Folhas Amaciantes Reutilizáveis - 100 Lavagens", custo: 60.04 },
  { nome: "Post-it adesivo transparente (reposicionável)", nomeNovo: "Bloco Post-it Transparente Reposicionável - 100 Folhas", custo: 32.06 },
  { nome: "Luz de leitura com clip (recarregável)", nomeNovo: "Luz de Leitura LED Recarregável com Clip - 3 Intensidades", custo: 60.04 },
  { nome: "Modelador de cílios aquecido", nomeNovo: "Modelador de Cílios Aquecido Elétrico - Curvatura 24h", custo: 64.34 },
  { nome: "Suporte de notebook articulado dobrável", nomeNovo: "Suporte Articulado Dobrável para Notebook - Alumínio", custo: 139.66 },
  { nome: "Manta de massagem com aquecimento", nomeNovo: "Manta Elétrica de Massagem com Aquecimento - Relaxante", custo: 214.98 },
  { nome: "Kit de lâminas de barbear com cabeça giratória", nomeNovo: "Kit Lâminas de Barbear Cabeça Giratória - 8 Unidades + Cabo", custo: 60.04 },
  { nome: "Lanterna recarregável tipo caneta", nomeNovo: "Lanterna Recarregável Tipo Caneta - LED 200 Lúmens", custo: 60.04 },
  { nome: "Kit de canetas coloridas com brush pen", nomeNovo: "Kit Canetas Brush Pen Coloridas - 12 Cores", custo: 70.80 },
  { nome: "Pano de microfibra que seca sem risco", nomeNovo: "Kit Panos de Microfibra Premium - 5 Unidades 40x40cm", custo: 42.82 },
  { nome: "Carregador sem fio rápido (wireless pad)", nomeNovo: "Carregador Wireless Pad - 15W Carregamento Rápido Qi", custo: 107.38 },
  { nome: "Rolo de jade ou gua sha massageador facial", nomeNovo: "Kit Massageador Facial - Rolo de Jade + Gua Sha", custo: 60.04 },
  { nome: "Kit de escovação dental para pets", nomeNovo: "Kit Escovação Dental para Pets - Escova + Pasta sabor Carne", custo: 60.04 },
  { nome: "Toalha de microfibra para cabelo (toalha turbante)", nomeNovo: "Toalha Turbante Microfibra para Cabelo - Secagem Rápida", custo: 53.58 },
  { nome: "Máscara de LED facial portátil (acne/rejuvenescimento)", nomeNovo: "Máscara Facial LED Terapêutica - 7 Cores Rejuvenescimento", custo: 214.98 },
  { nome: "Kit de vedação para portas (fita de silicone)", nomeNovo: "Kit Vedação Silicone para Portas - 5 metros Isolamento", custo: 42.82 },
  { nome: "Lenço de seda (poliéster) com estampas variadas", nomeNovo: "Lenço Seda Poliéster Estampado - 90x90cm", custo: 42.82 },
  { nome: "Bolsa transportadora dobrável para pets", nomeNovo: "Bolsa Transportadora Dobrável para Pets - Respirável", custo: 139.66 },
  { nome: "Óculos de sol com armação retrô (grife-style)", nomeNovo: "Óculos de Sol Retrô UV400 - Armação Grife-Style", custo: 85.86 },
  { nome: "Quadro magnético pequeno para lembretes", nomeNovo: "Quadro Magnético para Lembretes - 30x40cm com Ímãs", custo: 60.04 },
  { nome: "Garrafa térmica de aço inoxidável (500ml)", nomeNovo: "Garrafa Térmica Aço Inox 500ml - 12h Quente / 24h Frio", custo: 118.14 },
  { nome: "Palmilha ortopédica de gel", nomeNovo: "Palmilha Ortopédica de Gel - Suporte Arco Amortecimento", custo: 70.80 },
  { nome: "Anel de luz (ring light) portátil para fotos", nomeNovo: "Ring Light LED Portátil - 20cm com Suporte Celular", custo: 85.86 },
  { nome: "Tira-olheiras de hidrogel (pacote com 30 pares)", nomeNovo: "Tira-Olheiras Hidrogel Ácido Hialurônico - 30 Pares", custo: 64.34 },
  { nome: "Fonte de água automática para pets (bebedouro)", nomeNovo: "Fonte de Água Automática para Pets - 2L com Filtro Carvão", custo: 150.42 },
  { nome: "Suporte de celular para carro (ventosa magnética)", nomeNovo: "Suporte Magnético para Celular Tomate - Carro Ventosa", custo: 60.04 },
  { nome: "Mouse silencioso sem fio ergonômico", nomeNovo: "Mouse Sem Fio Ergonômico Silencioso - 1600 DPI USB", custo: 96.62 },
  { nome: "Kit de bordado/crochê para iniciantes (com videoaula)", nomeNovo: "Kit Bordado e Crochê para Iniciantes - Com Videoaulas", custo: 96.62 },
  { nome: "Chapéu bucket (pescador) unissex", nomeNovo: "Chapéu Bucket Unissex Algodão - Proteção UV", custo: 70.80 },
  { nome: "Suporte para monitor/notebook (elevador)", nomeNovo: "Suporte Elevador para Monitor/Notebook - Alumínio Escovado", custo: 139.66 },
  { nome: "Limpador de teclado portátil (gel mágico)", nomeNovo: "Gel Mágico Limpador de Teclado - Reutilizável", custo: 32.06 },
  { nome: "Controle remoto para selfie Bluetooth", nomeNovo: "Controle Remoto Bluetooth para Selfie - 10m Alcance", custo: 42.82 },
  { nome: "Organizador de mesa acrílico (giratório)", nomeNovo: "Organizador de Mesa Acrílico Giratório - Multidivisórias", custo: 96.62 },
  { nome: "Jogo de tabuleiro em miniatura (viagem)", nomeNovo: "Jogo de Tabuleiro Magnético Portátil - Estojo Viagem", custo: 75.10 },
  { nome: "Pulseira fitness simples (contador de passos)", nomeNovo: "Pulseira Fitness Smartband - Contador Passos + Sono", custo: 70.80 },
  { nome: "Luminária de mesa com braço articulado e LED", nomeNovo: "Luminária LED Braço Articulado - 3 Intensidades USB", custo: 171.94 },
  { nome: "Fita métrica digital a laser (pequena)", nomeNovo: "Fita Métrica Digital a Laser - 40m Precisão", custo: 85.86 },
  { nome: "Avental de limpeza para óculos VR/óculos comuns", nomeNovo: "Kit Avental Microfibra para Limpeza de Lentes - 3 Unidades", custo: 53.58 },
  { nome: "Necessaire de viagem compacta", nomeNovo: "Necessaire Compacta de Viagem - Impermeável 3L", custo: 60.04 },
  { nome: "Mochila dobrável impermeável (sacola)", nomeNovo: "Mochila Dobrável Impermeável - Nylon 20L", custo: 85.86 },
  { nome: "Coleira refletiva com luz LED", nomeNovo: "Coleira para Pets Refletiva LED - Luz Recarregável", custo: 60.04 },
  { nome: "Power bank fino 10.000mAh (fino e leve)", nomeNovo: "Power Bank 10.000mAh Fino e Leve - USB-C Carga Rápida", custo: 139.66 },
  { nome: "Kit de chaves Allen/hexagonais em formato compacto", nomeNovo: "Kit Chaves Allen Hexagonais Compacto - 8 Bitolas", custo: 42.82 },
  { nome: "Bolsa de água quente (elétrica e sem fio)", nomeNovo: "Bolsa de Água Quente Elétrica Portátil - Autoaquecível", custo: 107.38 },
  { nome: "Mini ventilador USB recarregável", nomeNovo: "Mini Ventilador USB Recarregável - 3 Velocidades Portátil", custo: 70.80 },
  { nome: "Caneta touch universal para tablets", nomeNovo: "Caneta Touch Universal para Tablets - Ponta Precisa Fina", custo: 42.82 },
  { nome: "Chave de fenda elétrica recarregável (mini)", nomeNovo: "Chave de Fenda Elétrica Recarregável - 6 Pontas LED", custo: 124.60 },
  { nome: "Suporte de parede para mangueira de jardim", nomeNovo: "Suporte de Parede para Mangueira - Metal Resistente", custo: 60.04 },
  { nome: "Comedouro lento para cães (labirinto)", nomeNovo: "Comedouro Lento Labirinto para Cães - Antigulpe", custo: 70.80 },
  { nome: "Cabo de carregamento magnético (tipo retrátil)", nomeNovo: "Cabo Magnético Retrátil - USB-C/Micro USB 1,2m", custo: 53.58 },
  { nome: "Brinquedo interativo para gato (vara com pena)", nomeNovo: "Brinquedo Interativo para Gatos - Vara com Pena + Sino", custo: 42.82 },
  { nome: "Cama de cachorro/gato aquecida (autoaquecível)", nomeNovo: "Cama Autoaquecível para Pets - Tamanho M 50x40cm", custo: 171.94 },
  { nome: "Tapete higiênico reutilizável lavável", nomeNovo: "Tapete Higiênico Reutilizável para Pets - 60x90cm Lavável", custo: 85.86 },
  { nome: "Kit de desenho profissional (lápis + carvão) para iniciantes", nomeNovo: "Kit de Desenho Profissional - 24 Peças Lápis + Carvão", custo: 107.38 },
  { nome: "Abridor de garrafas automático (elétrico)", nomeNovo: "Abridor de Garrafas Elétrico Automático - Pilhas Inclusas", custo: 107.38 },
  { nome: "Capa de chuva compacta (tamanho bolso)", nomeNovo: "Capa de Chuva Compacta Descartável Reutilizável - Bolso", custo: 60.04 },
  { nome: "Sensor de movimento com luz LED interna", nomeNovo: "Sensor de Movimento com Luz LED - Autônomo 12 LEDs", custo: 70.80 },
  { nome: "Luz de cabeceira 3D (efeito cubo flutuante)", nomeNovo: "Luminária 3D Cubo Flutuante LED - Controle Remoto 16 Cores", custo: 96.62 },
  { nome: "Apoio de pulso para teclado em gel", nomeNovo: "Apoio de Pulso Ergonômico Gel - Anti-fadiga", custo: 60.04 },
  { nome: "Mini grampeador sem esforço", nomeNovo: "Mini Grampeador Sem Esforço - 10 Folhas Capacidade", custo: 42.82 },
  { nome: "Caneca colorida que muda de cor com calor", nomeNovo: "Caneca Mágica Térmica 300ml - Muda de Cor com Calor", custo: 70.80 },
  { nome: "Kit de culinária infantil (forma de moldar arroz/legumes)", nomeNovo: "Kit Formas Divertidas para Alimentos Infantis - 6 Moldes", custo: 85.86 },
  { nome: "Mini projetor de estrelas/galáxia no teto", nomeNovo: "Mini Projetor Galaxy Estrelas LED - Rotação 360°", custo: 96.62 },
  { nome: "Caderno inteligente (reutilizável) + caneta apagável", nomeNovo: "Caderno Inteligente Reutilizável - 40 Folhas + Caneta Apagável", custo: 103.08 },
  { nome: "Fidget spinner de metal (gira e dura muito)", nomeNovo: "Fidget Spinner de Metal - Rolamento Cerâmico Longa Duração", custo: 42.82 },
  { nome: "Máquina de algodão-doce portátil (elétrica, pequena)", nomeNovo: "Máquina de Algodão-Doce Portátil Elétrica - 200W", custo: 193.46 },
  { nome: "Pente desembaraçador mágico", nomeNovo: "Pente Desembaraçador Mágico - Cerdas Flexíveis", custo: 53.58 }
];

async function main() {
  const { rows } = await pool.query('SELECT id, nome FROM products ORDER BY id');

  for (const p of rows) {
    const prod = produtos.find(x => x.nome === p.nome);
    if (!prod) {
      console.log('NAO ENCONTRADO:', p.nome);
      continue;
    }

    const precoCartao = Math.round(prod.custo * FATOR_CARTAO * 100) / 100;
    const precoOriginal = Math.round(prod.custo * FATOR_CARTAO * PRECO_ORIGINAL_FATOR * 100) / 100;

    await pool.query(
      `UPDATE products SET nome = $1, preco = $2, precoOriginal = $3 WHERE id = $4`,
      [prod.nomeNovo, precoCartao, precoOriginal, p.id]
    );
    console.log(`OK: ${prod.nomeNovo.substring(0, 50)}... | Custo: R$${prod.custo.toFixed(2)} | Preço: R$${precoCartao.toFixed(2)}`);
  }

  const { rows: v } = await pool.query("SELECT COUNT(*) AS total, SUM(CASE WHEN precoOriginal IS NULL OR precoOriginal = 0 THEN 1 ELSE 0 END) AS sem_original FROM products");
  console.log(`\nTotal: ${v[0].total} | Sem precoOriginal: ${v[0].sem_original}`);

  const { rows: amostra } = await pool.query('SELECT nome, preco, precoOriginal FROM products LIMIT 3');
  console.log(JSON.stringify(amostra, null, 2));

  await pool.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
