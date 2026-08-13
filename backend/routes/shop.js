const express = require('express');
const db = require('../db');
const nodemailer = require('nodemailer');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const PIX_KEY = process.env.PIX_KEY || 'techvault@picpay.com';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'akilajonas001@gmail.com',
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000
});

// ========== PRODUTOS ==========

router.get('/products/featured', async (req, res) => {
  try { res.json(await db.featuredProducts()); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao carregar destaques' }); }
});

router.get('/products/offers', async (req, res) => {
  try { res.json(await db.offerProducts()); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao carregar ofertas' }); }
});

router.get('/products/search', async (req, res) => {
  try {
    const { q, categoria, precoMin, precoMax, ordem, page, limit } = req.query;
    let products = (await db.allProducts()).filter(p => !p.paused);

    if (q) {
      const termo = q.toLowerCase();
      products = products.filter(p =>
        p.nome.toLowerCase().includes(termo) ||
        p.descricao?.toLowerCase().includes(termo) ||
        p.categoria.toLowerCase().includes(termo)
      );
    }
    if (categoria) products = products.filter(p => p.categoria === categoria);
    if (precoMin) products = products.filter(p => p.preco >= parseFloat(precoMin));
    if (precoMax) products = products.filter(p => p.preco <= parseFloat(precoMax));
    if (ordem === 'menor-preco') products.sort((a, b) => a.preco - b.preco);
    else if (ordem === 'maior-preco') products.sort((a, b) => b.preco - a.preco);
    else if (ordem === 'mais-vendidos') products.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    else if (ordem === 'melhor-avaliado') products.sort((a, b) => b.avaliacao - a.avaliacao);

    const total = products.length;
    const p = parseInt(page) || 1;
    const l = parseInt(limit) || 30;
    const start = (p - 1) * l;
    res.json({ products: products.slice(start, start + l), total, page: p, totalPages: Math.ceil(total / l) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao buscar produtos' }); }
});

router.get('/products/category/:categoria', async (req, res) => {
  try {
    const { page, limit } = req.query;
    let products = (await db.allProducts()).filter(p => !p.paused && p.categoria === req.params.categoria);
    const total = products.length;
    const p = parseInt(page) || 1;
    const l = parseInt(limit) || 30;
    const start = (p - 1) * l;
    res.json({ products: products.slice(start, start + l), total, page: p, totalPages: Math.ceil(total / l) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao carregar produtos' }); }
});

router.get('/categories', async (req, res) => {
  try { res.json(await db.getCategories()); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao carregar categorias' }); }
});

router.get('/products', async (req, res) => {
  try { res.json((await db.allProducts()).filter(p => !p.paused)); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao carregar produtos' }); }
});

router.get('/products/:id', async (req, res) => {
  try {
    const p = await db.productById(parseInt(req.params.id));
    if (!p) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(p);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao carregar produto' }); }
});

// ========== COMENTÁRIOS ==========

router.get('/products/:id/comments', async (req, res) => {
  try { res.json(await db.allComments(parseInt(req.params.id))); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao carregar comentários' }); }
});

router.post('/products/:id/comments', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { userId, userName, rating, comment } = req.body;
    if (!comment || !comment.trim()) return res.status(400).json({ error: 'O comentário não pode estar vazio' });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'A avaliação deve ser entre 1 e 5' });

    const newComment = await db.createComment({
      id: Date.now(), productId, userId: userId || null,
      userName: userName || 'Anônimo', rating, comment: comment.trim(),
      createdAt: new Date().toISOString()
    });
    res.json({ success: true, comment: newComment });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao adicionar comentário' }); }
});

router.delete('/products/:id/comments/:commentId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET;
    let userId;
    try { userId = jwt.verify(token, JWT_SECRET).id; }
    catch { return res.status(401).json({ error: 'Token inválido' }); }

    const commentId = parseInt(req.params.commentId);
    const comments = await db.allComments(parseInt(req.params.id));
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return res.status(404).json({ error: 'Comentário não encontrado' });
    const user = await db.userById(userId);
    const isAdmin = user && (user.admin || user.role === 'admin' || user.role === 'funcionario');
    if (comment.userId !== userId && !isAdmin) return res.status(403).json({ error: 'Você não tem permissão para deletar este comentário' });

    await db.deleteComment(commentId);
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao deletar comentário' }); }
});

// ========== PEDIDOS ==========

router.post('/orders', requireAuth, async (req, res) => {
  try {
    const { endereco, itens, total, totalOriginal, cupom, cliente } = req.body;
    const user = req.user;

    // Validar endereço brasileiro
    const brStates = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
    const cepClean = (endereco?.cep || '').replace(/\D/g, '');
    if (cepClean.length !== 8) {
      return res.status(400).json({ error: 'CEP inválido. Informe um CEP brasileiro com 8 dígitos.' });
    }
    if (!endereco?.estado || !brStates.includes(endereco.estado)) {
      return res.status(400).json({ error: 'Só realizamos entregas dentro do Brasil.' });
    }

    // Recalcular preço server-side (estoque é infinito enquanto disponível)
    let serverTotal = 0;
    for (const item of (itens || [])) {
      const product = await db.productById(item.id || item.productId);
      if (!product) return res.status(400).json({ error: 'Produto não encontrado: ' + (item.nome || item.id) });
      serverTotal += (product.preco || 0) * (item.quantidade || 1);
    }
    serverTotal = Math.round(serverTotal * 100) / 100;

    // Recalcular desconto do cupom server-side
    let serverDiscount = 0;
    if (cupom && cupom.code) {
      const couponRecord = await db.couponByCode(cupom.code.toUpperCase());
      if (couponRecord && couponRecord.valid) {
        if (couponRecord.type === 'percent') serverDiscount = serverTotal * (couponRecord.discount / 100);
        else if (couponRecord.type === 'fixed') serverDiscount = couponRecord.discount;
        serverDiscount = Math.min(Math.round(serverDiscount * 100) / 100, serverTotal);
      }
    }
    const finalTotal = Math.round((serverTotal - serverDiscount) * 100) / 100;

    const newOrder = await db.createOrder({
      id: Date.now(), userId: user.id,
      usuario: { nome: user.nome, email: user.email, telefone: user.telefone },
      endereco, itens, total: finalTotal, totalOriginal: serverTotal,
      cupom: cupom && serverDiscount > 0 ? { code: cupom.code, desconto: serverDiscount } : null, cliente: cliente || {},
      taxas: {},
      pagamento: 'Mercado Pago', status: 'pendente',
      createdAt: new Date().toISOString()
    });

    db.updateUserProfile(user.id, {
      nome: cliente?.nome || user.nome,
      telefone: cliente?.telefone || user.telefone,
      cpf: cliente?.cpf || '',
      cep: endereco?.cep || '',
      logradouro: endereco?.logradouro || '',
      numero: endereco?.numero || '',
      complemento: endereco?.complemento || '',
      bairro: endereco?.bairro || '',
      cidade: endereco?.cidade || '',
      estado: endereco?.estado || ''
    }).catch(e => console.error('Erro perfil:', e.message));

    transporter.sendMail({
      from: process.env.EMAIL_USER || 'akilajonas001@gmail.com',
      to: 'akilajonas001@gmail.com',
      subject: `Novo Pedido #${newOrder.id} - TechVault`,
      html: `<h1>Novo Pedido</h1><p>Pedido #${newOrder.id} de ${user.nome} - Aguardando pagamento</p>`
    }).catch(e => console.error('Erro email:', e.message));

    // Pedido criado sem pagamento: o checkout integrado cria o pagamento em seguida
    // (PIX ou cartão) via /api/payments/*. O pedido só sai de "pendente" quando o
    // webhook do Mercado Pago confirmar o pagamento.
    res.json({
      success: true,
      orderId: newOrder.id,
      paymentRef: newOrder.paymentRef,
      total: finalTotal,
      message: 'Pedido criado! Escolha a forma de pagamento.'
    });
  } catch (e) { console.error('ERRO PEDIDO:', e.message, e.stack); res.status(500).json({ error: 'Erro ao processar pedido: ' + (e.message || '') }); }
});

// ========== PAGAMENTOS INTEGRADOS (Payment API) ==========

const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const MP_API = 'https://api.mercadopago.com';
const MP_TIMEOUT_MS = 15000;

async function mpPost(path, payload, idempotencyKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MP_TIMEOUT_MS);
  try {
    const res = await fetch(`${MP_API}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': idempotencyKey || require('crypto').randomUUID()
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { error: e.name === 'AbortError' ? 'Timeout chamando Mercado Pago' : 'Falha de rede: ' + e.message } };
  } finally {
    clearTimeout(timeout);
  }
}

async function mpGet(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MP_TIMEOUT_MS);
  try {
    const res = await fetch(`${MP_API}${path}`, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
      signal: controller.signal
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Mercado Pago GET error:', e.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function buildPayer(cliente, user) {
  const nome = String(cliente?.nome || user.nome || '').trim();
  const parts = nome.split(/\s+/);
  const payer = {
    email: cliente?.email || user.email || '',
    first_name: parts[0] || 'Cliente'
  };
  if (parts.length > 1) payer.last_name = parts.slice(1).join(' ').slice(0, 30);
  const cpf = String(cliente?.cpf || '').replace(/\D/g, '');
  if (cpf.length === 11) payer.identification = { type: 'CPF', number: cpf };
  return payer;
}

function paymentStatusLabel(status) {
  switch ((status || '').toLowerCase()) {
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

function notifyBaseUrl(req) {
  const host = req.get('host') || '';
  if (/^(localhost|127\.0\.0\.1|\[::1\])/.test(host)) return null;
  const baseUrl = `${req.protocol}://${host}`;
  return `${baseUrl}/api/webhooks/mercadopago`;
}

// Cria pagamento PIX e retorna QR Code + copia-e-cola para exibir no próprio checkout
router.post('/payments/pix', requireAuth, async (req, res) => {
  try {
    const order = await db.orderById(parseInt(req.body.orderId));
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    if (order.userId != req.user.id && !req.user.admin) return res.status(403).json({ error: 'Acesso negado' });
    if (order.status === 'aprovado') return res.json({ success: true, alreadyPaid: true, status: 'approved' });
    if (!MP_ACCESS_TOKEN) return res.status(500).json({ error: 'Pagamento PIX indisponível no momento' });

    const total = Math.round(order.total * 100) / 100;
    if (total <= 0) return res.status(400).json({ error: 'Pedido sem valor válido' });

    const payer = buildPayer(order.cliente, order.usuario);
    const expiration = new Date(Date.now() + 45 * 60 * 1000).toISOString();
    const notifyUrl = notifyBaseUrl(req);

    const { ok, status: httpStatus, data } = await mpPost('/v1/payments', {
      transaction_amount: total,
      description: `Pedido #${order.id} TechVault`,
      payment_method_id: 'pix',
      payer,
      external_reference: String(order.id),
      ...(notifyUrl ? { notification_url: notifyUrl } : {}),
      statement_descriptor: 'TECHVAULT STORE',
      date_of_expiration: expiration
    });

    if (!ok) {
      console.error('PIX error:', httpStatus, JSON.stringify(data));
      const msg = data?.message || data?.error || 'Erro ao gerar pagamento PIX';
      return res.status(500).json({ error: 'Erro ao gerar PIX: ' + msg });
    }

    const tx = data.point_of_interaction && data.point_of_interaction.transaction_data;
    if (data.id) await db.updateOrderMpPayment(order.id, data.id);

    res.json({
      success: true,
      paymentId: data.id,
      status: data.status,
      qr_code: tx?.qr_code || '',
      qr_code_base64: tx?.qr_code_base64 || '',
      ticket_url: tx?.ticket_url || '',
      expires_at: expiration
    });
  } catch (e) { console.error('ERRO PIX:', e.message); res.status(500).json({ error: 'Erro ao gerar PIX: ' + (e.message || '') }); }
});

// Cria pagamento no cartão usando token gerado pelo MercadoPago.js (frontend)
router.post('/payments/card', requireAuth, async (req, res) => {
  try {
    const { orderId, token, paymentMethodId, cpf } = req.body;
    const order = await db.orderById(parseInt(orderId));
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    if (order.userId != req.user.id && !req.user.admin) return res.status(403).json({ error: 'Acesso negado' });
    if (order.status === 'aprovado') return res.json({ success: true, alreadyPaid: true, status: 'approved' });
    if (!token) return res.status(400).json({ error: 'Token do cartão ausente' });
    if (!MP_ACCESS_TOKEN) return res.status(500).json({ error: 'Pagamento no cartão indisponível no momento' });

    const total = Math.round(order.total * 100) / 100;
    const user = order.usuario || {};
    const cliente = order.cliente || {};
    const payer = {
      email: cliente.email || user.email || '',
      identification: { type: 'CPF', number: String(cpf || cliente.cpf || '').replace(/\D/g, '') }
    };
    if (!payer.identification.number) delete payer.identification;

    const { ok, status: httpStatus, data } = await mpPost('/v1/payments', {
      transaction_amount: total,
      description: `Pedido #${order.id} TechVault`,
      installments: 1,
      payment_method_id: paymentMethodId || undefined,
      token,
      payer,
      external_reference: String(order.id),
      ...(notifyBaseUrl(req) ? { notification_url: notifyBaseUrl(req) } : {}),
      statement_descriptor: 'TECHVAULT STORE'
    });

    if (data && data.id) await db.updateOrderMpPayment(order.id, data.id);

    if (!ok) {
      console.error('CARD error:', httpStatus, JSON.stringify(data));
      const msg = data?.message || data?.error || 'Erro ao processar cartão';
      return res.status(500).json({ error: 'Erro ao processar cartão: ' + msg, mpError: data });
    }

    if (data.status === 'approved') {
      await db.updateOrderStatus(order.id, 'aprovado');
      await db.updateOrderPaymentInfo(order.id, {
        paymentId: data.id, status: data.status, statusDetail: data.status_detail || '',
        method: data.payment_method_id || '', installments: data.installments || 1
      });
      console.log(`>>> Pedido #${order.id} aprovado via cartão (payment ${data.id})`);
    }

    res.json({
      success: true,
      paymentId: data.id,
      status: data.status,
      statusDetail: data.status_detail || '',
      installments: data.installments || 1,
      method: data.payment_method_id || ''
    });
  } catch (e) { console.error('ERRO CARTÃO:', e.message); res.status(500).json({ error: 'Erro ao processar cartão: ' + (e.message || '') }); }
});

// Consulta status do pagamento (polling do frontend, mais confiável que esperar webhook)
router.get('/payments/:orderId/status', requireAuth, async (req, res) => {
  try {
    const order = await db.orderById(parseInt(req.params.orderId));
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    if (order.userId != req.user.id && !req.user.admin) return res.status(403).json({ error: 'Acesso negado' });

    let payment = null;
    if (order.mpPaymentId) {
      payment = await mpGet(`/v1/payments/${order.mpPaymentId}`);
    }
    if (!payment && MP_ACCESS_TOKEN) {
      const search = await mpGet(`/v1/payments/search?external_reference=${encodeURIComponent(String(order.id))}&sort=date_created&criteria=desc`);
      payment = (search && search.results && search.results[0]) || null;
    }

    const mpStatus = payment ? payment.status : null;
    const status = paymentStatusLabel(mpStatus);
    if (status && order.status !== status && status === 'aprovado') {
      await db.updateOrderStatus(order.id, status);
      await db.updateOrderPaymentInfo(order.id, {
        paymentId: payment.id, status: payment.status, statusDetail: payment.status_detail || '',
        method: payment.payment_method_id || '', installments: payment.installments || 1
      });
      console.log(`>>> Pedido #${order.id} aprovado via polling (payment ${payment.id})`);
    }

    res.json({
      success: true,
      orderStatus: order.status,
      mpStatus,
      status,
      paymentId: payment ? payment.id : null
    });
  } catch (e) { console.error('ERRO STATUS:', e.message); res.status(500).json({ error: 'Erro ao consultar status' }); }
});

router.get('/orders/user/:userId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET;
    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); }
    catch { return res.status(401).json({ error: 'Token inválido' }); }

    const userId = parseInt(req.params.userId) || req.params.userId;
    if (decoded.id != userId) return res.status(403).json({ error: 'Acesso negado' });

    res.json(await db.ordersByUserId(userId));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao carregar pedidos' }); }
});

// ========== NEWSLETTER ==========

router.post('/newsletter', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email inválido' });
    if (await db.isNewsletterSubscribed(email)) return res.json({ success: true, message: 'Email já cadastrado' });
    await db.subscribeNewsletter(email);
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao cadastrar email' }); }
});

// ========== CUPONS (USUÁRIO) ==========

router.get('/coupons/my', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json([]);
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.userById(decoded.id);
    res.json(await db.userCoupons(decoded.id, user?.email));
  } catch { res.json([]); }
});

router.post('/coupons/apply', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, JWT_SECRET);
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Código do cupom é obrigatório' });

    const user = await db.userById(decoded.id);
    const coupons = await db.userCoupons(decoded.id, user?.email);
    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && !c.used);
    if (!coupon) return res.status(404).json({ error: 'Cupom não encontrado ou já utilizado' });

    await db.useCoupon(coupon.code, decoded.id);
    res.json({ success: true, coupon: { code: coupon.code, discount: coupon.discount, type: coupon.type } });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao aplicar cupom' }); }
});

