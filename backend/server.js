require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'techvault-secret-key-2026';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

let googleClient = null;
if (GOOGLE_CLIENT_ID) {
  googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Arquivos de dados
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');
const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const COMMENTS_FILE = path.join(__dirname, 'data', 'comments.json');
const CART_FILE = path.join(__dirname, 'data', 'cart.json');
const CHATS_FILE = path.join(__dirname, 'data', 'chats.json');

// Criar diretório data se não existir
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Inicializar arquivos de dados
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, '[]');
}
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, '[]');
}
if (!fs.existsSync(PRODUCTS_FILE)) {
  fs.writeFileSync(PRODUCTS_FILE, '[]');
}
if (!fs.existsSync(COMMENTS_FILE)) {
  fs.writeFileSync(COMMENTS_FILE, '[]');
}
if (!fs.existsSync(CART_FILE)) {
  fs.writeFileSync(CART_FILE, '{}');
}
if (!fs.existsSync(CHATS_FILE)) {
  fs.writeFileSync(CHATS_FILE, '{}');
}

// Funções auxiliares
function loadUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function loadOrders() {
  return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
}

function saveOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function loadProducts() {
  return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
}

function loadComments() {
  return JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf8'));
}

function saveComments(comments) {
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
}

function loadCarts() {
  return JSON.parse(fs.readFileSync(CART_FILE, 'utf8'));
}

function saveCarts(carts) {
  fs.writeFileSync(CART_FILE, JSON.stringify(carts, null, 2));
}

function loadChats() {
  return JSON.parse(fs.readFileSync(CHATS_FILE, 'utf8'));
}

function saveChats(chats) {
  fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2));
}

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'akilajonas001@gmail.com',
    pass: process.env.EMAIL_PASS || 'sua-senha-de-aplicativo'
  }
});

// === ROTAS DA API ===

