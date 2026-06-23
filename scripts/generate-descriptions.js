const fs = require('fs');

const products = JSON.parse(fs.readFileSync(__dirname + '/../backend/data/products.json', 'utf-8'));

function descCelular(nome, preco) {
  const baixo = preco < 1500;
  const medio = preco >= 1500 && preco < 5000;
  const alto = preco >= 5000;

  if (nome.includes('iPhone 16 Pro')) {
    return 'O iPhone 16 Pro Max representa o ápice da engenharia da Apple, trazendo o poderoso chip A18 Pro, sistema de câmera profissional com lente de 48MP e zoom óptico de 5x, tela Super Retina XDR OLED de 6,9 polegadas com ProMotion 120Hz, e bateria com autonomia de até 33 horas de reprodução de vídeo. Ideal para quem busca o melhor em fotografia, desempenho e ecossistema.';
  }
  if (nome.includes('iPhone 16 256')) {
    return 'O iPhone 16 traz o novo chip A18 com Neural Engine de 16 núcleos, tela Super Retina XDR OLED de 6,1 polegadas, câmera principal de 48MP com modos noturno e retrato aprimorados, e bateria com duração de até 22 horas. Perfeito para quem quer o melhor custo-benefício da linha premium da Apple.';
  }
  if (nome.includes('iPhone 15')) {
    return 'O iPhone 15 conta com chip A16 Bionic, tela Super Retina XDR OLED de 6,1 polegadas, Dynamic Island, câmera de 48MP com fotos em altíssima resolução e bateria de longa duração. Um smartphone que entrega excelência em cada detalhe.';
  }
  if (nome.includes('iPhone SE')) {
    return 'O iPhone SE 4 combina o potente chip A16 Bionic com um design clássico e compacto. Tela Retina HD de 4,7 polegadas, câmera de 12MP com modo retrato, Touch ID e bateria confiável. A porta de entrada perfeita para o universo Apple.';
  }
  if (nome.includes('Galaxy S25 Ultra')) {
    return 'O Samsung Galaxy S25 Ultra é o smartphone Android mais avançado do mercado, equipado com processador Snapdragon 8 Gen 4, câmera quádrupla de 200MP com zoom óptico de 10x, tela Dynamic AMOLED 2X de 6,9 polegadas com taxa de 120Hz, S Pen integrada e bateria de 5000mAh. Ideal para produtividade e criatividade.';
  }
  if (nome.includes('Galaxy S25 ') || nome === 'Samsung Galaxy S25') {
    return 'O Samsung Galaxy S25 oferece processador Snapdragon 8 Gen 4, tela Dynamic AMOLED 2X de 6,2 polegadas com 120Hz, câmera tripla de 50MP com modo noturno avançado, bateria de 4000mAh e carregamento rápido de 45W. Um flagship compacto e completo.';
  }
  if (nome.includes('Galaxy Z Fold')) {
    return 'O Samsung Galaxy Z Fold 6 redefine o conceito de produtividade móvel com sua tela dobrável de 7,6 polegadas, processador Snapdragon 8 Gen 4, câmera tripla de 50MP, multitarefa avançada com suporte a até 3 apps simultâneos e S Pen. O futuro dos smartphones está aqui.';
  }
  if (nome.includes('Galaxy A55')) {
    return 'O Samsung Galaxy A55 é um intermediário premium com tela Super AMOLED de 6,6 polegadas 120Hz, processador Exynos 1480, câmera tripla de 50MP com estabilização óptica, bateria de 5000mAh e certificação IP67. Um dos melhores custos-benefício da Samsung.';
  }
  if (nome.includes('Galaxy A35') || nome.includes('Galaxy A15')) {
    return 'O Samsung Galaxy A35 combina tela Super AMOLED de 6,6 polegadas, câmera principal de 50MP, bateria de 5000mAh e design moderno com proteção IP67. Perfeito para o dia a dia com desempenho equilibrado e preço acessível.';
  }
  if (nome.includes('Edge 50 Pro')) {
    return 'O Motorola Edge 50 Pro traz processador Snapdragon 7 Gen 3, tela pOLED de 6,7 polegadas com 144Hz, câmera principal de 50MP com estabilização óptica, câmera ultrawide de 13MP e bateria de 5000mAh com carregamento ultrarrápido de 125W. Ideal para quem busca tecnologia avançada.';
  }
  if (nome.includes('Edge 50 Neo')) {
    return 'O Motorola Edge 50 Neo oferece tela pOLED de 6,4 polegadas, processador Snapdragon 7 Gen 1, câmera de 50MP OIS, design ultrafino e leve, e bateria de 4500mAh com carregamento de 68W. Um smartphone estiloso e competente.';
  }
  if (nome.includes('Moto G85')) {
    return 'O Motorola Moto G85 é um intermediário completo com tela pOLED de 6,6 polegadas 120Hz, processador Snapdragon 6 Gen 1, câmera de 50MP OIS, som estéreo com Dolby Atmos e bateria de 5000mAh. Confiável para todas as tarefas do dia a dia.';
  }
  if (nome.includes('Xiaomi 14 Pro')) {
    return 'O Xiaomi 14 Pro é um flagship equipado com Snapdragon 8 Gen 3, tela AMOLED de 6,73 polegadas 120Hz LTPO, câmera Leica de 50MP com lentes Summilux, bateria de 4880mAh com carregamento de 120W. Fotografia e desempenho em nível máximo.';
  }
  if (nome.includes('Redmi Note 13')) {
    return 'O Redmi Note 13 Pro oferece tela AMOLED de 6,67 polegadas 120Hz, processador MediaTek Dimensity 7200 Ultra, câmera principal de 200MP, bateria de 5100mAh e carregamento rápido de 67W. Um verdadeiro monstro em custo-benefício.';
  }
  if (nome.includes('Pixel 9')) {
    return 'O Google Pixel 9 traz o processador Tensor G4, tela OLED de 6,3 polegadas 120Hz, câmera principal de 50MP com edição assistida por IA, recursos exclusivos como Magic Editor e o melhor suporte a atualizações do Android. A experiência Google pura.';
  }
  if (nome.includes('Zenfone 11')) {
    return 'O Asus Zenfone 11 é um compacto premium com Snapdragon 8 Gen 3, tela AMOLED de 6,4 polegadas 120Hz, câmera principal de 50MP com gimbal stabilizer OIS, bateria de 4500mAh e design compacto. Potência em tamanho reduzido.';
  }
  if (nome.includes('Xiaomi 13T')) {
    return 'O Xiaomi 13T traz tela AMOLED de 6,67 polegadas 144Hz, processador MediaTek Dimensity 8200 Ultra, câmera Leica de 50MP, bateria de 5000mAh com carregamento de 67W e certificação IP68. Um intermediário premium com alma de flagship.';
  }
  if (nome.includes('Oppo Find X8')) {
    return 'O Oppo Find X8 impressiona com design ultrafino, tela AMOLED de 6,5 polegadas 120Hz, processador MediaTek Dimensity 9400, câmera Hasselblad de 50MP com zoom periscópio e carregamento ultrarrápido de 80W. Inovação e estilo.';
  }
  if (nome.includes('Realme GT 6')) {
    return 'O Realme GT 6 é um gamer de alto desempenho com Snapdragon 8s Gen 3, tela AMOLED de 6,78 polegadas 120Hz LTPO, câmera de 50MP OIS, sistema de resfriamento avançado e bateria de 5500mAh com carregamento de 120W. Performance extrema.';
  }
  if (nome.includes('iPhone') || nome.includes('Apple')) {
    return 'Smartphone Apple com desempenho excepcional, câmera avançada, ecossistema integrado e design premium. Ideal para quem busca qualidade, segurança e fluidez no dia a dia.';
  }

  if (baixo) return 'Smartphone acessível com tela nítida, bateria de longa duração e câmera para fotos do dia a dia. Perfeito para quem busca um aparelho confiável sem gastar muito.';
  if (medio) return 'Smartphone intermediário-premium com tela de alta taxa de atualização, câmera versátil, bateria robusta e desempenho equilibrado para jogos e produtividade.';
  return 'Smartphone topo de linha com processador mais avançado do mercado, câmera profissional com múltiplas lentes, tela de alta resolução com taxa de atualização adaptável e carregamento ultrarrápido.';
}

