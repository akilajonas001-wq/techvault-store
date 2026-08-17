require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const { authenticate, adminAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET não definido. Configure a variável de ambiente JWT_SECRET.');
  process.exit(1);
}

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false
}));
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false });
app.use('/api/', apiLimiter);
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'https://techvault-store.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ===================== WEBHOOK (must be before body parsers to handle raw bodies) =====================

const webhookLogs = [];

const MP_API = 'https://api.mercadopago.com';
const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;

async function fetchMpPayment(paymentId) {
  if (!MP_ACCESS_TOKEN || !paymentId) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
      signal: controller.signal
    });
    if (!res.ok) {
      console.error('Mercado Pago payment fetch error:', res.status);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error('Mercado Pago payment fetch exception:', e.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function searchMpPaymentsByOrder(orderId) {
  if (!MP_ACCESS_TOKEN) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${MP_API}/v1/payments/search?external_reference=${encodeURIComponent(String(orderId))}&sort=date_created&criteria=desc`, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
      signal: controller.signal
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.results && data.results[0]) || null;
  } catch (e) {
    console.error('Mercado Pago payment search exception:', e.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Mapeia o status do pagamento do Mercado Pago para o status interno do pedido
function mapMpStatus(payment) {
  if (!payment) return null;
  const s = (payment.status || '').toLowerCase();
  switch (s) {
    case 'approved': return 'aprovado';
    case 'rejected': return 'reprovado';
    case 'cancelled': return 'cancelado';
    case 'refunded': return 'reembolsado';
    case 'charged_back': return 'estornado';
    case 'in_process':
    case 'pending':
    case 'authorized': return 'pendente';
    default: return null;
  }
}

function buildPaymentInfo(payment) {
  return {
    paymentId: payment.id,
    status: payment.status,
    statusDetail: payment.status_detail || '',
    method: payment.payment_method_id || '',
    type: payment.payment_type_id || '',
    installments: payment.installments || 1,
    cardBrand: payment.payment_method?.id || (payment.card && payment.card.cardholder && payment.card.cardholder.name) || '',
    externalReference: payment.external_reference || '',
    dateCreated: payment.date_created || '',
    dateApproved: payment.date_approved || ''
  };
}

async function applyMpPaymentToOrder(payment) {
  if (!payment || !payment.id) return false;
  const orderId = parseInt(payment.external_reference || '');
  let order = orderId > 0 ? await db.orderById(orderId) : null;
  if (!order) order = await db.orderByMpPaymentId(payment.id);
  if (!order) return false;

  const newStatus = mapMpStatus(payment);
  if (newStatus && order.status !== newStatus) {
    await db.updateOrderStatus(order.id, newStatus);
    console.log(`>>> Pedido #${order.id} atualizado para "${newStatus}" via Mercado Pago (payment ${payment.id})`);
  }
  if (String(order.mpPaymentId || '') !== String(payment.id)) {
    await db.updateOrderMpPayment(order.id, payment.id);
  }
  await db.updateOrderPaymentInfo(order.id, buildPaymentInfo(payment));
  return true;
}

// Capture raw body for webhook regardless of content type
app.post('/api/webhooks/mercadopago', express.raw({ type: '*/*', limit: '1mb' }), (req, res) => {
  // Responder 200 imediatamente para evitar retentativas do Mercado Pago
  res.status(200).json({ received: true });

  const rawBody = req.body ? req.body.toString('utf8') : '';
  let body = {};
  try { body = JSON.parse(rawBody); } catch { /* corpo não-JSON */ }

  webhookLogs.unshift({
    timestamp: new Date().toISOString(),
    type: body.type || 'unknown',
    paymentId: body.data && body.data.id,
    raw: rawBody.slice(0, 2000),
    headers: req.headers
  });
  if (webhookLogs.length > 50) webhookLogs.pop();
  console.log('=== Mercado Pago Webhook ===');
  console.log('Type:', body.type, '| data:', JSON.stringify(body.data));

  // Teste de configuração do Mercado Pago → só confirma
  if (body.type === 'test' || !body.data || !body.data.id) {
    console.log('Webhook: tipo teste ou sem data.id, ignorado.');
    return;
  }
  if (body.type !== 'payment') {
    console.log('Webhook: tipo não é payment (' + body.type + '), ignorado.');
    return;
  }

  // Nunca confiar no payload: buscar o pagamento real na API do Mercado Pago
  fetchMpPayment(body.data.id).then(async (payment) => {
    if (!payment) {
      console.log(`Webhook: pagamento ${body.data.id} não encontrado na API.`);
      return;
    }
    await applyMpPaymentToOrder(payment);
  }).catch(e => console.error('Erro processando webhook MP:', e.message));
});

// ===================== PUBLIC CONFIRM PAYMENT =====================
// Mercado Pago can redirect here after payment to show the order status page
// URL: /api/confirm-payment/:paymentRef
app.get('/api/confirm-payment/:ref', async (req, res) => {
  try {
    const ref = req.params.ref;
    let order = await db.orderByPaymentRef(ref);
    if (order) {
      // Do NOT auto-approve - only the webhook should change order status
      return res.redirect(`/pedido-sucesso?id=${order.id}&ref=${ref}`);
    }
    // Try by numeric ID as fallback
    const id = parseInt(ref);
    if (!isNaN(id)) {
      order = await db.orderById(id);
      if (order) {
        return res.redirect(`/pedido-sucesso?id=${id}`);
      }
    }
    res.redirect('/');
  } catch (e) {
    console.error('Erro confirm-payment:', e);
    res.redirect('/');
  }
});

// ===================== STANDARD MIDDLEWARE =====================

app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

// ===================== HEADER / FOOTER COMPARTILHADO =====================
// Todas as páginas da loja usam o mesmo header e footer
// (partials/header.html e partials/footer.html), injetados pelo servidor.
// Isso garante consistência e facilita manutenção: basta editar um único arquivo.
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const HEADER_PLACEHOLDER = '<!--HEADER-->';

function renderPage(fileName) {
  const resolved = path.resolve(PUBLIC_DIR, fileName);
  if (resolved !== PUBLIC_DIR && !resolved.startsWith(PUBLIC_DIR + path.sep)) return null;

  let html;
  try {
    html = fs.readFileSync(resolved, 'utf8');
  } catch (e) {
    return null;
  }

  if (html.includes(HEADER_PLACEHOLDER)) {
    try {
      const partial = fs.readFileSync(path.join(PUBLIC_DIR, 'partials', 'header.html'), 'utf8');
      html = html.split(HEADER_PLACEHOLDER).join(partial);
    } catch (e) {
      console.error('Erro ao ler partial header:', e);
    }

    // Footer compartilhado apenas nas paginas da loja (que usam o header).
    // Paginas standalone (login, registro, painel, comprovante, pedido-*)
    // nao recebem footer para nao quebrar o layout de centralizacao.
    try {
      const footer = fs.readFileSync(path.join(PUBLIC_DIR, 'partials', 'footer.html'), 'utf8');
      html = html.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/g, '');
      const lastBodyIdx = html.lastIndexOf('</body>');
      if (lastBodyIdx !== -1) {
        html = html.slice(0, lastBodyIdx) + footer + '\n' + html.slice(lastBodyIdx);
      }
    } catch (e) {
      console.error('Erro ao ler partial footer:', e);
    }
  }

  return html;
}

