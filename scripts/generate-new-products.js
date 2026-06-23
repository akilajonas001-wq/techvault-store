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

const novosProdutos = [];

let id = 241;

// ============ 1. CELULARES E SMARTPHONES (241-260) ============
const celulares = [
  { nome: 'Nothing Phone 3', custo: 2999, desc: 'O Nothing Phone 3 chega com design transparente icônico, processador Snapdragon 8s Gen 3, tela OLED LTPO de 6,7 polegadas 120Hz, interface Glyph iluminada e câmera traseira dupla de 50MP. Um smartphone único que une estilo e performance.', avaliacao: 4.3, reviews: 187, estoque: 45, destaque: true },
  { nome: 'Realme 12 Pro+', custo: 2499, desc: 'O Realme 12 Pro+ impressiona com câmera periscópio de 64MP com zoom óptico 3x, processador Snapdragon 7s Gen 2, tela AMOLED curvo de 6,7 polegadas 120Hz, bateria de 5000mAh e carregamento de 67W. Fotografia avançada a preço justo.', avaliacao: 4.4, reviews: 256, estoque: 78, destaque: true },
  { nome: 'Xiaomi Redmi Note 14 Pro', custo: 1799, desc: 'O Xiaomi Redmi Note 14 Pro eleva o padrão dos intermediários com tela AMOLED de 6,67 polegadas 120Hz, processador MediaTek Dimensity 7300 Ultra, câmera de 200MP OIS, bateria de 5500mAh e carregamento de 90W. O novo rei do custo-benefício.', avaliacao: 4.5, reviews: 892, estoque: 120, destaque: true },
  { nome: 'Samsung Galaxy M55', custo: 1599, desc: 'O Samsung Galaxy M55 combina tela Super AMOLED+ de 6,7 polegadas 120Hz, processador Snapdragon 7 Gen 1, câmera quádrupla de 108MP, bateria de 6000mAh e carregamento de 45W. Autência de sobra para o dia todo.', avaliacao: 4.2, reviews: 334, estoque: 95, destaque: false },
  { nome: 'Motorola Edge 50 Fusion', custo: 1999, desc: 'O Motorola Edge 50 Fusion traz tela pOLED de 6,7 polegadas 144Hz, processador Snapdragon 7s Gen 2, câmera de 50MP OIS, bateria de 5000mAh com carregamento TurboPower de 68W e design premium em couro vegano.', avaliacao: 4.1, reviews: 178, estoque: 67, destaque: false },
  { nome: 'Apple iPhone 17', custo: 6999, desc: 'O iPhone 17 chega com chip A19 Pro de 3nm, tela Super Retina XDR OLED de 6,3 polegadas com ProMotion 120Hz, Dynamic Island 2.0, câmera de 48MP com lente periscópio 10x, bateria com 30 horas de reprodução de vídeo e USB-C 3.2.', avaliacao: 4.8, reviews: 445, estoque: 34, destaque: true },
  { nome: 'Google Pixel 10', custo: 4999, desc: 'O Google Pixel 10 traz o chip Tensor G5, tela OLED de 6,3 polegadas 120Hz LTPO, câmera principal de 50MP com tecnologia de computação fotográfica de última geração, bateria de 5000mAh e 7 anos de atualizações. A melhor experiência Android pura.', avaliacao: 4.6, reviews: 223, estoque: 52, destaque: true },
  { nome: 'ASUS ROG Phone 9', custo: 5499, desc: 'O ASUS ROG Phone 9 é o sonho dos gamers com Snapdragon 8 Gen 4, tela AMOLED de 6,78 polegadas 165Hz, sistema de resfriamento AeroActive, gatilhos AirTrigger, bateria de 6000mAh com carregamento de 65W e RGB Aura personalizável.', avaliacao: 4.7, reviews: 312, estoque: 28, destaque: false },
  { nome: 'Xiaomi 15', custo: 4599, desc: 'O Xiaomi 15 é um flagship compacto com Snapdragon 8 Gen 4, tela AMOLED LTPO de 6,36 polegadas 120Hz, câmera Leica Summilux de 50MP tripla, bateria de 5400mAh com carregamento de 120W e HyperOS 2.0.', avaliacao: 4.5, reviews: 567, estoque: 41, destaque: true },
  { nome: 'Samsung Galaxy S25 FE', custo: 3499, desc: 'O Samsung Galaxy S25 FE oferece processador Exynos 2500, tela Dynamic AMOLED 2X de 6,7 polegadas 120Hz, câmera tripla de 50MP com Space Zoom 30x, bateria de 4900mAh e carregamento de 45W. O flagship acessível da Samsung.', avaliacao: 4.3, reviews: 678, estoque: 89, destaque: false },
  { nome: 'OnePlus 13', custo: 4999, desc: 'O OnePlus 13 traz Snapdragon 8 Gen 4, tela AMOLED LTPO 2K de 6,82 polegadas 120Hz, câmera Hasselblad tripla de 50MP, bateria de 6000mAh com carregamento SuperVOOC de 100W e alert slider clássico. Performance que inspira confiança.', avaliacao: 4.6, reviews: 445, estoque: 37, destaque: true },
  { nome: 'Oppo Find N5', custo: 7999, desc: 'O Oppo Find N5 é um dobrável tipo livro com tela interna LTPO de 7,8 polegadas, Snapdragon 8 Gen 4, câmera Hasselblad tripla de 50MP, bateria de 5600mAh, carregamento de 80W e design ultrafino de 11mm dobrado.', avaliacao: 4.4, reviews: 156, estoque: 18, destaque: false },
  { nome: 'Motorola Razr 60', custo: 5499, desc: 'O Motorola Razr 60 é um flip dobrável com tela externa de 3,6 polegadas e tela interna pOLED de 6,9 polegadas 165Hz, Snapdragon 8 Gen 4, câmera de 50MP OIS e bateria de 4500mAh. Design icônico reimaginado.', avaliacao: 4.2, reviews: 234, estoque: 22, destaque: false },
  { nome: 'Samsung Galaxy A16 5G', custo: 1299, desc: 'O Samsung Galaxy A16 5G é o intermediário acessível com tela Super AMOLED de 6,5 polegadas 90Hz, processador Dimensity 6300, câmera tripla de 50MP, bateria de 5000mAh e 4 anos de atualizações. Perfeito para o dia a dia.', avaliacao: 4.1, reviews: 523, estoque: 140, destaque: false },
  { nome: 'Xiaomi Poco X7 Pro', custo: 1699, desc: 'O Xiaomi Poco X7 Pro é um intermediário focado em performance com Dimensity 8400 Ultra, tela AMOLED de 6,67 polegadas 120Hz, câmera de 64MP OIS, bateria de 5500mAh e carregamento de 90W. Pura potência sem gastar muito.', avaliacao: 4.5, reviews: 789, estoque: 105, destaque: true },
  { nome: 'Realme C75', custo: 899, desc: 'O Realme C75 é um entry-level robusto com tela LCD de 6,7 polegadas 90Hz, processador Helio G92, câmera de 50MP, bateria de 6000mAh, carregamento de 45W e certificação IP64. O básico bem feito.', avaliacao: 4.0, reviews: 345, estoque: 200, destaque: false },
  { nome: 'Samsung Galaxy F55', custo: 1499, desc: 'O Samsung Galaxy F55 oferece tela Super AMOLED de 6,6 polegadas 120Hz, processador Exynos 1480, câmera de 50MP OIS, bateria de 5000mAh e carregamento de 45W. Design premium com traseira em couro vegano.', avaliacao: 4.0, reviews: 167, estoque: 88, destaque: false },
  { nome: 'Vivo V40', custo: 2299, desc: 'O Vivo V40 é focado em retratos com câmera Zeiss de 50MP OIS com modo retrato profissional, tela AMOLED curvo de 6,78 polegadas 120Hz, Dimensity 8200, bateria de 5500mAh e carregamento de 80W.', avaliacao: 4.2, reviews: 289, estoque: 56, destaque: false },
  { nome: 'Huawei P70 Pro', custo: 5999, desc: 'O Huawei P70 Pro traz câmera XMAGE de 50MP com lente física variável, tela OLED LTPO de 6,8 polegadas 120Hz, Kirin 9010, bateria de 5200mAh e carregamento de 100W. Fotografia computacional em novo patamar.', avaliacao: 4.5, reviews: 198, estoque: 25, destaque: false },
  { nome: 'TCL 40 NXTPAPER', custo: 999, desc: 'O TCL 40 NXTPAPER possui tela inovadora NXTPAPER 3.0 de 6,78 polegadas que reduz o cansaço visual, processador Helio G88, câmera de 50MP, bateria de 5010mAh e alto-falantes duplos. Perfeito para leitura e consumo de conteúdo.', avaliacao: 3.9, reviews: 134, estoque: 77, destaque: false }
];
for (const p of celulares) {
  novosProdutos.push({ id: id++, nome: p.nome, categoria: 'Celulares e Smartphones', preco: calcPreco(p.custo, 'Celulares e Smartphones'), imagem: `/images/products/produto-${id-1}.svg`, avaliacao: p.avaliacao, reviews: p.reviews, frete: 'Grátis', descricao: p.desc, estoque: p.estoque, destaque: p.destaque });
}

