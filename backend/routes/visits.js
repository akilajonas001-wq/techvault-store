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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

router.post('/visits/track', async (req, res) => {
  try {
    const today = todayISO();
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
    const today = todayISO();
    const weekStart = startOfWeek();
    const monthStart = startOfMonth();

    const [dayCount, weekCount, monthCount] = await Promise.all([
      db.countVisits(today),
      db.countVisitsRange(weekStart, today),
      db.countVisitsRange(monthStart, today)
    ]);

    res.json({ date: today, count: dayCount, week: weekCount, month: monthCount });
  } catch (err) {
    console.error('Erro ao consultar visitas:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
