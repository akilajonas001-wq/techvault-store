const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const addresses = await db.userAddresses(req.user.id);
    res.json(addresses);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao carregar endereços' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const addr = await db.createAddress(req.user.id, req.body);
    res.json({ success: true, address: addr });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao criar endereço' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const addr = await db.updateAddress(parseInt(req.params.id), req.user.id, req.body);
    if (!addr) return res.status(404).json({ error: 'Endereço não encontrado' });
    res.json({ success: true, address: addr });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao atualizar endereço' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.deleteAddress(parseInt(req.params.id), req.user.id);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao deletar endereço' });
  }
});

module.exports = router;