// ============ 2. INFORMÁTICA (261-280) ============
const informatica = [
  { nome: 'Notebook Dell Inspiron 16 5640', custo: 4999, desc: 'O Notebook Dell Inspiron 16 5640 possui processador Intel Core i7-1360P, tela 16" WUXGA, 16GB RAM, SSD 512GB, placa integrada Intel Iris Xe e bateria de longa duração. Ideal para produtividade e entretenimento.', avaliacao: 4.3, reviews: 234, estoque: 56 },
  { nome: 'Notebook Lenovo IdeaPad 3', custo: 3499, desc: 'O Lenovo IdeaPad 3 combina processador AMD Ryzen 7 7730U, tela 15,6" Full HD, 16GB RAM, SSD 512GB, placa de vídeo integrada e design compacto. Robusto, confiável e com ótimo custo-benefício.', avaliacao: 4.1, reviews: 445, estoque: 89 },
  { nome: 'Notebook Acer Nitro 5', custo: 5499, desc: 'O Acer Nitro 5 é um notebook gamer de entrada com Intel Core i5-13420H, RTX 3050 6GB, tela 15,6" Full HD 144Hz, 16GB RAM DDR5 e SSD 512GB NVMe. Perfeito para jogar e estudar.', avaliacao: 4.4, reviews: 567, estoque: 34 },
  { nome: 'Notebook ASUS ZenBook 14 OLED', custo: 6499, desc: 'O ASUS ZenBook 14 OLED é ultrafino com Intel Core i7-1355U, tela OLED 2.8K 120Hz, 16GB RAM, SSD 1TB, certificação Intel Evo e bateria de 14 horas. Elegância e performance em um só lugar.', avaliacao: 4.6, reviews: 312, estoque: 23 },
  { nome: 'MacBook Pro M4 14"', custo: 14999, desc: 'O MacBook Pro M4 14" traz o chip Apple M4 com CPU de 12 núcleos e GPU de 18 núcleos, tela Liquid Retina XDR de 14,2 polegadas, 24GB RAM unificada, SSD 1TB e até 20 horas de bateria. Poder profissional sem precedentes.', avaliacao: 4.9, reviews: 678, estoque: 15 },
  { nome: 'Notebook HP Pavilion 15', custo: 3999, desc: 'O Notebook HP Pavilion 15 oferece processador Intel Core i5-1335U, tela 15,6" Full HD IPS, 16GB RAM, SSD 512GB, design fino e bateria de até 10 horas. Confiável para tarefas do dia a dia.', avaliacao: 4.0, reviews: 334, estoque: 67 },
  { nome: 'Desktop PC Intel i5 16GB', custo: 3499, desc: 'Desktop PC completo com Intel Core i5-13400, 16GB RAM DDR4, SSD 480GB, placa de vídeo integrada Intel UHD, Wi-Fi, Bluetooth e sistema Windows 11. Pronto para uso em casa ou escritório.', avaliacao: 4.2, reviews: 189, estoque: 45 },
  { nome: 'All-in-One Dell 27"', custo: 5499, desc: 'All-in-One Dell Inspiron 27" com Intel Core i7-1355U, tela Full HD IPS touch de 27 polegadas, 16GB RAM, SSD 512GB, webcam pop-up e som estéreo. Design integrado que economiza espaço.', avaliacao: 4.3, reviews: 156, estoque: 22 },
  { nome: 'Monitor Dell 27" 4K UHD', custo: 2499, desc: 'Monitor Dell S2722QC de 27 polegadas com resolução 4K UHD (3840x2160), painel IPS, HDR, USB-C 65W, alto-falantes integrados e suporte VESA. Nitidez absoluta para trabalho criativo.', avaliacao: 4.5, reviews: 423, estoque: 38 },
  { nome: 'Teclado Mecânico Corsair K70 RGB', custo: 899, desc: 'Teclado mecânico Corsair K70 RGB Pro com switches Cherry MX Red, estrutura de alumínio anodizado, iluminação RGB por tecla, polling rate de 8000Hz e descanso de pulso macio. O padrão ouro dos teclados.', avaliacao: 4.7, reviews: 567, estoque: 29 },
  { nome: 'Mousepad Gamer RGB XXL', custo: 149, desc: 'Mousepad gamer RGB XXL de 90x40cm com iluminação RGB dinâmica, superfície de tecido microtexturizado, base antiderrapante e bordas costuradas. Espaço completo para teclado e mouse.', avaliacao: 4.1, reviews: 234, estoque: 88 },
  { nome: 'Mouse Gamer Razer DeathAdder V3', custo: 399, desc: 'Razer DeathAdder V3 com sensor óptico Focus Pro 30K, design ergonômico ultraleve de 63g, switches ópticos de 3ª geração e cabo Speedflex. Precisão e conforto para jogos competitivos.', avaliacao: 4.6, reviews: 445, estoque: 56 },
  { nome: 'SSD Samsung 990 Pro 2TB', custo: 1299, desc: 'SSD Samsung 990 Pro 2TB NVMe M.2 PCIe 4.0 com velocidades de leitura de 7450MB/s e gravação de 6900MB/s, controlador Samsung Pascal e dissipador de calor integrado. O SSD mais rápido do mercado.', avaliacao: 4.8, reviews: 789, estoque: 42 },
  { nome: 'HD Externo WD Elements 5TB', custo: 699, desc: 'HD Externo WD Elements Portable 5TB com interface USB 3.0, taxa de transferência de até 5Gbps, design compacto, alimentação via USB e software de backup WD Backup incluso. Armazenamento portátil confiável.', avaliacao: 4.3, reviews: 890, estoque: 95 },
  { nome: 'Placa de Vídeo RTX 5070 Ti', custo: 6999, desc: 'A NVIDIA GeForce RTX 5070 Ti traz 12GB GDDR7, arquitetura Blackwell, 8960 núcleos CUDA, ray tracing de 4ª geração, DLSS 4 e suporte a PCIe 5.0. A escolha certa para jogos 4K.', avaliacao: 4.7, reviews: 334, estoque: 12 },
  { nome: 'Fonte Cooler Master 850W Gold', custo: 699, desc: 'Fonte Cooler Master MWE Gold 850W V2 com certificação 80 Plus Gold, módulo totalmente modular, ventilador HDB de 120mm e proteções completas. Energia limpa e estável para seu PC.', avaliacao: 4.4, reviews: 267, estoque: 48 },
  { nome: 'Gabinete Gamer Corsair 4000D', custo: 599, desc: 'Gabinete Gamer Corsair 4000D Airflow em aço e vidro temperado, painel frontal em mesh para fluxo de ar otimizado, suporte a radiadores de até 360mm e gerenciamento de cabos simplificado.', avaliacao: 4.5, reviews: 445, estoque: 33 },
  { nome: 'Notebook Samsung Galaxy Book 3 Ultra', custo: 7999, desc: 'Samsung Galaxy Book 3 Ultra com Intel Core i9-13900H, RTX 4070 8GB, tela AMOLED 16" 3K 120Hz, 32GB RAM LPDDR5 e SSD 1TB. Performance de workstation em design ultrafino.', avaliacao: 4.5, reviews: 156, estoque: 18 },
  { nome: 'Mini PC Intel NUC 13 Pro', custo: 2999, desc: 'Intel NUC 13 Pro com Intel Core i7-1360P, 16GB RAM DDR4, SSD 512GB NVMe, suporte a 4 monitores 4K via HDMI e Thunderbolt 4, Wi-Fi 6E e design compacto de 1L. Performance desktop em formato mini.', avaliacao: 4.2, reviews: 134, estoque: 27 },
  { nome: 'Roteador Mesh TP-Link Deco X60', custo: 799, desc: 'Kit Roteador Mesh TP-Link Deco X60 (3 unidades) com Wi-Fi 6 AX3000, cobertura de até 550m², conexão para até 150 dispositivos, controle parental e segurança avançada. Internet sem pontos cegos.', avaliacao: 4.3, reviews: 678, estoque: 55 }
];
for (const p of informatica) {
  novosProdutos.push({ id: id++, nome: p.nome, categoria: 'Informática', preco: calcPreco(p.custo, 'Informática'), imagem: `/images/products/produto-${id-1}.svg`, avaliacao: p.avaliacao, reviews: p.reviews, frete: 'Grátis', descricao: p.desc, estoque: p.estoque, destaque: false });
}

// ============ 3. MODA E VESTUÁRIO (281-300) ============
const moda = [
  { nome: 'Camiseta Lacoste Masculina', custo: 199, desc: 'Camiseta Lacoste masculina em algodão pima de alta qualidade, com o icônico crocodilo bordado, modelagem regular, gola careca e costuras reforçadas. Elegância esportiva francesa.', avaliacao: 4.4, reviews: 312, estoque: 120 },
  { nome: 'Vestido Midi Zara', custo: 249, desc: 'Vestido midi Zara em viscose fluida com estampa exclusiva, decote V, cinto na cintura e fenda lateral. Peça versátil que transita do escritório ao happy hour com estilo.', avaliacao: 4.3, reviews: 234, estoque: 67 },
  { nome: 'Tênis New Balance 574', custo: 499, desc: 'Tênis New Balance 574 clássico em couro e mesh, entressola com amortecimento ENCAP, solado de borracha durável e design retro que nunca sai de moda. Conforto e estilo atemporais.', avaliacao: 4.5, reviews: 567, estoque: 89 },
  { nome: 'Tênis Puma Suede Classic', custo: 399, desc: 'Tênis Puma Suede Classic em camurça premium, com o icônico Formstrip lateral, sola de borracha, palmilha macia e design que transcende gerações. Um verdadeiro ícone do estilo urbano.', avaliacao: 4.4, reviews: 445, estoque: 78 },
  { nome: 'Calça Sarja Masculina Slim', custo: 179, desc: 'Calça sarja masculina slim fit em algodão elastano, cintura média, bolsos laterais e traseiros, zíper e botão de metal. Conforto e estilo para o dia a dia.', avaliacao: 4.2, reviews: 334, estoque: 95 },
  { nome: 'Jaqueta Jeans Feminina', custo: 299, desc: 'Jaqueta jeans feminina em denim azul médio, modelagem ajustada, gola clássica, botões metálicos, bolsos frontais e detalhes de desgaste. O coringa do guarda-roupa.', avaliacao: 4.3, reviews: 267, estoque: 56 },
  { nome: 'Blazer Masculino Slim Fit', custo: 349, desc: 'Blazer masculino slim fit em linho misto, forro interno, lapela entalhada, botão único, bolsos com aba e fenda traseira. Elegância para ocasiões especiais.', avaliacao: 4.1, reviews: 189, estoque: 34 },
  { nome: 'Bolsa Tote Feminina Couro', custo: 299, desc: 'Bolsa tote feminina em couro legítimo, alças duplas, fechamento em zíper, bolso interno com divisor, porta-celular e porta-documentos. Sofisticação e praticidade para o dia a dia.', avaliacao: 4.5, reviews: 312, estoque: 45 },
  { nome: 'Óculos de Sol Ray-Ban Aviator', custo: 699, desc: 'Óculos de Sol Ray-Ban Aviator clássico em metal dourado com lentes verde G-15, armação leve, hastes ajustáveis e proteção UV 400. O estilo que define gerações.', avaliacao: 4.7, reviews: 678, estoque: 33 },
  { nome: 'Relógio Casio G-Shock GA-2100', custo: 349, desc: 'Relógio Casio G-Shock GA-2100 com design octogonal icônico, resistência a impactos, iluminação LED super, cronômetro, alarme e resistência à água de 200m. Robusto e estiloso.', avaliacao: 4.6, reviews: 890, estoque: 67 },
  { nome: 'Camisa Polo Tommy Hilfiger', custo: 299, desc: 'Camisa polo Tommy Hilfiger em algodão piqué, gola com botões, a bandeira icônica bordada no peito e barra com aberturas laterais. Clássico americano.', avaliacao: 4.4, reviews: 445, estoque: 88 },
  { nome: 'Shorts Jeans Feminino', custo: 129, desc: 'Shorts jeans feminino em denim azul claro, cintura alta, barra desfiada, bolsos frontais e traseiros e fechamento em zíper. Despojado e estiloso para os dias quentes.', avaliacao: 4.1, reviews: 223, estoque: 78 },
  { nome: 'Macacão Feminino Longo', custo: 199, desc: 'Macacão feminino longo em viscose, decote V, cinto na cintura, pernas wide leg e costas abertas. Peça única que transmite frescor e elegância.', avaliacao: 4.2, reviews: 156, estoque: 44 },
  { nome: 'Tênis Vans Old Skool', custo: 349, desc: 'Tênis Vans Old Skool clássico em lona e camurça, com a icônica faixa lateral Sidestripe, biqueira reforçada e sola waffle de borracha. Ícone do skate e do streetwear.', avaliacao: 4.5, reviews: 567, estoque: 110 },
  { nome: 'Sandália Rasteira Feminina', custo: 99, desc: 'Sandália rasteira feminina em couro legítimo, tiras finas, sola de borracha flexível e fivela ajustável. Conforto e simplicidade para o verão.', avaliacao: 4.0, reviews: 234, estoque: 130 },
  { nome: 'Mochila Jansport SuperBreak', custo: 179, desc: 'Mochila Jansport SuperBreak em poliéster resistente, compartimento principal amplo, bolso frontal organizador, alças acolchoadas e garantia vitalícia. A mochila mais amada do mundo.', avaliacao: 4.6, reviews: 890, estoque: 95 },
  { nome: 'Carteira Masculina Couro', custo: 129, desc: 'Carteira masculina em couro legítimo, design slim, 8 porta-cartões, porta-cédulas duplo e porta-moedas com fechamento. Elegância que cabe no bolso.', avaliacao: 4.3, reviews: 334, estoque: 67 },
  { nome: 'Meia Social Kit 5 Pares', custo: 49, desc: 'Kit de meias sociais 5 pares em algodão egípcio, cano médio, elastano para firmeza, ponta reforçada e cores neutras. Conforto para o dia de trabalho.', avaliacao: 4.1, reviews: 178, estoque: 200 },
  { nome: 'Pijama de Seda Feminino', custo: 149, desc: 'Pijama de seda natural feminino com blusa de botões e calça de cintura elástica, gola de camisa e acabamento refinado. Conforto de luxo para suas noites.', avaliacao: 4.4, reviews: 145, estoque: 45 },
  { nome: 'Biquíni Salinas Tricot', custo: 129, desc: 'Biquíni Salinas em tricot artesanal, com bojo modelador, laterais ajustáveis e calcinha de cintura alta. Peça exclusiva e cheia de personalidade.', avaliacao: 4.2, reviews: 89, estoque: 55 }
];
for (const p of moda) {
  novosProdutos.push({ id: id++, nome: p.nome, categoria: 'Moda e Vestuário', preco: calcPreco(p.custo, 'Moda e Vestuário'), imagem: `/images/products/produto-${id-1}.svg`, avaliacao: p.avaliacao, reviews: p.reviews, frete: 'Grátis', descricao: p.desc, estoque: p.estoque, destaque: false });
}