// Serve arquivos .html diretos (ex: /quem-somos.html) com o header injetado
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  const p = req.path.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!p.endsWith('.html')) return next();
  const html = renderPage(p);
  if (html === null) return next();
  res.set('Cache-Control', 'no-cache');
  res.type('html').send(html);
});

app.use(express.static(path.join(__dirname, '..', 'public'), { index: false, maxAge: '1h', etag: true, lastModified: true, setHeaders: (res, filePath) => { if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); } }));
app.use(session({ secret: JWT_SECRET, resave: false, saveUninitialized: true, cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax' } }));

// Initialize database before starting server
async function startServer() {
  try {
    await db.initDb();
    await db.migrateFromJson();
    await db.initDefaultData();
    console.log('Banco de dados PostgreSQL inicializado');
  } catch (err) {
    console.error('Erro ao inicializar banco:', err);
    process.exit(1);
  }
}

app.use('/api', authenticate);

// Public order info (no auth required)
app.get('/api/config', (req, res) => {
  res.json({
    status: 'ok',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    mercadoPagoConfigured: !!process.env.MERCADO_PAGO_ACCESS_TOKEN,
    mercadoPagoPublicKey: process.env.MERCADO_PAGO_PUBLIC_KEY || ''
  });
});

app.get('/api/check-order-status/:id', async (req, res) => {
  try {
    const order = await db.orderById(parseInt(req.params.id));
    if (!order) return res.json({ status: 'not_found' });
    res.json({
      id: order.id,
      status: order.status,
      total: order.total,
      itens: order.itens,
      endereco: order.endereco,
      cliente: order.cliente,
      pagamento: order.pagamento,
      createdAt: order.createdAt
    });
  } catch { res.json({ status: 'error' }); }
});

// Route modules
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/shop'));
app.use('/api', require('./routes/profile'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/visits'));

// ===================== CHAT ROUTES =====================
// Key format: support:userId  → Atendimento

// --- USER-FACING ROUTES ---

app.get('/api/chat/messages/:convKey(*)', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json([]);
    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch { return res.json([]); }

    const convKey = req.params.convKey;
    const parts = convKey.split(':');
    if (parts[0] !== 'support' || parseInt(parts[1]) != decoded.id) return res.json([]);

    const chatData = await db.getChatMessages(convKey);
    if (!chatData) return res.json({ messages: [], resolved: false });
    const msgs = chatData.messages;

    await Promise.all(msgs.map(async (m) => {
      if (m.from === 'admin' && !m.adminName && m.adminUserId) {
        const adminUser = await db.userById(m.adminUserId);
        if (adminUser) m.adminName = adminUser.nome;
      }
    }));
    res.json({ messages: msgs, resolved: chatData.resolved });
  } catch { res.json({ messages: [], resolved: false }); }
});

app.post('/api/chat/send/support/:userId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });
    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Mensagem vazia' });

    const key = 'support:' + decoded.id;
    const chatData = await db.getChatMessages(key);
    const msgs = chatData ? chatData.messages : [];
    msgs.push({ from: 'user', message: message.trim(), createdAt: new Date().toISOString(), read: false });
    await db.saveChatMessages(key, msgs);
    res.json({ success: true, conversationKey: key });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao enviar mensagem' }); }
});

app.post('/api/chat/read/:convKey(*)', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });
    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ error: 'Token inválido' }); }

    const convKey = req.params.convKey;
    const parts = convKey.split(':');
    if (parts[0] !== 'support' || parseInt(parts[1]) != decoded.id) return res.status(403).json({ error: 'Acesso negado' });

    const chatData = await db.getChatMessages(convKey);
    if (!chatData) return res.json({ success: true });
    const msgs = chatData.messages;

    let modified = false;
    msgs.forEach(m => {
      if (m.from === 'admin' && !m.read) { m.read = true; modified = true; }
    });
    if (modified) await db.saveChatMessages(convKey, msgs);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Erro ao marcar como lido' }); }
});

