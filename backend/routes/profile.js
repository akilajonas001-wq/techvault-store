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

module.exports = router;
