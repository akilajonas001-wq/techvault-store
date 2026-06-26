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
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
app.use('/api/', apiLimiter);
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static('public', { maxAge: 0, etag: false, lastModified: false, setHeaders: (res, path) => { res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); } }));
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

// Public order status check (no auth required)
app.get('/api/check-order-status/:id', async (req, res) => {
  try {
    const order = await db.orderById(parseInt(req.params.id));
    if (!order) return res.json({ status: 'not_found' });
    res.json({ status: order.status });
  } catch { res.json({ status: 'error' }); }
});

// Route modules
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/shop'));
app.use('/api/admin', require('./routes/admin'));

// ===================== CHAT ROUTES (USER) =====================

app.get('/api/chat/conversations', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json([]);
    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch { return res.json([]); }

    const chats = db.allChats();
    const result = [];
    for (const [convKey, messages] of Object.entries(chats)) {
      if (!messages?.length) continue;
      const [, keyUserId] = convKey.split(':');
      if (!keyUserId) continue;
      if (parseInt(keyUserId) !== decoded.id) continue;

      messages.forEach(m => {
        if (m.from === 'admin' && !m.adminName && m.adminUserId) {
          const adminUser = db.userById(m.adminUserId);
          if (adminUser) m.adminName = adminUser.nome;
        }
      });

      const [keyAdminId] = convKey.split(':');
      const adminMsgs = messages.filter(m => m.from === 'admin');
      const adminName = adminMsgs.length > 0 ? adminMsgs[adminMsgs.length - 1].adminName : 'Atendimento';
      const unread = messages.filter(m => m.from === 'admin' && !m.read).length;
      result.push({
        conversationKey: convKey, adminUserId: keyAdminId !== 'general' ? parseInt(keyAdminId) : null,
        adminName, unreadCount: unread, totalMessages: messages.length,
        lastMessage: messages[messages.length - 1], updatedAt: messages[messages.length - 1].createdAt
      });
    }
    result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(result);
  } catch { res.json([]); }
});

app.get('/api/chat/messages/:adminUserId', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json([]);
    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch { return res.json([]); }

    const chats = db.allChats();
    const key = req.params.adminUserId + ':' + decoded.id;
    const generalKey = 'general:' + decoded.id;
    const messages = chats[key] || chats[generalKey] || [];
    messages.forEach(m => {
      if (m.from === 'admin' && !m.adminName && m.adminUserId) {
        const adminUser = db.userById(m.adminUserId);
        if (adminUser) m.adminName = adminUser.nome;
      }
    });
    res.json(messages);
  } catch { res.json([]); }
});

app.post('/api/chat/send/:adminUserId', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });
    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Mensagem vazia' });

    const adminUserId = req.params.adminUserId;
    const chats = db.allChats();
    let key;

    if (adminUserId === 'general') {
      key = 'general:' + decoded.id;
    } else {
      key = adminUserId + ':' + decoded.id;
    }

    if (adminUserId === 'general') {
      for (const [convKey] of Object.entries(chats)) {
        const [ka, ku] = convKey.split(':');
        if (ku && parseInt(ku) === decoded.id && ka !== 'general' && !isNaN(parseInt(ka))) {
          const adminUser = db.userById(parseInt(ka));
          const adminName = adminUser ? adminUser.nome : 'atendente #' + ka;
          return res.status(403).json({ error: 'Você já está sendo atendido por ' + adminName + '. Continue a conversa pela janela de chat.' });
        }
      }
    } else {
      const existing = chats[key];
      const hasAdminMessage = existing && existing.some(m => m.from === 'admin');
      if (!hasAdminMessage) {
        return res.status(403).json({ error: 'Você só pode responder a conversas iniciadas por um atendente. Aguarde nosso contato!' });
      }
    }

    const messages = chats[key] || [];
    messages.push({ from: 'user', message: message.trim(), createdAt: new Date().toISOString(), read: false });
    db.saveChatMessages(key, messages);
    res.json({ success: true, conversationKey: key });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao enviar mensagem' }); }
});

app.post('/api/chat/read', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });
    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ error: 'Token inválido' }); }

    const chats = db.allChats();
    let modified = false;
    for (const [convKey, messages] of Object.entries(chats)) {
      const [, keyUserId] = convKey.split(':');
      if (!keyUserId) continue;
      if (parseInt(keyUserId) === decoded.id) {
        messages.forEach(m => { if (m.from === 'admin') m.read = true; });
        db.saveChatMessages(convKey, messages);
        modified = true;
      }
    }
    if (chats[decoded.id] && Array.isArray(chats[decoded.id])) {
      chats[decoded.id].forEach(m => { if (m.from === 'admin') m.read = true; });
      db.saveChatMessages(String(decoded.id), chats[decoded.id]);
      modified = true;
    }
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Erro ao marcar como lido' }); }
});