// ============ 4. ESPORTES E FITNESS (301-320) ============
const esportes = [
  { nome: 'Kit Anilhas Revestidas 20kg', custo: 299, desc: 'Kit de anilhas revestidas em PVC com 20kg (2x 5kg + 2x 3kg + 2x 2kg), furo de 30mm, superfície silenciosa e antiderrapante. Ideal para treinos em casa.', avaliacao: 4.3, reviews: 445, estoque: 67 },
  { nome: 'Barra Fixa de Aço Reforçada', custo: 149, desc: 'Barra fixa de aço carbono com capacidade para 150kg, encaixe sem parafusos, empunhaduras em EVA antiderrapante e design retrátil. Monte seu home gym.', avaliacao: 4.4, reviews: 334, estoque: 45 },
  { nome: 'Corda de Pular Speed', custo: 49, desc: 'Corda de pular speed profissional com cabos de aço revestidos, rolamentos de alta velocidade, cabos de alumínio ergonômicos e ajuste de tamanho. Para treinos de alta performance.', avaliacao: 4.2, reviews: 267, estoque: 90 },
  { nome: 'Luvas de Academia Couro', custo: 69, desc: 'Luvas de academia em couro legítimo com palma acolchoada, abertura nos dedos para ventilação, punho com velcro ajustável e reforço nos pontos de pressão. Proteção e aderência.', avaliacao: 4.1, reviews: 189, estoque: 78 },
  { nome: 'Caneleira Magna 3kg Par', custo: 89, desc: 'Caneleira magnética de 3kg cada (par), com revestimento em nylon resistente, enchimento de areia de ferro, fecho de velcro reforçado e costuras duplas. Para treinos aeróbicos e localizados.', avaliacao: 4.3, reviews: 223, estoque: 56 },
  { nome: 'Faixa Elástica Longa', custo: 49, desc: 'Faixa elástica longa de resistência progressiva em latex natural, 2m de comprimento, 15cm de largura e nível médio de resistência. Para alongamento e musculação.', avaliacao: 4.0, reviews: 156, estoque: 110 },
  { nome: 'Roupão de Banho Microfibra', custo: 79, desc: 'Roupão de banho em microfibra extra absorvente, capuz, 2 bolsos frontais, cinto costurado e secagem rápida. Ideal para academia e pós-banho.', avaliacao: 4.2, reviews: 312, estoque: 85 },
  { nome: 'Bolsa Térmica Lancheira 12L', custo: 69, desc: 'Bolsa térmica lancheira 12L em poliéster com isolamento térmico de alumínio, compartimento principal amplo, bolso frontal, alça ajustável e zíper duplo. Leve sua marmita com conforto.', avaliacao: 4.1, reviews: 234, estoque: 67 },
  { nome: 'Suplemento Creatina Monohidratada 300g', custo: 89, desc: 'Creatina monohidratada em pó pura 100% importada, 300g (60 porções), micronizada para melhor absorção, sem sabor e sem aditivos. A creatina mais estudada do mundo.', avaliacao: 4.7, reviews: 890, estoque: 120 },
  { nome: 'Pré-Treino 300g', custo: 79, desc: 'Pré-treino em pó 300g com cafeína, beta-alanina, arginina e taurina, fórmula completa para energia e foco, sabor frutas vermelhas. Exploda seus treinos.', avaliacao: 4.3, reviews: 567, estoque: 95 },
  { nome: 'Barra de Proteína 12 Unidades', custo: 59, desc: 'Kit 12 barras de proteína 35g cada, 15g de proteína por barra, baixo teor de açúcar, cobertura de chocolate meio amargo. O snack perfeito pós-treino.', avaliacao: 4.2, reviews: 445, estoque: 150 },
  { nome: 'Coqueteleira 700ml', custo: 29, desc: 'Coqueteleira 700ml em Tritan livre de BPA, tampa com rosca à prova de vazamentos, rede misturadora de aço inox e alça de transporte. Agite seus suplementos.', avaliacao: 4.1, reviews: 312, estoque: 200 },
  { nome: 'Tapete Yoga 6mm', custo: 99, desc: 'Tapete yoga 6mm em TPE ecológico, 183x60cm, dupla camada antiderrapante, superfície macia e alça para transporte. Conforto e estabilidade para sua prática.', avaliacao: 4.3, reviews: 378, estoque: 88 },
  { nome: 'Bola de Pilates 55cm', custo: 79, desc: 'Bola suíça/pilates 55cm em PVC antiestouro, capacidade de 300kg, bomba manual inclusa e superfície texturizada antiderrapante. Para exercícios de equilíbrio e core.', avaliacao: 4.2, reviews: 234, estoque: 67 },
  { nome: 'Elástico Tubo com Pegas', custo: 39, desc: 'Kit elástico tubo com pegas em látex natural, 5 níveis de resistência (10-50kg), pegas de espuma e mosquetões de aço. Academia portátil.', avaliacao: 4.0, reviews: 189, estoque: 95 },
  { nome: 'Tornozeleira Peso 1kg Par', custo: 39, desc: 'Tornozeleira de 1kg cada (par) em nylon respirável, enchimento de microesferas de aço, fecho de velcro e design anatômico. Intensifique seus treinos aeróbicos.', avaliacao: 4.1, reviews: 156, estoque: 78 },
  { nome: 'Caixa de CrossFit 45cm', custo: 299, desc: 'Caixa de CrossFit em madeira compensada naval de 15mm, 45x60x75cm, superfície antiderrapante, bordas arredondadas e suporte para 200kg. Para saltos e treinos funcionais.', avaliacao: 4.4, reviews: 134, estoque: 22 },
  { nome: 'Kit Yoga Completo 7 Peças', custo: 149, desc: 'Kit yoga completo com tapete 6mm, 2 blocos EVA, cinta de algodão 2m, cobertor de yoga, almofada de meditação e sacola. Tudo que você precisa para começar.', avaliacao: 4.5, reviews: 267, estoque: 45 },
  { nome: 'Bicicleta Infantil Aro 16', custo: 599, desc: 'Bicicleta infantil aro 16 com quadro de aço, rodinhas laterais removíveis, freio V-brake dianteiro e traseiro, selim ajustável e guidão com protetor. Primeiras pedaladas com segurança.', avaliacao: 4.3, reviews: 312, estoque: 33 },
  { nome: 'Patins Infantil Ajustável', custo: 199, desc: 'Patins infantil ajustável em 4 tamanhos (do 28 ao 35), freio de segurança, rodas de PU 70mm, rolamentos ABEC-7 e fecho triplo. Diversão que cresce com a criança.', avaliacao: 4.1, reviews: 178, estoque: 44 }
];
for (const p of esportes) {
  novosProdutos.push({ id: id++, nome: p.nome, categoria: 'Esportes e Fitness', preco: calcPreco(p.custo, 'Esportes e Fitness'), imagem: `/images/products/produto-${id-1}.svg`, avaliacao: p.avaliacao, reviews: p.reviews, frete: 'Grátis', descricao: p.desc, estoque: p.estoque, destaque: false });
}

