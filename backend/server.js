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
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, {
      expiresIn: '7d'
    });
    
    res.json({ 
      success: true, 
      token,
      user: { id: newUser.id, nome: newUser.nome, email: newUser.email }
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
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d'
    });
    
    res.json({ 
      success: true, 
      token,
      user: { id: user.id, nome: user.nome, email: user.email }
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
        createdAt: new Date().toISOString()
      };
      users.push(user);
      saveUsers(users);
    } else {
      user.googleId = googleId;
      user.avatar = picture || user.avatar;
      saveUsers(users);
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      success: true,
      token,
      user: { id: user.id, nome: user.nome, email: user.email, avatar: user.avatar }
    });
  } catch (error) {
    console.error('Erro no login com Google:', error);
    res.status(500).json({ error: 'Erro ao autenticar com Google' });
  }
});

// Criar pedido
app.post('/api/orders', async (req, res) => {
  try {
    const { userId, endereco, itens, total } = req.body;
    
    const users = loadUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    
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
      status: 'pendente',
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
      
      <h2>Endereço de Entrega</h2>
      <p>${endereco.logradouro}, ${endereco.numero}</p>
      <p>${endereco.bairro} - ${endereco.cidade}/${endereco.estado}</p>
      
      <h2>Itens do Pedido</h2>
      <ul>
        ${itens.map(item => `<li>${item.quantidade}x ${item.nome} - R$ ${(item.preco * item.quantidade).toFixed(2)}</li>`).join('')}
      </ul>
      
      <h2>Total: R$ ${total.toFixed(2)}</h2>
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
      message: 'Pedido realizado com sucesso!'
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
    googleClientId: GOOGLE_CLIENT_ID || ''
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
    
    res.json({ 
      authenticated: true, 
      user: { id: user.id, nome: user.nome, email: user.email }
    });
  } catch (error) {
    res.json({ authenticated: false });
  }
});

// === ROTAS DO MARKETPLACE ===

// Produtos em destaque (ANTES de /api/products/:id)
app.get('/api/products/featured', (req, res) => {
  try {
    const products = loadProducts();
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
    const products = loadProducts();
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
    const products = loadProducts();
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
    let products = loadProducts();
    
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
    let products = loadProducts().filter(p => p.categoria === categoria);
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
    
    res.json(product);
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

app.listen(PORT, () => {
  console.log(`\n🚀 TechVault Store rodando em http://localhost:${PORT}`);
  console.log('📦 Marketplace multi-nicho pronto!\n');
});