function descInformatica(nome) {
  if (nome.includes('Dell XPS')) {
    return 'O Dell XPS 15 é o notebook premium definitivo, com tela InfinityEdge OLED 3.5K de 15,6 polegadas, processador Intel Core i9-13900H, 32GB de RAM DDR5, SSD de 1TB e placa de vídeo NVIDIA GeForce RTX 4070. Design em alumínio usinado com acabamento em fibra de carbono. Para profissionais que exigem o melhor.';
  }
  if (nome.includes('MacBook Air M4')) {
    return 'O MacBook Air M4 reúne o novo chip Apple M4 com CPU de 10 núcleos e GPU de 10 núcleos, tela Liquid Retina de 13,6 polegadas, design ultrafino de 11,3mm, bateria com até 18 horas e conector MagSafe. Perfeito para produtividade e criatividade com mobilidade.';
  }
  if (nome.includes('iPad Air M3')) {
    return 'O iPad Air M3 com chip Apple M3 oferece desempenho excepcional para criar, desenhar e estudar. Tela Liquid Retina de 13 polegadas, suporte Apple Pencil Pro e Magic Keyboard, bateria de até 10 horas. O tablet mais versátil para produtividade e entretenimento.';
  }
  if (nome.includes('Galaxy Book 4')) {
    return 'O Samsung Galaxy Book 4 é um notebook ultrafino com tela AMOLED de 15,6 polegadas Full HD, processador Intel Core i5-1335U, 16GB de RAM e SSD de 512GB. Integração perfeita com o ecossistema Samsung, design elegante em alumínio e bateria de longa duração.';
  }
  if (nome.includes('ThinkPad T14')) {
    return 'O Lenovo ThinkPad T14 é o notebook corporativo por excelência, com certificação MIL-STD-810G, processador Intel Core i7, 16GB de RAM, SSD de 512GB, teclado ergonômico retroiluminado e segurança de nível empresarial com leitor de impressão digital.';
  }
  if (nome.includes('Acer Aspire 5')) {
    return 'O Acer Aspire 5 é um notebook versátil para trabalho e estudos com processador Intel Core i5, 8GB de RAM, SSD de 256GB, tela Full HD de 15,6 polegadas e design fino. Ótimo custo-benefício para o dia a dia.';
  }
  if (nome.includes('Gamer') && nome.includes('Desktop')) {
    return 'Este desktop gamer de alta performance vem equipado com processador Intel Core i7, placa de vídeo NVIDIA RTX 4060, 16GB de RAM DDR5, SSD NVMe de 1TB e sistema de refrigeração avançado com fans RGB. Pronto para rodar os jogos mais pesados em 1440p com altíssima qualidade gráfica.';
  }
  if (nome.includes('Monitor LG')) {
    return 'O monitor LG Ultrawide de 29 polegadas oferece resolução Full HD, painel IPS com ângulos de visão amplos, taxa de atualização de 75Hz e suporte a HDR10. Perfeito para multitarefa com espaço de tela extra para produtividade e jogos.';
  }
  if (nome.includes('Odyssey G7')) {
    return 'O Samsung Odyssey G7 de 27 polegadas é um monitor gamer curvo com resolução QHD (2560x1440), taxa de atualização de 240Hz, tempo de resposta de 1ms, painel VA com suporte a HDR600 e iluminação Core Sync. Imersão total em jogos competitivos.';
  }
  if (nome.includes('Logitech G915')) {
    return 'O Teclado Mecânico Logitech G915 X é um teclado gamer sem fio ultrafino com switches GL mecânicos, iluminação RGB LIGHTSYNC, conectividade Lightspeed, bateria recarregável de até 40 horas e construção em alumínio aeronáutico. Premium em cada detalhe.';
  }
  if (nome.includes('MX Master')) {
    return 'O Mouse Logitech MX Master 3S é o padrão ouro em ergonomia e produtividade, com sensor 8000 DPI, scroll MagSpeed eletromagnético, botões programáveis, conexão Bluetooth e USB-C, e bateria com 70 dias de autonomia. Ideal para profissionais.';
  }
  if (nome.includes('SSD Kingston')) {
    return 'O SSD Kingston NV2 1TB é um drive NVMe PCIe 4.0 com velocidades de leitura de até 3500MB/s e gravação de até 2800MB/s. Ideal para acelerar o desempenho do seu computador com espaço generoso para jogos e arquivos.';
  }
  if (nome.includes('HD Externo') || nome.includes('Seagate')) {
    return 'O HD Externo Seagate de 2TB oferece backup confiável com interface USB 3.0, design compacto e portátil, compatibilidade com PC e Mac, e software de backup automático. Segurança e espaço para seus arquivos mais importantes.';
  }
  if (nome.includes('Webcam Logitech')) {
    return 'A Webcam Logitech C920 oferece gravação em Full HD 1080p com correção automática de iluminação, microfones estéreo integrados, campo de visão de 78 graus e compatibilidade universal. A referência em webcams para home office e streaming.';
  }
  if (nome.includes('TP-Link') || nome.includes('Roteador')) {
    return 'O Roteador TP-Link Wi-Fi 6 oferece velocidades de até 3000Mbps, tecnologia OFDMA para conectar múltiplos dispositivos sem perda de desempenho, cobertura ampla com 4 antenas e segurança WPA3. Prepare sua casa para o futuro da conectividade.';
  }
  if (nome.includes('RTX 4070') || nome.includes('Placa de Vídeo')) {
    return 'A Placa de Vídeo NVIDIA RTX 4070 traz arquitetura Ada Lovelace, 12GB GDDR6X, Ray Tracing de 3ª geração, DLSS 3 e suporte a NVIDIA Reflex. Desempenho excepcional para jogos em 1440p e 4K com máxima qualidade gráfica.';
  }
  if (nome.includes('Fonte Corsair')) {
    return 'A Fonte Corsair 750W 80 Plus Gold oferece eficiência energética certificada, cabos modulares para organização perfeita, ventoinha de baixo ruído com controle térmico e proteções completas. A base para um sistema estável e seguro.';
  }
  if (nome.includes('Gabinete') || nome.includes('NZXT')) {
    return 'O Gabinete Gamer NZXT H5 combina design minimalista em aço e vidro temperado, fluxo de ar otimizado com ventoinhas inclusas, suporte a placas-mãe ATX, gerenciamento de cabos simplificado e painel USB-C. Estilo e funcionalidade para sua build.';
  }
  if (nome.includes('Positivo Vision')) {
    return 'O Notebook Positivo Vision é ideal para estudos e trabalho, com processador Intel Celeron N4020, 4GB de RAM, SSD de 128GB, tela de 14 polegadas HD e design leve de apenas 1,4kg. Um notebook básico e acessível para o dia a dia.';
  }
  if (nome.includes('Tablet Samsung Galaxy Tab S9')) {
    return 'O Samsung Galaxy Tab S9 é um tablet premium com tela Dynamic AMOLED 2X de 11 polegadas 120Hz, processador Snapdragon 8 Gen 2, S Pen inclusa com baixa latência, som AKG com Dolby Atmos e certificação IP68. Ideal para criar, desenhar e consumir conteúdo.';
  }
  if (nome.includes('RTX 4070')) {
    return 'Placa de vídeo NVIDIA GeForce RTX 4070 com 12GB GDDR6X, arquitetura Ada Lovelace, Ray Tracing de 3ª geração e DLSS 3. Desempenho excepcional para jogos em 1440p e criação de conteúdo.';
  }
  return 'Produto de informática de alta qualidade, projetado para oferecer desempenho confiável em tarefas profissionais, estudos e entretenimento. Combina tecnologia atual com durabilidade e design funcional.';
}

function descModa(nome, preco) {
  if (nome.includes('Camiseta') || nome.includes('Dry Fit')) {
    return 'A Camiseta Masculina Nike Dry Fit é confeccionada em poliéster respirável com tecnologia Dri-FIT que afasta o suor do corpo, mantendo você seco e confortável. Design moderno com logotipo Nike bordado, costuras planas e caimento perfeito para o dia a dia e atividades físicas.';
  }
  if (nome.includes('Vestido')) {
    return 'O Vestido Feminino Farm é uma peça cheia de personalidade, estampada com os padrões vibrantes e únicos da marca. Confeccionado em viscose leve e fluida, possui modelagem soltinha que valoriza todos os tipos de corpo. Perfeito para looks casuais e sofisticados.';
  }
  if (nome.includes('Air Force 1')) {
    return 'O Tênis Nike Air Force 1 é um clássico absoluto do streetwear, com cabedal em couro legítimo, entressola Air-Sole para amortecimento superior, solado com padrão circular para tração duradoura e design icônico que nunca sai de moda.';
  }
  if (nome.includes('Campus 00s')) {
    return 'O Tênis Adidas Campus 00s é uma reedição moderna do clássico dos anos 80, com cabedal em suede premium, entressola macia, solado de borracha resistente e estilo casual que combina com qualquer look. Um verdadeiro ícone do lifestyle.';
  }
  if (nome.includes("Levi's") || nome.includes('Calça Jeans')) {
    return 'A Calça Jeans Masculina Levi\'s é feita com denim de alta qualidade, modelagem confortável e acabamento impecável. Costuras reforçadas, bolsos funcionais e o icônico patch Levi\'s. Uma peça essencial para qualquer guarda-roupa.';
  }
  if (nome.includes('Legging') || nome.includes('Lupo')) {
    return 'A Calça Legging Feminina Lupo é produzida em malha de alta compressão com tecnologia antiodor, cintura alta que modela o corpo, costura plana que evita atritos e tecido respirável. Ideal para academia, pilates e look casual.';
  }
  if (nome.includes('Jaqueta Puffer') || nome.includes('Nike')) {
    return 'A Jaqueta Puffer Nike é a peça ideal para enfrentar o frio com estilo, com acabamento em nylon resistente à água, enchimento sintético térmico que retém o calor, capuz fixo e bolsos com zíper. Leve, quente e moderna.';
  }
  if (nome.includes('Hering') || nome.includes('Blusa de Frio')) {
    return 'A Blusa de Frio Hering é uma peça básica e essencial, confeccionada em malha canelada de algodão de alta qualidade. Modelagem clássica com gola careca, punhos elastizados e costura reforçada para maior durabilidade. Conforto que dura.';
  }
  if (nome.includes('Camisa Social') || nome.includes('Reserva')) {
    return 'A Camisa Social Reserva é perfeita para ocasiões que pedem elegância, com tecido em algodão penteado de alta gramatura, corte slim que valoriza a silhueta, colarinho estruturado e botões de madrepérola. Sofisticação em cada detalhe.';
  }
  if (nome.includes('Bermuda') || nome.includes('Cyclone')) {
    return 'A Bermuda Masculina Cyclone é ideal para dias quentes, com tecido leve e resistente, cós com elástico e cordão regulável, bolsos laterais profundos e secagem rápida. Perfeita para lazer, praia e academia.';
  }
  if (nome.includes('Shorts') || nome.includes('Adidas')) {
    return 'O Shorts Feminino Adidas é confeccionado em malha macia e respirável, com cós elastizado e cordão ajustável. Design esportivo com logotipo Adidas aplicado, perfeito para treinos e momentos de lazer.';
  }
  if (nome.includes('Biquíni') || nome.includes('Marítima')) {
    return 'O Biquíni Cia Marítima traz estampas exclusivas e tecido de alta resistência ao cloro e ao sol. Modelagem com bojo removível, alças ajustáveis e acabamento premium. Estilo e conforto para sua melhor temporada de praia.';
  }
  if (nome.includes('Chapéu')) {
    return 'O Chapéu SunGA oferece proteção UV com fator 50+, aba larga de 8cm para sombra completa, tecido leve e respirável com faixa antissuor, e tamanho ajustável. O acessório perfeito para dias ensolarados.';
  }
  if (nome.includes('Bolsa') || nome.includes('Arezzo')) {
    return 'A Bolsa Feminina Arezzo é um acessório sofisticado em couro legítimo, com design atemporal, compartimentos internos organizadores, fechamento em zíper de alta qualidade e alças destacáveis. Elegância e funcionalidade para o dia a dia.';
  }
  if (nome.includes('Mochila') || nome.includes('Kipling')) {
    return 'A Mochila Kipling combina estilo e praticidade com seu nylon resistente e leve, compartimento para notebook de até 15,6 polegadas, vários bolsos organizadores e o icônico macaco de pelúcia. Perfeita para trabalho, viagem e estudo.';
  }
  if (nome.includes('Cinto')) {
    return 'O Cinto Masculino Lupo em couro legítimo tem fivela cromada de alta resistência, largura de 3,5cm, acabamento com costura reforçada e design clássico que combina com looks sociais e casuais.';
  }
  if (nome.includes('Meia')) {
    return 'A Meia Esportiva Nike possui tecnologia Dri-FIT para controle de umidade, amortecimento nas áreas de impacto, compressão no arco do pé e cano médio. Perfeita para corrida, treino e esportes em geral.';
  }
  if (nome.includes('Pijama') || nome.includes('Malwee')) {
    return 'O Pijama Malwee é feito em malha de algodão 100% fio penteado, com modelagem soltinha que proporciona conforto extremo, gola careca e estampas divertidas. A escolha certa para noites de sono tranquilo.';
  }
  if (nome.includes('Moletom')) {
    return 'O Moletom Adidas é confeccionado em fleece macio e aquecido, com capuz forrado, bolso canguru frontal, punhos e barra em canaletado elastizado. Conforto e estilo para os dias mais frios.';
  }
  if (nome.includes('Cachecol') || nome.includes('Zara')) {
    return 'O Cachecol Zara é um acessório elegante em tricot macio de acrílico de alta qualidade, com franjas nas pontas e design versátil que pode ser usado de várias maneiras. O toque final para seu look de inverno.';
  }
  return 'Peça de vestuário com acabamento de qualidade, modelagem moderna e tecidos selecionados para oferecer conforto, durabilidade e estilo no dia a dia.';
}

