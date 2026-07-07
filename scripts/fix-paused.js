const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}});

async function main() {
  const result = await pool.query(
    "UPDATE products SET paused = 1 WHERE id > 1783384750000 AND (paused IS NULL OR paused = 0)"
  );
  console.log('Updated', result.rowCount, 'products to paused=1');

  const check = await pool.query("SELECT paused, COUNT(*) as c FROM products GROUP BY paused");
  check.rows.forEach(r => console.log('paused =', r.paused, ':', r.c, 'products'));

  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
