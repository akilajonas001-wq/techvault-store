const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL não configurada. Defina a variável de ambiente DATABASE_URL.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000, ssl: { rejectUnauthorized: false } });

pool.on('error', (err) => console.error('Erro inesperado no pool do banco:', err));

async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY,
      nome TEXT DEFAULT '',
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE,
      senha TEXT,
      telefone TEXT DEFAULT '',
      admin SMALLINT DEFAULT 0,
      role TEXT,
      googleId TEXT,
      avatar TEXT,
      cep TEXT DEFAULT '',
      logradouro TEXT DEFAULT '',
      numero TEXT DEFAULT '',
      complemento TEXT DEFAULT '',
      bairro TEXT DEFAULT '',
      cidade TEXT DEFAULT '',
      estado TEXT DEFAULT '',
      createdAt TEXT DEFAULT (NOW())
    );
    CREATE TABLE IF NOT EXISTS products (
      id BIGINT PRIMARY KEY,
      nome TEXT NOT NULL DEFAULT '',
      descricao TEXT DEFAULT '',
      preco DOUBLE PRECISION DEFAULT 0,
      precoOriginal DOUBLE PRECISION,
      categoria TEXT DEFAULT '',
      imagem TEXT DEFAULT '',
      imagens TEXT DEFAULT '[]',
      estoque TEXT DEFAULT 'N/A',
      destaque SMALLINT DEFAULT 0,
      paused SMALLINT DEFAULT 0,
      precoAlterado SMALLINT DEFAULT 0,
      avaliacao DOUBLE PRECISION DEFAULT 0,
      reviews INTEGER DEFAULT 0,
      specs TEXT DEFAULT '{}',
      variants TEXT DEFAULT '[]',
      frete TEXT DEFAULT '',
      createdAt TEXT DEFAULT (NOW())
    );
    CREATE TABLE IF NOT EXISTS orders (
      id BIGINT PRIMARY KEY,
      userId BIGINT,
      usuario TEXT DEFAULT '{}',
      endereco TEXT DEFAULT '{}',
      itens TEXT DEFAULT '[]',
      total DOUBLE PRECISION DEFAULT 0,
      totalOriginal DOUBLE PRECISION,
      cupom TEXT,
      cliente TEXT DEFAULT '{}',
      taxas TEXT DEFAULT '{}',
      pagamento TEXT DEFAULT 'PicPay PIX',
      status TEXT DEFAULT 'pendente',
      createdAt TEXT DEFAULT (NOW())
    );
    CREATE TABLE IF NOT EXISTS comments (
      id BIGINT PRIMARY KEY,
      productId BIGINT NOT NULL,
      userId BIGINT,
      userName TEXT DEFAULT 'Anônimo',
      rating INTEGER DEFAULT 5,
      comment TEXT NOT NULL,
      createdAt TEXT DEFAULT (NOW())
    );
    CREATE TABLE IF NOT EXISTS carts (
      userId BIGINT PRIMARY KEY,
      items TEXT DEFAULT '[]',
      updatedAt TEXT DEFAULT (NOW())
    );
    CREATE TABLE IF NOT EXISTS chats (
      key TEXT PRIMARY KEY,
      messages TEXT DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY,
      discount DOUBLE PRECISION DEFAULT 0,
      type TEXT DEFAULT 'percent',
      minValue DOUBLE PRECISION DEFAULT 0,
      userId BIGINT,
      userEmail TEXT,
      used SMALLINT DEFAULT 0,
      usedBy BIGINT,
      usedAt TEXT,
      createdAt TEXT DEFAULT (NOW()),
      valid SMALLINT DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId BIGINT,
      type TEXT DEFAULT '',
      title TEXT DEFAULT '',
      message TEXT DEFAULT '',
      couponCode TEXT,
      read SMALLINT DEFAULT 0,
      createdAt TEXT DEFAULT (NOW())
    );
    CREATE TABLE IF NOT EXISTS newsletter (
      email TEXT PRIMARY KEY,
      createdAt TEXT DEFAULT (NOW())
    );
    CREATE TABLE IF NOT EXISTS wishlist (
      userId BIGINT NOT NULL,
      productId BIGINT NOT NULL,
      PRIMARY KEY (userId, productId)
    );
    CREATE TABLE IF NOT EXISTS product_images (
      id SERIAL PRIMARY KEY,
      product_id BIGINT,
      filename TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      data BYTEA NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await migrateUserProfileColumns();
}

