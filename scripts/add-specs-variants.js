const fs = require('fs');
const path = require('path');

const products = JSON.parse(fs.readFileSync(path.join(__dirname, '../backend/data/products.json'), 'utf-8'));

// Margens por categoria (para calcular preço de variantes)
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

// Gera especificações e variantes baseado no nome e categoria
function gerarEspecsEVariantes(p) {
  const nome = p.nome;
  const cat = p.categoria;
  const nomeLower = nome.toLowerCase();

  const specs = {};
  const variantes = [];

  if (cat === 'Celulares e Smartphones') {
    specs.sistema_operacional = nomeLower.includes('iphone') ? 'iOS 18' : 'Android 15';
    specs.processador = nomeLower.includes('iphone') ? 'Apple A18 Pro (3nm)' :
      nomeLower.includes('galaxy s25') ? 'Snapdragon 8 Gen 4' :
      nomeLower.includes('galaxy') ? 'Exynos 1480' :
      nomeLower.includes('moto') || nomeLower.includes('motorola') ? 'Snapdragon 7 Gen 3' :
      nomeLower.includes('xiaomi') || nomeLower.includes('redmi') || nomeLower.includes('poco') ? 'MediaTek Dimensity 7300' :
      nomeLower.includes('realme') ? 'MediaTek Dimensity 7200' :
      nomeLower.includes('rog phone') ? 'Snapdragon 8 Gen 4' :
      nomeLower.includes('pixel') ? 'Google Tensor G5' :
      nomeLower.includes('oneplus') ? 'Snapdragon 8 Gen 4' :
      'Snapdragon 8 Gen 3';
    specs.tela = nomeLower.includes('iphone 17') ? '6.3" Super Retina XDR OLED (120Hz)' :
      nomeLower.includes('iphone 16 pro') ? '6.9" Super Retina XDR OLED (120Hz)' :
      nomeLower.includes('iphone 16') ? '6.1" Super Retina XDR OLED' :
      nomeLower.includes('iphone 15') ? '6.1" Super Retina XDR OLED' :
      nomeLower.includes('iphone se') ? '4.7" Retina HD' :
      nomeLower.includes('ultra') || nomeLower.includes('fold') || nomeLower.includes('razr') ? '7.6" Dynamic AMOLED 2X (120Hz)' :
      nomeLower.includes('galaxy s25') ? '6.2" Dynamic AMOLED 2X (120Hz)' :
      nomeLower.includes('galaxy') || nomeLower.includes('samsung') ? '6.6" Super AMOLED (120Hz)' :
      nomeLower.includes('edge') || nomeLower.includes('moto') ? '6.7" pOLED (144Hz)' :
      nomeLower.includes('redmi') || nomeLower.includes('poco') || nomeLower.includes('xiaomi') ? '6.67" AMOLED (120Hz)' :
      nomeLower.includes('rog phone') ? '6.78" AMOLED (165Hz)' :
      nomeLower.includes('pixel') ? '6.3" OLED LTPO (120Hz)' :
      nomeLower.includes('tcl') ? '6.78" NXTPAPER 3.0' :
      '6.6" AMOLED (120Hz)';
    specs.armazenamento = (nomeLower.includes('512') || nomeLower.includes('512gb')) ? '512GB' :
      (nomeLower.includes('256') || nomeLower.includes('256gb')) ? '256GB' :
      (nomeLower.includes('128') || nomeLower.includes('128gb')) ? '128GB' :
      (nomeLower.includes('1tb')) ? '1TB' : '256GB';
    specs.memoria_ram = nomeLower.includes('pro max') || nomeLower.includes('ultra') ? '12GB' : '8GB';
    specs.bateria = nomeLower.includes('iphone') ? (nomeLower.includes('pro max') ? '4685mAh' : '3561mAh') :
      nomeLower.includes('ultra') || nomeLower.includes('fold') ? '5000mAh' :
      (nomeLower.includes('moto') || nomeLower.includes('edge')) ? '5000mAh' :
      nomeLower.includes('a16') || nomeLower.includes('a55') || nomeLower.includes('m55') ? '5000mAh' :
      '5000mAh';
    specs.camera_principal = nomeLower.includes('pro max') || nomeLower.includes('ultra') ? '200MP + 50MP + 12MP' :
      nomeLower.includes('iphone') ? '48MP + 12MP + 12MP' :
      nomeLower.includes('edge') ? '50MP + 13MP' :
      nomeLower.includes('redmi') ? '200MP' :
      nomeLower.includes('poco') ? '64MP' :
      nomeLower.includes('pixel') ? '50MP' :
      '50MP + 8MP + 2MP';
    specs.conectividade = '5G, Wi-Fi 6, Bluetooth 5.3';

    // Variantes para celulares
    if (nomeLower.includes('iphone 16 pro max')) {
      variantes.push(
        { id: p.id + '-256', nome: nome.replace('512GB', '256GB'), preco: calcPreco(11000, cat), especificacoes: { armazenamento: '256GB', cor: 'Titânio Natural', memoria_ram: '8GB' } },
        { id: p.id + '-512', nome: nome.replace('512GB', '256GB').replace('256GB', '512GB'), preco: p.preco, especificacoes: { armazenamento: '512GB', cor: 'Titânio Azul', memoria_ram: '8GB' } },
        { id: p.id + '-1tb', nome: nome.replace('512GB', '1TB'), preco: calcPreco(13000, cat), especificacoes: { armazenamento: '1TB', cor: 'Titânio Preto', memoria_ram: '8GB' } }
      );
      specs.cores_disponiveis = 'Titânio Natural, Titânio Azul, Titânio Branco, Titânio Preto';
    } else if (nomeLower.includes('galaxy s25 ultra')) {
      variantes.push(
        { id: p.id + '-256', nome: nome.replace('512GB', '256GB').replace('256GB', '512GB'), preco: calcPreco(8500, cat), especificacoes: { armazenamento: '256GB', cor: 'Titanium Gray', memoria_ram: '12GB' } },
        { id: p.id + '-512', nome: nome.replace('256GB', '512GB').replace('512GB', '256GB'), preco: p.preco, especificacoes: { armazenamento: '512GB', cor: 'Titanium Black', memoria_ram: '12GB' } },
        { id: p.id + '-1tb', nome: nome.replace('512GB', '1TB'), preco: calcPreco(11000, cat), especificacoes: { armazenamento: '1TB', cor: 'Titanium Blue', memoria_ram: '12GB' } }
      );
      specs.cores_disponiveis = 'Titanium Gray, Titanium Black, Titanium Blue, Titanium White';
    } else if (nomeLower.includes('iphone 16 256')) {
      variantes.push(
        { id: p.id + '-128', nome: nome.replace('256GB', '128GB'), preco: calcPreco(6200, cat), especificacoes: { armazenamento: '128GB', cor: 'Preto', memoria_ram: '8GB' } },
        { id: p.id + '-256', nome: nome.replace('256GB', '128GB').replace('128GB', '256GB'), preco: p.preco, especificacoes: { armazenamento: '256GB', cor: 'Azul', memoria_ram: '8GB' } },
        { id: p.id + '-512', nome: nome.replace('256GB', '512GB'), preco: calcPreco(7200, cat), especificacoes: { armazenamento: '512GB', cor: 'Rosa', memoria_ram: '8GB' } }
      );
      specs.cores_disponiveis = 'Preto, Azul, Rosa, Verde, Branco';
    } else if (nomeLower.includes('iphone 17')) {
      variantes.push(
        { id: p.id + '-256', nome: nome.replace('512GB', '256GB').replace('256GB', '512GB'), preco: calcPreco(7500, cat), especificacoes: { armazenamento: '256GB', cor: 'Preto Espacial', memoria_ram: '8GB' } },
        { id: p.id + '-512', nome: nome.replace('256GB', '512GB').replace('512GB', '256GB'), preco: p.preco, especificacoes: { armazenamento: '512GB', cor: 'Prata', memoria_ram: '8GB' } },
        { id: p.id + '-1tb', nome: nome.replace('512GB', '1TB'), preco: calcPreco(9500, cat), especificacoes: { armazenamento: '1TB', cor: 'Dourado', memoria_ram: '8GB' } }
      );
      specs.cores_disponiveis = 'Preto Espacial, Prata, Dourado, Azul Profundo';
    } else if (nomeLower.includes('galaxy s25 ') && !nomeLower.includes('ultra') && !nomeLower.includes('fe') && !nomeLower.includes('a')) {
      variantes.push(
        { id: p.id + '-128', nome: nome.replace('256GB', '128GB'), preco: calcPreco(3900, cat), especificacoes: { armazenamento: '128GB', cor: 'Iceblue', memoria_ram: '8GB' } },
        { id: p.id + '-256', nome: nome.replace('128GB', '256GB').replace('256GB', '128GB'), preco: p.preco, especificacoes: { armazenamento: '256GB', cor: 'Mint', memoria_ram: '8GB' } },
        { id: p.id + '-512', nome: nome.replace('256GB', '512GB'), preco: calcPreco(5000, cat), especificacoes: { armazenamento: '512GB', cor: 'Lavender', memoria_ram: '8GB' } }
      );
      specs.cores_disponiveis = 'Iceblue, Mint, Lavender, Silver Shadow';
    } else if (nomeLower.includes('motorola') || nomeLower.includes('moto')) {
      variantes.push(
        { id: p.id + '-base', nome: nome.replace(' 256GB', '').replace(' 128GB', '') + ' 128GB', preco: Math.round(p.preco * 0.88), especificacoes: { armazenamento: '128GB', cor: 'Preto' } },
        { id: p.id + '-pro', nome: nome, preco: p.preco, especificacoes: { armazenamento: '256GB', cor: 'Azul' } }
      );
      specs.cores_disponiveis = 'Preto, Azul, Verde, Lunar';
    } else if (nomeLower.includes('xiaomi') || nomeLower.includes('redmi') || nomeLower.includes('poco') || nomeLower.includes('realme')) {
      variantes.push(
        { id: p.id + '-base', nome: nome.replace('256GB', '128GB'), preco: Math.round(p.preco * 0.85), especificacoes: { armazenamento: '128GB', cor: 'Preto' } },
        { id: p.id + '-pro', nome: nome, preco: p.preco, especificacoes: { armazenamento: '256GB', cor: 'Azul' } }
      );
      specs.cores_disponiveis = 'Preto, Azul, Branco, Prata';
    } else if (nomeLower.includes('samsung galaxy a') || nomeLower.includes('samsung galaxy m') || nomeLower.includes('samsung galaxy f')) {
      variantes.push(
        { id: p.id + '-base', nome: nome.replace('128GB', '64GB') + (nomeLower.includes('128gb') ? '' : ''), preco: Math.round(p.preco * 0.88), especificacoes: { armazenamento: nomeLower.includes('128gb') ? '64GB' : '128GB', cor: 'Preto' } },
        { id: p.id + '-pro', nome: nome, preco: p.preco, especificacoes: { armazenamento: nomeLower.includes('128gb') ? '128GB' : '256GB', cor: 'Azul' } }
      );
      specs.cores_disponiveis = 'Preto, Azul, Branco, Prata';
    } else if (nomeLower.includes('razr') || nomeLower.includes('fold') || nomeLower.includes('find n') || nomeLower.includes('flip')) {
      variantes.push(
        { id: p.id + '-base', nome: nome, preco: p.preco, especificacoes: { armazenamento: '256GB', cor: 'Preto' } },
        { id: p.id + '-pro', nome: nome + ' Edição Especial', preco: Math.round(p.preco * 1.12), especificacoes: { armazenamento: '512GB', cor: 'Dourado' } }
      );
      specs.cores_disponiveis = 'Preto, Dourado, Prata';
    } else {
      variantes.push(
        { id: p.id + '-base', nome: nome, preco: p.preco, especificacoes: { armazenamento: '256GB', cor: 'Padrão' } }
      );
      specs.cores_disponiveis = 'Consulte disponibilidade';
    }
    specs.modelo = nome.split(' ').slice(0, 3).join(' ');

  } else if (cat === 'Informática') {
    if (nomeLower.includes('notebook') || nomeLower.includes('macbook') || nomeLower.includes('laptop') || nomeLower.includes('galaxy book')) {
      specs.sistema_operacional = nomeLower.includes('macbook') ? 'macOS Sequoia' : 'Windows 11 Home';
      specs.processador = nomeLower.includes('macbook pro') ? 'Apple M4 (12 núcleos)' :
        nomeLower.includes('macbook air') ? 'Apple M4 (10 núcleos)' :
        nomeLower.includes('dell') || nomeLower.includes('inspiron') ? 'Intel Core i7-1360P' :
        nomeLower.includes('lenovo') || nomeLower.includes('ideapad') ? 'AMD Ryzen 7 7730U' :
        nomeLower.includes('acer') || nomeLower.includes('nitro') ? 'Intel Core i5-13420H' :
        nomeLower.includes('asus') || nomeLower.includes('zenbook') ? 'Intel Core i7-1355U' :
        nomeLower.includes('hp') || nomeLower.includes('pavilion') ? 'Intel Core i5-1335U' :
        nomeLower.includes('samsung') || nomeLower.includes('galaxy book') ? 'Intel Core i9-13900H' :
        'Intel Core i5-1335U';
      specs.tela = nomeLower.includes('macbook pro') ? '14.2" Liquid Retina XDR' :
        nomeLower.includes('macbook air') ? '15.3" Liquid Retina' :
        nomeLower.includes('zenbook') ? '14" OLED 2.8K (120Hz)' :
        nomeLower.includes('galaxy book') ? '16" AMOLED 3K (120Hz)' :
        nomeLower.includes('nitro') ? '15.6" Full HD IPS (144Hz)' :
        '15.6" Full HD IPS';
      specs.armazenamento = nomeLower.includes('1tb') ? '1TB SSD' :
        nomeLower.includes('512gb') || nomeLower.includes('ssd') ? '512GB SSD' :
        '512GB SSD NVMe';
      specs.memoria_ram = nomeLower.includes('32gb') ? '32GB' :
        nomeLower.includes('24gb') ? '24GB' :
        nomeLower.includes('16gb') ? '16GB' : '16GB DDR5';
      specs.placa_video = nomeLower.includes('rtx 4070') || nomeLower.includes('rtx 3050') ? 'NVIDIA GeForce RTX' :
        nomeLower.includes('macbook') ? 'Apple GPU integrada' :
        nomeLower.includes('nitro') ? 'NVIDIA RTX 3050 6GB' :
        'Intel Iris Xe Integrada';
      specs.bateria = nomeLower.includes('macbook pro') ? 'Até 20h' :
        nomeLower.includes('macbook air') ? 'Até 18h' : 'Até 10h';

      if (nomeLower.includes('dell inspiron') || nomeLower.includes('lenovo ideapad') || nomeLower.includes('hp pavilion') || nomeLower.includes('acer nitro') || nomeLower.includes('asus zenbook') || nomeLower.includes('samsung galaxy book') || nomeLower.includes('macbook air')) {
        variantes.push(
          { id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { armazenamento: '512GB SSD', memoria_ram: nomeLower.includes('16gb') ? '16GB' : '16GB', cor: 'Cinza' } },
          { id: p.id + '-up', nome: nome + ' (1TB + 32GB)', preco: Math.round(p.preco * 1.18), especificacoes: { armazenamento: '1TB SSD', memoria_ram: '32GB', cor: 'Prata' } }
        );
      } else {
        variantes.push({ id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { armazenamento: '512GB SSD', memoria_ram: '16GB' } });
      }
    } else if (nomeLower.includes('monitor')) {
      specs.tela = nomeLower.includes('4k') ? '27" 4K UHD IPS' : '27" QHD IPS';
      specs.resolucao = nomeLower.includes('4k') ? '3840x2160' : '2560x1440';
      specs.taxa_atualizacao = nomeLower.includes('240hz') ? '240Hz' : '60Hz';
      specs.conectividade = 'HDMI, DisplayPort, USB-C';
      variantes.push({ id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { resolucao: specs.resolucao } });
    } else {
      specs.sistema_operacional = nomeLower.includes('mac') ? 'macOS' : nomeLower.includes('windows') ? 'Windows 11' : 'N/A';
      variantes.push({ id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { modelo: 'Padrão' } });
    }

  } else if (cat === 'Moda e Vestuário') {
    specs.material = nomeLower.includes('couro') ? 'Couro Legítimo' :
      nomeLower.includes('jeans') || nomeLower.includes('denim') ? 'Denim 100% algodão' :
      nomeLower.includes('algodão') || nomeLower.includes('cotton') ? 'Algodão 100%' :
      nomeLower.includes('seda') ? 'Seda Natural' :
      nomeLower.includes('lã') || nomeLower.includes('wool') ? 'Lã' :
      nomeLower.includes('poliéster') || nomeLower.includes('polyester') ? 'Poliéster' :
      'Algodão/poliéster';
    specs.genero = nomeLower.includes('feminino') || nomeLower.includes('feminina') ? 'Feminino' :
      nomeLower.includes('masculino') || nomeLower.includes('masculina') ? 'Masculino' : 'Unissex';
    specs.tamanhos_disponiveis = nomeLower.includes('tenis') || nomeLower.includes('sapato') || nomeLower.includes('sandália') ? '36 ao 44' :
      nomeLower.includes('calça') || nomeLower.includes('jeans') || nomeLower.includes('bermuda') || nomeLower.includes('shorts') ? 'P, M, G, GG' :
      nomeLower.includes('camisa') || nomeLower.includes('camiseta') || nomeLower.includes('polo') ? 'P, M, G, GG' :
      nomeLower.includes('vestido') || nomeLower.includes('macacão') || nomeLower.includes('jaqueta') || nomeLower.includes('blazer') ? 'P, M, G' :
      nomeLower.includes('bolsa') || nomeLower.includes('mochila') ? 'Único' :
      nomeLower.includes('cinto') ? 'Único (ajustável)' :
      nomeLower.includes('oculos') || nomeLower.includes('relogio') || nomeLower.includes('cachecol') || nomeLower.includes('meia') ? 'Único' :
      'P, M, G';
    specs.cores_disponiveis = nomeLower.includes('ray-ban') || nomeLower.includes('oculos') ? 'Dourado, Preto' :
      'Preto, Branco, Azul, Vermelho';
    specs.cuidados = 'Lavar à mão ou máquina (ciclo delicado)';

    variantes.push(
      { id: p.id + '-p', nome: nome + ' (P)', preco: p.preco, especificacoes: { tamanho: 'P' } },
      { id: p.id + '-m', nome: nome + ' (M)', preco: p.preco, especificacoes: { tamanho: 'M' } },
      { id: p.id + '-g', nome: nome + ' (G)', preco: Math.round(p.preco * 1.02), especificacoes: { tamanho: 'G' } }
    );

  } else if (cat === 'Esportes e Fitness') {
    specs.material = nomeLower.includes('aço') || nomeLower.includes('ferro') ? 'Aço Carbono' :
      nomeLower.includes('borracha') ? 'Borracha Natural' :
      nomeLower.includes('couro') ? 'Couro' :
      nomeLower.includes('pvc') ? 'PVC' :
      nomeLower.includes('elástico') || nomeLower.includes('latex') ? 'Látex Natural' :
      nomeLower.includes('eva') ? 'EVA' :
      nomeLower.includes('tpu') ? 'TPU' :
      'Material premium';
    specs.peso_aproximado = nomeLower.includes('20kg') ? '20kg' :
      nomeLower.includes('3kg') ? '3kg' :
      nomeLower.includes('1kg') ? '1kg' :
      nomeLower.includes('5kg') ? '5kg' :
      nomeLower.includes('2kg') ? '2kg' :
      'Variável';
    specs.garantia = '3 meses contra defeitos de fabricação';

    variantes.push(
      { id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { tipo: 'Padrão' } }
    );

  } else if (cat === 'Casa e Decoração') {
    specs.material = nomeLower.includes('madeira') ? 'Madeira Eucalipto' :
      nomeLower.includes('metal') || nomeLower.includes('aço') || nomeLower.includes('alumínio') ? 'Metal' :
      nomeLower.includes('vidro') ? 'Vidro Temperado' :
      nomeLower.includes('cerâmica') ? 'Cerâmica Esmaltada' :
      nomeLower.includes('algodão') ? 'Algodão' :
      nomeLower.includes('poliéster') ? 'Poliéster' :
      nomeLower.includes('palha') ? 'Palha Trançada Natural' :
      nomeLower.includes('feltro') ? 'Feltro' :
      nomeLower.includes('mpd') ? 'MDP' :
      'Material Premium';
    specs.dimensoes = nomeLower.includes('vaso') ? '40cm altura' :
      nomeLower.includes('tapete') ? '1,5m x 1m' :
      'Consultar descrição';
    specs.cores_disponiveis = 'Branco, Preto, Bege, Cinza';

    variantes.push(
      { id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { cor: specs.cores_disponiveis.split(', ')[0] } },
      { id: p.id + '-color', nome: nome + ' (Cor Alternativa)', preco: Math.round(p.preco * 1.05), especificacoes: { cor: specs.cores_disponiveis.split(', ')[1] } }
    );

  } else if (cat === 'Cozinha e Utensílios') {
    specs.material = nomeLower.includes('inox') || nomeLower.includes('aço') ? 'Aço Inox AISI 304' :
      nomeLower.includes('vidro') ? 'Vidro Temperado' :
      nomeLower.includes('porcelana') ? 'Porcelana Esmaltada' :
      nomeLower.includes('madeira') ? 'Madeira' :
      nomeLower.includes('silicone') ? 'Silicone Grau Alimentício' :
      nomeLower.includes('plástico') || nomeLower.includes('polietileno') || nomeLower.includes('pp') ? 'Plástico Livre de BPA' :
      nomeLower.includes('cerâmica') ? 'Cerâmica' :
      nomeLower.includes('teflon') || nomeLower.includes('antiaderente') ? 'Alumínio com Revestimento Antiaderente' :
      'Aço Inox';
    specs.capacidade = nomeLower.includes('panel') || nomeLower.includes('panela') ? 'Vários tamanhos' :
      nomeLower.includes('jarra') || nomeLower.includes('chaleira') ? '1,7L' :
      nomeLower.includes('liquidificador') ? '2L' :
      nomeLower.includes('mixer') ? '800ml' :
      nomeLower.includes('pote') ? '500ml a 2L' :
      nomeLower.includes('tigela') ? '1L a 3L' : 'N/A';
    specs.compativel_lava_loucas = 'Sim';

    variantes.push(
      { id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { material: specs.material } }
    );

  } else if (cat === 'Livros e Papelaria') {
    if (!nomeLower.includes('caneta') && !nomeLower.includes('marcador') && !nomeLower.includes('sulfite') && !nomeLower.includes('caderno') && !nomeLower.includes('agenda') && !nomeLower.includes('fichário') && !nomeLower.includes('mochila') && !nomeLower.includes('estojo') && !nomeLower.includes('calculadora') && !nomeLower.includes('bloco') && !nomeLower.includes('folha') && !nomeLower.includes('régua') && !nomeLower.includes('borracha') && !nomeLower.includes('corretivo') && !nomeLower.includes('post-it') && !nomeLower.includes('tesoura') && !nomeLower.includes('cola')) {
      specs.autor = nomeLower.includes('hoover') ? 'Colleen Hoover' :
        nomeLower.includes('harry') ? 'J.K. Rowling' :
        nomeLower.includes('sherlock') ? 'Arthur Conan Doyle' :
        nomeLower.includes('jogos vorazes') ? 'Suzanne Collins' :
        nomeLower.includes('1984') ? 'George Orwell' :
        nomeLower.includes('dom casmurro') || nomeLower.includes('machado') ? 'Machado de Assis' :
        nomeLower.includes('hal elrod') || nomeLower.includes('milagre da manhã') ? 'Hal Elrod' :
        nomeLower.includes('hábitos') || nomeLower.includes('habitos atomicos') || nomeLower.includes('james clear') ? 'James Clear' :
        nomeLower.includes('poder do hábito') ? 'Charles Duhigg' :
        nomeLower.includes('poder do agora') ? 'Eckhart Tolle' :
        nomeLower.includes('mente milionária') || nomeLower.includes('segredos da mente') ? 'T. Harv Eker' :
        nomeLower.includes('homem mais rico') ? 'George S. Clason' :
        nomeLower.includes('tudo é rio') || nomeLower.includes('carla madeira') ? 'Carla Madeira' :
        nomeLower.includes('verity') ? 'Colleen Hoover' :
        nomeLower.includes('biblioteca da meia-noite') || nomeLower.includes('meia noite') ? 'Matt Haig' :
        'Autor Best-Seller';
      specs.editora = 'Editora Parceira';
      specs.paginas = nomeLower.includes('harry') ? '3.472 (Box completo)' :
        nomeLower.includes('sherlock') ? '1.200' :
        nomeLower.includes('box') ? 'Box com 3 a 7 livros' :
        `${200 + Math.floor(Math.random() * 300)} páginas`;
      specs.idioma = 'Português';
      specs.tipo_capa = 'Capa Comum / Brochura';
    } else {
      specs.material = nomeLower.includes('calculadora') ? 'Plástico ABS' :
        nomeLower.includes('mochila') ? 'Poliéster 600D' : 'Material premium';
      specs.dimensoes = 'Padrão';
    }

    variantes.push({ id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { formato: specs.idioma === 'Português' ? 'Físico' : 'Físico' } });

  } else if (cat === 'Eletrônicos') {
    specs.tipo = nomeLower.includes('fone') || nomeLower.includes('headset') || nomeLower.includes('headphone') ? 'Áudio' :
      nomeLower.includes('caixa') || nomeLower.includes('soundbar') || nomeLower.includes('home theater') ? 'Áudio' :
      nomeLower.includes('smartwatch') || nomeLower.includes('pulseira') || nomeLower.includes('mi band') || nomeLower.includes('amazfit') ? 'Wearable' :
      nomeLower.includes('câmera') || nomeLower.includes('canon') || nomeLower.includes('sony') ? 'Câmera' :
      nomeLower.includes('drone') || nomeLower.includes('dji') ? 'Drone' :
      nomeLower.includes('projetor') ? 'Projetor' :
      nomeLower.includes('power bank') || nomeLower.includes('carregador') ? 'Acessório' :
      nomeLower.includes('echo') || nomeLower.includes('alexa') ? 'Smart Speaker' :
      nomeLower.includes('fire tv') || nomeLower.includes('roku') || nomeLower.includes('chromecast') ? 'Streaming' :
      nomeLower.includes('kindle') ? 'Leitor Digital' :
      nomeLower.includes('lâmpada') || nomeLower.includes('smart plug') || nomeLower.includes('hub') ? 'Casa Inteligente' :
      'Eletrônico';
    specs.conectividade = nomeLower.includes('bluetooth') || nomeLower.includes('bt') ? 'Bluetooth 5.3' :
      nomeLower.includes('wi-fi') || nomeLower.includes('wifi') ? 'Wi-Fi 6' : 'Varia conforme modelo';

    if (nomeLower.includes('jbl') || nomeLower.includes('fone') || nomeLower.includes('headset') || nomeLower.includes('edifier')) {
      variantes.push(
        { id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { cor: 'Preto' } },
        { id: p.id + '-color', nome: nome + ' (Branco)', preco: Math.round(p.preco * 1.03), especificacoes: { cor: 'Branco' } }
      );
    } else {
      variantes.push({ id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { modelo: 'Padrão' } });
    }

  } else if (cat === 'Móveis') {
    specs.material = nomeLower.includes('madeira') || nomeLower.includes('eucalipto') || nomeLower.includes('pin') || nomeLower.includes('freijó') ? 'Madeira Maciça' :
      nomeLower.includes('aço') || nomeLower.includes('metal') || nomeLower.includes('cromado') ? 'Aço Carbono' :
      nomeLower.includes('mpd') ? 'MDP com Pintura UV' :
      nomeLower.includes('couro') || nomeLower.includes('suade') || nomeLower.includes('veludo') || nomeLower.includes('sarja') ? 'Estofado' :
      nomeLower.includes('vidro') ? 'Vidro Temperado' :
      nomeLower.includes('bambu') ? 'Bambu Natural' :
      'MDP/MDF';
    specs.dimensoes = nomeLower.includes('sofa') || nomeLower.includes('sofá') ? '2-3 lugares' :
      nomeLower.includes('mesa') || nomeLower.includes('cadeira') ? 'Padrão' :
      'Consultar ficha técnica';
    specs.garantia = '6 meses contra defeitos de fabricação';
    specs.montagem = 'Requer montagem (manual incluso)';

    variantes.push(
      { id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { cor: 'Cinza' } },
      { id: p.id + '-color', nome: nome + ' (Bege)', preco: Math.round(p.preco * 1.05), especificacoes: { cor: 'Bege' } }
    );

  } else if (cat === 'Beleza e Perfumaria') {
    specs.volume = nomeLower.includes('100ml') || nomeLower.includes('50ml') || nomeLower.includes('60ml') || nomeLower.includes('30ml') ? 'Conforme descrição' :
      nomeLower.includes('400ml') ? '400ml' :
      nomeLower.includes('120ml') ? '120ml' :
      nomeLower.includes('30ml') ? '30ml' :
      nomeLower.includes('100ml') ? '100ml' :
      nomeLower.includes('50ml') ? '50ml' :
      nomeLower.includes('10g') || nomeLower.includes('30g') || nomeLower.includes('50g') || nomeLower.includes('100g') ? '100g' :
      'Tamanho padrão';
    specs.genero = nomeLower.includes('masculino') || nomeLower.includes('masculina') || nomeLower.includes('men') || nomeLower.includes('male') || nomeLower.includes('invictus') || nomeLower.includes('sauvage') || nomeLower.includes('212') || nomeLower.includes('bad boy') || nomeLower.includes('malbec') || nomeLower.includes('kaiak') ? 'Masculino' :
      nomeLower.includes('feminino') || nomeLower.includes('feminina') || nomeLower.includes('miss') || nomeLower.includes('carolina') || nomeLower.includes('good girl') || nomeLower.includes('rose') || nomeLower.includes('dolce') ? 'Feminino' :
      'Unissex';
    specs.tipo = nomeLower.includes('perfume') ? 'Perfume' :
      nomeLower.includes('base') || nomeLower.includes('batom') || nomeLower.includes('paleta') || nomeLower.includes('delineador') || nomeLower.includes('máscara') || nomeLower.includes('rímel') || nomeLower.includes('lápis') || nomeLower.includes('blush') || nomeLower.includes('iluminador') || nomeLower.includes('pincéis') || nomeLower.includes('kit maquiagem') || nomeLower.includes('corretivo') || nomeLower.includes('pó') ? 'Maquiagem' :
      nomeLower.includes('shampoo') || nomeLower.includes('condicionador') || nomeLower.includes('creme') || nomeLower.includes('protetor') || nomeLower.includes('desodorante') || nomeLower.includes('aparelho') || nomeLower.includes('escova') || nomeLower.includes('chapinha') || nomeLower.includes('sérum') || nomeLower.includes('esfoliante') || nomeLower.includes('máscara facial') || nomeLower.includes('demaquilante') || nomeLower.includes('hidratante') ? 'Cuidados Pessoais' :
      'Cosmético';

    if (nomeLower.includes('perfume')) {
      variantes.push(
        { id: p.id + '-30', nome: nome.replace('100ml', '30ml').replace('50ml', '30ml'), preco: Math.round(p.preco * 0.5), especificacoes: { volume: '30ml' } },
        { id: p.id + '-50', nome: nome.replace('100ml', '50ml'), preco: Math.round(p.preco * 0.7), especificacoes: { volume: '50ml' } },
        { id: p.id + '-100', nome: nome, preco: p.preco, especificacoes: { volume: '100ml' } }
      );
    } else {
      variantes.push({ id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { tipo: specs.tipo } });
    }

  } else if (cat === 'Games') {
    specs.plataforma = nomeLower.includes('ps5') || nomeLower.includes('playstation') || nomeLower.includes('ps vr') || nomeLower.includes('dualsense') ? 'PlayStation 5' :
      nomeLower.includes('xbox') ? 'Xbox Series X|S' :
      nomeLower.includes('nintendo') || nomeLower.includes('switch') ? 'Nintendo Switch' :
      nomeLower.includes('pc') || nomeLower.includes('rtx') || nomeLower.includes('amd') || nomeLower.includes('ddr') || nomeLower.includes('fonte') || nomeLower.includes('gabinete') || nomeLower.includes('monitor gamer') || nomeLower.includes('mousepad') || nomeLower.includes('cadeira') || nomeLower.includes('mesa') || nomeLower.includes('suporte') ? 'PC Gamer' :
      nomeLower.includes('headset') || nomeLower.includes('astro') ? 'Multiplataforma' :
      nomeLower.includes('controle') ? 'Multiplataforma' :
      nomeLower.includes('cartão') || nomeLower.includes('presente') ? 'Digital' :
      'Multiplataforma';
    specs.tipo = nomeLower.includes('cadeira') || nomeLower.includes('mesa') || nomeLower.includes('suporte') ? 'Acessório' :
      nomeLower.includes('headset') || nomeLower.includes('astro') ? 'Áudio' :
      nomeLower.includes('mouse') || nomeLower.includes('teclado') || nomeLower.includes('mousepad') || nomeLower.includes('monitor') ? 'Periférico' :
      nomeLower.includes('jogo') || nomeLower.includes('game') ? 'Jogo' :
      nomeLower.includes('controle') ? 'Controle' :
      nomeLower.includes('console') || nomeLower.includes('switch') || nomeLower.includes('playstation') || nomeLower.includes('xbox') || nomeLower.includes('nintendo') ? 'Console' :
      nomeLower.includes('placa') || nomeLower.includes('processador') || nomeLower.includes('memória') || nomeLower.includes('ssd') || nomeLower.includes('fonte') || nomeLower.includes('gabinete') ? 'Hardware' :
      'Acessório';

    if (nomeLower.includes('ps5') || nomeLower.includes('playstation') && !nomeLower.includes('jogo') && !nomeLower.includes('controle') && !nomeLower.includes('headset')) {
      variantes.push(
        { id: p.id + '-std', nome: nome + ' (Padrão)', preco: p.preco, especificacoes: { armazenamento: '825GB SSD', cor: 'Branco' } },
        { id: p.id + '-pro', nome: nome + ' (Edição Especial)', preco: Math.round(p.preco * 1.12), especificacoes: { armazenamento: '2TB SSD', cor: 'Edição Limitada' } }
      );
    } else if (nomeLower.includes('nintendo') || nomeLower.includes('switch')) {
      variantes.push(
        { id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { cor: 'Preto' } },
        { id: p.id + '-color', nome: nome + ' (Edição Colorida)', preco: Math.round(p.preco * 1.08), especificacoes: { cor: 'Colorida' } }
      );
    } else if (nomeLower.includes('xbox')) {
      variantes.push(
        { id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { armazenamento: '1TB SSD', cor: 'Preto' } }
      );
    } else if (nomeLower.includes('cadeira')) {
      variantes.push(
        { id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { cor: 'Preto/Vermelho' } },
        { id: p.id + '-color', nome: nome + ' (Branco/Roxo)', preco: Math.round(p.preco * 1.05), especificacoes: { cor: 'Branco/Roxo' } }
      );
    } else {
      variantes.push({ id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { plataforma: specs.plataforma } });
    }

  } else if (cat === 'Eletrodomésticos') {
    specs.voltagem = 'Bivolt (127V/220V)';
    specs.eficiencia_energetica = 'A++';
    specs.garantia = '12 meses contra defeitos de fabricação';

    if (nomeLower.includes('geladeira')) {
      specs.capacidade = nomeLower.includes('420l') || nomeLower.includes('420') ? '420L Frost Free' : '400L Frost Free';
      specs.cor = 'Inox Escovado';
      variantes.push(
        { id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { cor: 'Inox', voltagem: 'Bivolt' } },
        { id: p.id + '-color', nome: nome.replace('Inox', 'Branco').replace('Inox', 'Branco'), preco: Math.round(p.preco * 0.95), especificacoes: { cor: 'Branco', voltagem: 'Bivolt' } }
      );
    } else if (nomeLower.includes('fogão') || nomeLower.includes('fogao')) {
      specs.capacidade = '4 Queimadores + Forno';
      variantes.push(
        { id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { cor: 'Inox', voltagem: 'Bivolt' } },
        { id: p.id + '-color', nome: nome + ' (Branco)', preco: Math.round(p.preco * 0.93), especificacoes: { cor: 'Branco', voltagem: 'Bivolt' } }
      );
    } else if (nomeLower.includes('micro-ondas') || nomeLower.includes('microondas')) {
      specs.capacidade = '30L';
      specs.potencia = '1200W';
      variantes.push({ id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { cor: 'Inox', voltagem: 'Bivolt' } });
    } else if (nomeLower.includes('air fryer') || nomeLower.includes('fritadeira')) {
      specs.capacidade = '8L';
      specs.potencia = '1800W';
      variantes.push({ id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { cor: 'Preto', voltagem: 'Bivolt' } });
    } else if (nomeLower.includes('lava-louças') || nomeLower.includes('lavalouças')) {
      specs.capacidade = '8 Serviços';
      variantes.push({ id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { cor: 'Inox', voltagem: 'Bivolt' } });
    } else {
      variantes.push({ id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { voltagem: 'Bivolt' } });
    }

  } else {
    variantes.push({ id: p.id + '-std', nome: nome, preco: p.preco, especificacoes: { modelo: 'Padrão' } });
  }

  return { especificacoes: specs, variantes };
}

// Processar todos os produtos
let count = 0;
for (const p of products) {
  const { especificacoes, variantes } = gerarEspecsEVariantes(p);
  p.especificacoes = especificacoes;
  p.variantes = variantes;
  count++;
}

// Salvar
fs.writeFileSync(
  path.join(__dirname, '../backend/data/products.json'),
  JSON.stringify(products, null, 2),
  'utf-8'
);

console.log(`✅ Especificações e variantes adicionadas a ${count} produtos!`);

// Estatísticas
let totalVariants = 0;
let maxVariants = 0;
for (const p of products) {
  totalVariants += p.variantes.length;
  if (p.variantes.length > maxVariants) maxVariants = p.variantes.length;
}
console.log(`📊 Total de variantes: ${totalVariants} (média ${(totalVariants/count).toFixed(1)}/produto, máx ${maxVariants})`);
console.log(`💾 Arquivo salvo!`);