function descEsportes(nome, preco) {
  if (nome.includes('Esteira')) {
    return 'A Esteira Elétrica Pro Action possui motor de 2,5HP, velocidade ajustável de 1 a 16 km/h, inclinação motorizada de até 12%, superfície de corrida de 130x45cm, painel digital com 12 programas de treino e suporte para celular. Ideal para treinos cardiovasculares em casa.';
  }
  if (nome.includes('Bicicleta Ergométrica')) {
    return 'A Bicicleta Ergométrica Moviment oferece 8 níveis de resistência magnética, volante de 4kg para pedalada suave, sensor cardíaco, painel LCD com tempo/distância/calorias e assento ajustável. O equipamento perfeito para pedalar sem sair de casa.';
  }
  if (nome.includes('Halter')) {
    return 'O Halter Ajustável Polimet 20kg substitui 10 halteres em um único equipamento, com sistema de ajuste rápido através de botão giratório, pesos de 2 a 20kg, revestimento em borracha antiderrapante e base de armazenamento inclusa. Treino completo em casa.';
  }
  if (nome.includes('Colchonete') || nome.includes('Yoga')) {
    return 'O Colchonete de Yoga Athlethan tem espessura de 6mm para amortecimento ideal, superfície antiderrapante em PVC, dimensões de 180x60cm, alça para transporte e cor única. Perfeito para yoga, pilates e alongamento.';
  }
  if (nome.includes('Bola Suíça')) {
    return 'A Bola Suíça de 65cm é fabricada em PVC antirruptura com capacidade de até 300kg, superfície texturizada antiderrapante, bomba de ar inclusa e guia de exercícios. Ideal para core training, pilates e reabilitação.';
  }
  if (nome.includes('Corda de Pular')) {
    return 'A Corda de Pular Profissional possui cabos em espuma ergonômica com rolamentos de alta velocidade, cabo ajustável de 3m, movimento suave e silencioso. O equipamento mais eficiente para treinos HIIT e queima calórica.';
  }
  if (nome.includes('Caneleira 5')) {
    return 'A Caneleira de 5kg é confeccionada em lona resistente com enchimento de areia e revestimento impermeável, fecho em velcro duplo de alta aderência e alça de transporte. Ideal para treinos de pernas e glúteos.';
  }
  if (nome.includes('Caneleira')) {
    return 'A Caneleira de 2kg é ideal para treinos leves de fortalecimento muscular, confeccionada em lona resistente com fecho em velcro, ajuste universal e peso distribuído uniformemente. Perfeita para reabilitação e condicionamento.';
  }
  if (nome.includes('Elásticos') || nome.includes('Kit Elástico')) {
    return 'O Kit Elásticos de Resistência contém 5 faixas com níveis leve a extra-forte (5 a 35kg), látex natural de alta durabilidade, bolsa de transporte inclusa e guia de exercícios. Seu estúdio de pilates portátil.';
  }
  if (nome.includes('Garrafa')) {
    return 'A Garrafa Esportiva 1L é fabricada em Tritan livre de BPA, com bico de sucção anatômico, tampa de abertura rápida e alça de transporte. Mantém suas bebidas na temperatura ideal por horas.';
  }
  if (nome.includes('Bicicleta Aro 29') || nome.includes('Bicicleta')) {
    return 'A Bicicleta Aro 29 com Freio a Disco é ideal para trilhas e uso urbano, quadro de alumínio 6061 leve e resistente, câmbio Shimano de 21 velocidades, suspensão dianteira com curso de 80mm e guidão reto. Pronta para qualquer aventura.';
  }
  if (nome.includes('Patins')) {
    return 'Os Patins Inline Adulto possuem bota em plástico injetado resistente, fechamento em fivela de alumínio, rodas PU 80mm com rolamento ABEC 7 e freio traseiro. Perfeito para lazer e patinação fitness.';
  }
  if (nome.includes('Skate')) {
    return 'O Skate Completo Profissional tem shape em madeira de bordo canadense 7 camadas, lixa antiderrapante de alta aderência, trucks de alumínio resistente, rodas de 52mm com rolamentos ABEC 7. Ideal para freestyle e street.';
  }
  if (nome.includes('Bola de Futebol') || nome.includes('Penalty')) {
    return 'A Bola de Futebol Campo Penalty é oficial com certificação FIFA, gomos termocolados para menor absorção de água, revestimento em PU de alta resistência e câmara de butil. Performance profissional para seu jogo.';
  }
  if (nome.includes('Tênis de Corrida') || nome.includes('Asics')) {
    return 'O Tênis de Corrida Asics combina tecnologia GEL de amortecimento, cabedal mesh respirável, solado com borracha de alta tração e palmilha removível. Conforto e performance para suas corridas diárias.';
  }
  if (nome.includes('Camisa de Time') || nome.includes('Camisa Oficial')) {
    return 'A Camisa de Time Oficial é réplica autêntica com tecido leve e respirável, escudo bordado, patrocínios oficiais e tecnologia de absorção de suor. Vista suas cores com orgulho.';
  }
  if (nome.includes('Shorts de Compressão')) {
    return 'O Shorts de Compressão é confeccionado em tecido elástico de alta compressão com tecnologia antimicrobiana, costura plana para evitar atritos e cintura ergonômica. Ideal para corrida, musculação e crossfit.';
  }
  if (nome.includes('Luva de Boxe')) {
    return 'A Luva de Boxe Profissional é confeccionada em couro sintético de alta resistência, enchimento em espuma multi-camadas para absorção de impacto, fecho em velcro double strap e forro interno antimicrobiano. Proteção e desempenho durante seus treinos.';
  }
  if (nome.includes('Kit Mergulho')) {
    return 'O Kit Mergulho com Máscara e Snorkel tem máscara em silicone hipoalergênico com vidro temperado, snorkel com purga automática e sistema de drenagem. Equipamento leve e confortável para explorar o fundo do mar.';
  }
  if (nome.includes('Whey') || nome.includes('Suplemento')) {
    return 'O Suplemento Whey Protein 1kg é 100% isolado com 25g de proteína por dose, baixo teor de carboidratos e gorduras, enriquecido com glutamina e zero lactose. Ideal para recuperação muscular e ganho de massa magra.';
  }
  return 'Equipamento esportivo de alta qualidade, desenvolvido para oferecer desempenho, durabilidade e conforto durante seus treinos e atividades físicas. Ideal para atletas de todos os níveis.';
}