// --- ADMIN ROUTES ---

app.get('/api/admin/chat/support', adminAuth, async (req, res) => {
  try {
    const chats = await db.allChats();
    const result = [];
    for (const [convKey, data] of Object.entries(chats)) {
      if (!convKey.startsWith('support:')) continue;
      const msgs = data.messages;
      if (!msgs?.length) continue;
      const uid = parseInt(convKey.split(':')[1]);
      const user = await db.userById(uid);
      const unread = msgs.filter(m => m.from === 'user' && !m.read).length;
      result.push({
        conversationKey: convKey, userId: uid,
        userName: user ? user.nome : 'Usuário #' + uid,
        userEmail: user ? user.email : '',
        unreadCount: unread, totalMessages: msgs.length,
        lastMessage: msgs[msgs.length - 1], updatedAt: msgs[msgs.length - 1].createdAt,
        resolved: data.resolved || false
      });
    }
    result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(result);
  } catch { res.status(500).json([]); }
});

app.post('/api/admin/chat/resolve', adminAuth, async (req, res) => {
  try {
    const { conversationKey, resolved } = req.body;
    if (!conversationKey) return res.status(400).json({ error: 'conversationKey obrigatório' });
    await db.resolveChat(conversationKey, resolved);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Erro ao alterar status' }); }
});

app.post('/api/admin/chat/send', adminAuth, async (req, res) => {
  try {
    const { conversationKey, message, userId } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Mensagem vazia' });

    let key = conversationKey;
    if (!key && userId) {
      key = 'support:' + userId;
    }
    if (!key) return res.status(400).json({ error: 'conversationKey ou userId obrigatório' });

    const adminUserId = req.adminUser.id;
    const chatData = await db.getChatMessages(key);
    const msgs = chatData ? chatData.messages : [];
    msgs.push({ from: 'admin', adminUserId, adminName: req.adminUser.nome, message: message.trim(), createdAt: new Date().toISOString(), read: false });
    await db.saveChatMessages(key, msgs);
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao enviar mensagem' }); }
});

app.get('/api/admin/chat/:convKey(*)', adminAuth, async (req, res) => {
  try {
    const convKey = req.params.convKey;
    const chatData = await db.getChatMessages(convKey);
    if (!chatData) return res.json([]);
    const msgs = chatData.messages;
    msgs.forEach(m => {
      if (m.from === 'admin' && !m.adminName) m.adminName = req.adminUser.nome;
    });
    res.json(msgs);
  } catch { res.status(500).json({ error: 'Erro ao carregar chat' }); }
});

app.delete('/api/admin/chat/:convKey(*)', adminAuth, async (req, res) => {
  try {
    const convKey = req.params.convKey;
    await db.deleteChat(convKey);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Erro ao deletar conversa' }); }
});

// ===================== RETURN REQUESTS =====================

app.get('/api/admin/returns', adminAuth, async (req, res) => {
  try {
    const allOrders = await db.allOrders();
    const returnOrders = allOrders.filter(o => (o.returnedItems || []).length > 0 || (o.cancelledItems || []).length > 0);
    res.json(returnOrders);
  } catch { res.status(500).json({ error: 'Erro ao carregar chamados' }); }
});

app.post('/api/admin/returns/send', adminAuth, async (req, res) => {
  try {
    const { conversationKey, message } = req.body;
    if (!conversationKey || !message) return res.status(400).json({ error: 'Dados incompletos' });
    const chatData = await db.getChatMessages(conversationKey);
    const msgs = chatData ? chatData.messages : [];
    msgs.push({
      from: 'admin',
      adminUserId: req.adminUser.id,
      adminName: req.adminUser.nome,
      message,
      createdAt: new Date().toISOString(),
      read: false
    });
    await db.saveChatMessages(conversationKey, msgs);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Erro ao enviar mensagem' }); }
});

app.get('/api/return-chat/messages/:orderId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const orderId = parseInt(req.params.orderId);
    const order = await db.orderById(orderId);
    if (!order || order.userId !== decoded.id) return res.status(403).json({ error: 'Acesso negado' });
    const type = req.query.type || 'return';
    const convKey = type + ':' + orderId;
    const chatData = await db.getChatMessages(convKey);
    if (!chatData) return res.json({ messages: [], resolved: false });
    res.json(chatData);
  } catch { res.status(500).json({ error: 'Erro ao carregar chat' }); }
});

app.post('/api/return-chat/send/:orderId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const orderId = parseInt(req.params.orderId);
    const order = await db.orderById(orderId);
    if (!order || order.userId !== decoded.id) return res.status(403).json({ error: 'Acesso negado' });
    const type = req.query.type || 'return';
    const convKey = type + ':' + orderId;
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Mensagem vazia' });
    const chatData = await db.getChatMessages(convKey);
    const msgs = chatData ? chatData.messages : [];
    msgs.push({
      from: 'user',
      message,
      createdAt: new Date().toISOString(),
      read: false
    });
    await db.saveChatMessages(convKey, msgs);
    res.json({ success: true, conversationKey: convKey });
  } catch { res.status(500).json({ error: 'Erro ao enviar mensagem' }); }
});

