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

// ===================== WEBHOOK (must be before body parsers to handle raw bodies) =====================

const webhookLogs = [];

// Capture raw body for webhook regardless of content type
app.post('/api/webhooks/infinitepay', express.raw({ type: '*/*', limit: '1mb' }), async (req, res) => {
  try {
    const rawBody = req.body ? req.body.toString('utf8') : '';
    let parsed = {};
    try { parsed = JSON.parse(rawBody); } catch { try { parsed = Object.fromEntries(new URLSearchParams(rawBody)); } catch {} }

    const body = parsed;
    if (Object.keys(body).length === 0) {
      // Try to use the raw body directly
      if (rawBody) body._raw = rawBody;
    }

    webhookLogs.unshift({
      timestamp: new Date().toISOString(),
      raw: rawBody.slice(0, 2000),
      parsed: JSON.stringify(body),
      headers: req.headers
    });
    if (webhookLogs.length > 50) webhookLogs.pop();
    console.log('=== InfinitePay Webhook ===');
    console.log('Raw:', rawBody.slice(0, 500));
    console.log('Parsed:', JSON.stringify(body));

    // Try many possible field names for order ID
    const orderId = body.order_nsu || body.external_id || body.externalId || body.id || body.reference ||
                    body.order_id || body.transaction_id || body.transactionId ||
                    body.orderId || body.pedido_id || body.pedidoId ||
                    body.checkout_id || body.checkoutId || body.reference_id ||
                    body.nsu || body.orderNsu || body.order_nsu_id ||
                    (body.metadata && (body.metadata.pedido_id || body.metadata.orderId ||
                     body.metadata.order_id || body.metadata.external_id || body.metadata.order_nsu)) ||
                    (body.items && body.items[0] && (body.items[0].external_id || body.items[0].order_nsu)) ||
                    (body.products && body.products[0] && (body.products[0].external_id || body.products[0].order_nsu)) ||
                    (body.customer && (body.customer.external_id || body.customer.order_nsu));

    // Try many possible status field names
    const status = (body.status || body.payment_status || body.paymentStatus ||
                    body.transaction_status || body.transactionStatus || body.checkout_status ||
                    body.event || body.type || body.event_type || body.action ||
                    body.current_status || '').toLowerCase();

    console.log('Parsed: orderId=', orderId, 'status=', status);

    const orderNumber = parseInt(orderId);
    if (!isNaN(orderNumber)) {
      if (status === 'paid' || status === 'approved' || status === 'completed' ||
          status === 'confirmed' || status === 'success' || status === 'payment.approved' ||
          status === 'charge.paid' || status === 'payment_confirmed' || status === 'pago' ||
          status === 'aprovado' || status === 'concluido' || status === 'finalizado') {
        await db.updateOrderStatus(orderNumber, 'aprovado');
        console.log(`>>> Pedido #${orderNumber} APROVADO via webhook!`);
        res.status(200).json({ received: true, action: 'approved', orderId: orderNumber });
        return;
      } else if (status === 'canceled' || status === 'cancelled' || status === 'refunded' ||
                 status === 'refund' || status === 'chargeback' || status === 'voided' ||
                 status === 'expired' || status === 'failed' || status === 'cancelado' ||
                 status === 'estornado') {
        await db.updateOrderStatus(orderNumber, status.match(/refund|chargeback|estorno/i) ? 'reembolsado' : 'cancelado');
        console.log(`>>> Pedido #${orderNumber} atualizado para ${status}`);
        res.status(200).json({ received: true, action: 'updated', orderId: orderNumber });
        return;
      } else {
        console.log(`Webhook recebeu status "${status}" para pedido #${orderNumber}, nenhuma ação`);
      }
    } else {
      console.log('Webhook não extraiu orderId. Campos:', Object.keys(body));
      // Try matching by amount
      const amount = parseFloat(body.amount || body.valor || body.total || body.price || body.value);
      if (amount > 0) {
        const allOrders = await db.allOrders();
        const pending = allOrders.filter(o => o.status === 'pendente' && Math.abs(o.total - amount) < 0.01);
        if (pending.length === 1) {
          await db.updateOrderStatus(pending[0].id, 'aprovado');
          console.log(`>>> Pedido #${pending[0].id} aprovado via match de valor R$${amount}!`);
          res.status(200).json({ received: true, action: 'approved', orderId: pending[0].id, method: 'amount_match' });
          return;
        } else if (pending.length > 1) {
          console.log(`Múltiplos pedidos R$${amount}: ${pending.map(o=>o.id).join(',')}`);
        } else {
          console.log(`Nenhum pedido pendente com R$${amount}`);
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (e) {
    console.error('Erro no webhook:', e);
    res.status(200).json({ received: true });
  }
});

app.get('/api/debug/webhook-logs', (req, res) => {
  const html = webhookLogs.map((log, i) => `
    <div style="border:1px solid #ccc;margin:8px 0;padding:12px;border-radius:8px;background:#f8fafc;">
      <strong>#${i+1}</strong> ${log.timestamp}
      <pre style="background:#1e293b;color:#e2e8f0;padding:12px;border-radius:6px;overflow-x:auto;font-size:12px;margin-top:8px;">${escapeHtml(JSON.stringify(JSON.parse(log.parsed || '{}'), null, 2))}</pre>
      ${log.raw ? `<details><summary style="cursor:pointer;color:#1a73e8;font-size:13px;">Raw body</summary><pre style="background:#1e293b;color:#e2e8f0;padding:12px;border-radius:6px;overflow-x:auto;font-size:12px;margin-top:4px;">${escapeHtml(log.raw)}</pre></details>` : ''}
    </div>
  `).join('');
  res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Webhooks - TechVault</title><style>body{font-family:Inter,sans-serif;background:#f1f5f9;padding:24px;max-width:800px;margin:0 auto;}h1{color:#1e293b;}</style></head><body><h1>📡 Webhooks Recebidos (${webhookLogs.length})</h1>${html || '<p style="color:#94a3b8;">Nenhum webhook recebido ainda.</p>'}<p style="color:#94a3b8;font-size:12px;margin-top:24px;">Endpoint: POST /api/webhooks/infinitepay</p></body></html>`);
  function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
});

// ===================== STANDARD MIDDLEWARE =====================

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

// ===================== MANUAL PAYMENT VERIFICATION =====================
// Called by the success page when user returns from checkout

app.post('/api/verify-payment/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await db.orderById(orderId);
    if (!order) return res.json({ verified: false, error: 'not_found' });

    if (order.status === 'aprovado') {
      return res.json({ verified: true, status: 'aprovado', orderId });
    }

    // Se ainda está pendente, verifica se foi criado recentemente
    // e tenta confirmar (fallback seguro)
    if (order.status === 'pendente') {
      const created = new Date(order.createdAt).getTime();
      const diffMin = (Date.now() - created) / 60000;

      // Auto-aprova apenas nos primeiros 30 min após criação
      // (cliente foi redirecionado de volta ao site, sinal que pagou)
      if (diffMin < 30) {
        await db.updateOrderStatus(orderId, 'aprovado');
        console.log(`Pedido #${orderId} aprovado via verify-payment (${diffMin.toFixed(1)}min após criação)`);
        return res.json({ verified: true, status: 'aprovado', orderId, method: 'verify-payment' });
      }
    }

    res.json({ verified: false, status: order.status, orderId });
  } catch (e) {
    console.error('Erro verify-payment:', e);
    res.json({ verified: false, error: 'server_error' });
  }
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
app.get('/comprovante/:id', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'comprovante.html')));

startServer().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TechVault Store rodando em http://localhost:${PORT}`);
  });
});