function descCasa(nome, preco) {
  if (nome.includes('Sofá Retrátil')) {
    return 'O Sofá Retrátil 3 Lugares é o coração da sua sala, com mecanismo retrátil e reclinável individual, estofamento em suede de alta resistência, espuma D45 de densidade alta para conforto prolongado, estrutura em eucalipto tratado e pés em aço cromado. Acomoda até 3 pessoas com conforto total.';
  }
  if (nome.includes('Tapete')) {
    return 'O Tapete de Sala 2x3m é confeccionado em polipropileno de alta resistência com textura macia e felpuda, design geométrico moderno, base antiderrapante e fácil manutenção. Transforma qualquer ambiente com elegância.';
  }
  if (nome.includes('Cortina Blackout')) {
    return 'A Cortina Blackout 3x2,5m bloqueia até 99% da luz solar com seu tecido triplo de alta gramatura, ilhós de metal para instalação fácil, isolamento térmico e acústico. Perfeita para quartos e salas de home theater.';
  }
  if (nome.includes('Almofada')) {
    return 'A Almofada Decorativa 50cm em veludo macio com enchimento de fibra siliconada, zíper invisível para remoção da capa, design liso e elegante. O toque final que sua decoração merece.';
  }
  if (nome.includes('Abajour') || nome.includes('Abajur')) {
    return 'O Abajur de Mesa Clássico em base de metal com pintura eletrostática, cúpula em tecido estampado, soquete E27, altura de 45cm e interruptor no cabo. Iluminação decorativa e funcional para seu ambiente.';
  }
  if (nome.includes('Vaso') || nome.includes('Cerâmica')) {
    return 'O Vaso Decorativo em Cerâmica possui acabamento artesanal com esmaltação brilhante, design contemporâneo, base estável e furo de drenagem. Ideal para plantas e arranjos secos.';
  }
  if (nome.includes('Quadro Decorativo')) {
    return 'O Quadro Decorativo 60x40cm tem impressão em lona canvas de alta resolução com moldura em MDF preto fosco, proteção UV e gancho para fixação. Uma obra de arte para sua parede.';
  }
  if (nome.includes('Espelho')) {
    return 'O Espelho Redondo 80cm com moldura em alumínio anodizado, design minimalista, encaixe para parede incluso e bisotê suave. Amplia e ilumina qualquer ambiente com elegância.';
  }
  if (nome.includes('Luminária de Piso')) {
    return 'A Luminária de Piso com haste em aço cromado, base estável, cúpula em tecido bege, interruptor de pé e altura ajustável de 140 a 170cm. Iluminação indireta e aconchegante para sua sala.';
  }
  if (nome.includes('Cesto') || nome.includes('Palha')) {
    return 'O Cesto Organizador de Palha Natural é trançado à mão por artesãos, com alças laterais, tamanho 30x30x25cm e forro interno de algodão. Sustentável e charmoso para organizar qualquer ambiente.';
  }
  if (nome.includes('Mesa de Centro')) {
    return 'A Mesa de Centro Vidro tem tampo em vidro temperado de 8mm com bordas lapidadas, base em aço cromado, design contemporâneo e prateleira inferior para apoio. Funcionalidade e estilo para sua sala de estar.';
  }
  if (nome.includes('Estante') || nome.includes('Prateleiras')) {
    return 'A Estante para Livros com 6 Prateleiras em MDF revestido, estrutura em forma de escada, capacidade para até 80 livros, pés com niveladores e design aberto que valoriza a decoração. Organização com personalidade.';
  }
  if (nome.includes('Poltrona Reclinável') || nome.includes('Poltrona')) {
    return 'A Poltrona Reclinável em couro sintético de alta resistência, mecanismo reclinável com descanso para pernas, espuma D33 de alta densidade, braços acolchoados e bolsos laterais para controle remoto e revistas. Seu cantinho do descanso.';
  }
  if (nome.includes('Fruteira')) {
    return 'A Fruteira Decorativa em arame de metal com pintura eletrostática branca, design espiral moderno, capacidade para 5kg de frutas e base antiderrapante. Funcional e decorativa para sua cozinha.';
  }
  if (nome.includes('Porta-Retrato') || nome.includes('Digital')) {
    return 'O Porta-Retrato Digital com tela LCD de 10 polegadas, suporte a fotos e vídeos, controle remoto, função slideshow com música, moldura em acrílico preto e entrada USB. Suas melhores memórias em movimento.';
  }
  if (nome.includes('Lanternim')) {
    return 'O Lanternim Decorativo em vidro transparente com tampa em metal dourado, interior para vela ou luz LED, cordão de couro para pendurar. Iluminação romântica e charmosa para qualquer ambiente.';
  }
  if (nome.includes('Jardim Vertical')) {
    return 'O Jardim Vertical Artificial mede 60x60cm com folhas em PVC de alta qualidade que imitam plantas reais, quadro em MDF com revestimento impermeável, ganchos para fixação e manutenção zero. Verde o ano todo sem esforço.';
  }
  if (nome.includes('Manta')) {
    return 'A Manta para Sofá em tricot macio de acrílico premium, tamanho 130x170cm, franjas decorativas nas pontas, design texturizado e lavável em máquina. Aconchego e estilo para seu sofá.';
  }
  if (nome.includes('Aromatizador')) {
    return 'O Aromatizador de Ambiente Elétrico com difusão ultrassônica silenciosa, capacidade de 100ml, luz noturna LED com 7 cores, timer programável e desligamento automático. Perfume sua casa com saúde e estilo.';
  }
  if (nome.includes('Relógio de Parede')) {
    return 'O Relógio de Parede Decorativo com 40cm de diâmetro, moldura em metal com pintura preta fosca, mostrador com números grandes, mecanismo de quartzo silencioso e vidro protetor. Design e funcionalidade para sua parede.';
  }
  return 'Item decorativo e funcional de alta qualidade, produzido com materiais selecionados para transformar sua casa em um lar mais bonito, organizado e aconchegante.';
}

function descCozinha(nome, preco) {
  if (nome.includes('Jogo de Panelas') || nome.includes('Tramontina')) {
    return 'O Jogo de Panelas Tramontina 5 Peças é fabricado em alumínio forjado de alta espessura com revestimento antiaderente Starflon Teflon, fundo difusor para distribuição uniforme de calor, cabos em baquelite antitérmico e tampas de vidro temperado. Qualidade Tramontina que dura gerações.';
  }
  if (nome.includes('Faca de Chef')) {
    return 'A Faca de Chef Tramontina 8" tem lâmina em aço inox de alta resistência com fio preciso e duradouro, cabo em polipropileno ergonômico com proteção antiderrapante, balança integral para equilíbrio perfeito. A ferramenta essencial para qualquer cozinheiro.';
  }
  if (nome.includes('Panela de Pressão')) {
    return 'A Panela de Pressão 4,5L em alumínio de paredes grossas, válvula de segurança multipla com sistema de alívio automático, cabo tipo pegador em baquelite, trava de segurança na tampa e vedação em borracha siliconada. Cozinhe até 70% mais rápido com segurança total.';
  }
  if (nome.includes('Liquidificador') || nome.includes('Philco Turbo')) {
    return 'O Liquidificador Philco Turbo tem motor de 800W de potência, jarra em vidro temperado com capacidade de 2L, 3 velocidades + pulsar, sistema de lâminas em aço inox com 4 pontas e copo medidor. Ideal para sucos, vitaminas e massas.';
  }
  if (nome.includes('Batedeira') || nome.includes('Britânia')) {
    return 'A Batedeira Planetária Britânia possui 5 velocidades + função turbo, tigela inox de 4L, batedor triplo em aço inox, gancho para massas pesadas e soprador de ar quente. Perfeita para bolos, pães e massas leves.';
  }
  if (nome.includes('Sanduicheira')) {
    return 'A Sanduicheira Elétrica com placas antiaderentes, luz indicadora de funcionamento, alça de travamento, base antiderrapante e design compacto para fácil armazenamento. Prepare lanches dourados e crocantes em minutos.';
  }
  if (nome.includes('Jogo de Pratos')) {
    return 'O Jogo de Pratos 20 Peças em porcelana esmaltada de alta resistência, bordas em formato orgânico, acabamento brilhante e resistente a micro-ondas e lava-louças. Contém 6 pratos rasos, 6 pratos fundos e 8 pratos de sobremesa.';
  }
  if (nome.includes('Jogo de Talheres') || nome.includes('Talheres Inox')) {
    return 'O Jogo de Talheres Inox 24 Peças em aço inox AISI 304 de alta qualidade, acabamento polido espelhado, design clássico e confortável ao toque. Contém 6 facas, 6 garfos, 6 colheres de sopa e 6 colheres de chá.';
  }
  if (nome.includes('Copos Americanos')) {
    return 'O Kit de Copos Americanos com 12 unidades em vidro resistente com borda reforçada, capacidade de 190ml, empilháveis e resistentes a lava-louças. O clássico que não pode faltar na copa.';
  }
  if (nome.includes('Caneca')) {
    return 'A Caneca de Porcelana 300ml em cerâmica de alta qualidade, acabamento liso e brilhante, alça confortável, resistente a micro-ondas. Perfeita para seu café ou chá preferido.';
  }
  if (nome.includes('Forma de Bolo')) {
    return 'A Forma de Bolo Antiaderente com revestimento em silicone que dispensa untar, tamanho 25x9cm, distribuição uniforme de calor, bordas altas e fácil desenforme. Bolos perfeitamente soltinhos.';
  }
  if (nome.includes('Assadeira')) {
    return 'A Assadeira Retangular 40cm em aço carbono com revestimento antiaderente, bordas reforçadas, design com alças e resistente a altas temperaturas (até 230°C). Ideal para assados, lasanhas e tortas.';
  }
  if (nome.includes('Potes') || nome.includes('Herméticos')) {
    return 'O Conjunto de Potes Herméticos 8 Peças em vidro temperado com tampas herméticas de plástico com trava de vedação, empilháveis, ideais para armazenar alimentos na geladeira e freezer. Organização sem desperdício.';
  }
  if (nome.includes('Ralador')) {
    return 'O Ralador Multiuso em aço inox com 4 lâminas intercambiáveis (ralar fino, grosso, fatiar e desfiar), compartimento coletor em plástico resistente e base antiderrapante. Praticidade na hora de preparar alimentos.';
  }
  if (nome.includes('Espremedor')) {
    return 'O Espremedor de Frutas Manual em alumínio polido com alavanca ergonômica, copo em vidro com capacidade de 500ml, bico para despejar sem sujar e base antiderrapante. Suco natural fresquinho em segundos.';
  }
  if (nome.includes('Chaleira Elétrica')) {
    return 'A Chaleira Elétrica em aço inox com capacidade de 1,7L, potência de 1500W, desligamento automático ao ferver, proteção contra superaquecimento, base giratória 360° e filtro anticalcário. Água quente em instantes.';
  }
  if (nome.includes('Cafeteira Italiana') || nome.includes('Moka')) {
    return 'A Cafeteira Italiana Moka para 6 xícaras em alumínio polido, válvula de segurança, cabo em baquelite antitérmico e design clássico italiano. O método tradicional para um café encorpado e aromático.';
  }
  if (nome.includes('Tábua de Corte')) {
    return 'A Tábua de Corte em Polietileno de alta densidade, tamanho 30x40cm, superfície antiderrapante, suco periférico para líquidos e furo para pendurar. Higiênica e resistente para o preparo diário.';
  }
  if (nome.includes('Escorredor')) {
    return 'O Escorredor de Louças em plástico resistente, tamanho 40x30cm, com compartimento para talheres, bandeja coletora de água removível e design dobrável. Prático e funcional para sua cozinha.';
  }
  if (nome.includes('Lixeira') || nome.includes('Inox')) {
    return 'A Lixeira de Cozinha 15L em aço inox escovado, tampa com pedal que garante abertura sem usar as mãos, balde interno removível, alça para transporte e base antiderrapante. Higiene e praticidade para sua cozinha.';
  }
  return 'Utensílio de cozinha prático e eficiente, desenvolvido com materiais de qualidade para facilitar o preparo dos alimentos e tornar seu dia a dia mais produtivo e prazeroso.';
}