// Registro de usuário
app.post('/api/register', async (req, res) => {
  try {
    const { nome, email, senha, telefone } = req.body;
    
    const users = loadUsers();
    
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    const senhaHash = await bcrypt.hash(senha, 10);
    
    const newUser = {
      id: Date.now(),
      nome,
      email,
      senha: senhaHash,
      telefone,
      admin: false,
      role: null,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    const token = jwt.sign({ id: newUser.id, email: newUser.email, admin: false, role: null }, JWT_SECRET, {
      expiresIn: '7d'
    });
    
    res.json({ 
      success: true, 
      token,
      user: { id: newUser.id, nome: newUser.nome, email: newUser.email, admin: false, role: null }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    const users = loadUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }
    
    const senhaValida = await bcrypt.compare(senha, user.senha);
    
    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }
    
    const isAdmin = user.admin === true;
    const role = user.role || null;
    const token = jwt.sign({ id: user.id, email: user.email, admin: isAdmin, role }, JWT_SECRET, {
      expiresIn: '7d'
    });
    
    res.json({ 
      success: true, 
      token,
      user: { id: user.id, nome: user.nome, email: user.email, admin: isAdmin, role }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Login com Google
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Credencial do Google não fornecida' });
    }

    if (!googleClient) {
      return res.status(500).json({ error: 'Google OAuth não configurado. Defina GOOGLE_CLIENT_ID no .env' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    const users = loadUsers();
    let user = users.find(u => u.email === email);

    if (!user) {
      user = {
        id: Date.now(),
        nome: name || email.split('@')[0],
        email,
        googleId,
        avatar: picture || null,
        telefone: '',
        admin: false,
        role: null,
        createdAt: new Date().toISOString()
      };
      users.push(user);
      saveUsers(users);
    } else {
      user.googleId = googleId;
      user.avatar = picture || user.avatar;
      saveUsers(users);
    }

    const isAdmin = user.admin === true;
    const role = user.role || null;
    const token = jwt.sign({ id: user.id, email: user.email, admin: isAdmin, role }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      success: true,
      token,
      user: { id: user.id, nome: user.nome, email: user.email, admin: isAdmin, role, avatar: user.avatar }
    });
  } catch (error) {
    console.error('Erro no login com Google:', error);
    res.status(500).json({ error: 'Erro ao autenticar com Google' });
  }
});

const PICPAY_FEE = 0.0099;
const TAX_RATE = 0.06;
const PIX_KEY = process.env.PIX_KEY || 'techvault@picpay.com';

// Criar pedido
app.post('/api/orders', async (req, res) => {
  try {
    const { userId, endereco, itens, total, totalOriginal, cupom, cliente } = req.body;
    
    const users = loadUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    
    const picpayFee = total * PICPAY_FEE;
    const tax = total * TAX_RATE;
    const netAmount = total - picpayFee - tax;
    
    const newOrder = {
      id: Date.now(),
      userId,
      usuario: {
        nome: user.nome,
        email: user.email,
        telefone: user.telefone
      },
      endereco,
      itens,
      total,
      totalOriginal: totalOriginal || total,
      cupom: cupom || null,
      cliente: cliente || {},
      taxas: {
        picpayFee: parseFloat(picpayFee.toFixed(2)),
        impostos: parseFloat(tax.toFixed(2)),
        netAmount: parseFloat(netAmount.toFixed(2))
      },
      pagamento: 'PicPay PIX',
      status: 'aprovado',
      createdAt: new Date().toISOString()
    };
    
    const orders = loadOrders();
    orders.push(newOrder);
    saveOrders(orders);
    
    // Enviar email
    const emailHtml = `
      <h1>Novo Pedido - TechVault</h1>
      <h2>Dados do Cliente</h2>
      <p><strong>Nome:</strong> ${user.nome}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Telefone:</strong> ${cliente?.telefone || user.telefone || 'N/A'}</p>
      
      <h2>Endereço de Entrega</h2>
      <p>${endereco.logradouro}, ${endereco.numero}${endereco.complemento ? ' - ' + endereco.complemento : ''}</p>
      <p>${endereco.bairro} - ${endereco.cidade}/${endereco.estado}</p>
      <p>CEP: ${endereco.cep}</p>
      
      <h2>Itens do Pedido</h2>
      <ul>
        ${itens.map(item => `<li>${item.quantidade}x ${item.nome} - R$ ${(item.preco * item.quantidade).toFixed(2)}</li>`).join('')}
      </ul>
      
      <h2>Resumo Financeiro</h2>
      <p><strong>Total da venda:</strong> R$ ${total.toFixed(2)}</p>
      <p><strong>Taxa PicPay PIX (0,99%):</strong> -R$ ${picpayFee.toFixed(2)}</p>
      <p><strong>Imposto Simples Nacional (6%):</strong> -R$ ${tax.toFixed(2)}</p>
      <p><strong>Valor líquido recebido:</strong> R$ ${netAmount.toFixed(2)}</p>
      <p><strong>Pagamento:</strong> PicPay PIX - ${cupom?.code ? 'Cupom aplicado: ' + cupom.code : 'Pagamento à vista'}</p>
    `;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'akilajonas001@gmail.com',
      to: 'akilajonas001@gmail.com',
      subject: `Novo Pedido #${newOrder.id} - TechVault`,
      html: emailHtml
    };
    
    try {
      await transporter.sendMail(mailOptions);
      console.log('Email enviado com sucesso');
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
    }
    
    res.json({ 
      success: true, 
      orderId: newOrder.id,
      message: 'Pedido realizado com sucesso!',
      pixKey: PIX_KEY,
      taxas: newOrder.taxas
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro ao processar pedido' });
  }
});

// Dados do usuário
app.get('/api/users/:id', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });

    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const users = loadUsers();
    const user = users.find(u => u.id == req.params.id);
    if (!user || user.id != decoded.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      telefone: user.telefone || '',
      role: user.role || null,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Erro ao carregar usuário:', error);
    res.status(500).json({ error: 'Erro ao carregar dados' });
  }
});

// Verificar autenticação
// Retorna configurações públicas do frontend
app.get('/api/config', (req, res) => {
  res.json({
    googleClientId: GOOGLE_CLIENT_ID || '',
    picpay: {
      fee: PICPAY_FEE,
      taxRate: TAX_RATE,
      pixKey: PIX_KEY,
      paymentMethod: 'PicPay PIX'
    }
  });
});

app.get('/api/auth/check', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.json({ authenticated: false });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = loadUsers();
    const user = users.find(u => u.id === decoded.id);
    
    if (!user) {
      return res.json({ authenticated: false });
    }
    
    const isAdmin = user.admin === true;
    const role = user.role || null;
    res.json({ 
      authenticated: true, 
      user: { id: user.id, nome: user.nome, email: user.email, admin: isAdmin, role }
    });
  } catch (error) {
    res.json({ authenticated: false });
  }
});

