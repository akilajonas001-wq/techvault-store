const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', requireAuth, async (req, res) => {
  try {
    const profile = await db.getUserProfile(req.user.id);
    if (!profile) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(profile);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao carregar perfil' });
  }
});

router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { nome, telefone, cep, logradouro, numero, complemento, bairro, cidade, estado, cpf } = req.body;
    const profile = await db.updateUserProfile(req.user.id, {
      nome, telefone, cep, logradouro, numero, complemento, bairro, cidade, estado, cpf
    });
    if (!profile) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ success: true, profile });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao salvar perfil' });
  }
});

router.get('/orders/my', requireAuth, async (req, res) => {
  try {
    const orders = await db.ordersByUserId(req.user.id);
    res.json(orders);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao carregar pedidos' });
  }
});

router.post('/orders/:orderId/cancel-item', requireAuth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { itemId } = req.body;
    const order = await db.orderById(orderId);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    if (order.userId != req.user.id) return res.status(403).json({ error: 'Acesso negado' });

    const createdAt = new Date(order.createdAt);
    const now = new Date();
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
    if (hoursDiff > 24) return res.status(400).json({ error: 'Prazo de cancelamento expirado (24 horas)' });

    if ((order.cancelledItems || []).includes(itemId)) return res.status(400).json({ error: 'Item já foi cancelado' });

    const updated = await db.cancelOrderItem(orderId, itemId);
    await db.updateOrderStatus(orderId, 'chamado de cancelamento');

    const convKey = 'cancel:' + orderId;
    const existing = await db.getChatMessages(convKey);
    if (!existing) {
      const item = order.itens.find(i => (i.id || i.productId) == itemId);
      const msg = {
        from: 'system',
        message: 'Chamado de cancelamento aberto para o produto: ' + (item ? item.nome : 'Produto') + '. Motivo: solicitação do cliente.',
        createdAt: new Date().toISOString(),
        read: false
      };
      await db.saveChatMessages(convKey, [msg]);
    }

    res.json({ success: true, order: updated, conversationKey: convKey });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao cancelar item' });
  }
});

router.post('/orders/:orderId/return-item', requireAuth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { itemId } = req.body;
    const order = await db.orderById(orderId);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    if (order.userId != req.user.id) return res.status(403).json({ error: 'Acesso negado' });

    if (!order.deliveredAt) return res.status(400).json({ error: 'Pedido ainda não foi entregue' });

    const deliveredAt = new Date(order.deliveredAt);
    const now = new Date();
    const daysDiff = (now - deliveredAt) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) return res.status(400).json({ error: 'Prazo de devolução expirado (7 dias após entrega)' });

    if ((order.returnedItems || []).includes(itemId)) return res.status(400).json({ error: 'Item já foi devolvido' });

    const updated = await db.returnOrderItem(orderId, itemId);
    await db.updateOrderStatus(orderId, 'chamado de devolução');

    const convKey = 'return:' + orderId;
    const existing = await db.getChatMessages(convKey);
    if (!existing) {
      const item = order.itens.find(i => (i.id || i.productId) == itemId);
      const msg = {
        from: 'system',
        message: 'Chamado de devolução aberto para o produto: ' + (item ? item.nome : 'Produto') + '. Motivo: solicitação do cliente.',
        createdAt: new Date().toISOString(),
        read: false
      };
      await db.saveChatMessages(convKey, [msg]);
    }

    res.json({ success: true, order: updated, conversationKey: convKey });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao devolver item' });
  }
});

module.exports = router;
