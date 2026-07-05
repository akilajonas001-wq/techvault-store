const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip || req.connection.remoteAddress || 'unknown';
}

function makeFingerprint(ip, ua) {
  return crypto.createHash('sha256').update(ip + '|' + (ua || '')).digest('hex');
}

router.post('/visits/track', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const ip = getClientIp(req);
    const ua = req.headers['user-agent'] || '';
    const fp = makeFingerprint(ip, ua);
    await db.trackVisit(today, fp);
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao registrar visita:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/visits', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const count = await db.countVisits(today);
    res.json({ date: today, count });
  } catch (err) {
    console.error('Erro ao consultar visitas:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