// ============ 5. CASA E DECORAÇÃO (321-340) ============
const casa = [
  { nome: 'Luminária de Mesa LED', custo: 89, desc: 'Luminária de mesa LED articulável com braço flexível, base de metal, 3 níveis de brilho, temperatura de cor ajustável (3000K-6500K) e entrada USB. Iluminação inteligente para seu espaço.', avaliacao: 4.3, reviews: 334, estoque: 67 },
  { nome: 'Tapete Felpudo Sala 1,5m', custo: 129, desc: 'Tapete felpudo 1,5m x 1m em poliéster macio, feltro antiderrapante na base, cores neutras e design liso. Aconchego e conforto para sua sala.', avaliacao: 4.2, reviews: 267, estoque: 45 },
  { nome: 'Vaso Decorativo Grande 40cm', custo: 69, desc: 'Vaso decorativo grande 40cm de altura em cerâmica esmaltada, acabamento fosco, base estável e design minimalista. Para plantas ou como peça decorativa.', avaliacao: 4.1, reviews: 189, estoque: 55 },
  { nome: 'Quadro Decorativo Kit 3 Peças', custo: 149, desc: 'Kit 3 quadros decorativos 30x40cm com moldura de MDP preta, impressão de alta resolução em lona, ganchos e nylon para fixação. Arte contemporânea para suas paredes.', avaliacao: 4.4, reviews: 312, estoque: 34 },
  { nome: 'Almofada Bordada 45cm', custo: 39, desc: 'Almofada decorativa 45cm com bordado artesanal, capa em algodão com zíper, enchimento de fibra siliconada. Detalhe que transforma o ambiente.', avaliacao: 4.2, reviews: 234, estoque: 78 },
  { nome: 'Cortina Romana 1,5m', custo: 89, desc: 'Cortina romana 1,5m de largura em linho misto, mecanismo de correr silencioso, bloqueio de luz 80%, ferragem inclusa. Elegância e funcionalidade para suas janelas.', avaliacao: 4.3, reviews: 178, estoque: 33 },
  { nome: 'Espelho Decorativo Oval 60x90cm', custo: 149, desc: 'Espelho decorativo oval 60x90cm com moldura em alumínio dourado, vidro de 4mm com bisotê, ganchos de fixação inclusos. Amplie e ilumine seus ambientes.', avaliacao: 4.4, reviews: 223, estoque: 28 },
  { nome: 'Prateleira Flutuante Kit 2', custo: 79, desc: 'Kit 2 prateleiras flutuantes 60x20cm em MDP com pintura UV, suporte invisível, capacidade de 15kg cada e parafusos inclusos. Organização com estilo.', avaliacao: 4.1, reviews: 189, estoque: 67 },
  { nome: 'Cesto Organizador Palha Trançada', custo: 49, desc: 'Cesto organizador em palha trançada natural 30x30x30cm, alças de corda, revestimento interno em algodão e design boho. Organização com charme rústico.', avaliacao: 4.0, reviews: 156, estoque: 45 },
  { nome: 'Jardim Vertical 12 Vasos', custo: 99, desc: 'Jardim vertical para 12 vasos em feltro geotêxtil, 60x100cm, sistema de irrigação integrado, bolsos reforçados e ganchos de fixação. Verde na parede.', avaliacao: 4.3, reviews: 234, estoque: 33 },
  { nome: 'Abajur de Teto Pendente', custo: 129, desc: 'Abajur de teto pendente em metal e vidro fumê, cúpula cônica, soquete E27, cabo ajustável de 1,5m e base para lâmpada. Iluminação decorativa com personalidade.', avaliacao: 4.2, reviews: 145, estoque: 22 },
  { nome: 'Manta de Sofá Macia 1,5x2m', custo: 79, desc: 'Manta de sofá em acrílico macio 1,5x2m, tecido jacquard com franjas, gramatura 400g/m². Aconchego para dias frios ou para decorar.', avaliacao: 4.1, reviews: 178, estoque: 56 },
  { nome: 'Porta-Retrato Digital 7"', custo: 199, desc: 'Porta-retrato digital 7" com tela IPS, resolução 1024x600, memória interna 8GB, suporte a cartão SD, reprodução de vídeo e áudio. Suas memórias em movimento.', avaliacao: 4.0, reviews: 189, estoque: 34 },
  { nome: 'Vaso Autoirrigável 20cm', custo: 39, desc: 'Vaso autoirrigável 20cm em plástico reciclado, reservatório de água com indicador de nível, cordão de fibra de vidro e substrato incluso. Plantas felizes sem esforço.', avaliacao: 4.2, reviews: 312, estoque: 88 },
  { nome: 'Luminária de Parede LED', custo: 69, desc: 'Luminária de parede LED 12W com luz quente 3000K, design cilíndrico em alumínio escovado, ângulo ajustável e instalação simplificada. Destaque para suas paredes.', avaliacao: 4.1, reviews: 156, estoque: 45 },
  { nome: 'Cadeira de Balanço em Madeira', custo: 349, desc: 'Cadeira de balanço em madeira eucalipto tratada, encosto alto, assento em slats, braços largos e pintura UV. Relaxe em estilo na varanda ou jardim.', avaliacao: 4.5, reviews: 223, estoque: 15 },
  { nome: 'Mesa Lateral de Centro', custo: 199, desc: 'Mesa lateral de centro 50cm diâmetro em MDP com tampo de vidro temperado, estrutura em aço preto fosco e prateleira inferior. Peça versátil e moderna.', avaliacao: 4.3, reviews: 189, estoque: 28 },
  { nome: 'Nicho Decorativo Hexagonal Kit 4', custo: 89, desc: 'Kit 4 nichos decorativos hexagonais 25cm em MDP branco, suporte de parede invisível, montagem simples. Geometria na decoração.', avaliacao: 4.1, reviews: 145, estoque: 56 },
  { nome: 'Mini Vaso Suculentas Kit 6', custo: 29, desc: 'Kit 6 mini vasos de cerâmica 6cm para suculentas e cactos, com furo de drenagem, pratinho individual e coloridos Sortidos. Pequenos que encantam.', avaliacao: 4.2, reviews: 234, estoque: 100 },
  { nome: 'Kit Velas Aromáticas 3un', custo: 49, desc: 'Kit 3 velas aromáticas 200g cada em vidro, cera de soja natural, pavio de algodão, fragrâncias baunilha, lavanda e canela. Aconchego perfumado para sua casa.', avaliacao: 4.3, reviews: 312, estoque: 67 }
];
for (const p of casa) {
  novosProdutos.push({ id: id++, nome: p.nome, categoria: 'Casa e Decoração', preco: calcPreco(p.custo, 'Casa e Decoração'), imagem: `/images/products/produto-${id-1}.svg`, avaliacao: p.avaliacao, reviews: p.reviews, frete: 'Grátis', descricao: p.desc, estoque: p.estoque, destaque: false });
}

// ============ 6. COZINHA E UTENSÍLIOS (341-360) ============
const cozinha = [
  { nome: 'Jogo de Facas 6 Peças Inox', custo: 149, desc: 'Jogo de facas 6 peças em aço inox alemão, cabos de polipropileno ergonômicos, lâminas forjadas e afiadas, incluindo faca chef, pão, legumes e utilitárias. A base de toda boa cozinha.', avaliacao: 4.4, reviews: 445, estoque: 55 },
  { nome: 'Panela Elétrica de Arroz 2L', custo: 129, desc: 'Panela elétrica de arroz 2L (até 10 xícaras), panela de teflon antiaderente, cozimento automático, função manter aquecido, tampa de vidro e acessórios inclusos. Arroz soltinho todo dia.', avaliacao: 4.3, reviews: 567, estoque: 78 },
  { nome: 'Mixer Turbolento 500W', custo: 79, desc: 'Mixer turbolento 500W com lâminas de aço inox, haste removível, 2 velocidades + turbo, copo medidor 800ml e batedor de ovos. Praticidade para sopas e vitaminas.', avaliacao: 4.2, reviews: 334, estoque: 67 },
  { nome: 'Jarra Elétrica 1,7L Inox', custo: 69, desc: 'Chaleira elétrica 1,7L em aço inox escovado, 1500W, base giratória 360°, desligamento automático, proteção contra fervura a seco e filtro anti-calcário. Água quente em minutos.', avaliacao: 4.3, reviews: 445, estoque: 90 },
  { nome: 'Conjunto Panelas Antiaderentes 3 Peças', custo: 199, desc: 'Conjunto 3 panelas antiaderentes (20cm, 24cm, 28cm) com revestimento cerâmico 3 camadas, cabos de baquelite, tampas de vidro temperado e fundo difusor. Cozinhe com saúde.', avaliacao: 4.4, reviews: 312, estoque: 45 },
  { nome: 'Faqueiro Inox 24 Peças', custo: 99, desc: 'Faqueiro inox 24 peças (6 facas, 6 garfos, 6 colheres de sopa, 6 colheres de chá) em aço inox AISI 304, cabos escovados e design clássico. Servir com elegância.', avaliacao: 4.2, reviews: 267, estoque: 56 },
  { nome: 'Jogo de Pratos 6 Peças', custo: 89, desc: 'Jogo 6 pratos rasos 27cm em porcelana esmaltada, borda decorativa, acabamento brilhante e resistente a micro-ondas e lava-louças. O essencial com estilo.', avaliacao: 4.1, reviews: 223, estoque: 67 },
  { nome: 'Taças de Vinho Kit 4', custo: 69, desc: 'Kit 4 taças de vinho tinto 520ml em cristal transparente, haste longa, borda lapidada e design clássico. Brinde aos bons momentos.', avaliacao: 4.3, reviews: 189, estoque: 44 },
  { nome: 'Conjunto de Medidores Culinários', custo: 19, desc: 'Conjunto 5 medidores plásticos (1 xícara, 1/2, 1/3, 1/4 e colher de sopa) em material atóxico, alças integradas e anel organizador. Precisão nas receitas.', avaliacao: 4.0, reviews: 156, estoque: 120 },
  { nome: 'Peneira de Aço Inox 20cm', custo: 29, desc: 'Peneira aço inox 20cm diâmetro, tela fina, aro resistente com gancho lateral e cabo longo. Coar com durabilidade.', avaliacao: 4.1, reviews: 134, estoque: 89 },
  { nome: 'Descanso de Panela Silicone 3 Peças', custo: 19, desc: 'Kit 3 descansos de panela em silicone resistente a 230°C, design geométrico, antiderrapante e fácil de limpar. Proteja sua mesa com estilo.', avaliacao: 4.0, reviews: 112, estoque: 95 },
  { nome: 'Abridor de Garrafas Wall Mount', custo: 29, desc: 'Abridor de garrafas de parede em metal cromado com coletor magnético de tampinhas, parafusos inclusos e design retrô. Para o seu bar.', avaliacao: 4.2, reviews: 178, estoque: 56 },
  { nome: 'Pilão de Madeira 15cm', custo: 39, desc: 'Pilão de madeira maciça 15cm de altura em tauari, sem verniz ou químicos, base estável e mão de pilão anatômica. Tradição na cozinha.', avaliacao: 4.1, reviews: 134, estoque: 67 },
  { nome: 'Rolo de Massa de Madeira 40cm', custo: 29, desc: 'Rolo de massa de madeira 40cm em pinus tratado, cabos giratórios, superfície lisa sem emendas. Abra massas e doces com facilidade.', avaliacao: 4.0, reviews: 89, estoque: 78 },
  { nome: 'Espátula de Silicone Kit 3', custo: 39, desc: 'Kit 3 espátulas de silicone grau alimentício 230°C, cabos de madeira, cores variadas e design anatômico. Não risca suas panelas.', avaliacao: 4.1, reviews: 156, estoque: 88 },
  { nome: 'Saco de Confeitar Descartável 50un', custo: 29, desc: '50 sacos de confeitar descartáveis 30cm em plástico resistente, pontas cortáveis, compatível com bicos. Decore bolos e doces profissionalmente.', avaliacao: 4.0, reviews: 112, estoque: 100 },
  { nome: 'Fôrma de Bolo Redonda Antiaderente', custo: 29, desc: 'Fôrma de bolo redonda 22cm antiaderente em aço carbono, revestimento tefal, borda alta 7cm. Bolos que desinformam perfeitamente.', avaliacao: 4.2, reviews: 178, estoque: 67 },
  { nome: 'Tigela de Vidro Kit 3', custo: 49, desc: 'Kit 3 tigelas de vidro temperado (1L, 2L, 3L) atóxico, resistente a micro-ondas e lava-louças, bordas para servir. Versatilidade em vidro.', avaliacao: 4.2, reviews: 189, estoque: 55 },
  { nome: 'Escorredor de Louças Inox', custo: 39, desc: 'Escorredor de louças em aço inox 40x30x15cm, bandeja coletora de água, divisórias para pratos e talheres, pés antiderrubo. Organização na pia.', avaliacao: 4.1, reviews: 145, estoque: 67 },
  { nome: 'Pote Hermético Kit 5', custo: 49, desc: 'Kit 5 potes herméticos 500ml a 2L em vidro e plástico livre de BPA, tampa hermética com trava, transparentes. Alimentos frescos por mais tempo.', avaliacao: 4.3, reviews: 312, estoque: 78 }
];
for (const p of cozinha) {
  novosProdutos.push({ id: id++, nome: p.nome, categoria: 'Cozinha e Utensílios', preco: calcPreco(p.custo, 'Cozinha e Utensílios'), imagem: `/images/products/produto-${id-1}.svg`, avaliacao: p.avaliacao, reviews: p.reviews, frete: 'Grátis', descricao: p.desc, estoque: p.estoque, destaque: false });
}