app.post('/api/return-chat/read/:orderId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const orderId = parseInt(req.params.orderId);
    const order = await db.orderById(orderId);
    if (!order || order.userId !== decoded.id) return res.status(403).json({ error: 'Acesso negado' });
    const type = req.query.type || 'return';
    const convKey = type + ':' + orderId;
    const chatData = await db.getChatMessages(convKey);
    if (!chatData) return res.json({ success: true });
    const msgs = chatData.messages.map(m => {
      if (m.from === 'admin') m.read = true;
      return m;
    });
    await db.saveChatMessages(convKey, msgs);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Erro ao marcar como lido' }); }
});

// ===================== IMAGE SERVING =====================

app.get('/api/images/:id', async (req, res) => {
  try {
    const img = await db.getImage(req.params.id);
    if (!img) return res.status(404).send('Imagem não encontrada');
    res.set('Content-Type', img.mimetype);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.end(img.data);
  } catch { res.status(500).send('Erro ao carregar imagem'); }
});

// ===================== MANUAL PAYMENT VERIFICATION =====================
// Called by the success page when user returns from checkout.
// Consulta o Mercado Pago diretamente para confirmar o status (webhook pode atrasar).

app.post('/api/verify-payment/:id', async (req, res) => {
  try {
    const param = req.params.id;
    let order = null;

    // Try matching by paymentRef first (UUID format)
    if (param.includes('-')) {
      order = await db.orderByPaymentRef(param);
    }
    // Fallback to numeric order ID
    if (!order) {
      const orderId = parseInt(param);
      if (!isNaN(orderId)) order = await db.orderById(orderId);
    }

    if (!order) return res.json({ verified: false, error: 'not_found' });

    // Já aprovado → retorna direto
    if (order.status === 'aprovado') {
      return res.json({ verified: true, status: order.status, orderId: order.id, paymentRef: order.paymentRef });
    }

    // Tenta consultar o pagamento no Mercado Pago para atualização em tempo real
    let payment = order.mpPaymentId ? await fetchMpPayment(order.mpPaymentId) : null;
    if (!payment) payment = await searchMpPaymentsByOrder(order.id);
    if (payment) {
      await applyMpPaymentToOrder(payment);
      order = await db.orderById(order.id);
    }

    res.json({ verified: order.status === 'aprovado', status: order.status, orderId: order.id, paymentRef: order.paymentRef });
  } catch (e) {
    console.error('Erro verify-payment:', e);
    res.json({ verified: false, error: 'server_error' });
  }
});