router.post('/coupons/validate', async (req, res) => {
  try {
    const { code, total } = req.body;
    if (!code) return res.status(400).json({ error: 'Código do cupom é obrigatório' });

    const coupon = await db.couponByCode(code.toUpperCase());
    if (!coupon || !coupon.valid) return res.status(404).json({ error: 'Cupom não encontrado ou expirado' });
    if (total < coupon.minValue) {
      return res.status(400).json({ error: 'Valor mínimo de R$ ' + coupon.minValue.toFixed(2).replace('.', ',') + ' para usar este cupom' });
    }

    let discount = 0;
    if (coupon.type === 'percent') discount = total * (coupon.discount / 100);
    else if (coupon.type === 'fixed') discount = coupon.discount;

    res.json({ success: true, coupon: { code: coupon.code, discount: coupon.discount, type: coupon.type, discountValue: Math.min(discount, total) } });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao validar cupom' }); }
});

// ========== CARRINHO ==========

router.post('/cart/sync', requireAuth, async (req, res) => {
  try {
    await db.saveCart(req.user.id, req.body.items || []);
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao salvar carrinho' }); }
});

router.post('/cart/clear', requireAuth, async (req, res) => {
  try {
    await db.clearCart(req.user.id);
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao limpar carrinho' }); }
});

// ========== LISTA DE DESEJOS ==========

router.get('/wishlist/:userId', requireAuth, async (req, res) => {
  try {
    if (parseInt(req.params.userId) !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });
    res.json(await db.getWishlist(parseInt(req.params.userId) || req.params.userId));
  }
  catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao carregar favoritos' }); }
});

router.post('/wishlist/:userId', requireAuth, async (req, res) => {
  try {
    if (parseInt(req.params.userId) !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });
    const userId = parseInt(req.params.userId) || req.params.userId;
    const { productId } = req.body;
    const added = await db.toggleWishlist(userId, productId);
    res.json({ success: true, items: await db.getWishlist(userId), added });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao atualizar favoritos' }); }
});

// ========== NOTIFICAÇÕES ==========

router.get('/notifications/my', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json([]);
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json(await db.userNotifications(decoded.id));
  } catch { res.json([]); }
});

router.post('/notifications/read/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, JWT_SECRET);
    const userNotifs = await db.userNotifications(decoded.id);
    const notif = userNotifs.find(n => String(n.id) === String(req.params.id));
    if (!notif) return res.status(404).json({ error: 'Notificação não encontrada' });
    await db.markNotificationRead(req.params.id);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Erro' }); }
});

module.exports = router;