// ============ 7. LIVROS E PAPELARIA (361-380) ============
const livros = [
  { nome: 'Livro A Biblioteca da Meia-Noite', custo: 39, desc: 'No livro A Biblioteca da Meia-Noite, Matt Haig nos leva a uma jornada entre vida e morte, onde Nora Seed descobre uma biblioteca mágica repleta de livros que lhe permitem explorar todas as vidas que poderia ter vivido. Uma reflexão profunda sobre escolhas, arrependimentos e a beleza de estar vivo.', avaliacao: 4.6, reviews: 890, estoque: 120 },
  { nome: 'Livro Verity', custo: 39, desc: 'Verity é um thriller psicológico de Colleen Hoover que acompanha Lowen Ashleigh, uma escritora contratada para completar a série de livros da famosa autora Verity Crawford, que sofreu um acidente. Ao mergulhar nos arquivos de Verity, Lowen descobre segredos perturbadores.', avaliacao: 4.5, reviews: 678, estoque: 95 },
  { nome: 'Livro Tudo é Rio', custo: 34, desc: 'Tudo é Rio, de Carla Madeira, é uma obra envolvente que entrelaça amor, perda e redenção. A história de Dalva, Venâncio e Lucy, cujas vidas se cruzam de forma trágica e transformadora. Literatura brasileira no seu melhor.', avaliacao: 4.7, reviews: 567, estoque: 88 },
  { nome: 'Livro O Homem Mais Rico da Babilônia', custo: 29, desc: 'O Homem Mais Rico da Babilônia, de George S. Clason, é um clássico das finanças pessoais que usa parábolas ambientadas na antiga Babilônia para ensinar princípios atemporais de riqueza e prosperidade.', avaliacao: 4.5, reviews: 445, estoque: 110 },
  { nome: 'Livro Os Segredos da Mente Milionária', custo: 34, desc: 'Os Segredos da Mente Milionária, de T. Harv Eker, revela como nossos padrões de pensamento sobre dinheiro determinam nosso sucesso financeiro. Aprenda a reprogramar sua mente para a prosperidade.', avaliacao: 4.4, reviews: 334, estoque: 95 },
  { nome: 'Livro Hábitos Atômicos', custo: 44, desc: 'Hábitos Atômicos, de James Clear, é um guia prático para criar bons hábitos e eliminar os maus. Baseado em pesquisas científicas, o autor mostra como pequenas mudanças podem levar a resultados extraordinários.', avaliacao: 4.8, reviews: 1200, estoque: 140 },
  { nome: 'Livro O Poder do Agora', custo: 34, desc: 'O Poder do Agora, de Eckhart Tolle, é um guia para a iluminação espiritual que ensina como viver no presente. Um livro que transforma a maneira como você enxerga a vida.', avaliacao: 4.6, reviews: 789, estoque: 85 },
  { nome: 'Box Harry Potter 7 Livros', custo: 199, desc: 'Box coleção completa Harry Potter 7 livros de J.K. Rowling: A Pedra Filosofal, A Câmara Secreta, O Prisioneiro de Azkaban, O Cálice de Fogo, A Ordem da Fênix, O Enigma do Príncipe e As Relíquias da Morte.', avaliacao: 4.9, reviews: 2100, estoque: 45 },
  { nome: 'Box Sherlock Holmes', custo: 89, desc: 'Box Sherlock Holmes com 4 livros contendo os contos e romances completos de Sir Arthur Conan Doyle: Um Estudo em Vermelho, O Cão dos Baskervilles e muito mais.', avaliacao: 4.5, reviews: 445, estoque: 56 },
  { nome: 'Box Jogos Vorazes', custo: 99, desc: 'Box Jogos Vorazes com a trilogia completa de Suzanne Collins: Jogos Vorazes, Em Chamas e A Esperança. Distopia que virou fenômeno mundial.', avaliacao: 4.6, reviews: 567, estoque: 33 },
  { nome: 'Agenda Planner 2027', custo: 59, desc: 'Agenda planner 2027 capa dura em couro sintético, 240 páginas, planejamento mensal e semanal, espaço para metas, contatos e notas. Organize seu ano.', avaliacao: 4.3, reviews: 234, estoque: 67 },
  { nome: 'Bloco de Notas A5 Premium', custo: 19, desc: 'Bloco de notas A5 80 folhas em papel off-white 90g/m², capa dura, fecho elástico, elástico marcador de página e bolsa interna. Anote suas ideias com estilo.', avaliacao: 4.2, reviews: 178, estoque: 88 },
  { nome: 'Caneta Esferográfica Colorida Kit 10', custo: 15, desc: 'Kit 10 canetas esferográficas coloridas 1.0mm, tinta à base de água, corpo hexagonal transparente e tampas coloridas. Escreva com todas as cores.', avaliacao: 4.1, reviews: 312, estoque: 200 },
  { nome: 'Marcador de Texto Kit 6 Cores', custo: 19, desc: 'Kit 6 marcadores de texto fluorescentes, cores variadas, tinta à base de água, ponta chanfrada fina/ grossa. Destaque o que importa.', avaliacao: 4.0, reviews: 189, estoque: 150 },
  { nome: 'Fichário A4 20 Folhas', custo: 29, desc: 'Fichário A4 20 folhas pautadas, arcos de aço cromados, capa de PVC resistente e divisórias inclusas. Organização para seus estudos.', avaliacao: 4.1, reviews: 156, estoque: 67 },
  { nome: 'Mochila Universitária 40L', custo: 149, desc: 'Mochila universitária 40L em poliéster 600D, compartimento para notebook de 15.6", bolsos organizadores, alças acolchoadas, porta-garrafa e carregamento USB. Para o dia a dia acadêmico.', avaliacao: 4.3, reviews: 267, estoque: 45 },
  { nome: 'Estojo de Lona Personalizado', custo: 29, desc: 'Estojo de lona 20x10x6cm em algodão cru, fecho em zíper, capacidade para 30 canetas. Simples, funcional e sustentável.', avaliacao: 4.0, reviews: 134, estoque: 78 },
  { nome: 'Caderno Inteligente 120 Folhas', custo: 69, desc: 'Caderno inteligente 120 folhas pautadas, capa dura, folhas destacáveis em 3 blocos, com elástico e bolsa. O caderno que se adapta a você.', avaliacao: 4.3, reviews: 189, estoque: 55 },
  { nome: 'Folha Sulfite A4 Pacote 500', custo: 29, desc: 'Pacote 500 folhas sulfite A4 75g/m², papel alcalino de alta alvura, corte preciso e embalagem à prova de umidade. O essencial para impressão.', avaliacao: 4.2, reviews: 334, estoque: 200 },
  { nome: 'Calculadora Científica CASIO FX-991', custo: 59, desc: 'Calculadora científica CASIO FX-991LAX com 592 funções, display natural LCD, resolução de equações, integral, derivada e matrizes. A escolha dos engenheiros.', avaliacao: 4.5, reviews: 445, estoque: 56 }
];
for (const p of livros) {
  novosProdutos.push({ id: id++, nome: p.nome, categoria: 'Livros e Papelaria', preco: calcPreco(p.custo, 'Livros e Papelaria'), imagem: `/images/products/produto-${id-1}.svg`, avaliacao: p.avaliacao, reviews: p.reviews, frete: 'Grátis', descricao: p.desc, estoque: p.estoque, destaque: false });
}

