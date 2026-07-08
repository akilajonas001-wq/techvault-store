const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const match = envContent.match(/DATABASE_URL=(.+)/);
const url = match[1].trim();

const pool = new Pool({ connectionString: url.replace(':5432', ':6543'), ssl: { rejectUnauthorized: false } });

const descricoes = {
  "Organizador de gavetas com divisórias ajustáveis": "Mantenha suas gavetas sempre organizadas com este prático organizador de divisórias ajustáveis. Feito em material resistente, permite criar compartimentos personalizados para roupas, acessórios, ferramentas e muito mais. Ideal para quem busca praticidade e ordem no dia a dia.",
  "Suporte para rolo de papel toalha de parede (adesivo)": "Suporte adesivo para papel toalha que instala em segundos sem necessidade de furos ou parafusos. Fixação forte e segura, ideal para cozinhas, áreas de serviço e bancadas. Libera espaço e mantém o papel sempre à mão.",
  "Suporte adesivo para celular na cozinha (com receitas)": "Suporte adesivo para celular resistente a respingos, perfeito para usar na cozinha enquanto segue receitas. Acompanha base giratória e encaixe firme para a maioria dos modelos. Prático, compacto e fácil de instalar.",
  "Kit de unhas em gel UV (lâmpada + esmaltes)": "Kit completo de unhas em gel com lâmpada UV de secagem rápida e conjunto de esmaltes em gel nas cores mais usadas. Inclui base, top coat e ferramentas essenciais. Resultado profissional no conforto da sua casa.",
  "Difusor de óleos essenciais ultrassônico portátil": "Difusor ultrassônico compacto que aromatiza ambientes de forma suave e contínua. Silencioso, com luz LED e desligamento automático, funciona com qualquer óleo essencial. Perfeito para quarto, escritório ou sala.",
  "Tornozeleira de compressão para alívio de dor": "Tornozeleira elástica de compressão gradual para alívio de dores, inchaços e suporte pós-treino. Confeccionada em material respirável e leve, ajusta-se confortavelmente ao tornozelo. Ideal para uso diário e atividades esportivas.",
  "Tampa de silicone universal para potes": "Tampa de silicone flexível que se adapta a potes, tigelas e recipientes de diferentes tamanhos. Vedação hermética que mantém os alimentos frescos por mais tempo. Reutilizável, lavável e substitui o plástico-filme.",
  "Lâmpada de sal do Himalaia (pequena)": "Lâmpada decorativa esculpida em sal rosa do Himalaia, com base em madeira e lâmpada LED interna. Emite uma luz suave e aconchegante, perfeita para criar um ambiente relaxante. Peça única com cristal natural.",
  "Cushion de gel para joelhos": "Almofada de gel com memória para alívio da pressão sobre os joelhos durante alongamentos, ioga ou trabalho no chão. Superfície antiderrapante e ergonômica que se adapta ao movimento. Leve e fácil de transportar.",
  "Kit de etiquetas adesivas para organização": "Kit com etiquetas adesivas de diversos tamanhos e cores para organizar potes, caixas, pastas e documentos. Escrita fácil e aderência duradoura sem deixar resíduos. A solução prática para uma casa ou escritório organizado.",
  "Escova de dentes elétrica recarregável": "Escova de dentes elétrica com cerdas macias e tecnologia sônica de limpeza profunda. Bateria recarregável de longa duração com indicador de carga. Remove até 3x mais placa que a escovação manual.",
  "Fita adesiva para lifting facial instantâneo": "Fita adesiva transparente para lifting facial instantâneo, ideal para levantar e firmar a pele de forma natural. Hipoalergênica e discreta, proporciona efeito lifting sem procedimentos estéticos. Perfeita para fotos, eventos e uso diário.",
  "Aspirador de mão portátil recarregável (mini)": "Aspirador portátil sem fio com potente sucção, ideal para limpeza rápida de migalhas, pó e sujeiras do dia a dia. Bateria recarregável e design compacto que cabe em qualquer gaveta. Bivolt e fácil de esvaziar.",
  "Tapete antiderrapante para banheiro": "Tapete antiderrapante com ventosas firmes que aderem ao piso molhado, proporcionando segurança durante o banho. Material macio e confortável para os pés, com secagem rápida e fácil limpeza. Disponível em diversas cores.",
  "Pote hermético a vácuo para alimentos": "Pote hermético com sistema de vedação a vácuo que preserva a frescura dos alimentos por até 3x mais tempo. Tampa transparente com trava de segurança. Perfeito para armazenar grãos, cereais, biscoitos e mantimentos.",
  "Cinto reversível de couro sintético": "Cinto dupla face em couro sintético de alta durabilidade, oferecendo duas cores em um único acessório. Fivela giratória de metal com design moderno e elegante. Ajustável e ideal para looks casuais ou formais.",
  "Kit de meias invisíveis antiderrapantes (5 pares)": "Kit com 5 pares de meias invisíveis com acabamento antiderrapante no calcanhar para conforto e segurança. Confeccionadas em algodão macio com reforço nos dedos e calcanhar. Perfeitas para tênis e sapatos baixos.",
  "Carteira inteligente com bloqueio RFID": "Carteira fina e elegante com tecnologia de bloqueio RFID que protege seus cartões contra clonagem e leituras indevidas. Compartimentos organizados para cartões, cédulas e moedas. Couro sintético premium com costura reforçada.",
  "Anel ajustável de aço inoxidável (vários modelos)": "Anel ajustável em aço inoxidável com design moderno que se adapta perfeitamente a qualquer dedo. Resistente à água e ao desgaste, ideal para uso diário. Disponível em diversos modelos e acabamentos.",
  "Bolsa transversal minimalista em couro sintético": "Bolsa transversal compacta em couro sintético com design minimalista e elegante. Alça ajustável, compartimentos internos organizados e fechamento seguro. Ideal para o dia a dia, viagens e eventos casuais.",
  "Canivete multifuncional 12 em 1 (cartão de crédito)": "Canivete multifuncional no formato de cartão de crédito, cabe na carteira e oferece 12 ferramentas úteis. Inclui tesoura, lâmina, abre-garrafas, chave de fenda e muito mais. Perfeito para emergências do dia a dia.",
  "Escorredor de louça dobrável de silicone": "Escorredor de louça dobrável em silicone de alta temperatura, compacto e funcional. Expande quando necessário e dobra para guardar em qualquer gaveta. Antiderrapante e ideal para cozinhas com pouco espaço.",
  "Espelho de maquiagem com LED e zoom 10x": "Espelho de maquiagem profissional com iluminação LED natural ajustável e aumento de 10x para precisão nos detalhes. Base giratória 360° e braço articulado para ajuste de ângulo. Recarregável via USB.",
  "Hub USB-C 6 em 1 (leitor de cartão + HDMI + USB)": "Hub USB-C multifuncional 6 em 1 compatível com notebooks e tablets. Portas HDMI 4K, leitor de cartão SD/TF, 3 portas USB 3.0 e carregamento PD. Solução completa para expandir a conectividade do seu dispositivo.",
  "Frasco squeeze para óleo de cozinha (com bico dosador)": "Squeeze prático para óleo de cozinha com bico dosador que evita excessos e desperdícios. Design anatômico e vedação à prova de vazamentos. Ideal para saladas, grelhados e preparos saudáveis.",
  "Fechadura digital com impressão digital (porta)": "Fechadura digital inteligente com leitor de impressão digital de alta precisão e senha numérica. Instalação simples na porta existente sem necessidade de obras. Ideal para casa, escritório ou comércio.",
  "Bijuterias douradas/fosco - kit de argolas e brincos": "Kit de bijuterias com argolas e brincos em acabamento dourado e fosco, tendência da estação. Peças leves, resistentes e hipoalergênicas. Conjunto versátil para compor looks do dia a noite.",
  "Relógio digital feminino (modelo fashion)": "Relógio digital feminino com design fashion e mostrador de cristal líquido colorido. Pulseira confortável em silicone hipoalergênico com resistência à água. Funções de cronômetro, alarme e iluminação noturna.",
  "Cabide magnético para eletrodomésticos": "Cabide magnético ultraforte que se fixa em qualquer superfície metálica, ideal para pendurar utensílios, panos e pequenos objetos. Suporta até 3kg e mantém sua cozinha ou área de serviço organizada.",
  "Hidratante labial colorido (gloss com efeito)": "Hidratante labial com cor e brilho que hidrata profundamente enquanto realça os lábios com acabamento gloss. Fórmula enriquecida com vitamina E e óleos naturais. Leve, não pegajoso e de longa duração.",
  "Escova alisadora de cabelo elétrica portátil": "Escova alisadora elétrica com placas de cerâmica e íons negativos que alisa e reduz o frizz em segundos. Aquece rapidamente, com temperatura ajustável e desligamento automático. Design portátil para levar na bolsa.",
  "Fone Bluetooth 5.3 (cápsula/mini)": "Fone de ouvido Bluetooth 5.3 em formato mini cápsula com emparelhamento instantâneo e som estéreo de alta qualidade. Microfone embutido para chamadas nítidas e bateria com até 24h de reprodução.",
  "Lixeira automática com sensor (infravermelho)": "Lixeira inteligente com sensor infravermelho que abre automaticamente ao detectar movimento. Vedação que isola odores e alça para transporte. Funciona com pilhas ou bateria recarregável, disponível em vários tamanhos.",
  "Amaciante de roupas em folha reutilizável": "Folhas reutilizáveis para amaciar roupas na máquina de lavar, substituindo amaciantes líquidos por até 100 lavagens cada. Reduz o odor, estática e suaviza os tecidos. Ecológico e econômico.",
  "Post-it adesivo transparente (reposicionável)": "Bloco de post-its transparentes que se destacam em qualquer superfície sem esconder o que está escrito. Reposicionáveis e ideais para estudos, trabalho e lembretes visuais. Pacote com múltiplos tamanhos.",
  "Luz de leitura com clip (recarregável)": "Luz de leitura portátil com clip ajustável que se prende a livros, tablets ou superfícies. LED recarregável com 3 níveis de intensidade e luz quente/fria. Bateria de longa duração sem cansaço visual.",
  "Modelador de cílios aquecido": "Modelador de cílios aquecido que curva e fixa os cílios por até 24 horas sem danificar. Aquecimento rápido e temperatura controlada para segurança. Compatível com máscaras à prova d'água.",
  "Suporte de notebook articulado dobrável": "Suporte articulado para notebook com ângulos ajustáveis que melhora a postura e a circulação de ar. Dobrável e portátil para levar no escritório ou home office. Compatível com notebooks de até 15.6 polegadas.",
  "Manta de massagem com aquecimento": "Manta elétrica com vibração de massagem e aquecimento uniforme para relaxamento muscular. Controles independentes de intensidade e temperatura, com timer programável. Ideal para o sofá, cama ou escritório.",
  "Kit de lâminas de barbear com cabeça giratória": "Kit com lâminas de barbear de aço inoxidável com cabeça giratória que se adapta aos contornos do rosto. Lâminas lubrificantes para deslize suave e confortável. Cabo ergonômico antiderrapante.",
  "Lanterna recarregável tipo caneta": "Lanterna no formato caneta com LED potente e corpo em alumínio resistente. Recarregável via USB, cabe no bolso e é ideal para uso profissional, leitura de disjuntores, inspeções e emergências.",
  "Kit de canetas coloridas com brush pen": "Kit de canetas coloridas com ponta brush pen flexível para lettering, desenhos e destaques. Cores vibrantes, tinta à base d'água atóxica e durável. Estojo prático para armazenar e transportar.",
  "Pano de microfibra que seca sem risco": "Pano de microfibra premium que remove água, poeira e gordura sem arranhar superfícies. Secagem rápida, não solta fiapos e é reutilizável. Perfeito para vidros, espelhos, eletrônicos e automóveis.",
  "Carregador sem fio rápido (wireless pad)": "Carregador wireless pad com carregamento rápido compatível com todos os smartphones com Qi. Design ultrafino com LED indicador e proteção contra sobrecarga. Basta posicionar o celular e carregar.",
  "Rolo de jade ou gua sha massageador facial": "Rolo de jade natural com massageador facial gua sha para alívio de tensão e estímulo da circulação. Sensação refrescante que reduz olheiras e inchaço. Peça única em pedra natural com cabo de madeira.",
  "Kit de escovação dental para pets": "Kit completo de higiene bucal para pets com escova de cerdas macias e pasta dental sabor carne. Remove tártaro e mau hálito de forma segura. Indicado para cães e gatos de todos os portes.",
  "Toalha de microfibra para cabelo (toalha turbante)": "Toalha turbante de microfibra superabsorvente que reduz o tempo de secagem do cabelo pela metade. Design com botão e alça que prende o cabelo sem apertar. Ideal para cabelos crespos, cacheados e lisos.",
  "Máscara de LED facial portátil (acne/rejuvenescimento)": "Máscara facial com tecnologia LED terapêutica em múltiplos comprimentos de onda para tratar acne, manchas e rejuvenescimento. Leve, portátil e confortável com timer automático. Resultados visíveis em semanas.",
  "Kit de vedação para portas (fita de silicone)": "Kit de vedação de silicone para portas e janelas que isola ruídos, poeira e correntes de ar. Fita autoadesiva de fácil instalação que se adapta a diferentes espaços. Economiza energia e aumenta o conforto.",
  "Lenço de seda (poliéster) com estampas variadas": "Lenço em poliéster com toque de seda e estampas variadas que trazem sofisticação a qualquer look. Leve, macio e disponível em múltiplas cores. Pode ser usado no pescoço, cabelo, bolsa ou pulseira.",
  "Bolsa transportadora dobrável para pets": "Bolsa transportadora dobrável para pequenos animais com alça e estrutura reforçada. Confeccionada em material respirável com abertura frontal e superior. Leve e compacta, ideal para viagens e passeios.",
  "Óculos de sol com armação retrô (grife-style)": "Óculos de sol com armação retrô estilo grife, lentes UV400 com proteção contra raios UVA/UVB. Design vintage que combina com qualquer estilo. Leve, resistente e acompanha estojo de proteção.",
  "Quadro magnético pequeno para lembretes": "Quadro magnético compacto para afixar lembretes, fotos e recados com ímãs inclusos. Moldura elegante que combina com qualquer ambiente. Perfeito para geladeira, mesas ou paredes do escritório.",
  "Garrafa térmica de aço inoxidável (500ml)": "Garrafa térmica em aço inoxidável com dupla parede que mantém bebidas quentes por 12h ou geladas por 24h. Tampa à prova de vazamentos, design elegante e boca larga para fácil limpeza. Livre de BPA.",
  "Palmilha ortopédica de gel": "Palmilha ortopédica de gel com suporte para o arco e amortecimento de impacto. Reduz a fadiga e a dor nos pés durante longas caminhadas ou trabalho em pé. Ajustável a diferentes calçados.",
  "Anel de luz (ring light) portátil para fotos": "Ring light portátil com suporte ajustável para celular, ideal para fotos profissionais ao vivo e vídeos. Iluminação LED com 3 temperatures de cor e 10 níveis de brilho. USB recarregável.",
  "Tira-olheiras de hidrogel (pacote com 30 pares)": "Pacote com 30 pares de tiras de hidrogel para olheiras com ácido hialurônico e colágeno. Reduz olheiras, inchaço e linhas finas em minutos. Sensação refrescante e resultados imediatos.",
  "Fonte de água automática para pets (bebedouro)": "Fonte de água automática para cães e gatos com filtro de carvão ativado que mantém a água fresca e oxigenada. Fluxo ajustável, reservatório de grande capacidade e silenciosa. Incentiva a hidratação do pet.",
  "Suporte de celular para carro (ventosa magnética)": "Suporte magnético para celular no carro com ventosa forte que fixa no painel ou para-brisa. Imã potente que segura o celular firmemente sem interferir no sinal. Rotação 360° para visualização em qualquer ângulo.",
  "Mouse silencioso sem fio ergonômico": "Mouse sem fio com cliques silenciosos e design ergonômico que reduz a fadiga das mãos. Sensor óptico preciso, conexão USB e bateria de longa duração. Ideal para escritório, home office e jogos casuais.",
  "Kit de bordado/crochê para iniciantes (com videoaula)": "Kit completo de bordado e crochê para iniciantes com linha, agulhas, bastidor e acessórios. Inclui acesso a videoaulas passo a passo para aprender do absoluto zero. Projetos simples e criativos para começar.",
  "Chapéu bucket (pescador) unissex": "Chapéu bucket unissex em algodão com proteção UV, leve e confortável para uso diário. Modelo clássico pescador com aba curta que protege do sol sem atrapalhar a visão. Disponível em várias cores.",
  "Suporte para monitor/notebook (elevador)": "Suporte elevador para monitor ou notebook em alumínio escovado com design open-frame. Eleva a tela ao nível dos olhos para melhor postura e ergonomia. Compatível com monitores de até 32 polegadas.",
  "Limpador de teclado portátil (gel mágico)": "Gel mágico limpador que alcança sujeiras entre as teclas do teclado, painéis de carro, saídas de ar e fendas. Não tóxico, reutilizável e não deixa resíduos. Fácil de usar e leva em qualquer lugar.",
  "Controle remoto para selfie Bluetooth": "Controle remoto Bluetooth para selfie compatível com iOS e Android. Pareamento instantâneo, alcance de até 10 metros e design compacto que cabe no chaveiro. Perfeito para fotos em grupo e vídeos.",
  "Organizador de mesa acrílico (giratório)": "Organizador de mesa acrílico giratório com múltiplos compartimentos para canetas, clipes, post-its e acessórios. Design moderno e funcional que mantém sua mesa sempre arrumada. Gira 360° para fácil acesso.",
  "Jogo de tabuleiro em miniatura (viagem)": "Jogo de tabuleiro compacto no formato de estojo, ideal para levar em viagens e passeios. Inclui peças magnéticas que não se perdem e tabuleiro dobrável. Diversão garantida em qualquer lugar.",
  "Pulseira fitness simples (contador de passos)": "Pulseira fitness inteligente com monitoramento de passos, calorias e qualidade do sono. Display OLED touch, resistente à água e bateria com até 7 dias de autonomia. Sincroniza com app gratuito.",
  "Luminária de mesa com braço articulado e LED": "Luminária de mesa com braço articulado em alumínio e LED de alta luminosidade com ajuste de intensidade. Design moderno e funcional com base estável e pescoço flexível. Ideal para estudo e trabalho.",
  "Fita métrica digital a laser (pequena)": "Fita métrica digital a laser compacta que mede distâncias com precisão de até 40 metros. Display LCD iluminado com medição em metros/pés/polegadas. Ideal para reformas, decoração e marcenaria.",
  "Avental de limpeza para óculos VR/óculos comuns": "Avental de microfibra suave para limpeza segura de lentes de óculos VR, óculos comuns e telas. Remove impressões digitais, poeira e gordura sem riscos. Reutilizável e lavável.",
  "Necessaire de viagem compacta": "Necessaire compacta em material impermeável com compartimento interno e alça para pendurar. Ideal para organizar cosméticos, escovas e itens de higiene em viagens. Leve, resistente e fácil de limpar.",
  "Mochila dobrável impermeável (sacola)": "Mochila dobrável impermeável que se compacta em um pequeno pouch para levar na bolsa. Feita em nylon resistente à água, ideal para emergências, viagens e compras. Capacidade de até 20 litros.",
  "Coleira refletiva com luz LED": "Coleira ajustável com tira refletiva e luz LED recarregável para segurança do seu pet em passeios noturnos. Visível a longa distância, resistente à água e confortável para uso contínuo.",
  "Power bank fino 10.000mAh (fino e leve)": "Power bank ultrafino com capacidade de 10.000mAh, suficiente para carregar seu celular até 3 vezes. Design elegante em alumínio, entrada USB-C e saída rápida de 2.1A. Perfeito para o dia a dia.",
  "Kit de chaves Allen/hexagonais em formato compacto": "Kit de chaves Allen hexagonais em formato compacto tipo canivete com as bitolas mais usadas. Aço de alta resistência com cabo ergonômico. Ideal para montagem de móveis, bicicletas e reparos domésticos.",
  "Bolsa de água quente (elétrica e sem fio)": "Bolsa de água quente elétrica portátil com aquecimento rápido e desligamento automático sem necessidade de fio na hora do uso. Revestimento em flanela macia para maior conforto e segurança. Ideal para cólicas e dores musculares.",
  "Mini ventilador USB recarregável": "Mini ventilador portátil recarregável via USB com 3 velocidades e base de mesa. Silencioso, compacto e com pás protegidas para segurança. Ideal para escritório, academia, acampamento e dias quentes.",
  "Caneta touch universal para tablets": "Caneta touch com ponta precisa e sensível compatível com todos os tablets e smartphones. Design fino similar a uma caneta comum, com clipe para prender no bolso. Leve e sem necessidade de pareamento.",
  "Chave de fenda elétrica recarregável (mini)": "Chave de fenda elétrica recarregável compacta com pontas intercambiáveis armazenadas no corpo. Bateria de longa duração e LED na ponta para iluminar a área de trabalho. Ideal para eletrônicos e reparos delicados.",
  "Suporte de parede para mangueira de jardim": "Suporte de parede em metal resistente para organizar a mangueira de jardim sem enrolar. Instalação simples com parafusos e buchas inclusos. Mantém a mangueira sempre pronta para usar sem nós.",
  "Comedouro lento para cães (labirinto)": "Comedouro lento tipo labirinto que estimula a alimentação mais lenta, prevenindo engasgos, vômitos e obesidade. Design divertido e colorido em material atóxico. Lavável e resistente para cães de todos os portes.",
  "Cabo de carregamento magnético (tipo retrátil)": "Cabo magnético tipo retrátil com ponta magnética que se encaixa automaticamente, prolongando a vida útil do conector. Compatível com USB-C e Micro USB. Design que não embaraça e fácil de transportar.",
  "Brinquedo interativo para gato (vara com pena)": "Brinquedo interativo com vara flexível e pena colorida que desperta o instinto de caça do seu gato. Estímulo ao exercício e ao vínculo entre tutor e pet. Leve, resistente e substituível.",
  "Cama de cachorro/gato aquecida (autoaquecível)": "Cama autoaduecível para pets com tecnologia que reflete o calor corporal, mantendo seu animal aquecido sem eletricidade. Confortável, lavável e com base antiderrapante. Ideal para dias frios.",
  "Tapete higiênico reutilizável lavável": "Tapete higiênico reutilizável para pets com camada impermeável que absorve a urina sem vazar. Lavável em máquina, ecológico e econômico comparado aos descartáveis. Ideal para filhotes e adestramento.",
  "Kit de desenho profissional (lápis + carvão) para iniciantes": "Kit de desenho profissional com lápis grafite, carvão vegetal, esfuminho e borracha. Estojo compacto ideal para iniciantes e artistas em desenvolvimento. Materiais de alta qualidade para sombreamento e detalhes.",
  "Abridor de garrafas automático (elétrico)": "Abridor de garrafas automático elétrico que remove rolhas com um toque. Funciona com pilhas e é compatível com a maioria dos tamanhos de rolha. Design elegante em aço escovado, presente ideal.",
  "Capa de chuva compacta (tamanho bolso)": "Capa de chuva compacta que cabe no bolso e se abre em segundos quando necessário. Feita em poliéster resistente à água com costura selada. Leve, descartável mas reutilizável, ideal para imprevistos.",
  "Sensor de movimento com luz LED interna": "Sensor de movimento com luz LED embutida que acende automaticamente ao detectar presença. Instalação simples com fita adesiva ou parafusos. Perfeito para corredores, escadas, armários e garagens.",
  "Luz de cabeceira 3D (efeito cubo flutuante)": "Luminária 3D com efeito cubo flutuante que cria ilusão de ótica com luzes LED coloridas. Controle remoto para mudança de cor e intensidade. Peça decorativa única para quarto e sala de estar.",
  "Apoio de pulso para teclado em gel": "Apoio de pulso ergonômico em gel de memória que reduz a tensão e a fadiga durante a digitação. Base antiderrapante que não desliza na mesa. Compatível com teclados padrão e mecânicos.",
  "Mini grampeador sem esforço": "Mini grampeador compacto com alavanca que reduz o esforço necessário para grampear. Design leve e portátil que cabe em qualquer estojo ou gaveta. Ideal para escritório, escola e uso doméstico.",
  "Caneca colorida que muda de cor com calor": "Caneca mágica que revela uma imagem ou mensagem escondida quando recebe líquido quente. Cerâmica de alta qualidade com capacidade de 300ml e acabamento brilhante. Presente criativo e divertido.",
  "Kit de culinária infantil (forma de moldar arroz/legumes)": "Kit divertido para transformar arroz, legumes e alimentos em formas lúdicas que incentivam as crianças a comer melhor. Moldes de material atóxico e seguros para alimentos. Fácil de usar e lavar.",
  "Mini projetor de estrelas/galáxia no teto": "Mini projetor noturno que transforma o teto do quarto em um céu estrelado ou galáxia com cores vibrantes. Rotação automática e ajuste de foco. Ideal para relaxamento, meditação e quarto infantil.",
  "Caderno inteligente (reutilizável) + caneta apagável": "Caderno inteligente com páginas reutilizáveis que podem ser apagadas com água ou pano úmido. Inclui caneta especial com tinta borrável. Reduz o desperdício de papel e é prático para anotações do dia a dia.",
  "Fidget spinner de metal (gira e dura muito)": "Fidget spinner de metal com rolamento de cerâmica que gira por minutos sem parar. Design aerodinâmico e peso equilibrado para giros longos e suaves. Alivia estresse e melhora a concentração.",
  "Máquina de algodão-doce portátil (elétrica, pequena)": "Máquina elétrica portátil para fazer algodão-doce em casa em poucos minutos. Fácil de usar, limpar e guardar. Diversão garantida para festas, encontros e sobremesas criativas.",
  "Pente desembaraçador mágico": "Pente desembaraçador com cerdas flexíveis que deslizam pelos fios sem puxar ou quebrar. Design ergonômico com almofada que se adapta ao couro cabeludo. Ideal para todos os tipos de cabelo, inclusive úmido."
};

async function main() {
  const result = await pool.query('SELECT id, nome, descricao FROM products ORDER BY id');
  const products = result.rows;

  let atualizados = 0;
  let ignorados = 0;

  for (const product of products) {
    const descricao = descricoes[product.nome];
    if (!descricao) {
      console.log(`⚠️  Nenhuma descrição mapeada para: "${product.nome}" (ID: ${product.id})`);
      ignorados++;
      continue;
    }
    await pool.query('UPDATE products SET descricao = $1 WHERE id = $2', [descricao, product.id]);
    console.log(`✅ "${product.nome}" - descrição atualizada`);
    atualizados++;
  }

  console.log(`\nConcluído! ${atualizados} produtos atualizados, ${ignorados} ignorados.`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