app.delete('/api/chat/conversation/:adminUserId', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });
    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ error: 'Token inválido' }); }

    const chats = db.allChats();
    const key = req.params.adminUserId + ':' + decoded.id;
    const generalKey = 'general:' + decoded.id;
    if (chats[key]) db.deleteChat(key);
    else if (chats[generalKey]) db.deleteChat(generalKey);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Erro ao deletar conversa' }); }
});

// ===================== CHAT ROUTES (ADMIN) =====================

app.post('/api/admin/chat/send', adminAuth, (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message?.trim()) return res.status(400).json({ error: 'userId e mensagem são obrigatórios' });

    const adminUserId = req.adminUser.id;
    const chats = db.allChats();
    const key = adminUserId + ':' + userId;
    const generalKey = 'general:' + userId;

    if (chats[generalKey]) {
      if (!chats[key]) chats[key] = [];
      if (chats[key].length === 0) chats[key] = chats[generalKey];
      db.deleteChat(generalKey);
    }

    const legacyKey = String(userId);
    if (chats[legacyKey] && !legacyKey.includes(':')) {
      if (!chats[key]) chats[key] = [];
      if (chats[key].length === 0) chats[key] = chats[legacyKey];
      db.deleteChat(legacyKey);
    }

    const messages = chats[key] || [];
    messages.push({ from: 'admin', adminUserId, adminName: req.adminUser.nome, message: message.trim(), createdAt: new Date().toISOString(), read: false });
    db.saveChatMessages(key, messages);
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao enviar mensagem' }); }
});

app.get('/api/admin/chat/:userId', adminAuth, (req, res) => {
  try {
    const chats = db.allChats();
    const adminUserId = req.adminUser.id;
    const userId = req.params.userId;
    let key = adminUserId + ':' + userId;
    const generalKey = 'general:' + userId;

    if (!chats[key] && chats[generalKey]) {
      chats[key] = chats[generalKey];
      db.deleteChat(generalKey);
      db.saveChatMessages(key, chats[key]);
    }

    const messages = chats[key] || chats[String(userId)] || [];
    messages.forEach(m => {
      if (m.from === 'admin' && !m.adminName) m.adminName = req.adminUser.nome;
    });
    res.json(messages);
  } catch { res.status(500).json({ error: 'Erro ao carregar chat' }); }
});

app.get('/api/admin/my-chats', adminAuth, (req, res) => {
  try {
    const chats = db.allChats();
    const adminUserId = req.adminUser.id;
    const result = [];

    for (const [convKey, messages] of Object.entries(chats)) {
      if (!messages?.length) continue;
      const [keyAdminId, keyUserId] = convKey.split(':');
      if (!keyUserId) continue;
      if (keyAdminId !== String(adminUserId) && keyAdminId !== 'general') continue;

      messages.forEach(m => {
        if (m.from === 'admin' && !m.adminName) m.adminName = req.adminUser.nome;
      });

      const uid = parseInt(keyUserId);
      const user = db.userById(uid);
      const unread = messages.filter(m => m.from === 'user' && !m.read).length;
      result.push({
        conversationKey: convKey, userId: uid,
        userName: user ? user.nome : 'Usuário #' + uid,
        userEmail: user ? user.email : '',
        unreadCount: unread, totalMessages: messages.length,
        lastMessage: messages[messages.length - 1], updatedAt: messages[messages.length - 1].createdAt
      });
    }
    result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(result);
  } catch { res.status(500).json([]); }
});

app.delete('/api/admin/chat/:userId', adminAuth, (req, res) => {
  try {
    const chats = db.allChats();
    const key = req.adminUser.id + ':' + req.params.userId;
    const generalKey = 'general:' + req.params.userId;
    if (chats[key]) db.deleteChat(key);
    else if (chats[generalKey]) db.deleteChat(generalKey);
    else {
      const legacyKey = String(req.params.userId);
      if (chats[legacyKey]) db.deleteChat(legacyKey);
    }
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

app.post('/api/webhooks/infinitepay', async (req, res) => {
  try {
    const body = req.body;
    console.log('InfinitePay webhook received:', JSON.stringify(body));

    const orderId = body.external_id || body.externalId;
    const status = body.status;

    if (orderId && status === 'paid') {
      await db.updateOrderStatus(parseInt(orderId), 'aprovado');
      console.log(`Pedido #${orderId} aprovado via webhook`);
    } else if (orderId && (status === 'canceled' || status === 'refunded')) {
      await db.updateOrderStatus(parseInt(orderId), status === 'canceled' ? 'cancelado' : 'reembolsado');
      console.log(`Pedido #${orderId} atualizado para ${status}`);
    }

    res.status(200).json({ received: true });
  } catch (e) {
    console.error('Erro no webhook InfinitePay:', e);
    res.status(200).json({ received: true });
  }
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

startServer().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TechVault Store rodando em http://localhost:${PORT}`);
  });
});