// === ROTAS DO MARKETPLACE ===

function filterActive(products) {
  return products.filter(p => p.paused !== true);
}

// Produtos em destaque (ANTES de /api/products/:id)
app.get('/api/products/featured', (req, res) => {
  try {
    const products = filterActive(loadProducts());
    const featured = products.filter(p => p.destaque).slice(0, 12);
    res.json(featured);
  } catch (error) {
    console.error('Erro ao carregar destaques:', error);
    res.status(500).json({ error: 'Erro ao carregar destaques' });
  }
});

// Ofertas do dia (ANTES de /api/products/:id)
app.get('/api/products/offers', (req, res) => {
  try {
    const products = filterActive(loadProducts());
    const offers = products
      .filter(p => p.preco < 200)
      .slice(0, 10);
    res.json(offers);
  } catch (error) {
    console.error('Erro ao carregar ofertas:', error);
    res.status(500).json({ error: 'Erro ao carregar ofertas' });
  }
});

// Listar todos os produtos
app.get('/api/products', (req, res) => {
  try {
    const products = filterActive(loadProducts());
    res.json(products);
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    res.status(500).json({ error: 'Erro ao carregar produtos' });
  }
});

// Buscar produtos
app.get('/api/products/search', (req, res) => {
  try {
    const { q, categoria, precoMin, precoMax, ordem, page, limit } = req.query;
    let products = filterActive(loadProducts());
    
    if (q) {
      const termo = q.toLowerCase();
      products = products.filter(p => 
        p.nome.toLowerCase().includes(termo) ||
        p.descricao?.toLowerCase().includes(termo) ||
        p.categoria.toLowerCase().includes(termo)
      );
    }
    
    if (categoria) {
      products = products.filter(p => p.categoria === categoria);
    }
    
    if (precoMin) {
      products = products.filter(p => p.preco >= parseFloat(precoMin));
    }
    if (precoMax) {
      products = products.filter(p => p.preco <= parseFloat(precoMax));
    }
    
    if (ordem === 'menor-preco') {
      products.sort((a, b) => a.preco - b.preco);
    } else if (ordem === 'maior-preco') {
      products.sort((a, b) => b.preco - a.preco);
    } else if (ordem === 'mais-vendidos') {
      products.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    } else if (ordem === 'melhor-avaliado') {
      products.sort((a, b) => b.avaliacao - a.avaliacao);
    }

    const total = products.length;
    const p = parseInt(page) || 1;
    const l = parseInt(limit) || 30;
    const start = (p - 1) * l;
    const paginated = products.slice(start, start + l);
    
    res.json({ products: paginated, total, page: p, totalPages: Math.ceil(total / l) });
  } catch (error) {
    console.error('Erro na busca:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// Categoria com paginação
app.get('/api/products/category/:categoria', (req, res) => {
  try {
    const { page, limit } = req.query;
    const categoria = req.params.categoria;
    let products = filterActive(loadProducts()).filter(p => p.categoria === categoria);
    const total = products.length;
    const p = parseInt(page) || 1;
    const l = parseInt(limit) || 30;
    const start = (p - 1) * l;
    const paginated = products.slice(start, start + l);
    res.json({ products: paginated, total, page: p, totalPages: Math.ceil(total / l) });
  } catch (error) {
    console.error('Erro ao carregar categoria:', error);
    res.status(500).json({ error: 'Erro ao carregar produtos' });
  }
});

// Listar categorias
app.get('/api/categories', (req, res) => {
  try {
    const products = loadProducts();
    const categorias = [...new Set(products.map(p => p.categoria))];
    res.json(categorias);
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    res.status(500).json({ error: 'Erro ao carregar categorias' });
  }
});

// Obter produto por ID (DEPOIS das rotas específicas)
app.get('/api/products/:id', (req, res) => {
  try {
    const products = loadProducts();
    const product = products.find(p => p.id === parseInt(req.params.id));
    
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json({ ...product, paused: product.paused === true });
  } catch (error) {
    console.error('Erro ao carregar produto:', error);
    res.status(500).json({ error: 'Erro ao carregar produto' });
  }
});

// === COMENTÁRIOS ===

// Listar comentários de um produto
app.get('/api/products/:id/comments', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const comments = loadComments();
    const productComments = comments
      .filter(c => c.productId === productId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(productComments);
  } catch (error) {
    console.error('Erro ao carregar comentários:', error);
    res.status(500).json({ error: 'Erro ao carregar comentários' });
  }
});

// Adicionar comentário
app.post('/api/products/:id/comments', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { userId, userName, rating, comment } = req.body;

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ error: 'O comentário não pode estar vazio' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'A avaliação deve ser entre 1 e 5' });
    }

    const newComment = {
      id: Date.now(),
      productId,
      userId: userId || null,
      userName: userName || 'Anônimo',
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString()
    };

    const comments = loadComments();
    comments.push(newComment);
    saveComments(comments);

    res.json({ success: true, comment: newComment });
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ error: 'Erro ao adicionar comentário' });
  }
});