// ============ 8. ELETRÔNICOS (381-400) ============
const eletronicos = [
  { nome: 'Soundbar Samsung HW-B650 2.1', custo: 899, desc: 'Soundbar Samsung HW-B650 2.1 canais com subwoofer wireless, 380W de potência, Dolby Audio, Bluetooth e modo D. Game. Áudio imersivo para sua TV.', avaliacao: 4.3, reviews: 312, estoque: 45 },
  { nome: 'Home Theater LG S77S 5.1', custo: 1499, desc: 'Home Theater LG S77S 5.1 canais com 600W RMS, Dolby Atmos, DTS:X, subwoofer wireless, Bluetooth e inteligente AI Sound Pro. Cinema em casa.', avaliacao: 4.4, reviews: 234, estoque: 22 },
  { nome: 'Projetor Multimídia Full HD 1080p', custo: 1599, desc: 'Projetor multimídia Full HD 1080p com 5500 lumens, tela de 120 polegadas, correção trapezoidal, zoom óptico, alto-falante 10W e conexão HDMI/USB. Sua sala de cinema.', avaliacao: 4.2, reviews: 445, estoque: 33 },
  { nome: 'Caixa de Som Portátil JBL Flip 6', custo: 599, desc: 'Caixa de som portátil JBL Flip 6 com 30W de potência, graves potentes, som 360°, Bluetooth 5.1, IP67 à prova d\'água e bateria de 12 horas. Música em todo lugar.', avaliacao: 4.6, reviews: 678, estoque: 67 },
  { nome: 'Fone Bluetooth JBL Tune 660NC', custo: 499, desc: 'Fone Bluetooth JBL Tune 660NC com cancelamento de ruído ativo, som Pure Bass, 40 horas de bateria, Bluetooth 5.0 e design dobrável. Som sem ruídos.', avaliacao: 4.4, reviews: 445, estoque: 56 },
  { nome: 'Fone Bluetooth Edifier W820NB', custo: 299, desc: 'Fone Bluetooth Edifier W820NB com cancelamento de ruído ativo, driver de 40mm, 49 horas de bateria, Bluetooth 5.2 e design over-ear. O melhor custo-benefício em áudio.', avaliacao: 4.5, reviews: 890, estoque: 78 },
  { nome: 'Smartwatch Amazfit T-Rex 3', custo: 899, desc: 'Smartwatch Amazfit T-Rex 3 robusto com tela AMOLED 1,5", GPS dual-band, 170 modos esportivos, bateria de 20 dias, resistência militar e monitoramento de saúde completo.', avaliacao: 4.4, reviews: 334, estoque: 45 },
  { nome: 'Pulseira Xiaomi Mi Band 10', custo: 249, desc: 'Xiaomi Mi Band 10 com tela AMOLED 1,96" 60Hz, monitor cardíaco, SpO2, sono, estresse, 150 modos esportivos, GPS conectado e bateria de 16 dias. Saúde no seu pulso.', avaliacao: 4.3, reviews: 567, estoque: 110 },
  { nome: 'Câmera Canon EOS R100', custo: 3299, desc: 'Câmera Canon EOS R100 mirrorless com sensor APS-C 24.1MP, DIGIC 8, gravação 4K 24fps, tela LCD 3", Wi-Fi e Bluetooth. O primeiro passo na fotografia mirrorless.', avaliacao: 4.3, reviews: 189, estoque: 28 },
  { nome: 'Câmera Sony ZV-1 II', custo: 4499, desc: 'Câmera Sony ZV-1 II compacta para vlog com sensor 1" 20.1MP, lente ultrawide 18-50mm, áudio direcional, estabilização ativa e tela articulada. A ferramenta dos criadores.', avaliacao: 4.6, reviews: 312, estoque: 18 },
  { nome: 'Drone DJI Mini 5', custo: 6999, desc: 'Drone DJI Mini 5 com peso abaixo de 249g, câmera 4K HDR 60fps, transmissão O4 de 20km, bateria de 45 minutos, sensores omnidirecionais e QuickShots. Voe sem limites.', avaliacao: 4.8, reviews: 445, estoque: 15 },
  { nome: 'Carregador Wireless 15W', custo: 79, desc: 'Carregador wireless 15W rápido, padrão Qi, base antiderrapante com LED inteligente, proteção contra sobrecarga. Compatível com iPhone, Samsung e Xiaomi. Adeus cabos.', avaliacao: 4.1, reviews: 234, estoque: 78 },
  { nome: 'Power Bank Anker 26800mAh', custo: 199, desc: 'Power Bank Anker PowerCore 26800mAh com 3 portas USB (2x 3A), PowerIQ e VoltageBoost, carregamento rápido para 2 dispositivos simultaneamente. Energia portátil para dias fora.', avaliacao: 4.5, reviews: 567, estoque: 56 },
  { nome: 'Adaptador Bluetooth 5.3', custo: 39, desc: 'Adaptador Bluetooth 5.3 USB, alcance de 50m, compatível com Windows, Linux e Mac, driver automático. Transforme seu PC em um hub Bluetooth.', avaliacao: 4.0, reviews: 178, estoque: 95 },
  { nome: 'Hub USB-C 9 em 1', custo: 149, desc: 'Hub USB-C 9 em 1 com HDMI 4K, 2 USB-A 3.0, USB-C PD 100W, leitor SD/TF, áudio 3.5mm e Ethernet Gigabit. Conectividade total para seu notebook.', avaliacao: 4.3, reviews: 312, estoque: 45 },
  { nome: 'Smart Plug Wi-Fi', custo: 49, desc: 'Smart Plug Wi-Fi compatível com Alexa e Google Home, monitoramento de energia, timer, controle remoto pelo app. Transforme sua casa em smart.', avaliacao: 4.2, reviews: 234, estoque: 88 },
  { nome: 'Lâmpada Inteligente RGB', custo: 39, desc: 'Lâmpada inteligente Wi-Fi RGB 9W, 16 milhões de cores, branco ajustável 2700K-6500K, compatível com Alexa e Google, controle por voz e app. Iluminação inteligente.', avaliacao: 4.1, reviews: 189, estoque: 110 },
  { nome: 'Amazon Echo Studio', custo: 1399, desc: 'Amazon Echo Studio com som de alta fidelidade, Dolby Atmos, processador AZ2 Neural Edge, hub Zigbee integrado e Alexa. O melhor som inteligente da Amazon.', avaliacao: 4.6, reviews: 445, estoque: 22 },
  { nome: 'Fire TV Stick 4K Max', custo: 399, desc: 'Fire TV Stick 4K Max com Wi-Fi 6E, processador quad-core, suporte a Dolby Vision/Atmos, HDR10+, Alexa integrada e controle remoto com atalhos. Streaming em 4K.', avaliacao: 4.4, reviews: 678, estoque: 67 },
  { nome: 'Fone JBL Tune 720BT', custo: 349, desc: 'Fone de ouvido JBL Tune 720BT com som Pure Bass, driver de 40mm, Bluetooth 5.3, 70 horas de bateria, carregamento rápido USB-C e design dobrável. Música sem parar.', avaliacao: 4.3, reviews: 312, estoque: 56 }
];
for (const p of eletronicos) {
  novosProdutos.push({ id: id++, nome: p.nome, categoria: 'Eletrônicos', preco: calcPreco(p.custo, 'Eletrônicos'), imagem: `/images/products/produto-${id-1}.svg`, avaliacao: p.avaliacao, reviews: p.reviews, frete: 'Grátis', descricao: p.desc, estoque: p.estoque, destaque: false });
}

// ============ 9. MÓVEIS (401-420) ============
const moveis = [
  { nome: 'Sofá-Cama 2 Lugares Retrátil', custo: 1499, desc: 'Sofá-cama 2 lugares retrátil e reclinável em suede cinza, mecanismo de abertura fácil, estrutura de eucalipto e espuma D33. Funcionalidade para espaços compactos.', avaliacao: 4.3, reviews: 312, estoque: 22 },
  { nome: 'Mesa de Cabeceira 2 Gavetas', custo: 349, desc: 'Mesa de cabeceira 2 gavetas em MDP com corrediça telescópica, puxadores cromados, pernas palito e tampo com borda. Organização noturna com elegância.', avaliacao: 4.2, reviews: 234, estoque: 45 },
  { nome: 'Armário de Cozinha 4 Portas', custo: 1999, desc: 'Armário de cozinha 4 portas em MDP, 120x35x80cm, portas com dobradiças amortecedoras, prateleiras ajustáveis e puxadores em alumínio. Organize sua cozinha.', avaliacao: 4.1, reviews: 178, estoque: 15 },
  { nome: 'Prateleira Industrial 5 Níveis', custo: 299, desc: 'Prateleira industrial 5 níveis em aço carbono, 90x35x180cm, capacidade de 50kg por nível, pés reguláveis e pintura eletrostática preta. Armazenamento robusto.', avaliacao: 4.3, reviews: 267, estoque: 33 },
  { nome: 'Banco Alto para Balcão', custo: 199, desc: 'Banco alto para balcão 65cm em madeira maciça e assento redondo, pés em aço carbono com pintura preta, apoio para os pés. Estilo industrial.', avaliacao: 4.1, reviews: 156, estoque: 44 },
  { nome: 'Poltrona de Leitura com Otomana', custo: 1299, desc: 'Poltrona de leitura giratória com otomana, estofada em veludo azul, espuma D45, estrutura de eucalipto e base giratória cromada. Seu cantinho da leitura.', avaliacao: 4.5, reviews: 189, estoque: 12 },
  { nome: 'Mesa de Escritório L Shape 140cm', custo: 1299, desc: 'Mesa de escritório L Shape 140x140cm em MDP com pintura UV, 2 gavetas, passagem para cabos e pés metálicos. Home office profissional.', avaliacao: 4.3, reviews: 312, estoque: 18 },
  { nome: 'Gaveteiro com 3 Gavetas', custo: 499, desc: 'Gaveteiro 3 gavetas em aço, corrediça telescópica, fechadura com 2 chaves, capacidade 25kg cada, pintura eletrostática preta. Organização para seu escritório.', avaliacao: 4.2, reviews: 234, estoque: 34 },
  { nome: 'Painel para TV 2m', custo: 899, desc: 'Painel para TV 2m de largura em MDP, nichos decorativos, passagem oculta para cabos, suporte para TV até 70" e pintura UV. Sala de estar renovada.', avaliacao: 4.3, reviews: 189, estoque: 15 },
  { nome: 'Mesa de Centro com Gaveta', custo: 599, desc: 'Mesa de centro 90x60x45cm em MDP, tampo com borda, gaveta com corrediça metálica, prateleira inferior e pés cônicos. Praticidade para sua sala.', avaliacao: 4.2, reviews: 178, estoque: 28 },
  { nome: 'Aparador 2 Portas 120cm', custo: 799, desc: 'Aparador 120cm em MDP, 2 portas com dobradiças amortecedoras, prateleira interna e puxadores longos em aço. Elegância para seu jantar.', avaliacao: 4.1, reviews: 145, estoque: 20 },
  { nome: 'Cadeira de Jantar Design', custo: 349, desc: 'Cadeira de jantar design em madeira maciça, assento estofado em couro ecológico, estrutura em freijó maciço e pés palito. Conforto à mesa.', avaliacao: 4.3, reviews: 223, estoque: 34 },
  { nome: 'Carrinho de Chá Auxiliar', custo: 299, desc: 'Carrinho de chá auxiliar 3 níveis em bambu natural e aço, rodízios com trava, alça para transporte e design versátil. Bar móvel ou apoio.', avaliacao: 4.2, reviews: 156, estoque: 28 },
  { nome: 'Cabideiro de Chão 4 Ganchos', custo: 89, desc: 'Cabideiro de chão em aço com pintura eletrostática preta, 4 ganchos, base estável de 40cm e altura de 175cm. Organização para seus casacos.', avaliacao: 4.1, reviews: 178, estoque: 67 },
  { nome: 'Espelho de Corpo Inteiro 160x60cm', custo: 199, desc: 'Espelho de corpo inteiro 160x60cm em moldura de alumínio, vidro de 4mm, fixação na parede ou apoio no chão com pés de metal. Veja-se por inteiro.', avaliacao: 4.3, reviews: 234, estoque: 33 },
  { nome: 'Baú Organizador 60L', custo: 249, desc: 'Baú organizador 60L em madeira pinus, tampa com pistão a gás, revestimento interno em feltro, fechadura e alças laterais. Organização com estilo.', avaliacao: 4.2, reviews: 145, estoque: 25 },
  { nome: 'Cama Box Solteiro', custo: 899, desc: 'Cama box solteiro 88x188x40cm em estrutura de eucalipto, estofada em sarja cinza, box com molas ensacadas e pés cônicos. Base resistente e confortável.', avaliacao: 4.2, reviews: 312, estoque: 34 },
  { nome: 'Colchão Ortopédico Casal', custo: 1499, desc: 'Colchão ortopédico casal 138x188x28cm em espuma D45, tecnologia viscoelástica, capa em malha alvejada com zíper e tratamento antiácaros. Conforto e saúde.', avaliacao: 4.4, reviews: 445, estoque: 22 },
  { nome: 'Colchão D33 Solteiro', custo: 999, desc: 'Colchão D33 solteiro 78x188x20cm em espuma ortopédica, densidade D33, capa em algodão com zíper e ventilação. Sono de qualidade.', avaliacao: 4.2, reviews: 267, estoque: 45 },
  { nome: 'Mesa de Piquenique Dobrável', custo: 299, desc: 'Mesa de piquenique dobrável em madeira eucalipto tratada, 120x60x72cm, capacidade para 4 pessoas, pintura UV e alça de transporte. Seu jardim mais completo.', avaliacao: 4.1, reviews: 134, estoque: 28 }
];
for (const p of moveis) {
  novosProdutos.push({ id: id++, nome: p.nome, categoria: 'Móveis', preco: calcPreco(p.custo, 'Móveis'), imagem: `/images/products/produto-${id-1}.svg`, avaliacao: p.avaliacao, reviews: p.reviews, frete: 'Grátis', descricao: p.desc, estoque: p.estoque, destaque: false });
}

