const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const match = envContent.match(/DATABASE_URL=(.+)/);
const url = match[1].trim();
const pool = new Pool({ connectionString: url.replace(':5432', ':6543'), ssl: { rejectUnauthorized: false }, max: 2 });

const PRECO_ORIGINAL_FATOR = 1.15;
const TAXA_INFINITIPAY = 0.0549;
const TAXA_IMPOSTOS = 0.09;

const precosMercado = [
  59.00, 35.00, 38.00, 95.00, 35.00, 28.00, 21.00, 55.00, 35.00, 45.00,
  28.00, 25.00, 65.00, 40.00, 24.00, 40.00, 25.00, 55.00, 25.00, 60.00,
  56.09, 49.90, 30.96, 149.90, 35.40, 638.11, 37.35, 48.16, 23.28, 15.00,
  46.05, 96.92, 166.86, 34.90, 45.00, 33.94, 89.99, 67.86, 123.55, 89.45,
  49.90, 19.90, 25.90, 69.90, 39.90, 34.90, 29.90, 199.90, 32.90, 34.90,
  89.90, 89.90, 34.90, 54.90, 69.90, 49.90, 24.90, 99.90, 29.90, 59.90,
  59.90, 39.90, 79.90, 19.90, 29.90, 69.90, 44.90, 89.90, 54.90, 64.90,
  24.90, 34.90, 49.90, 44.90, 79.90, 19.90, 49.90, 34.90, 14.90, 59.90,
  44.90, 49.90, 24.90, 19.90, 69.90, 129.90, 39.90, 89.90, 14.90, 44.90,
  79.90, 54.90, 19.90, 59.90, 24.90, 44.90, 49.90, 45.90, 179.90, 12.90
];

const custos = [
  75.10, 49.28, 42.82, 171.94, 96.62, 70.80, 32.06, 96.62, 85.86, 42.82,
  118.14, 42.82, 171.94, 60.04, 85.86, 85.86, 42.82, 96.62, 32.06, 139.66,
  70.80, 64.34, 139.66, 139.66, 42.82, 204.22, 49.28, 107.38, 53.58, 32.06,
  161.18, 96.62, 279.55, 60.04, 32.06, 60.04, 64.34, 139.66, 214.98, 60.04,
  60.04, 70.80, 42.82, 107.38, 60.04, 60.04, 53.58, 214.98, 42.82, 42.82,
  139.66, 85.86, 60.04, 118.14, 70.80, 85.86, 64.34, 150.42, 60.04, 96.62,
  96.62, 70.80, 139.66, 32.06, 42.82, 96.62, 75.10, 70.80, 171.94, 85.86,
  53.58, 60.04, 85.86, 60.04, 139.66, 42.82, 107.38, 70.80, 42.82, 124.60,
  60.04, 70.80, 53.58, 42.82, 171.94, 85.86, 107.38, 107.38, 60.04, 70.80,
  96.62, 60.04, 42.82, 70.80, 85.86, 96.62, 103.08, 42.82, 193.46, 53.58
];

async function main() {
  const { rows } = await pool.query('SELECT id, nome FROM products ORDER BY id');

  console.log('Atualizando precos com base na media de mercado...\n');
  console.log('ID | Produto | Custo | Preco Mercado | PrecoFinal | PrecoOriginal | Taxa IP | Impostos | Lucro\n');

  for (let i = 0; i < rows.length; i++) {
    const p = rows[i];
    const precoMercado = precosMercado[i];
    const custo = custos[i];

    if (!precoMercado) {
      console.log(`PULANDO: ${p.nome.substring(0, 50)} (sem preco mercado)`);
      continue;
    }

    const preco = Math.round(precoMercado * 100) / 100;
    const precoOriginal = Math.round(precoMercado * PRECO_ORIGINAL_FATOR * 100) / 100;

    await pool.query(
      `UPDATE products SET preco = $1, precoOriginal = $2 WHERE id = $3`,
      [preco, precoOriginal, p.id]
    );

    const taxaInfinitiPay = Math.round(preco * TAXA_INFINITIPAY * 100) / 100;
    const impostos = Math.round(preco * TAXA_IMPOSTOS * 100) / 100;
    const lucro = Math.round((preco - taxaInfinitiPay - impostos - custo) * 100) / 100;

    const nomeCurto = p.nome.substring(0, 45).padEnd(45);
    const idStr = String(p.id).padEnd(6);
    console.log(`${idStr} | ${nomeCurto} | R$${custo.toFixed(2).padStart(7)} | R$${precoMercado.toFixed(2).padStart(7)} | R$${preco.toFixed(2).padStart(7)} | R$${precoOriginal.toFixed(2).padStart(8)} | ${taxaInfinitiPay.toFixed(2).padStart(5)} | ${impostos.toFixed(2).padStart(5)} | R$${lucro.toFixed(2).padStart(7)}`);
  }

  const { rows: v } = await pool.query("SELECT COUNT(*) AS total, SUM(CASE WHEN precoOriginal IS NULL OR precoOriginal = 0 THEN 1 ELSE 0 END) AS sem_original FROM products");
  console.log(`\nTotal: ${v[0].total} | Sem precoOriginal: ${v[0].sem_original}`);

  const { rows: amostra } = await pool.query('SELECT nome, preco, precoOriginal FROM products LIMIT 5');
  console.log('\nAmostra de produtos atualizados:');
  console.log(JSON.stringify(amostra, null, 2));

  await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