// Newsletter
const NEWSLETTER_FILE = path.join(__dirname, 'data', 'newsletter.json');
if (!fs.existsSync(NEWSLETTER_FILE)) {
  fs.writeFileSync(NEWSLETTER_FILE, '[]');
}

app.post('/api/newsletter', (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    const subscribers = JSON.parse(fs.readFileSync(NEWSLETTER_FILE, 'utf8'));
    if (subscribers.find(s => s.email === email)) {
      return res.json({ success: true, message: 'Email já cadastrado' });
    }
    subscribers.push({ email, createdAt: new Date().toISOString() });
    fs.writeFileSync(NEWSLETTER_FILE, JSON.stringify(subscribers, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Erro na newsletter:', error);
    res.status(500).json({ error: 'Erro ao cadastrar email' });
  }
});

// Cupons de desconto
const COUPONS_FILE = path.join(__dirname, 'data', 'coupons.json');
if (!fs.existsSync(COUPONS_FILE)) {
  fs.writeFileSync(COUPONS_FILE, JSON.stringify([
    { code: 'BEMVIDO10', discount: 10, type: 'percent', minValue: 0, valid: true },
    { code: 'TECH20', discount: 20, type: 'percent', minValue: 100, valid: true },
    { code: 'FRETEGRATIS', discount: 100, type: 'frete', minValue: 150, valid: true }
  ], null, 2));
}

app.post('/api/coupons/validate', (req, res) => {
  try {
    const { code, total } = req.body;
    if (!code) return res.status(400).json({ error: 'Código do cupom é obrigatório' });

    const coupons = JSON.parse(fs.readFileSync(COUPONS_FILE, 'utf8'));
    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.valid);

    if (!coupon) {
      return res.status(404).json({ error: 'Cupom não encontrado ou expirado' });
    }

    if (total < coupon.minValue) {
      return res.status(400).json({ error: 'Valor mínimo de R$ ' + coupon.minValue.toFixed(2).replace('.', ',') + ' para usar este cupom' });
    }

    let discount = 0;
    if (coupon.type === 'percent') {
      discount = total * (coupon.discount / 100);
    } else if (coupon.type === 'fixed') {
      discount = coupon.discount;
    }

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discount: coupon.discount,
        type: coupon.type,
        discountValue: Math.min(discount, total)
      }
    });
  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    res.status(500).json({ error: 'Erro ao validar cupom' });
  }
});

// Pedidos do usuário
app.get('/api/orders/user/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || req.params.userId;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });

    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }

    if (decoded.id != userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const orders = loadOrders();
    const userOrders = orders
      .filter(o => o.userId == userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(userOrders);
  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
    res.status(500).json({ error: 'Erro ao carregar pedidos' });
  }
});

// Lista de desejos (persistida no servidor para usuários logados)
const WISHLIST_FILE = path.join(__dirname, 'data', 'wishlist.json');
if (!fs.existsSync(WISHLIST_FILE)) {
  fs.writeFileSync(WISHLIST_FILE, '{}');
}

app.get('/api/wishlist/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || req.params.userId;
    const wishlists = JSON.parse(fs.readFileSync(WISHLIST_FILE, 'utf8'));
    res.json(wishlists[userId] || []);
  } catch (error) {
    console.error('Erro ao carregar wishlist:', error);
    res.status(500).json({ error: 'Erro ao carregar favoritos' });
  }
});