function descLivros(nome, preco) {
  if (nome.includes('Colleen Hoover') || nome.includes('É Assim que Acaba')) {
    return 'Em É Assim que Acaba, Colleen Hoover entrega uma narrativa emocionante e profunda sobre relacionamentos abusivos, recomeços e a força necessária para quebrar ciclos. Com personagens complexos e uma história que toca o coração, este livro se tornou um fenômeno mundial e um dos maiores best-sellers da década. Leitura obrigatória para quem busca romance com profundidade emocional.';
  }
  if (nome.includes('O Milagre da Manhã')) {
    return 'Em O Milagre da Manhã, Hal Elrod apresenta um método transformador de 6 passos para começar o dia com mais produtividade, energia e propósito. Combinando práticas como meditação, afirmações, visualização, exercícios, leitura e escrita, o livro já ajudou milhões de pessoas a transformar suas manhãs e suas vidas. Ideal para quem busca autodesenvolvimento e alta performance.';
  }
  if (nome.includes('O Poder do Hábito')) {
    return 'Em O Poder do Hábito, Charles Duhigg explora a ciência por trás da formação de hábitos e como podemos transformá-los para melhorar nossa vida pessoal e profissional. Baseado em pesquisas rigorosas em neurociência e psicologia, o livro revela o loop do hábito e oferece um guia prático para criar mudanças duradouras. Uma leitura essencial para quem busca autotransformação.';
  }
  if (nome.includes('A Culpa é das Estrelas')) {
    return 'Em A Culpa é das Estrelas, John Green conta a comovente história de Hazel Grace Lancaster, uma adolescente com câncer que encontra no amor inesperado por Augustus Waters uma nova perspectiva sobre a vida, a morte e o significado de existir. Uma narrativa sensível, inteligente e emocionante que conquistou milhões de leitores ao redor do mundo.';
  }
  if (nome.includes('Harry Potter') || nome.includes('Pedra Filosofal')) {
    return 'Em Harry Potter e a Pedra Filosofal, J.K. Rowling dá início à série mais amada da literatura mundial. Acompanhe Harry em sua descoberta do mundo mágico, suas amizades em Hogwarts e a primeira batalha contra as forças das trevas. Uma história encantadora sobre coragem, amizade e o poder do amor que transcende gerações.';
  }
  if (nome.includes('O Pequeno Príncipe')) {
    return 'Em O Pequeno Príncipe, Antoine de Saint-Exupéry nos presenteia com uma fábula filosófica e poética sobre amizade, amor e o sentido da vida. Através dos olhos de um pequeno príncipe de outro planeta, o livro nos convida a enxergar o essencial que é invisível aos olhos. Uma obra atemporal que encanta crianças e adultos há gerações.';
  }
  if (nome.includes('1984') || nome.includes('George Orwell')) {
    return 'Em 1984, George Orwell cria uma distopia assustadoramente atual sobre um regime totalitário onde o Grande Irmão vigia cada movimento. Uma crítica poderosa ao autoritarismo, à manipulação da verdade e à perda da liberdade individual. Leitura essencial e cada vez mais relevante para entender os tempos modernos.';
  }
  if (nome.includes('Dom Casmurro') || nome.includes('Machado')) {
    return 'Em Dom Casmurro, Machado de Assis constrói uma das obras-primas da literatura brasileira, narrando a história de Bentinho e Capitu em um romance repleto de ciúme, dúvida e ironia. A pergunta que atravessa gerações permanece: Capitu traiu ou não Bentinho? Um clássico que todo brasileiro precisa ler.';
  }
  if (nome.includes('Agenda')) {
    return 'A Agenda 2027 Tilibra é a companheira ideal para organizar seu ano, com capa dura, fechamento em elástico, marcador de páginas de fita, bolsa porta-documentos, calendário anual, planejamento mensal e semanal, e páginas extras para notas. Produtividade com estilo.';
  }
  if (nome.includes('Caderno')) {
    return 'O Caderno 10 Matérias 200 folhas tem capa dura, folhas pautadas com margens, espiral reforçado para maior durabilidade, divisórias internas e bolsa plástica. O companheiro ideal para aulas, reuniões e anotações do dia a dia.';
  }
  if (nome.includes('Canetinhas') || nome.includes('Hidrográficas')) {
    return 'O Kit Canetinhas Hidrográficas 24 Cores oferece ponta média de 1mm, cores vibrantes e laváveis, tinta atóxica com certificação de segurança e estojo organizador. Perfeito para colorir, desenhar e soltar a criatividade.';
  }
  if (nome.includes('Lapiseira')) {
    return 'A Lapiseira 0.7mm em plástico resistente com grafite de alta qualidade, borracha na ponta, clip para bolso e design anatômico. Ideal para escrita precisa e desenho técnico.';
  }
  if (nome.includes('Borracha')) {
    return 'A Borracha Colorida macia e eficiente, apaga sem borrar nem rasgar o papel, livre de PVC e látex, em formato divertido e colorido. Ideal para escola e escritório.';
  }
  if (nome.includes('Corretivo')) {
    return 'O Corretivo em Fita de 5mm x 6m cobre a escrita na hora sem necessidade de esperar secar, aplicação precisa e limpa, recarregável. Prático e sem bagunça.';
  }
  if (nome.includes('Post-it')) {
    return 'O Post-it 100 Folhas no tamanho 76x76mm, cores sortidas, adesivo reposicionável que não danifica o papel. Ideal para lembretes, marcações e organização.';
  }
  if (nome.includes('Tesoura')) {
    return 'A Tesoura Escolar em aço inox com pontas arredondadas para segurança, lâminas de precisão, cabo ergonômico em plástico, adequada para destros e canhotos. Ideal para artesanato e uso escolar.';
  }
  if (nome.includes('Cola Bastão')) {
    return 'A Cola Bastão 40g é lavável, atóxica, sem solvente, com aplicação suave e uniforme que não enruga o papel. Ideal para papel, papelão e fotos. Segurança e praticidade.';
  }
  if (nome.includes('Mochila') || nome.includes('Escolar Infantil')) {
    return 'A Mochila Escolar Infantil em poliéster resistente, com compartimento principal amplo, bolsos frontais organizadores, alças acolchoadas ajustáveis, estampa lúdica e puxador para pendurar. Conforto e diversão para a volta às aulas.';
  }
  if (nome.includes('Estojo')) {
    return 'O Estojo Escolar com Zíper em nylon resistente, compartimento único, fecho em zíper duplo e design compacto. Leve e prático para transportar seus materiais escolares.';
  }
  if (nome.includes('Régua')) {
    return 'A Régua 30cm Transparente em poliestireno cristal, escala milimetrada e centimétrica impressa a laser, borda reta para corte preciso. Ideal para uso escolar e escritório.';
  }
  return 'Produto de papelaria de qualidade, cuidadosamente selecionado para oferecer a melhor experiência em leitura, estudo e organização.';
}

function descEletronicos(nome, preco) {
  if (nome.includes('Sony') || nome.includes('WH-1000XM5')) {
    return 'O Fone Headset Sony WH-1000XM5 é o melhor fone com cancelamento de ruído ativo do mundo, com processador HD QN1 que elimina ruídos em tempo real, drivers de 30mm com som de alta resolução, 30 horas de bateria, carregamento rápido, design leve e confortável com couro sintético macio. Controle por gestos e assistente de voz integrado. A experiência sonora definitiva.';
  }
  if (nome.includes('JBL Tune 520BT')) {
    return 'O Fone Bluetooth JBL Tune 520BT oferece som Pure Bass característico da JBL, 40 horas de reprodução, carregamento rápido via USB-C, design dobrável leve, microfone integrado para chamadas e conexão multiponto. Perfeito para o dia a dia.';
  }
  if (nome.includes('JBL Boombox 3')) {
    return 'A Caixa de Som JBL Boombox 3 é uma potência portátil com som surround imersivo, graves profundos, 24 horas de bateria, resistência IP67 à água e poeira, Bluetooth 5.3 e powerbank para carregar dispositivos. A festa vai com você para qualquer lugar.';
  }
  if (nome.includes('Galaxy Watch 7')) {
    return 'O Smartwatch Samsung Galaxy Watch 7 com Wear OS, tela Super AMOLED de 1,5 polegadas  sempre ativa, processador Exynos W1000, sensor BioActive para análise corporal completa, GPS integrado, resistência 5ATM + IP68, bateria de 425mAh e monitoramento de saúde avançado. Seu parceiro de bem-estar.';
  }
  if (nome.includes('Apple Watch') || nome.includes('Series 10')) {
    return 'O Smartwatch Apple Watch Series 10 com tela Retina sempre ativa 30% maior, chip S10, sensor de temperatura corporal, ECG, detecção de quedas e acidentes, GPS integrado, resistência à água 50m e bateria com até 18 horas. O melhor smartwatch para saúde e conectividade.';
  }
  if (nome.includes('Mi Band 9') || nome.includes('Smartband')) {
    return 'A Smartband Xiaomi Mi Band 9 tem tela AMOLED de 1,62 polegadas com brilho de 600 nits, monitoramento cardíaco 24h, SpO2, sono e estresse, modos esportivos, resistência à água 5ATM e bateria com 21 dias de autonomia. Saúde inteligente por um preço acessível.';
  }
  if (nome.includes('Canon') || nome.includes('Câmera')) {
    return 'A Câmera Canon EOS R50 é mirrorless com sensor APS-C de 24,2MP, processador DIGIC X, vídeo 4K 30fps, autofoco Dual Pixel CMOS II, tela touch articulável, conectividade Wi-Fi e Bluetooth. Ideal para criar conteúdo de alta qualidade.';
  }
  if (nome.includes('GoPro')) {
    return 'A Câmera GoPro Hero 13 é a ação câmera mais versátil, com vídeo 5.3K 60fps, estabilização HyperSmooth 6.0, resistente até 10m sem caixa, GPS integrado, tela touch frontal e traseira. A companheira ideal para suas aventuras radicais.';
  }
  if (nome.includes('DJI') || nome.includes('Drone')) {
    return 'O Drone DJI Mini 4 Pro pesa apenas 249g, câmera 4K 100fps com sensor 1/1.3", estabilização de 3 eixos, sensores omnidirecionais para evitar obstáculos, transmissão O4 de 20km e 34 minutos de voo. O drone compacto mais avançado para fotografia aérea.';
  }
  if (nome.includes('Power Bank')) {
    return 'O Carregador Portátil Power Bank 20000mAh tem duas portas USB-A e uma USB-C com Power Delivery, carregamento rápido, indicador LED de bateria, design compacto e proteções de segurança. Energia extra para seus dispositivos em qualquer lugar.';
  }
  if (nome.includes('Carregador Turbo')) {
    return 'O Carregador Turbo 65W com tecnologia GaN (nitreto de gálio) é compacto e potente, com portas USB-C PD 3.0 e USB-A, carregamento super rápido para notebooks, tablets e smartphones. Pronto para qualquer dispositivo.';
  }
  if (nome.includes('Hub USB')) {
    return 'O Hub USB-C 7 em 1 expande as portas do seu notebook com 3 entradas USB-A 3.0, HDMI 4K, leitor de cartão SD/TF e USB-C Power Delivery. Compacto e essencial para produtividade.';
  }
  if (nome.includes('Teclado Slim')) {
    return 'O Teclado Slim Bluetooth Multidevices é ultrafino em alumínio escovado, conecta até 3 dispositivos simultaneamente, teclas silenciosas tipo scissor, bateria recarregável de 6 meses. Design elegante para produtividade multiplataforma.';
  }
  if (nome.includes('Mouse Sem Fio Vertical')) {
    return 'O Mouse Sem Fio Vertical em design ergonômico a 57° reduz a tensão no pulso, sensor óptico de 4000 DPI ajustável, conexão Bluetooth 5.0, bateria recarregável e suporte para mãos direita e esquerda. Saúde e conforto para o home office.';
  }
  if (nome.includes('Tablet Positivo')) {
    return 'O Tablet Positivo 10" com tela HD IPS, processador quad-core, 4GB de RAM, 128GB de armazenamento, Wi-Fi, Bluetooth, câmeras frontal e traseira e bateria de 6000mAh. Ideal para entretenimento e estudo.';
  }
  if (nome.includes('Kindle')) {
    return 'O Kindle 11ª Geração tem tela de 6 polegadas com luz embutida ajustável, resolução 300ppi, design leve de 158g, bateria com semanas de duração, armazenamento de 16GB e conexão Wi-Fi. Milhares de livros na palma da sua mão.';
  }
  if (nome.includes('Echo Dot')) {
    return 'O Echo Dot 5ª Geração com Alexa tem som mais encorpado, sensor de temperatura, hub Zigbee integrado, controle por voz, tela LED, design compacto e privacidade com botão físico para desligar microfones. Sua assistente inteligente para o dia a dia.';
  }
  if (nome.includes('Roku') || nome.includes('Express')) {
    return 'O Roku Express 4K transmite streaming em 4K HDR, Wi-Fi de banda dupla, controle remoto com atalhos para Netflix, Prime Video e Disney+, suporte a Alexa e Google Assistente. A maneira mais simples de transformar sua TV em smart.';
  }
  if (nome.includes('Chromecast')) {
    return 'O Chromecast 4K com Google TV oferece streaming em 4K HDR, Dolby Vision e Atmos, controle remoto por voz com Google Assistente, recomendações personalizadas e Chromecast integrado. Todo o entretenimento em um só dispositivo.';
  }
  if (nome.includes('KZ') || nome.includes('Fone de Ouvido')) {
    return 'O Fone de Ouvido Intra-auricular KZ ZSN Pro tem drivers híbridos (balanceado + dinâmico), som de alta definição, cabo destacável com microfone, construção em resina acrílica e design ergonômico. Áudio profissional por um preço acessível.';
  }
  return 'Dispositivo eletrônico moderno com tecnologia de ponta, design funcional e desempenho confiável para atender suas necessidades de conectividade, entretenimento e produtividade.';
}

