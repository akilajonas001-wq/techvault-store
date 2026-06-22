require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'techvault-secret-key-2026';

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

// Verificar autenticação
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
    const { q, categoria, precoMin, precoMax, ordem } = req.query;
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
    
    res.json(products);
  } catch (error) {
    console.error('Erro na busca:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
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