app.post('/api/wishlist/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || req.params.userId;
    const { productId } = req.body;
    const wishlists = JSON.parse(fs.readFileSync(WISHLIST_FILE, 'utf8'));
    if (!wishlists[userId]) wishlists[userId] = [];
    const idx = wishlists[userId].indexOf(productId);
    if (idx > -1) {
      wishlists[userId].splice(idx, 1);
    } else {
      wishlists[userId].push(productId);
    }
    fs.writeFileSync(WISHLIST_FILE, JSON.stringify(wishlists, null, 2));
    res.json({ success: true, items: wishlists[userId] });
  } catch (error) {
    console.error('Erro na wishlist:', error);
    res.status(500).json({ error: 'Erro ao atualizar favoritos' });
  }
});

// Deletar comentário
app.delete('/api/products/:id/comments/:commentId', (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Autenticação necessária' });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const comments = loadComments();
    const index = comments.findIndex(c => c.id === commentId);

    if (index === -1) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }

    if (comments[index].userId !== userId) {
      return res.status(403).json({ error: 'Você não tem permissão para deletar este comentário' });
    }

    comments.splice(index, 1);
    saveComments(comments);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar comentário:', error);
    res.status(500).json({ error: 'Erro ao deletar comentário' });
  }
});

// Middleware de admin
function adminAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Autenticação necessária' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = loadUsers();
    const user = users.find(u => u.id === decoded.id);
    if (!user || user.admin !== true) {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
    req.adminUser = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Sincronizar carrinho do usuário no servidor
app.post('/api/cart/sync', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });

    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const { items } = req.body;
    const carts = loadCarts();
    carts[decoded.id] = { items: items || [], updatedAt: new Date().toISOString() };
    saveCarts(carts);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao sincronizar carrinho:', error);
    res.status(500).json({ error: 'Erro ao salvar carrinho' });
  }
});

// Limpar carrinho do servidor (após compra)
app.post('/api/cart/clear', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });

    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const carts = loadCarts();
    delete carts[decoded.id];
    saveCarts(carts);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao limpar carrinho:', error);
    res.status(500).json({ error: 'Erro ao limpar carrinho' });
  }
});

// === ROTAS DE ADMIN ===

app.get('/api/admin/orders', adminAuth, (req, res) => {
  try {
    const orders = loadOrders();
    const sorted = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
  } catch (error) {
    console.error('Erro ao carregar pedidos (admin):', error);
    res.status(500).json({ error: 'Erro ao carregar pedidos' });
  }
});

app.get('/api/admin/users', adminAuth, (req, res) => {
  try {
    const users = loadUsers();
    const safe = users.map(u => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      telefone: u.telefone || '',
      admin: u.admin === true,
      role: u.role || null,
      createdAt: u.createdAt,
      googleId: u.googleId ? true : false
    }));
    res.json(safe);
  } catch (error) {
    console.error('Erro ao carregar usuários (admin):', error);
    res.status(500).json({ error: 'Erro ao carregar usuários' });
  }
});

app.get('/api/admin/carts', adminAuth, (req, res) => {
  try {
    const carts = loadCarts();
    const users = loadUsers();
    const result = [];

    for (const [userId, cartData] of Object.entries(carts)) {
      const user = users.find(u => u.id == userId);
      if (user && cartData.items && cartData.items.length > 0) {
        result.push({
          userId: parseInt(userId),
          userName: user.nome,
          userEmail: user.email,
          items: cartData.items,
          itemCount: cartData.items.reduce((s, i) => s + (i.quantidade || 1), 0),
          updatedAt: cartData.updatedAt
        });
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Erro ao carregar carrinhos (admin):', error);
    res.status(500).json({ error: 'Erro ao carregar carrinhos' });
  }
});

// Listar funcionários (admins + staff)
app.get('/api/admin/staff', adminAuth, (req, res) => {
  try {
    const users = loadUsers();
    const staff = users.filter(u => u.admin === true || (u.role && u.role !== 'cliente'));
    const safe = staff.map(u => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      telefone: u.telefone || '',
      role: u.role || 'admin',
      admin: u.admin === true,
      createdAt: u.createdAt
    }));
    res.json(safe);
  } catch (error) {
    console.error('Erro ao carregar staff:', error);
    res.status(500).json({ error: 'Erro ao carregar staff' });
  }
});