function descMoveis(nome, preco) {
  if (nome.includes('Sofá 3 Lugares') || nome.includes('Sofá')) {
    return 'O Sofá 3 Lugares em L é o centro da sua sala de estar, com estofamento em veludo premium, espuma D45 de alta resiliência, estrutura em madeira de eucalipto tratada, pés em aço escovado e almofadas de assento removíveis. Design contemporâneo com conforto de primeira linha para até 3 pessoas.';
  }
  if (nome.includes('Cama Box') || nome.includes('Cama')) {
    return 'A Cama Box Casal Queen oferece base box estruturada em madeira com estofamento em sarja, colchão de espuma D45 com tecnologia viscoelástica, pillow top, suporte ergonômico e densidade que se adapta ao corpo. Sono reparador e qualidade de vida.';
  }
  if (nome.includes('Guarda-Roupa')) {
    return 'O Guarda-Roupa 6 Portas + Espelho em MDF revestido, acabamento em laca branca premium, 6 portas com dobradiças amortecedoras, gavetas com corrediça telescópica, cabideiro, prateleiras ajustáveis e espelho na porta central. Organize seu guarda-roupa com elegância e funcionalidade.';
  }
  if (nome.includes('Cômoda')) {
    return 'A Cômoda 4 Gavetas em MDF com estrutura reforçada, gavetas com corrediça metálica telescópica e dampers, puxadores em metal cromado, pés niveladores e tampo em MDF de 25mm. Elegância clássica para seu quarto.';
  }
  if (nome.includes('Mesa de Jantar')) {
    return 'A Mesa de Jantar 6 Lugares com tampo em vidro temperado 10mm, base em aço carbono com pintura eletrostática preta, design clean e cadeiras inclusas com estofamento em couro sintético. O ponto de encontro perfeito para suas refeições.';
  }
  if (nome.includes('Cadeira de Escritório') || nome.includes('Ergonômica')) {
    return 'A Cadeira de Escritório Ergonômica tem encosto alto com suporte lombar ajustável, assento em espuma moldada com revestimento em mesh respirável, braços 3D ajustáveis, base giratória 360° com rodízios silenciosos e mecanismo de inclinação com trava. Sua coluna agradece.';
  }
  if (nome.includes('Escrivaninha')) {
    return 'A Escrivaninha com 3 Gavetas em MDF com tampo de 120x50cm, gavetas com corrediça telescópica, puxadores em alumínio, passa-fios e pés niveladores. O espaço perfeito para home office e estudos.';
  }
  if (nome.includes('Estante para TV')) {
    return 'A Estante para TV 4 Prateleiras em MDF com design modular, prateleiras ajustáveis em altura, compartimento para receiver e videogame, passa-fios internos e capacidade para TVs de até 65 polegadas. Organização e estilo para seu home theater.';
  }
  if (nome.includes('Rack')) {
    return 'O Rack para Sala de Estar em MDF com portas de correr, gavetas, nichos abertos para equipamentos, passa-fios traseiro e tampo reforçado. Design versátil que combina com qualquer decoração.';
  }
  if (nome.includes('Penteadeira')) {
    return 'A Penteadeira com Espelho é o móvel dos sonhos, com tampo em MDF, espelho grande emoldurado, 3 gavetas com divisórias para organização de maquiagem, banquetinha inclusa e iluminação em LED. Seu cantinho de beleza em casa.';
  }
  if (nome.includes('Criado-Mudo')) {
    return 'O Criado-Mudo 2 Gavetas em MDF com design compacto, gavetas com puxadores em alumínio, tampo para apoio, pés niveladores. Prático e elegante ao lado da cama.';
  }
  if (nome.includes('Berço')) {
    return 'O Berço Montessoriano em MDF reflorestado, design inspirado no método Montessori, grades laterais que incentivam a independência do bebê, 3 alturas ajustáveis, rodízios com travas e certificação do INMETRO. Segurança e desenvolvimento para seu pequeno.';
  }
  if (nome.includes('Poltrona Giratória')) {
    return 'A Poltrona Giratória em veludo macio com base giratória 360° em aço cromado, encosto alto e envolvente, assento amplo com espuma D45, braços acolchoados. Conforto e estilo para leitura e descanso.';
  }
  if (nome.includes('Mesa para Notebook') || nome.includes('Dobrável')) {
    return 'A Mesa para Notebook Dobrável é leve e portátil, com tampo em MDF de 60x40cm, pernas retráteis de alumínio, ajuste de altura, encaixe para copo e suporte para tablet. Trabalhe de qualquer lugar com conforto.';
  }
  if (nome.includes('Banco') || nome.includes('Jardim')) {
    return 'O Banco de Madeira para Jardim em eucalipto tratado com verniz resistente a intempéries, design rústico com encosto curvo, capacidade para 2 pessoas e pés com niveladores. Seu refúgio ao ar livre.';
  }
  if (nome.includes('Aparador')) {
    return 'O Aparador de Sala em MDF com 2 portas e tampo amplo, design retrô com pés palito, puxadores em metal dourado, prateleiras internas ajustáveis e pintura em laca acetinada. Elegância e funcionalidade para sua sala de jantar.';
  }
  if (nome.includes('Nicho') || nome.includes('Decorativo')) {
    return 'O Nicho Decorativo 8 Peças em MDF no formato geométrico hexagonal, pintura em laca branca, suportes para fixação inclusos e disposição livre na parede. Crie composições únicas para decorar.';
  }
  if (nome.includes('Balcão') || nome.includes('Cozinha')) {
    return 'O Balcão de Cozinha 2m em MDF revestido com laminado melamínico, tampo em granito sintético, 3 portas com dampers, gavetas, nicho para cooktop e rodapé. Sua cozinha completa e funcional.';
  }
  if (nome.includes('Cadeira de Plástico')) {
    return 'A Cadeira de Plástico Reforçada em polipropileno de alta resistência, empilhável para fácil armazenamento, design com encosto e assento ergonômicos, capacidade de até 120kg. Prática e resistente para qualquer ambiente.';
  }
  if (nome.includes('Cabideiro')) {
    return 'O Cabideiro de Parede 6 Ganchos em metal cromado, design minimalista, fixação robusta com buchas e parafusos inclusos, ganchos duplos com giro. Organização elegante para halls e closets.';
  }
  return 'Móvel de alta qualidade fabricado com materiais resistentes e design contemporâneo, projetado para oferecer conforto, funcionalidade e beleza para sua casa ou escritório.';
}

