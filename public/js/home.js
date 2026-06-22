document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadCategories(),
    loadFeaturedProducts(),
    loadOffers()
  ]);
  triggerStagger();
});

const categoryIcons = {
  'Celulares e Smartphones': 'fa-mobile-alt',
  'Informática': 'fa-laptop',
  'Moda e Vestuário': 'fa-tshirt',
  'Esportes e Fitness': 'fa-football-ball',
  'Casa e Decoração': 'fa-couch',
  'Cozinha e Utensílios': 'fa-utensils',
  'Livros e Papelaria': 'fa-book',
  'Eletrônicos': 'fa-tv',
  'Beleza e Perfumaria': 'fa-pump-soap',
  'Móveis': 'fa-chair',
  'Games': 'fa-gamepad',
  'Eletrodomésticos': 'fa-blender'
};

async function loadCategories() {
  try {
    const response = await fetch('/api/categories');
    const categorias = await response.json();

    const container = document.getElementById('categoriesGrid');
    if (!container) return;

    container.innerHTML = categorias.map(cat => `
      <div class="category-card" onclick="window.location.href='/busca?categoria=${encodeURIComponent(cat)}'">
        <i class="fas ${categoryIcons[cat] || 'fa-store'}"></i>
        <h3>${cat}</h3>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
  }
}

async function loadFeaturedProducts() {
  try {
    const response = await fetch('/api/products/featured');
    const products = await response.json();

    const container = document.getElementById('featuredProducts');
    if (!container) return;

    container.innerHTML = products.map(product => `
      <div class="product-card" onclick="window.location.href='/produto/${product.id}'">
        <div class="product-image">
          <i class="fas ${product.imagem}"></i>
          <button class="quick-add-btn" onclick="event.stopPropagation(); quickAdd(${product.id}, '${product.nome.replace(/'/g, "\\'")}', ${product.preco}, '${product.imagem}')">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <div class="product-info">
          <div class="product-price">R$ ${product.preco.toFixed(2).replace('.', ',')}</div>
          ${product.frete === 'Grátis' ? '<div class="product-shipping"><i class="fas fa-truck"></i> Frete grátis</div>' : ''}
          <div class="product-name">${product.nome}</div>
          <div class="product-rating">
            <i class="fas fa-star"></i>
            ${product.avaliacao.toFixed(1)} (${product.reviews})
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erro ao carregar destaques:', error);
  }
}

async function loadOffers() {
  try {
    const response = await fetch('/api/products/offers');
    const products = await response.json();

    const container = document.getElementById('offersProducts');
    if (!container) return;

    container.innerHTML = products.map(product => {
      const oldPrice = product.preco * 1.25;
      const discount = Math.round((1 - product.preco / oldPrice) * 100);

      return `
        <div class="offer-card" onclick="window.location.href='/produto/${product.id}'">
          <div class="deal-discount">${discount}% OFF</div>
          <div style="font-size: 40px; color: var(--text-muted); text-align: center; margin: 10px 0;">
            <i class="fas ${product.imagem || 'fa-tag'}"></i>
          </div>
          <div class="deal-old-price">R$ ${oldPrice.toFixed(2).replace('.', ',')}</div>
          <div class="deal-price">R$ ${product.preco.toFixed(2).replace('.', ',')}</div>
          <div class="offer-name">${product.nome.substring(0, 35)}${product.nome.length > 35 ? '...' : ''}</div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Erro ao carregar ofertas:', error);
  }
}

function quickAdd(id, nome, preco, imagem) {
  const produto = { id, nome, preco, imagem };
  addToCart(produto);
}

function triggerStagger() {
  requestAnimationFrame(() => {
    document.querySelectorAll('.stagger-children').forEach(container => {
      const rect = container.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (isVisible) {
        container.classList.add('visible');
      }
    });
  });
}
