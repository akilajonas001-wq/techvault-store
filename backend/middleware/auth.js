const jwt = require('jsonwebtoken');
const db = require('../db');
const JWT_SECRET = process.env.JWT_SECRET || 'techvault-default-secret-key';

async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.userById(decoded.id);
    req.user = user || null;
    next();
  } catch {
    req.user = null;
    next();
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária' });
  }
  next();
}

async function adminAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Autenticação necessária' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.userById(decoded.id);
    if (!user || !user.admin) {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
    req.adminUser = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, admin: user.admin, role: user.role || null },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { authenticate, requireAuth, adminAuth, signToken };