function descBeleza(nome, preco) {
  if (nome.includes('Malbec') || nome.includes('Boticário')) {
    return 'O Perfume Malbec Gold é a fragrância masculina da linha premium do Boticário, com notas de saída de bergamota e pimenta rosa, coração de lavanda e sálvia, e fundo amadeirado de cedro e couro. Uma assinatura olfativa marcante e sofisticada para o homem moderno.';
  }
  if (nome.includes('Egeo Dolce') || nome.includes('Egeo')) {
    return 'O Perfume Egeo Dolce é uma fragrância feminina frutal e floral, com notas de saída de frutas vermelhas, coração de jasmim e violeta, e fundo de baunilha e âmbar. Um perfume jovem, doce e envolvente para momentos especiais.';
  }
  if (nome.includes('Kaiak') || nome.includes('Aventura')) {
    return 'O Perfume Kaiak Aventura combina notas aquáticas frescas com toques cítricos de limão siciliano, coração herbal de alecrim e lavanda, e fundo amadeirado. A fragrância ideal para o homem aventureiro e dinâmico.';
  }
  if (nome.includes('212 VIP') || nome.includes('212')) {
    return 'O Perfume 212 VIP Rose é uma fragrância floral amadeirada feminina, com notas de champanhe, framboesa, pimenta rosa, rosa búlgara, almíscar e patchouli. Um perfume sofisticado e sensual que exala confiança.';
  }
  if (nome.includes('Acqua di Gio')) {
    return 'O Perfume Acqua di Gio é um clássico atemporal da Giorgio Armani, com notas marinhas frescas, bergamota, tangerina, coração de alecrim e lavanda, e fundo de patchouli e almíscar. Elegância e frescor em uma fragrância icônica.';
  }
  if (nome.includes('Carolina Herrera') || nome.includes('Good Girl')) {
    return 'O Perfume Carolina Herrera Good Girl é uma fragrância floral oriental com notas de amêndoa, café, jasmim, tuberosa, fava de tonka e cacau. Um perfume ousado, sofisticado e inconfundível no icônico frasco de salto alto.';
  }
  if (nome.includes('Base Líquida') || nome.includes('Tracta')) {
    return 'A Base Líquida Tracta oferece cobertura média a alta com acabamento natural, textura leve que uniformiza a pele, FPS 15, longa duração e disponível em diversos tons. Pele perfeita e protegida.';
  }
  if (nome.includes('Batom') || nome.includes('Ruby Rose')) {
    return 'O Batom Matte Ruby Rose tem textura cremosa de alta pigmentação, acabamento matte aveludado, longa duração e enriquecido com manteiga de karité para hidratar os lábios. Cor intensa com conforto.';
  }
  if (nome.includes('Paleta de Sombras')) {
    return 'A Paleta de Sombras 16 Cores tem pigmentação intensa com acabamentos matte, shimmer e glitter, textura macia e fácil de esfumar, espelho incluso e design compacto. Todas as cores que você precisa em uma só paleta.';
  }
  if (nome.includes('Delineador')) {
    return 'O Delineador Líquido tem ponta ultrafina de 0,01mm para traços precisos, fórmula à prova d\'água de longa duração, pigmentação intensa e aplicador em feltro. Olhos marcantes em um só traço.';
  }
  if (nome.includes('Máscara de Cílios') || nome.includes('Maybelline')) {
    return 'A Máscara de Cílios Maybelline tem escova inovadora que separa e alonga os cílios, fórmula de longa duração à prova d\'água, volume intenso sem grumos. Olhos expressivos em segundos.';
  }
  if (nome.includes('Pincéis') || nome.includes('Kit Pincéis')) {
    return 'O Kit Pincéis de Maquiagem 12 Peças em cabo de madeira com cerdas sintéticas macias, ideal para aplicar base, pó, blush, sombra, delineado e batom. Estojo organizador incluso. Para uma make profissional em casa.';
  }
  if (nome.includes('Shampoo') || nome.includes('Kerastase')) {
    return 'O Shampoo Kerastase 250ml é um tratamento profissional que limpa suavemente enquanto nutre e fortalece os fios, com fórmula enriquecida com ceramidas e glicerina. Cabelos saudáveis e brilhantes com a expertise de um salão.';
  }
  if (nome.includes('Condicionador') || nome.includes('Elseve')) {
    return 'O Condicionador Elseve desembaraça e nutre os fios com sua fórmula enriquecida com óleos nutritivos, deixando o cabelo macio, brilhante e fácil de pentear. Cuidado acessível para todos os dias.';
  }
  if (nome.includes('Creme Hidratante') || nome.includes('Natura')) {
    return 'O Creme Hidratante Corporal Natura tem fórmula enriquecida com manteiga de karité e óleo de coco, hidratação profunda por 48h, textura cremosa de rápida absorção e fragrância suave. Pele macia e perfumada.';
  }
  if (nome.includes('Protetor Solar') || nome.includes('FPS')) {
    return 'O Protetor Solar Facial FPS 60 oferece proteção de amplo espectro UVA/UVB, textura leve oil-free com toque seco, rápida absorção, resistente à água e não comedogênico. Proteção diária essencial para sua pele.';
  }
  if (nome.includes('Desodorante') || nome.includes('Rexona')) {
    return 'O Desodorante Rexona Clinical oferece proteção antitranspirante de 72 horas, fórmula com 4x mais ação contra o suor, toque seco e fragrância suave. A confiança de não se preocupar com suor.';
  }
  if (nome.includes('Aparelho de Barbear') || nome.includes('Gillette')) {
    return 'O Aparelho de Barbear Gillette 6 Lâminas tem lâminas de precisão com lubrificante avançado, cabeça giratória flexível que se adapta aos contornos do rosto e tira laminada para barbear rente sem irritação. Barbear suave e preciso.';
  }
  if (nome.includes('Escova Secadora')) {
    return 'A Escova Secadora de Cabelo combina secador e escova em um só aparelho, com potência de 1000W, cerdas de nylon e tufos de javali, 3 temperaturas, íons condicionadores e design ergonômico. Cabelo seco e modelado em minutos.';
  }
  if (nome.includes('Chapinha') || nome.includes('Prancha Alisadora')) {
    return 'A Chapinha Prancha Alisadora tem placas de cerâmica flutuantes com tecnologia infravermelha, ajuste de temperatura de 120 a 230°C, desligamento automático, design slim e cabo giratório. Alisamento perfeito sem danificar os fios.';
  }
  return 'Produto de beleza e perfumaria de alta qualidade, desenvolvido com ingredientes selecionados para cuidar da sua pele, cabelo e bem-estar com eficácia e segurança.';
}

function descGames(nome, preco) {
  if (nome.includes('PlayStation 5') || nome.includes('PS5')) {
    return 'O PlayStation 5 Slim é a versão mais compacta do console da Sony, com SSD ultrarrápido de 1TB para carregamento instantâneo, controle DualSense com feedback háptico e gatilhos adaptáveis, suporte a Ray Tracing, áudio 3D Tempest e jogos exclusivos de tirar o fôlego. A experiência definitiva em games.';
  }
  if (nome.includes('Xbox Series X')) {
    return 'O Xbox Series X é o console mais potente da Microsoft, com processador customizado AMD Zen 2, SSD NVMe de 1TB, 12 TFLOPS de potência gráfica, suporte a Ray Tracing, Quick Resume que permite alternar entre jogos instantaneamente e compatibilidade com 4 gerações de jogos Xbox. Jogue sem limites.';
  }
  if (nome.includes('Nintendo Switch')) {
    return 'O Nintendo Switch OLED tem tela OLED de 7 polegadas com cores vibrantes, dock com porta LAN, armazenamento de 64GB, áudio aprimorado e suporte aos melhores títulos exclusivos Nintendo. A versatilidade de jogar em casa ou em qualquer lugar.';
  }
  if (nome.includes('Controle PS5') || nome.includes('DualSense')) {
    return 'O Controle PS5 DualSense revoluciona a experiência de jogo com feedback háptico imersivo, gatilhos adaptáveis que variam a resistência, microfone integrado, alto-falante embutido e design ergonômico com iluminação RGB. Sinta cada momento do jogo.';
  }
  if (nome.includes('Controle Xbox') || nome.includes('Sem Fio')) {
    return 'O Controle Xbox Sem Fio tem design ergonômico lapidado para maior conforto, botão compartilhar, conexão Bluetooth e Xbox Wireless, entrada para fone de 3,5mm e pilhas com até 40 horas de duração. Precisão e conforto para vencer.';
  }
  if (nome.includes('GTA VI')) {
    return 'GTA VI para PS5 é o aguardado novo capítulo da série Grand Theft Auto, ambientado na vibrante Vice City com gráficos de nova geração, história envolvente com protagonistas duplos, mundo aberto expansivo e o caos e liberdade que só a Rockstar Games oferece.';
  }
  if (nome.includes('EA FC 26')) {
    return 'EA FC 26 traz a experiência mais autêntica de futebol com gráficos下一代, jogabilidade refinada com o motor Frostbite, modos Carreira, Ultimate Team, Clubs e Volta com elencos atualizados e novas mecânicas. Para quem vive o futebol.';
  }
  if (nome.includes('Call of Duty') || nome.includes('COD')) {
    return 'Call of Duty 2026 (PS5) é o FPS mais aguardado do ano, com campanha cinematográfica intensa, multiplayer competitivo com mapas e modos inéditos, Warzone integrado, gráficos de ponta e áudio imersivo. Ação sem limites.';
  }
  if (nome.includes('Zelda') || nome.includes('Tears of Kingdom')) {
    return 'Zelda: Tears of the Kingdom para Nintendo Switch é a sequência épica de Breath of the Wild, com um Hyrule expandido entre céu e terra, novas habilidades criativas de construção, inimigos inéditos e uma história profunda sobre a coragem e o poder da triforce. Uma obra-prima.';
  }
  if (nome.includes('Headset Gamer') || nome.includes('HyperX')) {
    return 'O Headset Gamer HyperX Cloud II tem drivers de 53mm com som surround virtual 7.1, microfone removível com cancelamento de ruído, arco de alumínio resistente, almofadas em couro com espuma viscoelástica e controle de áudio inline. Conforto e som profissional para jogar.';
  }
  if (nome.includes('Cadeira Gamer')) {
    return 'A Cadeira Gamer ThunderX3 C3 tem estrutura de aço reforçado, espuma moldada de alta densidade, revestimento em couro sintético respirável, braços 3D ajustáveis, encosto reclinável até 180°, apoio lombar e de cabeça inclusos e base giratória com rodízios silenciosos. Domine suas maratonas de jogo.';
  }
  if (nome.includes('Mouse Gamer') || nome.includes('G403')) {
    return 'O Mouse Gamer Logitech G403 tem sensor HERO 25K de 25600 DPI, design ergonômico para destros, 6 botões programáveis, iluminação RGB LIGHTSYNC e cabo flexível. Leve, preciso e confiável para jogos competitivos.';
  }
  if (nome.includes('Teclado Gamer') || nome.includes('Redragon')) {
    return 'O Teclado Gamer Mecânico Redragon com switches Outemu Blue de resposta tátil e clique sonoro, iluminação RGB individual por tecla, estrutura em aço, anti-ghosting completo e 104 teclas. Precisão e estilo para suas jogadas.';
  }
  if (nome.includes('Mousepad') || nome.includes('XXL')) {
    return 'O Mousepad Gamer XXL nas dimensões 90x40cm cobre toda a mesa, superfície de tecido microtexturizado para deslize preciso com sensores ópticos e laser, base de borracha antiderrapante e bordas costuradas. A base para seu setup gamer.';
  }
  if (nome.includes('RTX 5070') || nome.includes('Placa de Vídeo')) {
    return 'A Placa de Vídeo RTX 5070 com arquitetura NVIDIA Blackwell, 16GB GDDR7, Ray Tracing de 4ª geração, DLSS 4, suporte a NVIDIA Reflex e 3 fans com iluminação RGB. A nova geração do desempenho gráfico.';
  }
  if (nome.includes('Ryzen') || nome.includes('AMD')) {
    return 'O Processador AMD Ryzen 7 9800X3D com arquitetura Zen 5, 8 núcleos e 16 threads, cache 3D V-Cache de 96MB, frequência de até 5,6GHz e soquete AM5. O processador gamer mais rápido do mundo para quem exige o máximo.';
  }
  if (nome.includes('RAM') || nome.includes('DDR5') || nome.includes('32GB')) {
    return 'A Memória RAM 32GB DDR5 tem frequência de 6000MHz, latência CL30, dissipador de calor em alumínio, suporte a Intel XMP 3.0 e AMD EXPO. Desempenho extremo para jogos e multitarefa pesada.';
  }
  if (nome.includes('Placa Mãe') || nome.includes('ASUS') || nome.includes('X670E')) {
    return 'A Placa Mãe ASUS X670E com soquete AM5, chipset X670, suporte DDR5 e PCIe 5.0, Wi-Fi 6E, Bluetooth 5.3, 4 slots M.2 NVMe, áudio de alta definição e iluminação RGB Aura Sync. A base perfeita para sua build dos sonhos.';
  }
  if (nome.includes('SSD NVMe') || nome.includes('2TB Gamer')) {
    return 'O SSD NVMe 2TB Gamer com interface PCIe 4.0, velocidades de leitura de até 7450MB/s e gravação de 6900MB/s, dissipador térmico integrado e tecnologia DRAM cache. Carregue jogos em segundos.';
  }
  if (nome.includes('Fonte 850W') || nome.includes('Fonte')) {
    return 'A Fonte 850W 80 Plus Gold com certificação de eficiência, cabos totalmente modulares, ventoinha de 135mm com controle de temperatura, proteções OVP/UVP/OCP/SCP e suporte a PCIe 5.0. Energia limpa e estável para seu PC gamer.';
  }
  return 'Produto gamer de alto desempenho, projetado para oferecer a melhor experiência em jogos com gráficos imersivos, resposta rápida e qualidade de construção premium.';
}