// Definir cargo de usuário (só admin pode)
app.post('/api/admin/set-role', adminAuth, (req, res) => {
  try {
    if (req.adminUser.role && req.adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem definir cargos' });
    }
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email é obrigatório' });
    if (role && !['admin', 'funcionario'].includes(role)) {
      return res.status(400).json({ error: 'Cargo inválido. Use: admin ou funcionario' });
    }
    const users = loadUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    if (role === 'admin') {
      user.admin = true;
      user.role = 'admin';
    } else if (role === 'funcionario') {
      user.admin = true;
      user.role = 'funcionario';
    } else {
      user.admin = false;
      user.role = null;
    }
    saveUsers(users);
    res.json({ success: true, user: { id: user.id, nome: user.nome, email: user.email, role: user.role, admin: user.admin } });
  } catch (error) {
    console.error('Erro ao definir cargo:', error);
    res.status(500).json({ error: 'Erro ao definir cargo' });
  }
});

// Listar todos os produtos (admin) com status paused e precoAlterado
app.get('/api/admin/products', adminAuth, (req, res) => {
  try {
    const products = loadProducts();
    const { search, paused } = req.query;
    let filtered = products;
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(p => p.nome.toLowerCase().includes(term) || p.categoria.toLowerCase().includes(term));
    }
    if (paused === 'true') filtered = filtered.filter(p => p.paused === true);
    if (paused === 'false') filtered = filtered.filter(p => !p.paused);
    res.json(filtered.map(p => {
      const modified = p.paused === true || p.precoAlterado === true;
      return {
        id: p.id, nome: p.nome, categoria: p.categoria,
        preco: p.preco, precoOriginal: p.precoOriginal || null,
        paused: p.paused === true, precoAlterado: p.precoAlterado === true,
        modified,
        imagem: p.imagem, estoque: p.estoque || 'N/A'
      };
    }));
  } catch (error) {
    console.error('Erro ao carregar produtos (admin):', error);
    res.status(500).json({ error: 'Erro ao carregar produtos' });
  }
});

// Alterar preço de produto
app.post('/api/admin/products/:id/update-price', adminAuth, (req, res) => {
  try {
    if (req.adminUser.role === 'funcionario') {
      return res.status(403).json({ error: 'Apenas administradores podem alterar preços' });
    }
    const { preco } = req.body;
    if (!preco || preco <= 0) return res.status(400).json({ error: 'Preço inválido' });

    const products = loadProducts();
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

    const parsedPreco = parseFloat(preco);
    if (!product.precoOriginal) {
      product.precoOriginal = product.preco;
    }
    product.preco = parsedPreco;
    product.precoAlterado = parsedPreco !== product.precoOriginal;
    const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));

    res.json({ success: true, id: product.id, nome: product.nome, preco: product.preco, precoOriginal: product.precoOriginal, precoAlterado: true });
  } catch (error) {
    console.error('Erro ao alterar preço:', error);
    res.status(500).json({ error: 'Erro ao alterar preço' });
  }
});

