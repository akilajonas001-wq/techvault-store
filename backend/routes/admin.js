const express = require('express');
const db = require('../db');
const { adminAuth } = require('../middleware/auth');
const nodemailer = require('nodemailer');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'techvault-default-secret-key';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER || 'akilajonas001@gmail.com', pass: process.env.EMAIL_PASS || '' }
});

router.use(adminAuth);

// ========== DASHBOARD ==========

router.get('/dashboard', async (req, res) => {
  try {
    const [orders, users] = await Promise.all([db.allOrders(), db.allUsers()]);
    res.json({
      totalVendas: orders.reduce((s, o) => s + (o.total || 0), 0),
      totalPedidos: orders.length,
      totalUsuarios: users.length,
      pedidosRecentes: orders.slice(-10).reverse()
    });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao carregar dashboard' }); }
});

// ========== PEDIDOS ==========

router.get('/orders', async (req, res) => {
  try { res.json(await db.allOrders()); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao carregar pedidos' }); }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    await db.updateOrderStatus(parseInt(req.params.id), req.body.status);
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao atualizar pedido' }); }
});

// ========== PRODUTOS ==========

router.get('/products', async (req, res) => {
  try {
    const { search, paused } = req.query;
    res.json(await db.adminProducts(search, paused));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao carregar produtos' }); }
});

router.post('/products', async (req, res) => {
  try {
    const p = req.body;
    if (!p.nome || !p.preco) return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
    const produto = await db.createProduct({
      id: Date.now(), nome: p.nome, descricao: p.descricao || '',
      preco: parseFloat(p.preco), precoOriginal: p.precoOriginal ? parseFloat(p.precoOriginal) : null,
      categoria: p.categoria || 'outros', imagem: p.imagem || '',
      imagens: p.imagens || [], estoque: p.estoque || 'N/A',
      destaque: p.destaque === true, avaliacao: parseFloat(p.avaliacao) || 0,
      reviews: parseInt(p.reviews) || 0, createdAt: new Date().toISOString()
    });
    res.json({ success: true, product: produto });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao criar produto' }); }
});

router.put('/products/:id', async (req, res) => {
  try { await db.updateProduct(parseInt(req.params.id), req.body); res.json({ success: true }); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao atualizar produto' }); }
});

router.delete('/products/:id', async (req, res) => {
  try { await db.deleteProduct(parseInt(req.params.id)); res.json({ success: true }); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao deletar produto' }); }
});

router.post('/products/:id/update-price', async (req, res) => {
  try {
    if (req.adminUser.role === 'funcionario') {
      return res.status(403).json({ error: 'Apenas administradores podem alterar preços' });
    }
    const id = parseInt(req.params.id);
    const { preco } = req.body;
    if (!preco || preco <= 0) return res.status(400).json({ error: 'Preço inválido' });

    const product = await db.productById(id);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

    const parsedPreco = parseFloat(preco);
    const precoOriginal = product.precoOriginal || product.preco;
    await db.updateProduct(id, { preco: parsedPreco, precoOriginal, precoAlterado: parsedPreco !== precoOriginal });

    res.json({ success: true, id, nome: product.nome, preco: parsedPreco, precoOriginal, precoAlterado: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao alterar preço' }); }
});

router.post('/products/:id/toggle-pause', async (req, res) => {
  try {
    if (req.adminUser.role === 'funcionario') {
      return res.status(403).json({ error: 'Apenas administradores podem pausar/reativar produtos' });
    }
    const id = parseInt(req.params.id);
    const p = await db.productById(id);
    if (!p) return res.status(404).json({ error: 'Produto não encontrado' });
    await db.updateProduct(id, { paused: !p.paused });
    const updated = await db.productById(id);
    res.json({ success: true, id, nome: updated.nome, paused: updated.paused });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao pausar/ativar produto' }); }
});

// ========== USUÁRIOS ==========

router.get('/users', async (req, res) => {
  try {
    const users = await db.allUsers();
    res.json(users.map(u => ({ ...u, senha: undefined })));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao carregar usuários' }); }
});

router.put('/users/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.senha;
    if (req.body.novaSenha) {
      const bcrypt = require('bcryptjs');
      updates.senha = await bcrypt.hash(req.body.novaSenha, 10);
    }
    await db.updateUser(parseInt(req.params.id), updates);
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao atualizar usuário' }); }
});

router.delete('/users/:id', async (req, res) => {
  try { await db.deleteUser(parseInt(req.params.id)); res.json({ success: true }); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao deletar usuário' }); }
});

// ========== STAFF & CARGOS ==========

router.get('/staff', async (req, res) => {
  try { res.json(await db.adminStaff()); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao carregar staff' }); }
});

router.post('/set-role', async (req, res) => {
  try {
    if (req.adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem definir cargos' });
    }
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email é obrigatório' });
    if (role && !['admin', 'funcionario'].includes(role)) {
      return res.status(400).json({ error: 'Cargo inválido. Use: admin ou funcionario' });
    }
    const user = await db.userByEmail(email);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    if (role === 'admin') { await db.updateUser(user.id, { admin: true, role: 'admin' }); }
    else if (role === 'funcionario') { await db.updateUser(user.id, { admin: true, role: 'funcionario' }); }
    else { await db.updateUser(user.id, { admin: false, role: null }); }

    const updated = await db.userById(user.id);
    res.json({ success: true, user: { id: updated.id, nome: updated.nome, email: updated.email, role: updated.role, admin: updated.admin } });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao definir cargo' }); }
});

// ========== CARRINHOS ==========

router.get('/carts', async (req, res) => {
  try { res.json(await db.allCartsWithUsers()); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao carregar carrinhos' }); }
});

// ========== CUPONS ==========

router.get('/coupons', async (req, res) => {
  try { res.json(await db.allCoupons()); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao carregar cupons' }); }
});

router.post('/coupons/create', async (req, res) => {
  try {
    const { email, code, discount } = req.body;
    if (!email || !code || !discount) {
      return res.status(400).json({ error: 'Email, código e desconto são obrigatórios' });
    }
    const user = await db.userByEmail(email);
    if (!user) return res.status(404).json({ error: 'Email não encontrado' });

    if (await db.couponByCode(code.toUpperCase())) {
      return res.status(400).json({ error: 'Código de cupom já existe' });
    }

    const coupon = await db.createCoupon({
      code: code.toUpperCase(), discount: parseFloat(discount),
      type: 'percent', minValue: 0, userId: user.id,
      userEmail: email, createdAt: new Date().toISOString()
    });

    await db.createNotification({
      id: 'notif_' + Date.now(), userId: user.id, type: 'coupon',
      title: 'Cupom de desconto!',
      message: `Você ganhou um cupom de ${discount}% de desconto! Use o código: ${code.toUpperCase()} no checkout.`,
      couponCode: code.toUpperCase(), createdAt: new Date().toISOString()
    });

    try {
      await transporter.sendMail({
        from: `"TechVault" <${process.env.EMAIL_USER || 'akilajonas001@gmail.com'}>`,
        to: email, subject: 'Voce ganhou um cupom de desconto na TechVault!',
        html: `<div style="font-family:Arial;padding:24px;background:#f8fafc;"><h2>Cupom de ${discount}%!</h2><p>Use o código: <strong>${code.toUpperCase()}</strong> no checkout.</p></div>`
      });
    } catch (emailErr) { console.error('Erro email cupom:', emailErr.message); }

    res.json({ success: true, coupon, emailSent: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao criar cupom' }); }
});

// ========== NEWSLETTER ==========

router.get('/newsletter', async (req, res) => {
  try { res.json(await db.allNewsletters()); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao carregar emails' }); }
});

module.exports = router;
