const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { OAuth2Client } = require('google-auth-library');
const { signToken } = require('../middleware/auth');

const router = express.Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
let googleClient = null;
if (GOOGLE_CLIENT_ID) {
  googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
}

// Registro
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha, telefone, username } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    if (!senha || senha.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Nome de usuário é obrigatório' });
    }

    const usernameClean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (usernameClean.length < 3) {
      return res.status(400).json({ error: 'Nome de usuário deve ter pelo menos 3 caracteres (apenas letras, números e _)' });
    }

    const existing = db.userByEmail(email);

    const usernameTaken = existing
      ? db.allUsers().some(u => u.username === usernameClean && u.id !== existing.id)
      : db.allUsers().some(u => u.username === usernameClean);
    if (usernameTaken) {
      return res.status(400).json({ error: 'Este nome de usuário já está em uso' });
    }

    if (existing && existing.senha) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    let user;
    if (existing) {
      user = db.updateUser(existing.id, {
        nome, senha: senhaHash,
        telefone: telefone || existing.telefone || '',
        username: usernameClean,
        admin: existing.admin || false,
        role: existing.role || null
      });
    } else {
      user = db.createUser({
        id: Date.now(), nome, email, username: usernameClean,
        senha: senhaHash, telefone: telefone || '',
        admin: false, role: null,
        createdAt: new Date().toISOString()
      });
    }

    const token = signToken(user);
    res.json({
      success: true, token,
      user: { id: user.id, nome: user.nome, email: user.email, username: user.username, admin: user.admin, role: user.role || null }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = db.userByEmail(email);
    if (!user || !user.senha) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const token = signToken(user);
    res.json({
      success: true, token,
      user: { id: user.id, nome: user.nome, email: user.email, username: user.username || null, admin: user.admin, role: user.role || null }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Login com Google (só para contas já existentes)
router.post('/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Credencial do Google não fornecida' });
    if (!googleClient) return res.status(500).json({ error: 'Google OAuth não configurado' });

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    const user = db.userByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Conta não encontrada. Registre-se primeiro com Google na página de registro.' });
    }

    db.updateUser(user.id, { googleId: payload.sub, avatar: picture || user.avatar });
    const updated = db.userById(user.id);
    const token = signToken(updated);

    res.json({
      success: true, token,
      user: { id: updated.id, nome: updated.nome, email: updated.email, username: updated.username || null, admin: updated.admin, role: updated.role || null, avatar: updated.avatar }
    });
  } catch (error) {
    console.error('Erro no login com Google:', error);
    res.status(500).json({ error: 'Erro ao autenticar com Google' });
  }
});

// Registro com Google
router.post('/auth/google-register', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Credencial do Google não fornecida' });
    if (!googleClient) return res.status(500).json({ error: 'Google OAuth não configurado' });

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let existing = db.userByEmail(email);

    if (existing && existing.senha) {
      return res.status(400).json({ error: 'Email já cadastrado. Faça login com email e senha ou use o login do Google.' });
    }

    let user;
    if (existing) {
      user = db.updateUser(existing.id, {
        nome: name || existing.nome, googleId, avatar: picture || existing.avatar,
        telefone: existing.telefone || '', admin: existing.admin || false,
        role: existing.role || null
      });
    } else {
      user = db.createUser({
        id: Date.now(), nome: name || email.split('@')[0], email, googleId,
        avatar: picture || null, username: null, telefone: '',
        admin: false, role: null, createdAt: new Date().toISOString()
      });
    }

    const needsUsername = !user.username;
    const token = signToken(user);

    res.json({
      success: true, token, needsUsername,
      user: { id: user.id, nome: user.nome, email: user.email, username: user.username || null, admin: user.admin, role: user.role || null, avatar: user.avatar }
    });
  } catch (error) {
    console.error('Erro no registro com Google:', error);
    res.status(500).json({ error: 'Erro ao registrar com Google' });
  }
});

// Verificar autenticação
router.get('/auth/check', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.json({ authenticated: false });

  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'techvault-default-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.userById(decoded.id);
    if (!user) return res.json({ authenticated: false });

    res.json({
      authenticated: true,
      user: { id: user.id, nome: user.nome, email: user.email, username: user.username || null, admin: user.admin, role: user.role || null }
    });
  } catch {
    res.json({ authenticated: false });
  }
});

// Definir username
router.post('/user/set-username', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'techvault-default-secret-key';
    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Nome de usuário é obrigatório' });
    }

    const usernameClean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (usernameClean.length < 3) {
      return res.status(400).json({ error: 'Nome de usuário deve ter pelo menos 3 caracteres' });
    }

    const user = db.userById(decoded.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    if (db.allUsers().some(u => u.username === usernameClean && u.id !== decoded.id)) {
      return res.status(400).json({ error: 'Este nome de usuário já está em uso' });
    }

    db.updateUser(decoded.id, { username: usernameClean });
    const updated = db.userById(decoded.id);
    const newToken = signToken(updated);

    res.json({ success: true, username: usernameClean, token: newToken });
  } catch (error) {
    console.error('Erro ao definir username:', error);
    res.status(500).json({ error: 'Erro ao definir nome de usuário' });
  }
});

// Dados do usuário
router.get('/users/:id', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária' });

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'techvault-default-secret-key';
    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const user = db.userById(parseInt(req.params.id) || req.params.id);
    if (!user || user.id != decoded.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json({
      id: user.id, nome: user.nome, email: user.email,
      username: user.username || null, telefone: user.telefone || '',
      role: user.role || null, createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Erro ao carregar usuário:', error);
    res.status(500).json({ error: 'Erro ao carregar dados' });
  }
});

// Configurações públicas
router.get('/config', (req, res) => {
  res.json({
    googleClientId: GOOGLE_CLIENT_ID || '',
    picpay: {
      fee: 0.0099, taxRate: 0.06,
      pixKey: process.env.PIX_KEY || 'techvault@picpay.com',
      paymentMethod: 'PicPay PIX'
    }
  });
});

module.exports = router;