// ============ 10. BELEZA E PERFUMARIA (421-440) ============
const beleza = [
  { nome: 'Perfume Invictus Paco Rabanne 100ml', custo: 499, desc: 'Perfume Invictus Paco Rabanne 100ml é um aroma masculino amadeirado fresco com notas de grapefruit, folha de louro e madeira de âmbar. A fragrância dos vencedores.', avaliacao: 4.6, reviews: 678, estoque: 45 },
  { nome: 'Perfume Miss Dior 50ml', custo: 599, desc: 'Perfume Miss Dior 50ml é um floral chipre radiante com notas de lírio, peônia e almíscar. A assinatura floral icônica da Dior.', avaliacao: 4.7, reviews: 567, estoque: 33 },
  { nome: 'Perfume Sauvage Dior 60ml', custo: 599, desc: 'Perfume Sauvage Dior 60ml é uma fragrância masculina intensa e fresca com notas de bergamota, pimenta Sichuan e âmbar. A liberdade em sua forma mais pura.', avaliacao: 4.7, reviews: 890, estoque: 56 },
  { nome: 'Perfume La Vie Est Belle Lancôme 50ml', custo: 499, desc: 'La Vie Est Belle Lancôme 50ml é um perfume floral gourmand com notas de íris, patchouli e baunilha. A fragrância da felicidade.', avaliacao: 4.5, reviews: 445, estoque: 44 },
  { nome: 'Perfume 212 NYC Men 100ml', custo: 349, desc: 'Perfume 212 NYC Men 100ml da Carolina Herrera é um aroma amadeirado picante com notas de toranja, gengibre e cedro. A energia de Nova York em um frasco.', avaliacao: 4.4, reviews: 312, estoque: 38 },
  { nome: 'Perfume Bad Boy Carolina Herrera 100ml', custo: 449, desc: 'Perfume Bad Boy Carolina Herrera 100ml é uma fragrância amadeirada com notas de cânabis, pimenta preta e cacau. O perfume que desafia as regras.', avaliacao: 4.4, reviews: 267, estoque: 28 },
  { nome: 'Kit Maquiagem Completo 20 Peças', custo: 149, desc: 'Kit maquiagem profissional 20 peças com 12 sombras, 2 blushes, 2 batons, corretivo, base compacta, pó translúcido e espelho. Maquiagem completa para qualquer ocasião.', avaliacao: 4.1, reviews: 334, estoque: 67 },
  { nome: 'Base Líquida Vult HD 30ml', custo: 29, desc: 'Base líquida Vult HD 30ml com cobertura média a alta, acabamento natural, textura leve e alta pigmentação. Disponível em 6 tons.', avaliacao: 4.2, reviews: 445, estoque: 88 },
  { nome: 'Corretivo Líquido Vult 10ml', custo: 19, desc: 'Corretivo líquido Vult 10ml com alta cobertura, acabamento natural, aplicador em esponja e fórmula de longa duração. Disfarce imperfeições.', avaliacao: 4.1, reviews: 312, estoque: 95 },
  { nome: 'Pó Compacto Vult 10g', custo: 29, desc: 'Pó compacto Vult 10g com acabamento matte, cobertura leve a média, fórmula oil-free e proteção solar. Toque final perfeito.', avaliacao: 4.0, reviews: 267, estoque: 78 },
  { nome: 'Rímel Volume Efeito Alongador', custo: 25, desc: 'Rímel volume alongador com cerdas em silicone, fórmula à prova d\'água, pigmentação intensa e curvex integrado. Cílios de impacto.', avaliacao: 4.2, reviews: 334, estoque: 110 },
  { nome: 'Lápis de Olho Preto', custo: 12, desc: 'Lápis de olho preto macio, textura cremosa, alta pigmentação, à prova d\'água e esfumável. O clássico indispensável.', avaliacao: 4.0, reviews: 189, estoque: 140 },
  { nome: 'Blush Líquido Matte', custo: 22, desc: 'Blush líquido matte com alta pigmentação, acabamento natural, fácil de esfumar e longa duração. Cor saudável para suas bochechas.', avaliacao: 4.1, reviews: 156, estoque: 67 },
  { nome: 'Iluminador Facial Líquido', custo: 29, desc: 'Iluminador facial líquido cintilante, textura leve, fácil de esfumar, acabamento glow. Brilho natural para sua pele.', avaliacao: 4.2, reviews: 178, estoque: 56 },
  { nome: 'Kit Pincéis Maquiagem 5 Peças', custo: 39, desc: 'Kit 5 pincéis de maquiagem profissionais com cerdas sintéticas macias, cabos de madeira, arruela de alumínio. Aplicação impecável.', avaliacao: 4.1, reviews: 234, estoque: 78 },
  { nome: 'Demaquilante Bifásico 120ml', custo: 25, desc: 'Demaquilante bifásico 120ml para olhos e lábios, remove maquiagem à prova d\'água, fórmula suave com camomila e óleo de amêndoas. Limpeza eficaz.', avaliacao: 4.2, reviews: 189, estoque: 67 },
  { nome: 'Esfoliante Facial 100g', custo: 29, desc: 'Esfoliante facial 100g com microesferas de jojoba, extrato de chá verde e vitamina E. Renove sua pele suavemente.', avaliacao: 4.1, reviews: 145, estoque: 56 },
  { nome: 'Máscara Facial Hidratante 50g', custo: 19, desc: 'Máscara facial hidratante 50g com ácido hialurônico, colágeno e babosa. Hidratação intensa em 15 minutos.', avaliacao: 4.2, reviews: 223, estoque: 88 },
  { nome: 'Sérum Facial Vitamina C 30ml', custo: 69, desc: 'Sérum facial vitamina C 30ml com 10% de vitamina C pura, ácido hialurônico e vitamina E. Antioxidante poderoso para pele iluminada.', avaliacao: 4.4, reviews: 312, estoque: 45 },
  { nome: 'Hidratante Corporal Nivea 400ml', custo: 29, desc: 'Hidratante corporal Nivea 400ml com óleo de amêndoas, fórmula de rápida absorção, 48h de hidratação e perfume suave. Pele macia o dia todo.', avaliacao: 4.3, reviews: 567, estoque: 120 }
];
for (const p of beleza) {
  novosProdutos.push({ id: id++, nome: p.nome, categoria: 'Beleza e Perfumaria', preco: calcPreco(p.custo, 'Beleza e Perfumaria'), imagem: `/images/products/produto-${id-1}.svg`, avaliacao: p.avaliacao, reviews: p.reviews, frete: 'Grátis', descricao: p.desc, estoque: p.estoque, destaque: false });
}

// ============ 11. GAMES (441-460) ============
const games = [
  { nome: 'Nintendo Switch 2', custo: 3999, desc: 'Nintendo Switch 2 com tela LCD 8" 1080p, processador personalizado Nvidia, armazenamento 256GB, suporte 4K no dock e retrocompatibilidade com jogos Switch. A nova geração da Nintendo.', avaliacao: 4.8, reviews: 890, estoque: 22 },
  { nome: 'PlayStation VR2', custo: 3499, desc: 'PlayStation VR2 com headset de realidade virtual para PS5, tela OLED 4K HDR 110°, taxa de 120Hz, rastreamento ocular e controle Sense com feedback tátil. Imersão total nos jogos.', avaliacao: 4.4, reviews: 445, estoque: 15 },
  { nome: 'Controle Xbox Series Elite 2', custo: 899, desc: 'Controle Xbox Series Elite 2 profissional com manoplas intercambiáveis, gatilhos ajustáveis, d-pad intercambiável e bateria recarregável de 40h. Performance competitiva.', avaliacao: 4.6, reviews: 567, estoque: 33 },
  { nome: 'Controle Pro Nintendo Switch', custo: 499, desc: 'Controle Pro Nintendo Switch oficial com design ergonômico, bateria de 40 horas, HD Rumble, NFC e conectividade Bluetooth. Para jogar com conforto.', avaliacao: 4.5, reviews: 334, estoque: 45 },
  { nome: 'Jogo Elden Ring (PS5)', custo: 249, desc: 'Elden Ring para PS5, o aclamado RPG de ação da FromSoftware em parceria com George R.R. Martin. Explore as Terras Intermédias em uma jornada épica.', avaliacao: 4.8, reviews: 1200, estoque: 56 },
  { nome: 'Jogo Spider-Man 3 (PS5)', custo: 349, desc: 'Spider-Man 3 para PS5, a conclusão da trilogia da Insomniac Games. Balance pela nova York, enfrente vilões clássicos e descubra o destino de Peter Parker.', avaliacao: 4.6, reviews: 678, estoque: 34 },
  { nome: 'Jogo God of War Ragnarok (PS5)', custo: 299, desc: 'God of War Ragnarok para PS5, a épica jornada de Kratos e Atreus pelos Nove Reinos. Mitologia nórdica, combate visceral e uma história emocionante.', avaliacao: 4.9, reviews: 1500, estoque: 67 },
  { nome: 'Jogo Halo Infinite (Xbox)', custo: 199, desc: 'Halo Infinite para Xbox Series, a nova aventura do Master Chief. Campanha emocionante, multiplayer gratuito e gráficos de última geração.', avaliacao: 4.3, reviews: 445, estoque: 44 },
  { nome: 'Jogo Forza Horizon 6 (Xbox)', custo: 299, desc: 'Forza Horizon 6 para Xbox Series, o festival de corridas definitivo em um novo mapa aberto. Centenas de carros, eventos dinâmicos e mundo aberto de tirar o fôlego.', avaliacao: 4.7, reviews: 789, estoque: 38 },
  { nome: 'Jogo Super Mario Wonder 2 (Switch)', custo: 349, desc: 'Super Mario Wonder 2 para Nintendo Switch, a sequência do aclamado jogo de plataforma 2D. Novas transformações, mundos criativos e diversão para toda a família.', avaliacao: 4.7, reviews: 567, estoque: 45 },
  { nome: 'Headset Gamer Astro A50 Gen 5', custo: 1499, desc: 'Headset gamer Astro A50 Gen 5 sem fio com som Dolby Atmos, drivers de 40mm, microfone unidirecional, base de carregamento e bateria de 15 horas. Áudio premium.', avaliacao: 4.5, reviews: 312, estoque: 15 },
  { nome: 'Mouse Gamer Logitech G Pro X Superlight 2', custo: 699, desc: 'Mouse gamer Logitech G Pro X Superlight 2 com sensor HERO 2 de 44.000 DPI, peso de 60g, switches ópticos e Lightspeed wireless. O mouse dos campeões.', avaliacao: 4.7, reviews: 445, estoque: 33 },
  { nome: 'Teclado Gamer Razer Huntsman V3 Pro', custo: 999, desc: 'Teclado gamer Razer Huntsman V3 Pro com switches ópticos analógicos Rapid Trigger, polling rate 8000Hz, estrutura de alumínio e iluminação Chroma. Velocidade absoluta.', avaliacao: 4.6, reviews: 334, estoque: 22 },
  { nome: 'Monitor Gamer 27" 240Hz OLED', custo: 2499, desc: 'Monitor gamer 27" OLED 240Hz, resolução QHD 2560x1440, tempo de resposta 0.03ms, HDR400 e suporte a G-Sync/FreeSync. A imagem mais fluida possível.', avaliacao: 4.7, reviews: 267, estoque: 12 },
  { nome: 'Mesa Gamer RGB 140cm', custo: 1199, desc: 'Mesa gamer RGB 140x60x75cm em MDP, tampo com pintura UV, iluminação RGB controlada por app, passagem de cabos e suporte para headset. Seu setup completo.', avaliacao: 4.3, reviews: 189, estoque: 18 },
  { nome: 'Suporte Monitor Articulado', custo: 199, desc: 'Suporte monitor articulado para 1 tela de 17 a 34", braço de alumínio com mola a gás, capacidade 9kg, instalação em mesa e gerenciamento de cabos. Ergonomia para seu setup.', avaliacao: 4.4, reviews: 234, estoque: 45 },
  { nome: 'Cadeira Gamer DXRacer Master', custo: 1999, desc: 'Cadeira gamer DXRacer Master em couro PU, espuma D50 moldada, encosto reclinável 180°, braços 4D e almofadas de pescoço e lombar. Conforto para maratonas.', avaliacao: 4.5, reviews: 445, estoque: 15 },
  { nome: 'Cartão Presente PlayStation R$ 200', custo: 200, desc: 'Cartão presente PlayStation Store no valor de R$ 200. Resgate na PS Store e compre jogos, DLCs, assinatura PlayStation Plus e muito mais.', avaliacao: 4.3, reviews: 312, estoque: 200 },
  { nome: 'Cartão Presente Xbox R$ 200', custo: 200, desc: 'Cartão presente Xbox no valor de R$ 200. Resgate na Microsoft Store e compre jogos, DLCs, Game Pass e muito mais.', avaliacao: 4.2, reviews: 267, estoque: 200 },
  { nome: 'Mouse Bungee Suporte para Cabo', custo: 89, desc: 'Mouse bungee com suporte articulado para cabo de mouse, base de metal com peso antiderrapante, design ajustável e RGB. Adeus cabo enroscado.', avaliacao: 4.0, reviews: 134, estoque: 56 }
];
for (const p of games) {
  novosProdutos.push({ id: id++, nome: p.nome, categoria: 'Games', preco: calcPreco(p.custo, 'Games'), imagem: `/images/products/produto-${id-1}.svg`, avaliacao: p.avaliacao, reviews: p.reviews, frete: 'Grátis', descricao: p.desc, estoque: p.estoque, destaque: false });
}