// ===================== WEBHOOK DEBUG (ADMIN) =====================

app.get('/api/admin/webhook-logs', adminAuth, (req, res) => {
  res.json({ logs: webhookLogs });
});

// ===================== RECEIPT ROUTES =====================

app.get('/api/receipt/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });
    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ error: 'Token inválido' }); }

    const order = await db.orderById(parseInt(req.params.id));
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

    const isOwner = order.userId && parseInt(order.userId) === decoded.id;
    const isAdmin = await db.userById(decoded.id).then(u => u && (u.admin || u.role === 'admin' || u.role === 'funcionario'));
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Acesso negado' });

    res.json(order);
  } catch { res.status(500).json({ error: 'Erro ao carregar comprovante' }); }
});

// ===================== STATIC PAGE ROUTES =====================

app.get('/', (req, res) => res.send(renderPage('index.html')));
app.get('/login', (req, res) => res.send(renderPage('login.html')));
app.get('/registro', (req, res) => res.send(renderPage('registro.html')));
app.get('/checkout', (req, res) => res.send(renderPage('checkout.html')));
app.get('/conta', (req, res) => res.send(renderPage('conta.html')));
app.get('/categoria/:categoria', (req, res) => res.send(renderPage('categoria.html')));
app.get('/produto/:id', (req, res) => res.send(renderPage('produto.html')));
app.get('/busca', (req, res) => res.send(renderPage('busca.html')));
app.get('/privacidade', (req, res) => res.send(renderPage('privacidade.html')));
app.get('/termos', (req, res) => res.send(renderPage('termos.html')));
app.get('/central-ajuda', (req, res) => res.send(renderPage('central-ajuda.html')));
app.get('/favoritos', (req, res) => res.send(renderPage('favoritos.html')));
app.get('/como-comprar', (req, res) => res.send(renderPage('como-comprar.html')));
app.get('/frete-entrega', (req, res) => res.send(renderPage('frete-entrega.html')));
app.get('/devolucoes', (req, res) => res.send(renderPage('devolucoes.html')));
app.get('/quem-somos', (req, res) => res.send(renderPage('quem-somos.html')));
app.get('/trabalhe-conosco', (req, res) => res.send(renderPage('trabalhe-conosco.html')));
app.get('/painel-mobile', (req, res) => res.send(renderPage('painel-mobile.html')));
app.get('/painel', (req, res) => {
  let html = renderPage('painel.html');
  if (html === null) return res.status(404).send('Página não encontrada');
  if (req.query.desktop !== '1') {
    html = html.replace('</head>', `<script>
      try {
        if (window.innerWidth < 900 && !(localStorage.getItem('tv-painel-mobile') === '1')) {
          window.location.href = '/painel-mobile';
        }
      } catch (e) {}
    </script></head>`);
  }
  html = html.replace('</body>', `<a id="openMobilePanelBtn" href="/painel-mobile" title="Versão Mobile"
    style="position:fixed;bottom:18px;right:18px;z-index:9999;display:flex;align-items:center;gap:7px;background:linear-gradient(135deg,#1a73e8,#4285f4);color:#fff;padding:10px 16px;border-radius:50px;font-size:13px;font-family:Inter,sans-serif;font-weight:600;text-decoration:none;box-shadow:0 6px 16px rgba(0,0,0,.25);">
    <i class="fas fa-mobile-alt"></i> Versão Mobile</a></body>`);
  res.send(html);
});
app.get('/pedido-sucesso', (req, res) => res.send(renderPage('pedido-sucesso.html')));
app.get('/pedido-cancelado', (req, res) => res.send(renderPage('pedido-cancelado.html')));
app.get('/comprovante', (req, res) => res.send(renderPage('comprovante.html')));
app.get('/comprovante/:id', (req, res) => res.send(renderPage('comprovante.html')));

// ===================== CLEANUP DE PEDIDOS ABANDONADOS =====================
// Marca como "abandonado" pedidos pendentes sem pagamento iniciado (sem mp_payment_id)
// e mais antigos que 24h — ou seja, clientes que desistiram antes de pagar.
async function markAbandonedOrders() {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const orders = await db.allOrders();
    for (const o of orders) {
      if (o.status === 'pendente' && !o.mpPaymentId && o.createdAt && o.createdAt < cutoff) {
        await db.updateOrderStatus(o.id, 'abandonado');
        console.log(`>>> Pedido #${o.id} marcado como abandonado (sem pagamento iniciado em 24h)`);
      }
    }
  } catch (e) {
    console.error('Erro no cleanup de pedidos abandonados:', e.message);
  }
}

startServer().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TechVault Store rodando em http://localhost:${PORT}`);
  });
  markAbandonedOrders();
  setInterval(markAbandonedOrders, 60 * 60 * 1000);
});
