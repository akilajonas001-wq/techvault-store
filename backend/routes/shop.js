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
    const JWT_SECRET = process.env.JWT_SECRET || 'techvault-default-secret-key';
    let userId;
    try { userId = jwt.verify(token, JWT_SECRET).id; }
    catch { return res.status(401).json({ error: 'Token inválido' }); }

    const commentId = parseInt(req.params.commentId);
    const comments = await db.allComments(parseInt(req.params.id));
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return res.status(404).json({ error: 'Comentário não encontrado' });
    if (comment.userId !== userId) return res.status(403).json({ error: 'Você não tem permissão para deletar este comentário' });

    await db.deleteComment(commentId);
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao deletar comentário' }); }
});

// ========== PEDIDOS ==========

const INFINITE_PAY_API = 'https://api.infinitepay.io/invoices/public/checkout/links';
const INFINITE_PAY_HANDLE = 'akila-jonas';

router.post('/orders', requireAuth, async (req, res) => {
  try {
    const { endereco, itens, total, totalOriginal, cupom, cliente } = req.body;
    const user = req.user;

    const newOrder = await db.createOrder({
      id: Date.now(), userId: user.id,
      usuario: { nome: user.nome, email: user.email, telefone: user.telefone },
      endereco, itens, total, totalOriginal: totalOriginal || total,
      cupom: cupom || null, cliente: cliente || {},
      taxas: {},
      pagamento: 'InfinitePay', status: 'pendente',
      createdAt: new Date().toISOString()
    });

    db.updateUserProfile(user.id, {
      nome: cliente?.nome || user.nome,
      telefone: cliente?.telefone || user.telefone,
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

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const successUrl = `${baseUrl}/pedido-sucesso?id=${newOrder.id}`;
    const cancelUrl = `${baseUrl}/pedido-cancelado?id=${newOrder.id}`;
    const webhookUrl = `${baseUrl}/api/webhooks/infinitepay`;

    // Cria link de checkout dinâmico via API InfinitePay
    const apiPayload = {
      handle: INFINITE_PAY_HANDLE,
      itens: (itens || []).map(item => ({
        quantity: item.quantidade || 1,
        price: Math.round((item.preco || 0) * 100),
        description: item.nome || 'Produto'
      })),
      order_nsu: String(newOrder.id),
      redirect_url: successUrl,
      webhook_url: webhookUrl,
      customer: {
        name: cliente?.nome || user.nome,
        email: cliente?.email || user.email,
        phone_number: cliente?.telefone || user.telefone || ''
      }
    };

    let checkoutUrl = null;
    try {
      const apiRes = await fetch(INFINITE_PAY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload)
      });
      const apiData = await apiRes.json();
      if (apiRes.ok && apiData.url) {
        checkoutUrl = apiData.url;
      } else {
        console.error('InfinitePay API error:', apiRes.status, JSON.stringify(apiData));
      }
    } catch (e) {
      console.error('InfinitePay API fetch error:', e.message);
    }

    // Fallback: static checkout link + order_nsu como query param
    if (!checkoutUrl) {
      checkoutUrl = `https://checkout.infinitepay.io/${INFINITE_PAY_HANDLE}/JlFvnPXXzd?order_nsu=${newOrder.id}&redirect_url=${encodeURIComponent(successUrl)}`;
    }

    res.json({
      success: true, orderId: newOrder.id,
      message: 'Pedido criado! Redirecionando para o pagamento...',
      checkout_url: checkoutUrl
    });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao processar pedido' }); }
});

router.get('/orders/user/:userId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'techvault-default-secret-key';
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
    const JWT_SECRET = process.env.JWT_SECRET || 'techvault-default-secret-key';
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
    const JWT_SECRET = process.env.JWT_SECRET || 'techvault-default-secret-key';
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

router.get('/wishlist/:userId', async (req, res) => {
  try { res.json(await db.getWishlist(parseInt(req.params.userId) || req.params.userId)); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao carregar favoritos' }); }
});

router.post('/wishlist/:userId', async (req, res) => {
  try {
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
    const JWT_SECRET = process.env.JWT_SECRET || 'techvault-default-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json(await db.userNotifications(decoded.id));
  } catch { res.json([]); }
});

router.post('/notifications/read/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'techvault-default-secret-key';
    jwt.verify(token, JWT_SECRET);
    await db.markNotificationRead(req.params.id);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Erro' }); }
});

module.exports = router;
