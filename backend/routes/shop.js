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

const MP_API = 'https://api.mercadopago.com';
const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const MP_TIMEOUT_MS = 10000;

function cents(value) {
  return Math.round((parseFloat(value) || 0) * 100);
}

// Distribui o desconto do cupom proporcionalmente entre os itens (em centavos inteiros),
// garantindo que a soma dos itens bata exatamente com o total final do pedido.
function buildMpItems(itens, baseCents, totalCents) {
  if (!itens || itens.length === 0 || baseCents <= 0 || totalCents <= 0) return [];
  const items = itens.map(it => ({
    title: String(it.nome || 'Produto').slice(0, 256),
    quantity: Math.max(1, parseInt(it.quantidade) || 1),
    unit_price: cents(it.preco),
    category_id: 'others'
  }));
  if (baseCents === totalCents) return items;
  let allocated = 0;
  const n = items.length;
  return items.map((it, i) => {
    if (i === n - 1) return { ...it, unit_price: totalCents - allocated };
    const price = Math.floor(it.unit_price * totalCents / baseCents);
    allocated += price;
    return { ...it, unit_price: price };
  });
}

function buildMpPayer(cliente, user) {
  const nome = String(cliente?.nome || user.nome || '').trim();
  const email = cliente?.email || user.email || '';
  const tel = String(cliente?.telefone || user.telefone || '').replace(/\D/g, '');
  let area_code = '', number = '';
  if (tel.length >= 10) { area_code = tel.slice(0, 2); number = tel.slice(2); }
  else { number = tel; }

  const parts = nome.split(/\s+/);
  const payer = { name: parts[0] || 'Cliente' };
  if (parts.length > 1) payer.surname = parts.slice(1).join(' ');
  if (email) payer.email = email;
  if (area_code || number) payer.phone = { area_code, number };
  const cpf = String(cliente?.cpf || '').replace(/\D/g, '');
  if (cpf.length === 11) payer.identification = { type: 'CPF', number: cpf };
  return payer;
}

async function createMercadoPagoPreference(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MP_TIMEOUT_MS);
  try {
    const res = await fetch(`${MP_API}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Mercado Pago preference error:', res.status, JSON.stringify(data));
      return null;
    }
    return data;
  } catch (e) {
    console.error('Mercado Pago preference fetch error:', e.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

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

    // Verificar estoque e recalcular preço server-side
    let serverTotal = 0;
    for (const item of (itens || [])) {
      const product = await db.productById(item.id || item.productId);
      if (!product) return res.status(400).json({ error: 'Produto não encontrado: ' + (item.nome || item.id) });
      if (product.stock >= 0 && product.stock < (item.quantidade || 1)) {
        return res.status(400).json({ error: 'Estoque insuficiente para "' + (product.nome || 'Produto') + '". Disponível: ' + product.stock });
      }
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

    (itens || []).forEach(item => {
      db.decrementStock(item.id || item.productId, item.quantidade || 1)
        .catch(e => console.error('Erro ao decrementar estoque:', e.message));
    });

    transporter.sendMail({
      from: process.env.EMAIL_USER || 'akilajonas001@gmail.com',
      to: 'akilajonas001@gmail.com',
      subject: `Novo Pedido #${newOrder.id} - TechVault`,
      html: `<h1>Novo Pedido</h1><p>Pedido #${newOrder.id} de ${user.nome} - Aguardando pagamento</p>`
    }).catch(e => console.error('Erro email:', e.message));

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const paymentRef = newOrder.paymentRef;
    const successUrl = `${baseUrl}/pedido-sucesso?id=${newOrder.id}&ref=${paymentRef}`;
    const failureUrl = `${baseUrl}/pedido-cancelado?id=${newOrder.id}&ref=${paymentRef}`;

    const baseCents = Math.round((serverTotal || 0) * 100);
    const totalCents = Math.round((finalTotal || 0) * 100);
    const mpItems = buildMpItems(itens || [], baseCents, totalCents);

    // Cria preference no Mercado Pago (Checkout Pro) → link de pagamento
    let checkoutUrl = null;
    if (MP_ACCESS_TOKEN && mpItems.length > 0) {
      const pref = await createMercadoPagoPreference({
        items: mpItems,
        payer: buildMpPayer(cliente, user),
        external_reference: String(newOrder.id),
        back_urls: {
          success: successUrl,
          pending: successUrl,
          failure: failureUrl
        },
        ...(baseUrl.startsWith('https://') ? { auto_return: 'approved' } : {}),
        binary_mode: true,
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        statement_descriptor: 'TECHVAULT STORE',
        shipments: { mode: 'not_specified' }
      });
      if (pref && pref.init_point) {
        checkoutUrl = pref.init_point;
      }
    } else {
      console.error('Mercado Pago: access token ausente ou pedido sem itens. Pedido #' + newOrder.id + ' criado sem URL de pagamento.');
    }

    if (!checkoutUrl) {
      console.error('Checkout URL é null! Pedido #' + newOrder.id + ' criado sem URL de pagamento.');
    }

    res.json({
      success: true, orderId: newOrder.id, paymentRef,
      message: 'Pedido criado! Redirecionando para o pagamento...',
      checkout_url: checkoutUrl
    });
  } catch (e) { console.error('ERRO PEDIDO:', e.message, e.stack); res.status(500).json({ error: 'Erro ao processar pedido: ' + (e.message || '') }); }
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
