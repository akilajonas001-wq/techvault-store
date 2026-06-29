require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const db = require('./db');
const { authenticate, adminAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'techvault-default-secret-key';

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false
}));
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false });
app.use('/api/', apiLimiter);
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static('public', { maxAge: '1h', etag: true, lastModified: true, setHeaders: (res, filePath) => { if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); } }));
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
app.use('/api/admin', require('./routes/admin'));

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

app.get('/api/admin/chat/support', async (req, res) => {
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

// ===================== INFINITEPAY WEBHOOK =====================

const webhookLogs = [];

app.post('/api/webhooks/infinitepay', async (req, res) => {
  try {
    const body = req.body;
    webhookLogs.unshift({ timestamp: new Date().toISOString(), body: JSON.stringify(body), headers: req.headers });
    if (webhookLogs.length > 50) webhookLogs.pop();
    console.log('InfinitePay webhook received:', JSON.stringify(body));

    const orderId = body.external_id || body.externalId || body.id || body.reference || body.order_id || body.transaction_id;
    const status = body.status;
    console.log('Parsed: orderId=', orderId, 'status=', status);

    if (orderId && status === 'paid') {
      await db.updateOrderStatus(parseInt(orderId), 'aprovado');
      console.log(`Pedido #${orderId} aprovado via webhook`);
    } else if (orderId && (status === 'canceled' || status === 'refunded' || status === 'cancelled')) {
      await db.updateOrderStatus(parseInt(orderId), status === 'canceled' || status === 'cancelled' ? 'cancelado' : 'reembolsado');
      console.log(`Pedido #${orderId} atualizado para ${status}`);
    } else {
      console.log('Webhook não processou: tente outros nomes de campo para orderId');
      // Try to match by amount if we can't find orderId
      if (body.amount || body.valor) {
        const amount = parseFloat(body.amount || body.valor);
        if (amount) {
          const allOrders = await db.allOrders();
          const pending = allOrders.filter(o => o.status === 'pendente' && Math.abs(o.total - amount) < 0.01);
          if (pending.length === 1) {
            await db.updateOrderStatus(pending[0].id, 'aprovado');
            console.log(`Pedido #${pending[0].id} aprovado via match de valor R$${amount}`);
          }
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (e) {
    console.error('Erro no webhook InfinitePay:', e);
    res.status(200).json({ received: true });
  }
});

app.get('/api/debug/webhook-logs', (req, res) => {
  res.json(webhookLogs);
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

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'login.html')));
app.get('/registro', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'registro.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'checkout.html')));
app.get('/conta', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'conta.html')));
app.get('/categoria/:categoria', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'categoria.html')));
app.get('/produto/:id', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'produto.html')));
app.get('/busca', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'busca.html')));
app.get('/privacidade', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'privacidade.html')));
app.get('/termos', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'termos.html')));
app.get('/central-ajuda', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'central-ajuda.html')));
app.get('/como-comprar', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'como-comprar.html')));
app.get('/frete-entrega', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'frete-entrega.html')));
app.get('/devolucoes', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'devolucoes.html')));
app.get('/painel', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'painel.html')));
app.get('/pedido-sucesso', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'pedido-sucesso.html')));
app.get('/pedido-cancelado', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'pedido-cancelado.html')));
app.get('/comprovante', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'comprovante.html')));

startServer().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TechVault Store rodando em http://localhost:${PORT}`);
  });
});
