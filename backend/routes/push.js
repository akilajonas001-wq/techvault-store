const express = require('express');
const webpush = require('web-push');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:techvault@example.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY || null });
});

router.post('/subscribe', authenticate, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  if (!req.user.admin && req.user.role !== 'admin' && req.user.role !== 'funcionario') {
    return res.status(403).json({ error: 'Apenas admin/funcionários' });
  }
  try {
    const { endpoint, p256dh, auth } = req.body;
    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ error: 'Subscription inválida' });
    }
    await db.savePushSubscription(req.user.id, { endpoint, p256dh, auth });
    res.json({ success: true });
  } catch (e) {
    console.error('Erro ao salvar subscription:', e);
    res.status(500).json({ error: 'Erro ao salvar subscription' });
  }
});

router.post('/unsubscribe', authenticate, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) await db.removePushSubscription(endpoint);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao remover subscription' });
  }
});

async function sendPushToAdmins(title, body, url) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
  const subscriptions = await db.pushSubscriptionsByRole('funcionario');
  const payload = JSON.stringify({ title, body, url, tag: 'techvault-novo-pedido' });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          await db.removePushSubscription(sub.endpoint);
        }
      }
    })
  );
  return results;
}

module.exports = { pushRouter: router, sendPushToAdmins };
