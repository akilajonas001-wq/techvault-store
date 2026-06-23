const fs = require('fs');
const path = require('path');

const products = JSON.parse(fs.readFileSync(path.join(__dirname, '../backend/data/products.json'), 'utf-8'));

const categoryColors = {
  'Celulares e Smartphones': { from: '#6366f1', to: '#8b5cf6', icon: '📱' },
  'Informática': { from: '#2563eb', to: '#3b82f6', icon: '💻' },
  'Moda e Vestuário': { from: '#ec4899', to: '#f472b6', icon: '👕' },
  'Esportes e Fitness': { from: '#10b981', to: '#34d399', icon: '⚽' },
  'Casa e Decoração': { from: '#f59e0b', to: '#fbbf24', icon: '🛋️' },
  'Cozinha e Utensílios': { from: '#f97316', to: '#fb923c', icon: '🍳' },
  'Livros e Papelaria': { from: '#8b5cf6', to: '#a78bfa', icon: '📚' },
  'Eletrônicos': { from: '#06b6d4', to: '#22d3ee', icon: '📺' },
  'Móveis': { from: '#78716c', to: '#a8a29e', icon: '🪑' },
  'Beleza e Perfumaria': { from: '#d946ef', to: '#e879f9', icon: '🧴' },
  'Games': { from: '#ef4444', to: '#f87171', icon: '🎮' },
  'Eletrodomésticos': { from: '#14b8a6', to: '#2dd4bf', icon: '🔌' }
};

const defaultColors = { from: '#64748b', to: '#94a3b8', icon: '📦' };

const outputDir = path.join(__dirname, '../public/images/products');

function generateSVG(product, colors) {
  const name = product.nome || 'Produto';
  const lines = [];
  const words = name.split(' ');
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).length > 18) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current);

  const textY = 330;
  const lineHeight = 22;
  const startY = textY - ((lines.length - 1) * lineHeight) / 2;

  const textElements = lines.map((line, i) =>
    `<text x="200" y="${startY + i * lineHeight}" text-anchor="middle" font-family="Inter, sans-serif" font-size="16" font-weight="600" fill="#ffffff" opacity="0.9">${escapeXml(line)}</text>`
  ).join('\n      ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.from}"/>
      <stop offset="100%" style="stop-color:${colors.to}"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.15"/>
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0"/>
    </linearGradient>
  </defs>

  <rect width="400" height="400" fill="url(#bg)" rx="0"/>

  <circle cx="200" cy="180" r="100" fill="url(#glow)"/>
  <circle cx="200" cy="180" r="80" fill="none" stroke="#ffffff" stroke-opacity="0.1" stroke-width="2"/>
  <circle cx="200" cy="180" r="60" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1"/>

  <text x="200" y="195" text-anchor="middle" font-size="72" dominant-baseline="central">${colors.icon}</text>

  <rect x="40" y="290" width="320" height="1" fill="#ffffff" fill-opacity="0.15"/>

  ${textElements}
</svg>`;
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

let count = 0;
for (const product of products) {
  const colors = categoryColors[product.categoria] || defaultColors;
  const svg = generateSVG(product, colors);
  const filename = `produto-${product.id}.svg`;
  fs.writeFileSync(path.join(outputDir, filename), svg, 'utf-8');
  count++;
}

console.log(`Generated ${count} product images in ${outputDir}`);