// ============ 12. ELETRODOMÉSTICOS (461-480) ============
const eletrodomesticos = [
  { nome: 'Geladeira Inverse 420L Electrolux', custo: 3499, desc: 'Geladeira Inverse 420L Electrolux com frost free, dispenser de água externo, painel touch, iluminação LED, compartimento de legumes e frutas e eficiência energética A++. Design sofisticado e praticidade.', avaliacao: 4.5, reviews: 445, estoque: 18 },
  { nome: 'Fogão 4 Bocas Electrolux', custo: 1799, desc: 'Fogão 4 bocas Electrolux com mesa de vidro, acendimento superautomático, forno com luz e timer, queimador tripla chama e design moderno. A escolha certa para sua cozinha.', avaliacao: 4.3, reviews: 334, estoque: 25 },
  { nome: 'Micro-ondas 30L Panasonic', custo: 699, desc: 'Micro-ondas 30L Panasonic com inverter technology, descongelamento rápido, menu inteligente, tampa de vidro e 12 níveis de potência. Cozimento uniforme e eficiente.', avaliacao: 4.4, reviews: 267, estoque: 34 },
  { nome: 'Lava-Louças 8 Serviços Brastemp', custo: 2499, desc: 'Lava-louças 8 serviços Brastemp com 5 ciclos de lavagem, painel digital, cestas ajustáveis, compartimento para talheres e filtro autolimpante. Adeus louça suja.', avaliacao: 4.3, reviews: 312, estoque: 15 },
  { nome: 'Secadora de Roupas 10kg Samsung', custo: 2999, desc: 'Secadora de roupas 10kg Samsung com bomba de calor, 14 programas de secagem, sensor de umidade, painel digital e eficiência A++. Roupas secas sem encolher.', avaliacao: 4.5, reviews: 234, estoque: 12 },
  { nome: 'Centrífuga de Roupas 8kg', custo: 599, desc: 'Centrífuga de roupas 8kg em aço inox, 2800 RPM, cesto removível, temporizador e freio de segurança. Centrifugue e agilize a secagem.', avaliacao: 4.1, reviews: 178, estoque: 33 },
  { nome: 'Ventilador de Coluna 60cm 3 Velocidades', custo: 199, desc: 'Ventilador de coluna 60cm com 3 velocidades, oscilação automática, timer, controle remoto e grade de segurança. Ventilação eficiente para sua casa.', avaliacao: 4.2, reviews: 234, estoque: 56 },
  { nome: 'Climatizador de Ar Evaporativo', custo: 399, desc: 'Climatizador evaporativo 70W com reservatório 15L, 3 velocidades, timer, controle remoto e rodízios. Refresque o ar naturalmente.', avaliacao: 4.0, reviews: 189, estoque: 28 },
  { nome: 'Purificador de Ar com Filtro HEPA', custo: 499, desc: 'Purificador de ar com filtro HEPA H13, carvão ativado e luz UV-C, cobertura 40m², modo automático, silencioso (25dB). Inspire ar puro.', avaliacao: 4.3, reviews: 267, estoque: 22 },
  { nome: 'Umidificador de Ar Ultrassônico 4L', custo: 149, desc: 'Umidificador de ar ultrassônico 4L, névoa fria, ajuste de névoa noturno/contínuo, timer, desligamento automático e silencioso. Adeus ar seco.', avaliacao: 4.2, reviews: 312, estoque: 45 },
  { nome: 'Liquidificador Turbo 1200W', custo: 199, desc: 'Liquidificador turbo 1200W com lâminas de aço inox, copo de vidro 2L, 10 velocidades + pulsar e função autolimpante. Vitaminas e sucos potentes.', avaliacao: 4.3, reviews: 334, estoque: 67 },
  { nome: 'Batedeira Planetária 500W', custo: 399, desc: 'Batedeira planetária 500W com tigela de aço inox 5L, batedor, gancho e fouet, 6 velocidades + turbo. Bolos e massas perfeitos.', avaliacao: 4.4, reviews: 267, estoque: 33 },
  { nome: 'Processador de Alimentos 800W', custo: 299, desc: 'Processador de alimentos 800W com lâminas de aço inox, copo 3L, disco de corte/rale, emulsificador e batedor. Preparo rápido e prático.', avaliacao: 4.2, reviews: 189, estoque: 28 },
  { nome: 'Panela Elétrica de Arroz 5L', custo: 159, desc: 'Panela elétrica de arroz 5L (até 25 xícaras), panela antiaderente, cozimento automático, vaporizador incluso e função manter aquecido. Arroz em grande quantidade.', avaliacao: 4.2, reviews: 156, estoque: 45 },
  { nome: 'Fogão Elétrico 2 Bocas', custo: 249, desc: 'Fogão elétrico 2 bocas vitrocerâmico, 2000W, temperatura ajustável, design portátil e leve. Cozinhe em qualquer lugar.', avaliacao: 4.1, reviews: 134, estoque: 34 },
  { nome: 'Grill Elétrico Inox', custo: 299, desc: 'Grill elétrico inox 2000W com chapa lisa e churrasqueira, 2 em 1, temperatura ajustável, bandeja coletora de gordura e design versátil. Churrasco sem fumaça.', avaliacao: 4.3, reviews: 223, estoque: 28 },
  { nome: 'Churrasqueira Elétrica 1500W', custo: 399, desc: 'Churrasqueira elétrica 1500W com grelha em aço cromado, bandeja de gordura, temperatura ajustável e design compacto. Faça churrasco no apê.', avaliacao: 4.2, reviews: 178, estoque: 22 },
  { nome: 'Fritadeira Air Fryer 8L Mondial', custo: 499, desc: 'Fritadeira Air Fryer 8L Mondial sem óleo, 1800W, painel digital touch, 12 programas, timer e temperatura ajustável. Frituras saudáveis para toda família.', avaliacao: 4.5, reviews: 678, estoque: 45 },
  { nome: 'Iogurteira Elétrica 1,5L', custo: 129, desc: 'Iogurteira elétrica 1,5L com 7 potes de vidro de 200ml, timer digital, desligamento automático e receita inclusa. Iogurte caseiro natural.', avaliacao: 4.0, reviews: 112, estoque: 34 },
  { nome: 'Máquina de Pão 700W', custo: 299, desc: 'Máquina de pão 700W com 12 programas automáticos, timer, até 1kg de pão, visor LCD e copo medidor. Pão fresquinho em casa.', avaliacao: 4.2, reviews: 156, estoque: 18 }
];
for (const p of eletrodomesticos) {
  novosProdutos.push({ id: id++, nome: p.nome, categoria: 'Eletrodomésticos', preco: calcPreco(p.custo, 'Eletrodomésticos'), imagem: `/images/products/produto-${id-1}.svg`, avaliacao: p.avaliacao, reviews: p.reviews, frete: 'Grátis', descricao: p.desc, estoque: p.estoque, destaque: false });
}

// ============ WRITE PRODUCTS TO FILE ============
const existingProducts = JSON.parse(fs.readFileSync(path.join(__dirname, '../backend/data/products.json'), 'utf-8'));
const allProducts = [...existingProducts, ...novosProdutos];

fs.writeFileSync(
  path.join(__dirname, '../backend/data/products.json'),
  JSON.stringify(allProducts, null, 2),
  'utf-8'
);

console.log(`✅ ${novosProdutos.length} novos produtos gerados (IDs ${existingProducts.length + 1} a ${existingProducts.length + novosProdutos.length})`);
console.log(`📦 Total de produtos: ${allProducts.length}`);
console.log('📁 Arquivo atualizado: backend/data/products.json');

// Summary by category
const summary = {};
for (const p of allProducts) {
  if (!summary[p.categoria]) summary[p.categoria] = 0;
  summary[p.categoria]++;
}
console.log('\n📊 Resumo por categoria:');
for (const [cat, count] of Object.entries(summary)) {
  console.log(`   ${cat}: ${count} produtos`);
}
