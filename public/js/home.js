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

// Wishlist integration
function isInWishlist(id) {
  const saved = localStorage.getItem('techvault-wishlist');
  if (!saved) return false;
  const wishlist = JSON.parse(saved);
  return wishlist.some(p => (typeof p === 'object' ? p.id : p) === id);
}

function toggleWishlist(id, btn) {
  const saved = localStorage.getItem('techvault-wishlist') || '[]';
  let wishlist = JSON.parse(saved);
  const exists = wishlist.some(p => (typeof p === 'object' ? p.id : p) === id);

  if (exists) {
    wishlist = wishlist.filter(p => (typeof p === 'object' ? p.id : p) !== id);
    if (btn) {
      btn.classList.remove('active');
      btn.querySelector('i').classList.replace('fas', 'far');
      btn.setAttribute('title', 'Adicionar aos favoritos');
    }
    showToast('Removido dos favoritos');
  } else {
    wishlist.push(id);
    if (btn) {
      btn.classList.add('active');
      btn.querySelector('i').classList.replace('far', 'fas');
      btn.setAttribute('title', 'Remover dos favoritos');
    }
    showToast('Adicionado aos favoritos!');
  }

  localStorage.setItem('techvault-wishlist', JSON.stringify(wishlist));
  updateWishlistCount();
}

function updateWishlistCount() {
  const saved = localStorage.getItem('techvault-wishlist');
  const count = saved ? JSON.parse(saved).length : 0;
  const countEl = document.getElementById('wishlistCount');
  if (countEl) {
    countEl.textContent = count;
    countEl.style.display = count > 0 ? 'flex' : 'none';
  }
}

function showToast(message, isError = false) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast' + (isError ? ' error' : '');
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: white;
    padding: 16px 24px;
    border-radius: 14px;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 9999;
    animation: slideInRight 0.3s ease;
    border-left: 4px solid ${isError ? '#ef4444' : '#10b981'};
  `;
  toast.innerHTML = `
    <i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}" style="color: ${isError ? '#ef4444' : '#10b981'}; font-size: 20px;"></i>
    <span style="font-weight: 500; color: #1e293b;">${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

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

    container.innerHTML = products.map(product => {
      const inWish = isInWishlist(product.id);
      return `
      <div class="product-card" onclick="window.location.href='/produto/${product.id}'">
        <div class="product-image">
          <img src="${product.imagem}" alt="${product.nome}" loading="lazy">
          <button class="wishlist-btn${inWish ? ' active' : ''}" onclick="event.stopPropagation(); toggleWishlist(${product.id}, this)" title="${inWish ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
            <i class="${inWish ? 'fas' : 'far'} fa-heart"></i>
          </button>
          <button class="quick-add-btn" onclick="event.stopPropagation(); quickAdd(${product.id}, '${product.nome.replace(/'/g, "\\'")}', ${product.preco}, '${product.imagem}')">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <div class="product-info">
          <div class="product-name">${product.nome}</div>
          <div class="product-rating">
            <i class="fas fa-star"></i>
            <span>${product.avaliacao.toFixed(1)}</span>
            <span class="rating-count">(${product.reviews})</span>
          </div>
          <div class="product-price">R$ ${product.preco.toFixed(2).replace('.', ',')}</div>
          <div class="product-shipping"><span class="old-shipping-card">R$ 14,99</span> <span class="free-shipping-badge-card"><i class="fas fa-truck"></i> Frete Grátis</span></div>
        </div>
      </div>
    `}).join('');
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
      const inWish = isInWishlist(product.id);

      return `
        <div class="offer-card" onclick="window.location.href='/produto/${product.id}'">
          <div class="deal-discount">${discount}% OFF</div>
          <button class="wishlist-btn${inWish ? ' active' : ''}" onclick="event.stopPropagation(); toggleWishlist(${product.id}, this)" title="${inWish ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
            <i class="${inWish ? 'fas' : 'far'} fa-heart"></i>
          </button>
          <div class="offer-image">
            <img src="${product.imagem}" alt="${product.nome}" loading="lazy">
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
  showToast(`${nome} adicionado ao carrinho! 🛒`);
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