async function migrateUserProfileColumns() {
  const missingColumns = ['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado'];
  for (const col of missingColumns) {
    try {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col} TEXT DEFAULT ''`);
    } catch (e) {
      console.error(`Erro ao adicionar coluna ${col}:`, e.message);
    }
  }
  try {
    await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS frete TEXT DEFAULT ''`);
  } catch (e) {
    console.error('Erro ao adicionar frete:', e.message);
  }
}

async function migrateFromJson() {
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
      variants: JSON.stringify(row.variants || row.variantes || []),
      frete: row.frete || '',
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
    { file: 'cart.json', table: 'carts', migrate: async (rows) => {
      for (const [userId, data] of Object.entries(rows)) {
        const items = JSON.stringify(data.items || []);
        const updatedAt = data.updatedAt || new Date().toISOString();
        await query(`INSERT INTO carts (userId, items, updatedAt) VALUES ($1, $2, $3) ON CONFLICT (userId) DO NOTHING`, [parseInt(userId), items, updatedAt]);
      }
    }},
    { file: 'chats.json', table: 'chats', migrate: async (rows) => {
      for (const [key, messages] of Object.entries(rows)) {
        await query(`INSERT INTO chats (key, messages) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`, [key, JSON.stringify(messages)]);
      }
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
    { file: 'wishlist.json', table: 'wishlist', migrate: async (rows) => {
      for (const [userId, productIds] of Object.entries(rows)) {
        if (Array.isArray(productIds)) {
          for (const pid of productIds) {
            await query(`INSERT INTO wishlist (userId, productId) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [parseInt(userId), pid]);
          }
        }
      }
    }}
  ];

  for (const { file, table, migrate } of files) {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) continue;
    const countResult = await query(`SELECT COUNT(*) as c FROM ${table}`);
    if (parseInt(countResult.rows[0].c) > 0) {
      console.log(`  ${table}: já migrado (${countResult.rows[0].c} registros)`);
      continue;
    }
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);

      if (table === 'carts' || table === 'chats' || table === 'wishlist') {
        await migrate(data);
      } else if (Array.isArray(data) && data.length > 0) {
        const first = migrate(data[0]);
        const keys = Object.keys(first);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
        const cols = keys.join(',');
        const insertSQL = `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        for (const row of data) {
          const vals = Object.values(migrate(row));
          await query(insertSQL, vals);
        }
      }
      const countAfter = await query(`SELECT COUNT(*) as c FROM ${table}`);
      console.log(`  ${table}: ${countAfter.rows[0].c} registros migrados`);
      migrated = true;
    } catch (e) {
      console.error(`  ${table}: erro na migração - ${e.message}`);
    }
  }

  if (migrated) {
    await query(`UPDATE users SET username = email WHERE username IS NULL`);
  }

  return migrated;
}

// === DATA ACCESS FUNCTIONS ===

const mapUser = (u) => u ? { ...u, admin: u.admin === 1 || u.admin === true } : null;

async function allUsers() {
  const result = await query(`SELECT * FROM users`);
  return result.rows.map(mapUser);
}

async function userByEmail(email) {
  const result = await query(`SELECT * FROM users WHERE email = $1`, [email]);
  return result.rows.length ? mapUser(result.rows[0]) : null;
}

async function userById(id) {
  const result = await query(`SELECT * FROM users WHERE id = $1`, [id]);
  return result.rows.length ? mapUser(result.rows[0]) : null;
}

async function createUser(data) {
  await query(
    `INSERT INTO users (id, nome, email, username, senha, telefone, admin, role, googleId, avatar, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [data.id, data.nome || '', data.email, data.username || null,
     data.senha || null, data.telefone || '', data.admin ? 1 : 0,
     data.role || null, data.googleId || null, data.avatar || null,
     data.createdAt || new Date().toISOString()]
  );
  return userById(data.id);
}

async function updateUser(id, data) {
  const fields = [];
  const values = [];
  let idx = 1;
  for (const [key, val] of Object.entries(data)) {
    if (key === 'admin') {
      fields.push(`admin = $${idx++}`); values.push(val ? 1 : 0);
    } else if (key !== 'id') {
      fields.push(`${key} = $${idx++}`); values.push(val);
    }
  }
  if (fields.length === 0) return userById(id);
  values.push(id);
  await query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`, values);
  return userById(id);
}

async function getUserProfile(id) {
  const result = await query(
    `SELECT id, nome, email, username, telefone, role, admin, cep, logradouro, numero, complemento, bairro, cidade, estado, createdAt FROM users WHERE id = $1`,
    [id]
  );
  return result.rows.length ? {
    ...result.rows[0],
    admin: result.rows[0].admin === 1 || result.rows[0].admin === true
  } : null;
}

async function updateUserProfile(id, data) {
  const fields = [];
  const values = [];
  let idx = 1;
  const allowed = ['nome', 'telefone', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado'];
  for (const [key, val] of Object.entries(data)) {
    if (allowed.includes(key)) {
      fields.push(`${key} = $${idx++}`);
      values.push(val === undefined || val === null ? '' : val);
    }
  }
  if (fields.length === 0) return getUserProfile(id);
  values.push(id);
  await query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`, values);
  return getUserProfile(id);
}

async function deleteUser(id) {
  await query(`DELETE FROM users WHERE id = $1`, [id]);
}

const parseProduct = (p) => p ? {
  ...p,
  imagens: JSON.parse(p.imagens || '[]'),
  specs: JSON.parse(p.specs || '{}'),
  variants: JSON.parse(p.variants || '[]'),
  especificacoes: JSON.parse(p.specs || '{}'),
  variantes: JSON.parse(p.variants || '[]'),
  frete: p.frete || '',
  paused: p.paused === 1 || p.paused === true,
  precoAlterado: p.precoAlterado === 1 || p.precoAlterado === true,
  destaque: p.destaque === 1 || p.destaque === true
} : null;

async function allProducts() {
  const result = await query(`SELECT * FROM products`);
  return result.rows.map(parseProduct);
}

async function productById(id) {
  const result = await query(`SELECT * FROM products WHERE id = $1`, [id]);
  return result.rows.length ? parseProduct(result.rows[0]) : null;
}

async function updateProduct(id, data) {
  const fields = []; const values = [];
  let idx = 1;
  for (const [key, val] of Object.entries(data)) {
    if (key === 'id') continue;
    if (key === 'imagens' || key === 'specs' || key === 'variants') {
      fields.push(`${key} = $${idx++}`); values.push(JSON.stringify(val));
    } else if (key === 'paused' || key === 'precoAlterado' || key === 'destaque') {
      fields.push(`${key} = $${idx++}`); values.push(val ? 1 : 0);
    } else {
      fields.push(`${key} = $${idx++}`); values.push(val);
    }
  }
  if (fields.length === 0) return productById(id);
  values.push(id);
  await query(`UPDATE products SET ${fields.join(', ')} WHERE id = $${idx}`, values);
  return productById(id);
}

async function createProduct(data) {
  await query(
    `INSERT INTO products (id, nome, descricao, preco, precoOriginal, categoria, imagem, imagens, estoque, destaque, avaliacao, reviews, specs, variants, frete, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
    [data.id, data.nome, data.descricao || '', data.preco || 0, data.precoOriginal || null,
     data.categoria || '', data.imagem || '', JSON.stringify(data.imagens || []),
     data.estoque || 'N/A', data.destaque ? 1 : 0, data.avaliacao || 0,
     data.reviews || 0, JSON.stringify(data.specs || {}), JSON.stringify(data.variants || []),
     data.frete || '',
     data.createdAt || new Date().toISOString()]
  );
  return productById(data.id);
}

async function deleteProduct(id) {
  await query(`DELETE FROM products WHERE id = $1`, [id]);
}

const parseOrder = (o) => o ? {
  ...o,
  id: o.id,
  userId: o.userid,
  totalOriginal: o.totaloriginal,
  createdAt: o.createdat || o.createdAt,
  usuario: JSON.parse(o.usuario || '{}'),
  endereco: JSON.parse(o.endereco || '{}'),
  itens: JSON.parse(o.itens || '[]'),
  cupom: o.cupom ? JSON.parse(o.cupom) : null,
  cliente: JSON.parse(o.cliente || '{}'),
  taxas: JSON.parse(o.taxas || '{}')
} : null;

async function allOrders() {
  const result = await query(`SELECT * FROM orders ORDER BY createdAt DESC`);
  return result.rows.map(parseOrder);
}

async function orderById(id) {
  const result = await query(`SELECT * FROM orders WHERE id = $1`, [id]);
  return result.rows.length ? parseOrder(result.rows[0]) : null;
}

async function ordersByUserId(userId) {
  const result = await query(`SELECT * FROM orders WHERE userId = $1 ORDER BY createdAt DESC`, [userId]);
  return result.rows.map(parseOrder);
}

async function createOrder(data) {
  await query(
    `INSERT INTO orders (id, userId, usuario, endereco, itens, total, totalOriginal, cupom, cliente, taxas, pagamento, status, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [data.id, data.userId, JSON.stringify(data.usuario || {}),
     JSON.stringify(data.endereco || {}), JSON.stringify(data.itens || []),
     data.total || 0, data.totalOriginal || null,
     data.cupom ? JSON.stringify(data.cupom) : null,
     JSON.stringify(data.cliente || {}), JSON.stringify(data.taxas || {}),
     data.pagamento || 'PicPay PIX', data.status || 'aprovado',
     data.createdAt || new Date().toISOString()]
  );
  const result = await query(`SELECT * FROM orders WHERE id = $1`, [data.id]);
  return result.rows.length ? parseOrder(result.rows[0]) : null;
}

async function updateOrderStatus(id, status) {
  await query(`UPDATE orders SET status = $1 WHERE id = $2`, [status, id]);
}

async function clearAllOrders() {
  await query(`DELETE FROM orders`);
}

async function allComments(productId) {
  if (productId) {
    const result = await query(`SELECT * FROM comments WHERE productId = $1 ORDER BY createdAt DESC`, [productId]);
    return result.rows;
  }
  const result = await query(`SELECT * FROM comments ORDER BY createdAt DESC`);
  return result.rows;
}

async function createComment(data) {
  await query(
    `INSERT INTO comments (id, productId, userId, userName, rating, comment, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [data.id, data.productId, data.userId || null,
     data.userName || 'Anônimo', data.rating || 5,
     data.comment, data.createdAt || new Date().toISOString()]
  );
  const result = await query(`SELECT * FROM comments WHERE id = $1`, [data.id]);
  return result.rows.length ? result.rows[0] : null;
}

async function deleteComment(id) {
  await query(`DELETE FROM comments WHERE id = $1`, [id]);
}

async function getCart(userId) {
  const result = await query(`SELECT * FROM carts WHERE userId = $1`, [userId]);
  if (result.rows.length) {
    const c = result.rows[0];
    return { userId: c.userId, items: JSON.parse(c.items || '[]'), updatedAt: c.updatedAt };
  }
  return { userId, items: [] };
}

async function saveCart(userId, items) {
  await query(
    `INSERT INTO carts (userId, items, updatedAt) VALUES ($1, $2, $3) ON CONFLICT (userId) DO UPDATE SET items = $2, updatedAt = $3`,
    [userId, JSON.stringify(items), new Date().toISOString()]
  );
}

async function clearCart(userId) {
  await query(`DELETE FROM carts WHERE userId = $1`, [userId]);
}

async function allCartsWithUsers() {
  const cartsResult = await query(`SELECT * FROM carts`);
  const result = [];
  for (const c of cartsResult.rows) {
    const items = JSON.parse(c.items || '[]');
    if (items.length === 0) continue;
    const user = await userById(c.userId);
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

async function getChatMessages(key) {
  const result = await query(`SELECT * FROM chats WHERE key = $1`, [key]);
  return result.rows.length ? JSON.parse(result.rows[0].messages || '[]') : [];
}

async function saveChatMessages(key, messages) {
  await query(
    `INSERT INTO chats (key, messages) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET messages = $2`,
    [key, JSON.stringify(messages)]
  );
}

async function deleteChat(key) {
  await query(`DELETE FROM chats WHERE key = $1`, [key]);
}

async function allChats() {
  const result = await query(`SELECT * FROM chats`);
  const output = {};
  for (const r of result.rows) {
    output[r.key] = JSON.parse(r.messages || '[]');
  }
  return output;
}

const parseCoupon = (c) => c ? { ...c, used: c.used === 1 || c.used === true, valid: c.valid === 1 || c.valid === true } : null;

async function allCoupons() {
  const result = await query(`SELECT * FROM coupons`);
  return result.rows.map(parseCoupon);
}

async function couponByCode(code) {
  const result = await query(`SELECT * FROM coupons WHERE code = $1`, [code]);
  return result.rows.length ? parseCoupon(result.rows[0]) : null;
}

async function createCoupon(data) {
  await query(
    `INSERT INTO coupons (code, discount, type, minValue, userId, userEmail, createdAt, valid) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [data.code.toUpperCase(), data.discount || 0, data.type || 'percent',
     data.minValue || 0, data.userId || null, data.userEmail || null,
     data.createdAt || new Date().toISOString(), data.valid !== false ? 1 : 0]
  );
  return couponByCode(data.code.toUpperCase());
}

async function useCoupon(code, userId) {
  await query(`UPDATE coupons SET used = 1, usedBy = $1, usedAt = $2 WHERE code = $3`, [userId, new Date().toISOString(), code]);
}

async function userCoupons(userId, email) {
  const result = await query(`SELECT * FROM coupons WHERE (userId = $1 OR userEmail = $2) AND used = 0 ORDER BY createdAt DESC`, [userId, email]);
  return result.rows.map(parseCoupon);
}

async function allNotifications() {
  const result = await query(`SELECT * FROM notifications ORDER BY createdAt DESC`);
  return result.rows.map(n => ({ ...n, read: n.read === 1 || n.read === true }));
}

async function userNotifications(userId) {
  const result = await query(`SELECT * FROM notifications WHERE userId = $1 AND read = 0 ORDER BY createdAt DESC`, [userId]);
  return result.rows.map(n => ({ ...n, read: false }));
}

async function createNotification(data) {
  await query(
    `INSERT INTO notifications (id, userId, type, title, message, couponCode, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [data.id, data.userId, data.type || '', data.title || '',
     data.message || '', data.couponCode || null,
     data.createdAt || new Date().toISOString()]
  );
}

async function markNotificationRead(id) {
  await query(`UPDATE notifications SET read = 1 WHERE id = $1`, [id]);
}

async function allNewsletters() {
  const result = await query(`SELECT u.id, u.nome, u.email, u.createdAt FROM users u ORDER BY u.createdAt DESC`);
  return result.rows;
}

async function subscribeNewsletter(email) {
  await query(`INSERT INTO newsletter (email, createdAt) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING`, [email, new Date().toISOString()]);
}

async function isNewsletterSubscribed(email) {
  const result = await query(`SELECT 1 as e FROM newsletter WHERE email = $1`, [email]);
  return result.rows.length > 0;
}

async function getWishlist(userId) {
  const result = await query(`SELECT productId FROM wishlist WHERE userId = $1`, [userId]);
  return result.rows.map(r => r.productid);
}

async function toggleWishlist(userId, productId) {
  const existing = await query(`SELECT 1 FROM wishlist WHERE userId = $1 AND productId = $2`, [userId, productId]);
  if (existing.rows.length > 0) {
    await query(`DELETE FROM wishlist WHERE userId = $1 AND productId = $2`, [userId, productId]);
    return false;
  } else {
    await query(`INSERT INTO wishlist (userId, productId) VALUES ($1, $2)`, [userId, productId]);
    return true;
  }
}

async function getCategories() {
  const result = await query(`SELECT DISTINCT categoria FROM products WHERE paused = 0 AND categoria != '' ORDER BY categoria`);
  return result.rows.map(r => r.categoria);
}

async function searchProducts(queryTerm) {
  const term = `%${queryTerm}%`;
  const result = await query(`SELECT * FROM products WHERE paused = 0 AND (nome ILIKE $1 OR descricao ILIKE $2 OR categoria ILIKE $3)`, [term, term, term]);
  return result.rows.map(parseProduct);
}

async function productsByCategory(categoria) {
  const result = await query(`SELECT * FROM products WHERE paused = 0 AND categoria = $1`, [categoria]);
  return result.rows.map(parseProduct);
}

async function featuredProducts(limit = 12) {
  const result = await query(`SELECT * FROM products WHERE paused = 0 AND destaque = 1 LIMIT $1`, [limit]);
  return result.rows.map(parseProduct);
}

async function offerProducts(limit = 10) {
  const result = await query(`SELECT * FROM products WHERE paused = 0 AND preco < 200 LIMIT $1`, [limit]);
  return result.rows.map(parseProduct);
}

async function adminProducts(search, pausedFilter) {
  let sql = `SELECT id, nome, categoria, preco, precoOriginal, paused, precoAlterado, imagem, estoque FROM products WHERE 1=1`;
  const params = [];
  let idx = 1;
  if (search) {
    sql += ` AND (nome ILIKE $${idx} OR categoria ILIKE $${idx + 1})`;
    params.push(`%${search}%`, `%${search}%`);
    idx += 2;
  }
  if (pausedFilter === 'true') { sql += ` AND paused = 1`; }
  else if (pausedFilter === 'false') { sql += ` AND paused = 0`; }
  const result = await query(sql, params);
  return result.rows.map(p => ({
    ...p, paused: p.paused === 1 || p.paused === true,
    precoAlterado: p.precoAlterado === 1 || p.precoAlterado === true,
    modified: (p.paused === 1 || p.paused === true) || (p.precoAlterado === 1 || p.precoAlterado === true)
  }));
}

async function adminStaff() {
  const result = await query(`SELECT id, nome, email, telefone, role, admin FROM users WHERE admin = 1 OR (role IS NOT NULL AND role != 'cliente')`);
  return result.rows.map(u => ({ ...u, admin: u.admin === 1 || u.admin === true }));
}

async function initDefaultData() {
  const countResult = await query(`SELECT COUNT(*) as c FROM users`);
  if (parseInt(countResult.rows[0].c) === 0) {
    console.log('Inicializando dados padrão...');
    const bcrypt = require('bcryptjs');
    const passHash = '$2a$10$BMLdT4/ABI9YY0raSzKJYuj6Q9RGofoZ3AdB9gcTsSuzzyn9M/8F2';
    const defaultUsers = [
      { id: Date.now() + 1, nome: 'Akila Jonas', email: 'akilajonas001@gmail.com', username: 'akilajonas', senha: passHash, telefone: '', admin: true, role: 'admin' },
      { id: Date.now() + 2, nome: 'Kauanne Lopes da Silva', email: 'kkauanne80kau@gmail.com', username: 'kkauanne80kau', senha: passHash, telefone: '81999188978', admin: true, role: 'admin' }
    ];
    for (const u of defaultUsers) {
      await createUser(u);
    }
    console.log('  Usuários padrão criados (senha: 123456)');
  }
}

async function saveImage(productId, filename, mimetype, buffer) {
  const result = await query(
    `INSERT INTO product_images (product_id, filename, mimetype, data) VALUES ($1, $2, $3, $4) RETURNING id`,
    [productId || null, filename, mimetype, buffer]
  );
  return result.rows[0];
}

async function getImage(id) {
  const result = await query(`SELECT * FROM product_images WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

async function deleteImage(id) {
  await query(`DELETE FROM product_images WHERE id = $1`, [id]);
}

async function deleteProductImages(productId) {
  await query(`DELETE FROM product_images WHERE product_id = $1`, [productId]);
}

async function closeDb() {
  await pool.end();
}

module.exports = {
  initDb, migrateFromJson, initDefaultData, closeDb,
  allUsers, userByEmail, userById, createUser, updateUser, getUserProfile, updateUserProfile, deleteUser,
  allProducts, productById, updateProduct, createProduct, deleteProduct,
  allOrders, orderById, ordersByUserId, createOrder, updateOrderStatus, clearAllOrders,
  allComments, createComment, deleteComment,
  getCart, saveCart, clearCart, allCartsWithUsers,
  getChatMessages, saveChatMessages, deleteChat, allChats,
  allCoupons, couponByCode, createCoupon, useCoupon, userCoupons,
  allNotifications, userNotifications, createNotification, markNotificationRead,
  allNewsletters, subscribeNewsletter, isNewsletterSubscribed,
  getWishlist, toggleWishlist,
  getCategories, searchProducts, productsByCategory, featuredProducts, offerProducts,
  adminProducts, adminStaff,
  saveImage, getImage, deleteImage, deleteProductImages
};