// Pausar/reativar produto
app.post('/api/admin/products/:id/toggle-pause', adminAuth, (req, res) => {
  try {
    if (req.adminUser.role === 'funcionario') {
      return res.status(403).json({ error: 'Apenas administradores podem pausar/reativar produtos' });
    }
    const products = loadProducts();
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

    product.paused = product.paused === true ? false : true;
    const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));

    res.json({ success: true, id: product.id, nome: product.nome, paused: product.paused });
  } catch (error) {
    console.error('Erro ao pausar/reativar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// === ROTAS DE CHAT ===

// Helper: extrair mensagens de um chat (ignorando chave)
function getChatMessages(chats, adminUserId, userId) {
  const key = adminUserId + ':' + userId;
  const altKey = 'general:' + userId;
  // Try specific key first, then general
  if (chats[key]) return chats[key];
  if (chats[altKey]) return chats[altKey];
  // Also check legacy format (just userId as key)
  if (chats[String(userId)]) return chats[String(userId)];
  return [];
}

// Admin envia mensagem (cria conversa admin-específica)
app.post('/api/admin/chat/send', adminAuth, (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message || !message.trim()) {
      return res.status(400).json({ error: 'userId e mensagem são obrigatórios' });
    }

    const adminUserId = req.adminUser.id;
    const chats = loadChats();
    const key = adminUserId + ':' + userId;

    // Se existia conversa "general", migrar mensagens para este admin
    const generalKey = 'general:' + userId;
    if (chats[generalKey]) {
      if (!chats[key]) chats[key] = [];
      // Só migra se ainda não existe conversa com este admin
      if (chats[key].length === 0) {
        chats[key] = chats[generalKey];
      }
      delete chats[generalKey];
    }

    // Se existia conversa legacy (userId puro), migrar
    const legacyKey = String(userId);
    if (chats[legacyKey] && typeof chats[legacyKey] === 'object' && !legacyKey.includes(':')) {
      if (!chats[key]) chats[key] = [];
      if (chats[key].length === 0) {
        chats[key] = chats[legacyKey];
      }
      delete chats[legacyKey];
    }

    if (!chats[key]) chats[key] = [];
    chats[key].push({
      from: 'admin',
      adminUserId: adminUserId,
      adminName: req.adminUser.nome,
      message: message.trim(),
      createdAt: new Date().toISOString(),
      read: false
    });
    saveChats(chats);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// Admin busca histórico com um usuário (só da conversa deste admin)
app.get('/api/admin/chat/:userId', adminAuth, (req, res) => {
  try {
    const chats = loadChats();
    const adminUserId = req.adminUser.id;
    const messages = getChatMessages(chats, adminUserId, req.params.userId);
    res.json(messages);
  } catch (error) {
    console.error('Erro ao carregar chat:', error);
    res.status(500).json({ error: 'Erro ao carregar chat' });
  }
});

// Admin lista TODAS as conversas dele
app.get('/api/admin/my-chats', adminAuth, (req, res) => {
  try {
    const chats = loadChats();
    const users = loadUsers();
    const adminUserId = req.adminUser.id;
    const result = [];

    for (const [convKey, messages] of Object.entries(chats)) {
      if (!messages || !messages.length) continue;

      // Verificar se esta conversa pertence a este admin
      const [keyAdminId, keyUserId] = convKey.split(':');
      if (!keyUserId) continue; // formato inválido

      if (keyAdminId !== String(adminUserId) && keyAdminId !== 'general') continue;

      const uid = parseInt(keyUserId);
      const unread = messages.filter(m => m.from === 'user' && !m.read).length;
      const user = users.find(u => u.id === uid);
      result.push({
        conversationKey: convKey,
        userId: uid,
        userName: user ? user.nome : 'Usuário #' + uid,
        userEmail: user ? user.email : '',
        unreadCount: unread,
        totalMessages: messages.length,
        lastMessage: messages[messages.length - 1],
        updatedAt: messages[messages.length - 1].createdAt,
        isGeneral: keyAdminId === 'general'
      });
    }

    result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(result);
  } catch (error) {
    console.error('Erro ao carregar conversas:', error);
    res.status(500).json([]);
  }
});

// Admin deleta conversa dele com um usuário
app.delete('/api/admin/chat/:userId', adminAuth, (req, res) => {
  try {
    const chats = loadChats();
    const adminUserId = req.adminUser.id;
    const key = adminUserId + ':' + req.params.userId;
    const generalKey = 'general:' + req.params.userId;

    if (chats[key]) {
      delete chats[key];
    } else if (chats[generalKey]) {
      delete chats[generalKey];
    } else {
      const legacyKey = String(req.params.userId);
      if (chats[legacyKey]) delete chats[legacyKey];
    }
    saveChats(chats);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar conversa:', error);
    res.status(500).json({ error: 'Erro ao deletar conversa' });
  }
});

// === ROTAS DE CHAT PARA USUÁRIO ===

// Lista conversas do usuário (quais admins ele conversou)
app.get('/api/chat/conversations', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json([]);

    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch { return res.json([]); }

    const chats = loadChats();
    const users = loadUsers();
    const result = [];

    for (const [convKey, messages] of Object.entries(chats)) {
      if (!messages || !messages.length) continue;
      const [, keyUserId] = convKey.split(':');
      if (!keyUserId) continue;
      if (parseInt(keyUserId) !== decoded.id) continue;

      // Encontrar admin desta conversa
      const [keyAdminId] = convKey.split(':');
      const adminMsgs = messages.filter(m => m.from === 'admin');
      const adminName = adminMsgs.length > 0 ? adminMsgs[adminMsgs.length - 1].adminName : 'Atendimento';
      const adminUserId = keyAdminId !== 'general' ? parseInt(keyAdminId) : null;

      const unread = messages.filter(m => m.from === 'admin' && !m.read).length;
      result.push({
        conversationKey: convKey,
        adminUserId: adminUserId,
        adminName: adminName,
        unreadCount: unread,
        totalMessages: messages.length,
        lastMessage: messages[messages.length - 1],
        updatedAt: messages[messages.length - 1].createdAt,
        isGeneral: keyAdminId === 'general'
      });
    }

    result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(result);
  } catch (error) {
    console.error('Erro ao carregar conversas:', error);
    res.status(500).json([]);
  }
});

// Usuário busca mensagens de uma conversa específica (com um admin)
app.get('/api/chat/messages/:adminUserId', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json([]);

    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch { return res.json([]); }

    const chats = loadChats();
    const key = req.params.adminUserId + ':' + decoded.id;
    const generalKey = 'general:' + decoded.id;
    const messages = chats[key] || chats[generalKey] || [];
    res.json(messages);
  } catch (error) {
    console.error('Erro ao carregar mensagens:', error);
    res.status(500).json([]);
  }
});