function descEletrodomesticos(nome, preco) {
  if (nome.includes('Geladeira') || nome.includes('Electrolux')) {
    return 'A Geladeira Frost Free 400L Electrolux tem capacidade de 400 litros, tecnologia Frost Free que elimina o acúmulo de gelo, compressor inverter de alta eficiência energética A, prateleiras ajustáveis em vidro temperado, gavetão de legumes com controle de umidade, porta-latas e design em inox escovado. Sua cozinha mais inteligente e econômica.';
  }
  if (nome.includes('Fogão') || nome.includes('Consul')) {
    return 'O Fogão 5 Bocas Consul tem queimações profissionais com acendimento automático, forno com capacidade de 80L e luz interna, timer sonoro, grades de ferro fundido e design em aço inox. Prepare suas receitas com precisão e segurança.';
  }
  if (nome.includes('Micro-ondas') || nome.includes('Philco')) {
    return 'O Micro-ondas 31L Philco tem painel digital touch, 10 níveis de potência, 8 menus automáticos, função descongelar por tempo e peso, trava de segurança infantil e interior em aço inox de fácil limpeza. Praticidade no dia a dia.';
  }
  if (nome.includes('Lava e Seca') || nome.includes('Samsung')) {
    return 'A Lava e Seca 11kg Samsung com tecnologia EcoBubble e Digital Inverter, capacidade de 11kg para lavar e 6kg para secar, 14 programas de lavagem, display digital, controle por aplicativo SmartThings e eficiência A. A solução completa para sua lavanderia.';
  }
  if (nome.includes('Máquina de Lavar') || nome.includes('LG')) {
    return 'A Máquina de Lavar 13kg LG com motor Smart Inverter de 10 anos de garantia, tela LED, 12 programas de lavagem, função vapor, cesto em aço inox e segurança contra vazamentos. Roupas limpas com economia e durabilidade.';
  }
  if (nome.includes('Ar Condicionado') || nome.includes('Split')) {
    return 'O Ar Condicionado 12000 BTUs Split Inverter com tecnologia de climatização precisa, compressor inverter silencioso e econômico, filtro de ar antibacteriano, controle remoto com timer, modo dormir e telas de proteção. Clima ideal para seu ambiente em qualquer estação.';
  }
  if (nome.includes('Ventilador') || nome.includes('Teto')) {
    return 'O Ventilador de Teto 100W com 3 pás reversíveis, 3 velocidades, controle de parede ou remoto, design clean em branco e hastes de 30cm para tetos baixos. Circulação eficiente e silenciosa para todos os ambientes.';
  }
  if (nome.includes('Air Fryer') || nome.includes('Mondial')) {
    return 'A Air Fryer 5,5L Mondial prepara alimentos crocantes com até 98% menos óleo, tecnologia de circulação de ar quente, painel digital com 8 programas pré-definidos, timer e ajuste de temperatura de 80 a 200°C, cesto antiaderente removível. Comer frito sem culpa.';
  }
  if (nome.includes('Aspirador') || nome.includes('Vertical') || nome.includes('Philco')) {
    return 'O Aspirador de Pó Vertical Philco tem potência de 1200W, tecnologia ciclônica sem saco, filtro HEPA lavável, bocal para pisos e tapetes, bocal fenda incluso e design leve de 4,2kg. Limpeza prática e eficiente para toda a casa.';
  }
  if (nome.includes('Ferro a Vapor') || nome.includes('Britânia')) {
    return 'O Ferro a Vapor Britânia tem potência de 1500W, base em cerâmica que desliza suavemente, vapor constante de 30g/min, jato de vapor de 120g/min, borrifador e sistema antigotejamento. Roupas sem vincos com rapidez.';
  }
  if (nome.includes('Cafeteira Expresso') || nome.includes('Cafeteira')) {
    return 'A Cafeteira Expresso 15 Bar tem bomba de 15 bares de pressão para extrair cafés com crema perfeito, bocal vaporizador para leite, reservatório de 1,4L, bandeja aquecida para xícaras e bandeja removível. Café de qualidade profissional em casa.';
  }
  if (nome.includes('Torradeira')) {
    return 'A Torradeira Elétrica 2 Fendas tem 6 níveis de tosta, função descongelar e reaquecer, bandeja coletora de migalhas removível, desligamento automático e design compacto. Torradas perfeitas todas as manhãs.';
  }
  if (nome.includes('Freezer')) {
    return 'O Freezer Vertical 140L tem capacidade de 140 litros, 3 gavetas, sistema frost free, controle de temperatura externo, eficiência energética A, prateleiras removíveis e design em inox. Congele e organize seus alimentos com eficiência.';
  }
  if (nome.includes('Purificador') || nome.includes('Água')) {
    return 'O Purificador de Água Refrigerado tem sistema de refrigeração com compressor, filtro de carvão ativado que remove cloro e impurezas, torneira elétrica, design compacto e capacidade de 2L. Água pura e fresca sempre disponível.';
  }
  if (nome.includes('KitchenAid') || nome.includes('Batedeira')) {
    return 'A Batedeira Planetária KitchenAid é o eletrodoméstico mais icônico da cozinha, com motor de 300W, tigela de aço inox de 4,7L, 10 velocidades, batedor em forma de plano orbital, gancho para pão e rotor. Potência e design para criar receitas inesquecíveis.';
  }
  if (nome.includes('Multiprocessador') || nome.includes('Alimentos')) {
    return 'O Multiprocessador de Alimentos com motor de 700W, 3 lâminas intercambiáveis (picar, fatiar, ralar), copo de 2L, batedor para massas e emulsificador. Preparo rápido e prático de todos os ingredientes.';
  }
  if (nome.includes('Fritadeira') || nome.includes('Óleo')) {
    return 'A Fritadeira Elétrica a Óleo 7L tem potência de 1800W, controle de temperatura ajustável, cesto removível com capacidade de 1,5kg, tampa com visor, filtro antiodor e desligamento automático de segurança. Frituras crocantes sem sujeira.';
  }
  if (nome.includes('Exaustor') || nome.includes('Cozinha')) {
    return 'O Exaustor de Cozinha 60cm tem vazão de 800m³/h, 3 velocidades, filtro de alumínio lavável, iluminação em LED, design em aço inox e acionamento por botões de pressão. Adeus, fumaça e odores da cozinha.';
  }
  if (nome.includes('Aquecedor') || nome.includes('Gás')) {
    return 'O Aquecedor a Gás 16L com acendimento automático, controle digital de temperatura, segurança com sensor de chama e fluxo, vazão de 16 litros por minuto. Água quente instantânea em toda a casa com segurança.';
  }
  if (nome.includes('Robô Aspirador') || nome.includes('WAP')) {
    return 'O Robô Aspirador WAP Robo Clean com mapeamento inteligente, sensores de obstáculo e queda, 3 modos de limpeza, função aspiração e passagem de pano, bateria de 120min com retorno automático à base. Sua casa limpa sem esforço.';
  }
  return 'Eletrodoméstico eficiente e moderno, projetado com tecnologia de ponta para facilitar as tarefas do lar, economizar energia e trazer mais conforto para o seu dia a dia.';
}

const descricoes = {
  'Celulares e Smartphones': descCelular,
  'Informática': descInformatica,
  'Moda e Vestuário': descModa,
  'Esportes e Fitness': descEsportes,
  'Casa e Decoração': descCasa,
  'Cozinha e Utensílios': descCozinha,
  'Livros e Papelaria': descLivros,
  'Eletrônicos': descEletronicos,
  'Móveis': descMoveis,
  'Beleza e Perfumaria': descBeleza,
  'Games': descGames,
  'Eletrodomésticos': descEletrodomesticos
};

for (const p of products) {
  const gerar = descricoes[p.categoria];
  if (gerar) {
    p.descricao = gerar(p.nome, p.preco);
  }
}

fs.writeFileSync(__dirname + '/../backend/data/products.json', JSON.stringify(products, null, 2), 'utf-8');
console.log('Generated descriptions for ' + products.length + ' products');
