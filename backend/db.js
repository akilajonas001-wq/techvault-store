const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'store.db');

let db;

function getDb() {
  if (db) return db;
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

function initDb() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      nome TEXT DEFAULT '',
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE,
      senha TEXT,
      telefone TEXT DEFAULT '',
      admin INTEGER DEFAULT 0,
      role TEXT,
      googleId TEXT,
      avatar TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      nome TEXT NOT NULL DEFAULT '',
      descricao TEXT DEFAULT '',
      preco REAL DEFAULT 0,
      precoOriginal REAL,
      categoria TEXT DEFAULT '',
      imagem TEXT DEFAULT '',
      imagens TEXT DEFAULT '[]',
      estoque TEXT DEFAULT 'N/A',
      destaque INTEGER DEFAULT 0,
      paused INTEGER DEFAULT 0,
      precoAlterado INTEGER DEFAULT 0,
      avaliacao REAL DEFAULT 0,
      reviews INTEGER DEFAULT 0,
      specs TEXT DEFAULT '{}',
      variants TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      userId INTEGER,
      usuario TEXT DEFAULT '{}',
      endereco TEXT DEFAULT '{}',
      itens TEXT DEFAULT '[]',
      total REAL DEFAULT 0,
      totalOriginal REAL,
      cupom TEXT,
      cliente TEXT DEFAULT '{}',
      taxas TEXT DEFAULT '{}',
      pagamento TEXT DEFAULT 'PicPay PIX',
      status TEXT DEFAULT 'pendente',
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY,
      productId INTEGER NOT NULL,
      userId INTEGER,
      userName TEXT DEFAULT 'Anônimo',
      rating INTEGER DEFAULT 5,
      comment TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS carts (
      userId INTEGER PRIMARY KEY,
      items TEXT DEFAULT '[]',
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chats (
      key TEXT PRIMARY KEY,
      messages TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY,
      discount REAL DEFAULT 0,
      type TEXT DEFAULT 'percent',
      minValue REAL DEFAULT 0,
      userId INTEGER,
      userEmail TEXT,
      used INTEGER DEFAULT 0,
      usedBy INTEGER,
      usedAt TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      valid INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId INTEGER,
      type TEXT DEFAULT '',
      title TEXT DEFAULT '',
      message TEXT DEFAULT '',
      couponCode TEXT,
      read INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS newsletter (
      email TEXT PRIMARY KEY,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      userId INTEGER NOT NULL,
      productId INTEGER NOT NULL,
      PRIMARY KEY (userId, productId)
    );
  `);

  return database;
}

function migrateFromJson() {
  const database = getDb();
  const dataDir = path.join(__dirname, 'data');
  let migrated = false;

  const files = [
    { file: 'users.json', table: 'users', migrate: (row) => ({
      id: row.id, nome: row.nome, email: row.email, username: row.username || null,
      senha: row.senha, telefone: row.telefone || '',
      admin: row.admin ? 1 : 0, role: row.role || null,
      googleId: row.googleId || null, avatar: row.avatar || null,
      createdAt: row.createdAt || new Date().toISOString()
    })},
    { file: 'products.json', table: 'products', migrate: (row) => ({
      id: row.id, nome: row.nome, descricao: row.descricao || '',
      preco: row.preco || 0, precoOriginal: row.precoOriginal || null,
      categoria: row.categoria || '', imagem: row.imagem || '',
      imagens: JSON.stringify(row.imagens || []),
      estoque: row.estoque || 'N/A', destaque: row.destaque ? 1 : 0,
      paused: row.paused ? 1 : 0, precoAlterado: row.precoAlterado ? 1 : 0,
      avaliacao: row.avaliacao || 0, reviews: row.reviews || 0,
      specs: JSON.stringify(row.specs || {}),
      variants: JSON.stringify(row.variants || []),
      createdAt: row.createdAt || new Date().toISOString()
    })},
    { file: 'orders.json', table: 'orders', migrate: (row) => ({
      id: row.id, userId: row.userId || null,
      usuario: JSON.stringify(row.usuario || {}),
      endereco: JSON.stringify(row.endereco || {}),
      itens: JSON.stringify(row.itens || []),
      total: row.total || 0, totalOriginal: row.totalOriginal || null,
      cupom: row.cupom ? JSON.stringify(row.cupom) : null,
      cliente: JSON.stringify(row.cliente || {}),
      taxas: JSON.stringify(row.taxas || {}),
      pagamento: row.pagamento || 'PicPay PIX',
      status: row.status || 'pendente',
      createdAt: row.createdAt || new Date().toISOString()
    })},
    { file: 'comments.json', table: 'comments', migrate: (row) => ({
      id: row.id, productId: row.productId, userId: row.userId || null,
      userName: row.userName || 'Anônimo', rating: row.rating || 5,
      comment: row.comment, createdAt: row.createdAt || new Date().toISOString()
    })},
    { file: 'coupons.json', table: 'coupons', migrate: (row) => ({
      code: row.code, discount: row.discount || 0, type: row.type || 'percent',
      minValue: row.minValue || 0, userId: row.userId || null,
      userEmail: row.userEmail || null,
      used: row.used ? 1 : 0, usedBy: row.usedBy || null,
      usedAt: row.usedAt || null,
      createdAt: row.createdAt || new Date().toISOString(),
      valid: row.valid !== false ? 1 : 0
    })},
    { file: 'cart.json', table: 'carts', migrate: (rows, table) => {
      for (const [userId, data] of Object.entries(rows)) {
        const items = JSON.stringify(data.items || []);
        const updatedAt = data.updatedAt || new Date().toISOString();
        database.prepare(`INSERT OR IGNORE INTO carts (userId, items, updatedAt) VALUES (?, ?, ?)`).run(parseInt(userId), items, updatedAt);
      }
      return true;
    }},
    { file: 'chats.json', table: 'chats', migrate: (rows, table) => {
      for (const [key, messages] of Object.entries(rows)) {
        database.prepare(`INSERT OR IGNORE INTO chats (key, messages) VALUES (?, ?)`).run(key, JSON.stringify(messages));
      }
      return true;
    }},
    { file: 'notifications.json', table: 'notifications', migrate: (row) => ({
      id: row.id, userId: row.userId, type: row.type || '',
      title: row.title || '', message: row.message || '',
      couponCode: row.couponCode || null,
      read: row.read ? 1 : 0, createdAt: row.createdAt || new Date().toISOString()
    })},
    { file: 'newsletter.json', table: 'newsletter', migrate: (row) => ({
      email: row.email, createdAt: row.createdAt || new Date().toISOString()
    })},
    { file: 'wishlist.json', table: 'wishlist', migrate: (rows, table) => {
      for (const [userId, productIds] of Object.entries(rows)) {
        if (Array.isArray(productIds)) {
          const insert = database.prepare(`INSERT OR IGNORE INTO wishlist (userId, productId) VALUES (?, ?)`);
          for (const pid of productIds) insert.run(parseInt(userId), pid);
        }
      }
      return true;
    }}
  ];

  for (const { file, table, migrate } of files) {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) continue;
    const count = database.prepare(`SELECT COUNT(*) as c FROM ${table}`).get();
    if (count.c > 0) {
      console.log(`  ${table}: já migrado (${count.c} registros)`);
      continue;
    }
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);
      if (table === 'carts' || table === 'chats' || table === 'wishlist') {
        migrate(data, table);
      } else if (Array.isArray(data) && data.length > 0) {
        const insert = database.prepare(`INSERT INTO ${table} (${Object.keys(migrate(data[0])).join(',')}) VALUES (${Object.keys(migrate(data[0])).map(() => '?').join(',')})`);
        const insertMany = database.transaction((rows) => {
          for (const row of rows) insert.run(...Object.values(migrate(row)));
        });
        insertMany(data);
      }
      const countAfter = database.prepare(`SELECT COUNT(*) as c FROM ${table}`).get();
      console.log(`  ${table}: ${countAfter.c} registros migrados`);
      migrated = true;
    } catch (e) {
      console.error(`  ${table}: erro na migração - ${e.message}`);
    }
  }

  if (migrated) {
    database.prepare(`UPDATE users SET username = email WHERE username IS NULL`).run();
  }

  return migrated;
}

// === DATA ACCESS FUNCTIONS ===

function allUsers() {
  return getDb().prepare(`SELECT * FROM users`).all().map(u => ({
    ...u, admin: u.admin === 1
  }));
}

function userByEmail(email) {
  const u = getDb().prepare(`SELECT * FROM users WHERE email = ?`).get(email);
  return u ? { ...u, admin: u.admin === 1 } : null;
}

function userById(id) {
  const u = getDb().prepare(`SELECT * FROM users WHERE id = ?`).get(id);
  return u ? { ...u, admin: u.admin === 1 } : null;
}

function createUser(data) {
  const db = getDb();
  db.prepare(`INSERT INTO users (id, nome, email, username, senha, telefone, admin, role, googleId, avatar, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    data.id, data.nome || '', data.email, data.username || null,
    data.senha || null, data.telefone || '', data.admin ? 1 : 0,
    data.role || null, data.googleId || null, data.avatar || null,
    data.createdAt || new Date().toISOString()
  );
  return userById(data.id);
}

function updateUser(id, data) {
  const db = getDb();
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(data)) {
    if (key === 'admin') {
      fields.push('admin = ?'); values.push(val ? 1 : 0);
    } else if (key !== 'id') {
      fields.push(`${key} = ?`); values.push(val);
    }
  }
  if (fields.length === 0) return userById(id);
  values.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return userById(id);
}

function deleteUser(id) {
  getDb().prepare(`DELETE FROM users WHERE id = ?`).run(id);
}

function allProducts() {
  return getDb().prepare(`SELECT * FROM products`).all().map(p => ({
    ...p,
    imagens: JSON.parse(p.imagens || '[]'),
    specs: JSON.parse(p.specs || '{}'),
    variants: JSON.parse(p.variants || '[]'),
    paused: p.paused === 1,
    precoAlterado: p.precoAlterado === 1,
    destaque: p.destaque === 1
  }));
}

function productById(id) {
  const p = getDb().prepare(`SELECT * FROM products WHERE id = ?`).get(id);
  if (!p) return null;
  return {
    ...p,
    imagens: JSON.parse(p.imagens || '[]'),
    specs: JSON.parse(p.specs || '{}'),
    variants: JSON.parse(p.variants || '[]'),
    paused: p.paused === 1,
    precoAlterado: p.precoAlterado === 1,
    destaque: p.destaque === 1
  };
}

function updateProduct(id, data) {
  const db = getDb();
  const fields = []; const values = [];
  for (const [key, val] of Object.entries(data)) {
    if (key === 'id') continue;
    if (key === 'imagens' || key === 'specs' || key === 'variants') {
      fields.push(`${key} = ?`); values.push(JSON.stringify(val));
    } else if (key === 'paused' || key === 'precoAlterado' || key === 'destaque') {
      fields.push(`${key} = ?`); values.push(val ? 1 : 0);
    } else {
      fields.push(`${key} = ?`); values.push(val);
    }
  }
  if (fields.length === 0) return productById(id);
  values.push(id);
  db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return productById(id);
}

function allOrders() {
  return getDb().prepare(`SELECT * FROM orders ORDER BY createdAt DESC`).all().map(o => ({
    ...o,
    usuario: JSON.parse(o.usuario || '{}'),
    endereco: JSON.parse(o.endereco || '{}'),
    itens: JSON.parse(o.itens || '[]'),
    cupom: o.cupom ? JSON.parse(o.cupom) : null,
    cliente: JSON.parse(o.cliente || '{}'),
    taxas: JSON.parse(o.taxas || '{}')
  }));
}

function ordersByUserId(userId) {
  return getDb().prepare(`SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC`).all(userId).map(o => ({
    ...o,
    usuario: JSON.parse(o.usuario || '{}'),
    endereco: JSON.parse(o.endereco || '{}'),
    itens: JSON.parse(o.itens || '[]'),
    cupom: o.cupom ? JSON.parse(o.cupom) : null,
    cliente: JSON.parse(o.cliente || '{}'),
    taxas: JSON.parse(o.taxas || '{}')
  }));
}

function createOrder(data) {
  const db = getDb();
  db.prepare(`INSERT INTO orders (id, userId, usuario, endereco, itens, total, totalOriginal, cupom, cliente, taxas, pagamento, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    data.id, data.userId, JSON.stringify(data.usuario || {}),
    JSON.stringify(data.endereco || {}), JSON.stringify(data.itens || []),
    data.total || 0, data.totalOriginal || null,
    data.cupom ? JSON.stringify(data.cupom) : null,
    JSON.stringify(data.cliente || {}), JSON.stringify(data.taxas || {}),
    data.pagamento || 'PicPay PIX', data.status || 'aprovado',
    data.createdAt || new Date().toISOString()
  );
  return db.prepare(`SELECT * FROM orders WHERE id = ?`).get(data.id);
}

function updateOrderStatus(id, status) {
  getDb().prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(status, id);
}

function allComments(productId) {
  if (productId) return getDb().prepare(`SELECT * FROM comments WHERE productId = ? ORDER BY createdAt DESC`).all(productId);
  return getDb().prepare(`SELECT * FROM comments ORDER BY createdAt DESC`).all();
}

function createComment(data) {
  const db = getDb();
  db.prepare(`INSERT INTO comments (id, productId, userId, userName, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    data.id, data.productId, data.userId || null,
    data.userName || 'Anônimo', data.rating || 5,
    data.comment, data.createdAt || new Date().toISOString()
  );
  return db.prepare(`SELECT * FROM comments WHERE id = ?`).get(data.id);
}

function deleteComment(id) {
  getDb().prepare(`DELETE FROM comments WHERE id = ?`).run(id);
}

function getCart(userId) {
  const c = getDb().prepare(`SELECT * FROM carts WHERE userId = ?`).get(userId);
  return c ? { userId: c.userId, items: JSON.parse(c.items || '[]'), updatedAt: c.updatedAt } : { userId, items: [] };
}

function saveCart(userId, items) {
  getDb().prepare(`INSERT OR REPLACE INTO carts (userId, items, updatedAt) VALUES (?, ?, ?)`).run(userId, JSON.stringify(items), new Date().toISOString());
}

function clearCart(userId) {
  getDb().prepare(`DELETE FROM carts WHERE userId = ?`).run(userId);
}

function allCartsWithUsers() {
  const db = getDb();
  const carts = db.prepare(`SELECT * FROM carts`).all();
  const result = [];
  for (const c of carts) {
    const items = JSON.parse(c.items || '[]');
    if (items.length === 0) continue;
    const user = userById(c.userId);
    result.push({
      userId: c.userId,
      userName: user ? user.nome : 'Usuário #' + c.userId,
      userEmail: user ? user.email : '',
      items,
      itemCount: items.reduce((s, i) => s + (i.quantidade || 1), 0),
      updatedAt: c.updatedAt
    });
  }
  return result;
}

function getChatMessages(key) {
  const c = getDb().prepare(`SELECT * FROM chats WHERE key = ?`).get(key);
  return c ? JSON.parse(c.messages || '[]') : [];
}

function saveChatMessages(key, messages) {
  getDb().prepare(`INSERT OR REPLACE INTO chats (key, messages) VALUES (?, ?)`).run(key, JSON.stringify(messages));
}

function deleteChat(key) {
  getDb().prepare(`DELETE FROM chats WHERE key = ?`).run(key);
}

function allChats() {
  const rows = getDb().prepare(`SELECT * FROM chats`).all();
  const result = {};
  for (const r of rows) {
    result[r.key] = JSON.parse(r.messages || '[]');
  }
  return result;
}

function allCoupons() {
  return getDb().prepare(`SELECT * FROM coupons`).all().map(c => ({
    ...c, used: c.used === 1, valid: c.valid === 1
  }));
}

function couponByCode(code) {
  const c = getDb().prepare(`SELECT * FROM coupons WHERE code = ?`).get(code);
  return c ? { ...c, used: c.used === 1, valid: c.valid === 1 } : null;
}

function createCoupon(data) {
  const db = getDb();
  db.prepare(`INSERT INTO coupons (code, discount, type, minValue, userId, userEmail, createdAt, valid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    data.code.toUpperCase(), data.discount || 0, data.type || 'percent',
    data.minValue || 0, data.userId || null, data.userEmail || null,
    data.createdAt || new Date().toISOString(), data.valid !== false ? 1 : 0
  );
  return couponByCode(data.code.toUpperCase());
}

function useCoupon(code, userId) {
  const db = getDb();
  db.prepare(`UPDATE coupons SET used = 1, usedBy = ?, usedAt = ? WHERE code = ?`).run(userId, new Date().toISOString(), code);
}

function userCoupons(userId, email) {
  return getDb().prepare(`SELECT * FROM coupons WHERE (userId = ? OR userEmail = ?) AND used = 0 ORDER BY createdAt DESC`).all(userId, email).map(c => ({
    ...c, used: c.used === 1, valid: c.valid === 1
  }));
}

function allNotifications() {
  return getDb().prepare(`SELECT * FROM notifications ORDER BY createdAt DESC`).all().map(n => ({
    ...n, read: n.read === 1
  }));
}

function userNotifications(userId) {
  return getDb().prepare(`SELECT * FROM notifications WHERE userId = ? AND read = 0 ORDER BY createdAt DESC`).all(userId).map(n => ({
    ...n, read: n.read === 1
  }));
}

function createNotification(data) {
  getDb().prepare(`INSERT INTO notifications (id, userId, type, title, message, couponCode, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    data.id, data.userId, data.type || '', data.title || '',
    data.message || '', data.couponCode || null,
    data.createdAt || new Date().toISOString()
  );
}

function markNotificationRead(id) {
  getDb().prepare(`UPDATE notifications SET read = 1 WHERE id = ?`).run(id);
}

function allNewsletters() {
  return getDb().prepare(`SELECT * FROM newsletter`).all();
}

function subscribeNewsletter(email) {
  getDb().prepare(`INSERT OR IGNORE INTO newsletter (email, createdAt) VALUES (?, ?)`).run(email, new Date().toISOString());
}

function isNewsletterSubscribed(email) {
  return !!getDb().prepare(`SELECT 1 FROM newsletter WHERE email = ?`).get(email);
}

function getWishlist(userId) {
  const rows = getDb().prepare(`SELECT productId FROM wishlist WHERE userId = ?`).all(userId);
  return rows.map(r => r.productId);
}

function toggleWishlist(userId, productId) {
  const db = getDb();
  const existing = db.prepare(`SELECT 1 FROM wishlist WHERE userId = ? AND productId = ?`).get(userId, productId);
  if (existing) {
    db.prepare(`DELETE FROM wishlist WHERE userId = ? AND productId = ?`).run(userId, productId);
    return false;
  } else {
    db.prepare(`INSERT INTO wishlist (userId, productId) VALUES (?, ?)`).run(userId, productId);
    return true;
  }
}

function getCategories() {
  return getDb().prepare(`SELECT DISTINCT categoria FROM products WHERE paused = 0 AND categoria != '' ORDER BY categoria`).all().map(r => r.categoria);
}

function searchProducts(query) {
  const term = `%${query}%`;
  return getDb().prepare(`SELECT * FROM products WHERE paused = 0 AND (nome LIKE ? OR descricao LIKE ? OR categoria LIKE ?)`).all(term, term, term).map(p => ({
    ...p,
    imagens: JSON.parse(p.imagens || '[]'),
    specs: JSON.parse(p.specs || '{}'),
    variants: JSON.parse(p.variants || '[]'),
    paused: false, precoAlterado: p.precoAlterado === 1, destaque: p.destaque === 1
  }));
}

function productsByCategory(categoria) {
  return getDb().prepare(`SELECT * FROM products WHERE paused = 0 AND categoria = ?`).all(categoria).map(p => ({
    ...p,
    imagens: JSON.parse(p.imagens || '[]'),
    specs: JSON.parse(p.specs || '{}'),
    variants: JSON.parse(p.variants || '[]'),
    paused: false, precoAlterado: p.precoAlterado === 1, destaque: p.destaque === 1
  }));
}

function featuredProducts(limit = 12) {
  return getDb().prepare(`SELECT * FROM products WHERE paused = 0 AND destaque = 1 LIMIT ?`).all(limit).map(p => ({
    ...p,
    imagens: JSON.parse(p.imagens || '[]'),
    specs: JSON.parse(p.specs || '{}'),
    variants: JSON.parse(p.variants || '[]'),
    paused: false, precoAlterado: p.precoAlterado === 1, destaque: true
  }));
}

function offerProducts(limit = 10) {
  return getDb().prepare(`SELECT * FROM products WHERE paused = 0 AND preco < 200 LIMIT ?`).all(limit).map(p => ({
    ...p,
    imagens: JSON.parse(p.imagens || '[]'),
    specs: JSON.parse(p.specs || '{}'),
    variants: JSON.parse(p.variants || '[]'),
    paused: false, precoAlterado: p.precoAlterado === 1, destaque: p.destaque === 1
  }));
}

function adminProducts(search, pausedFilter) {
  let sql = `SELECT id, nome, categoria, preco, precoOriginal, paused, precoAlterado, imagem, estoque FROM products WHERE 1=1`;
  const params = [];
  if (search) { sql += ` AND (nome LIKE ? OR categoria LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`); }
  if (pausedFilter === 'true') { sql += ` AND paused = 1`; }
  else if (pausedFilter === 'false') { sql += ` AND paused = 0`; }
  return getDb().prepare(sql).all(...params).map(p => ({
    ...p, paused: p.paused === 1, precoAlterado: p.precoAlterado === 1,
    modified: p.paused === 1 || p.precoAlterado === 1
  }));
}

function adminStaff() {
  return getDb().prepare(`SELECT id, nome, email, telefone, role, admin FROM users WHERE admin = 1 OR (role IS NOT NULL AND role != 'cliente')`).all().map(u => ({
    ...u, admin: u.admin === 1
  }));
}

function initDefaultData() {
  const db = getDb();
  const userCount = db.prepare(`SELECT COUNT(*) as c FROM users`).get().c;
  if (userCount === 0) {
    console.log('Inicializando dados padrão...');
    const bcrypt = require('bcryptjs');
    const passHash = '$2a$10$BMLdT4/ABI9YY0raSzKJYuj6Q9RGofoZ3AdB9gcTsSuzzyn9M/8F2';
    const defaultUsers = [
      { id: Date.now() + 1, nome: 'Akila Jonas', email: 'akilajonas001@gmail.com', username: 'akilajonas', senha: passHash, telefone: '', admin: true, role: 'admin' },
      { id: Date.now() + 2, nome: 'Kauanne Lopes da Silva', email: 'kkauanne80kau@gmail.com', username: 'kkauanne80kau', senha: passHash, telefone: '81999188978', admin: true, role: 'admin' }
    ];
    for (const u of defaultUsers) {
      createUser(u);
    }
    console.log('  Usuários padrão criados (senha: 123456)');
  }
}

function closeDb() {
  if (db) { db.close(); db = null; }
}

function createProduct(data) {
  const db = getDb();
  db.prepare(`INSERT INTO products (id, nome, descricao, preco, precoOriginal, categoria, imagem, imagens, estoque, destaque, avaliacao, reviews, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    data.id, data.nome, data.descricao || '', data.preco || 0, data.precoOriginal || null,
    data.categoria || '', data.imagem || '', JSON.stringify(data.imagens || []),
    data.estoque || 'N/A', data.destaque ? 1 : 0, data.avaliacao || 0,
    data.reviews || 0, data.createdAt || new Date().toISOString()
  );
  return productById(data.id);
}

function deleteProduct(id) {
  getDb().prepare(`DELETE FROM products WHERE id = ?`).run(id);
}

module.exports = {
  initDb, migrateFromJson, initDefaultData, closeDb,
  allUsers, userByEmail, userById, createUser, updateUser, deleteUser,
  allProducts, productById, updateProduct, createProduct, deleteProduct,
  allOrders, ordersByUserId, createOrder, updateOrderStatus,
  allComments, createComment, deleteComment,
  getCart, saveCart, clearCart, allCartsWithUsers,
  getChatMessages, saveChatMessages, deleteChat, allChats,
  allCoupons, couponByCode, createCoupon, useCoupon, userCoupons,
  allNotifications, userNotifications, createNotification, markNotificationRead,
  allNewsletters, subscribeNewsletter, isNewsletterSubscribed,
  getWishlist, toggleWishlist,
  getCategories, searchProducts, productsByCategory, featuredProducts, offerProducts,
  adminProducts, adminStaff
};