// Usuário envia mensagem para um admin específico
app.post('/api/chat/send/:adminUserId', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });

    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Mensagem vazia' });
    }

    const adminUserId = req.params.adminUserId;
    const chats = loadChats();
    let key;

    if (adminUserId === 'general') {
      key = 'general:' + decoded.id;
    } else {
      key = adminUserId + ':' + decoded.id;
    }

    if (!chats[key]) chats[key] = [];
    chats[key].push({
      from: 'user',
      message: message.trim(),
      createdAt: new Date().toISOString(),
      read: false
    });
    saveChats(chats);
    res.json({ success: true, conversationKey: key });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// Usuário deleta conversa com um admin específico
app.delete('/api/chat/conversation/:adminUserId', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });

    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const chats = loadChats();
    const key = req.params.adminUserId + ':' + decoded.id;
    const generalKey = 'general:' + decoded.id;

    if (chats[key]) delete chats[key];
    else if (chats[generalKey]) delete chats[generalKey];
    saveChats(chats);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar conversa:', error);
    res.status(500).json({ error: 'Erro ao deletar conversa' });
  }
});

// Usuário marca mensagens como lidas (de todas as conversas)
app.post('/api/chat/read', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });

    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const chats = loadChats();
    const userId = decoded.id;
    let modified = false;

    // Mark all admin messages as read in any conversation for this user
    for (const [convKey, messages] of Object.entries(chats)) {
      const [, keyUserId] = convKey.split(':');
      if (!keyUserId) continue;
      if (parseInt(keyUserId) === userId) {
        messages.forEach(m => {
          if (m.from === 'admin') m.read = true;
        });
        modified = true;
      }
    }

    // Also handle legacy format
    if (chats[userId] && Array.isArray(chats[userId])) {
      chats[userId].forEach(m => {
        if (m.from === 'admin') m.read = true;
      });
      modified = true;
    }

    if (modified) saveChats(chats);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar como lido:', error);
    res.status(500).json({ error: 'Erro ao marcar como lido' });
  }
});

// Servir páginas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.get('/registro', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'registro.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'checkout.html'));
});

app.get('/conta', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'conta.html'));
});

app.get('/categoria/:categoria', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'categoria.html'));
});

app.get('/produto/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'produto.html'));
});

app.get('/busca', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'busca.html'));
});

// Páginas institucionais
app.get('/privacidade', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'privacidade.html'));
});

app.get('/termos', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'termos.html'));
});

app.get('/trabalhe-conosco', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'trabalhe-conosco.html'));
});

app.get('/central-ajuda', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'central-ajuda.html'));
});

app.get('/como-comprar', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'como-comprar.html'));
});

app.get('/frete-entrega', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'frete-entrega.html'));
});

app.get('/devolucoes', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'devolucoes.html'));
});

app.get('/painel', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'painel.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 TechVault Store rodando em http://localhost:${PORT}`);
  console.log('📦 Marketplace multi-nicho pronto!\n');
});