const slugToCategory = {
  'celulares-e-smartphones': 'Celulares e Smartphones',
  'informatica': 'Informática',
  'moda-e-vestuario': 'Moda e Vestuário',
  'esportes-e-fitness': 'Esportes e Fitness',
  'casa-e-decoracao': 'Casa e Decoração',
  'cozinha-e-utensilios': 'Cozinha e Utensílios',
  'livros-e-papelaria': 'Livros e Papelaria',
  'eletronicos': 'Eletrônicos',
  'moveis': 'Móveis',
  'beleza-e-perfumaria': 'Beleza e Perfumaria',
  'games': 'Games',
  'eletrodomesticos': 'Eletrodomésticos',
  'processadores': 'Processadores',
  'ram': 'Memória RAM',
  'ssds': 'SSDs',
  'hds': 'HDs',
  'monitores': 'Monitores',
  'gabinetes': 'Gabinetes',
  'pcs-premontados': 'PCs Premontados',
  'acessorios': 'Acessórios',
  'utilitarios': 'Utilitários'
};

const iconMap = {
  'Celulares e Smartphones': 'fa-mobile-alt',
  'Informática': 'fa-laptop',
  'Moda e Vestuário': 'fa-tshirt',
  'Esportes e Fitness': 'fa-football-ball',
  'Casa e Decoração': 'fa-couch',
  'Cozinha e Utensílios': 'fa-utensils',
  'Livros e Papelaria': 'fa-book',
  'Eletrônicos': 'fa-tv',
  'Móveis': 'fa-chair',
  'Beleza e Perfumaria': 'fa-pump-soap',
  'Games': 'fa-gamepad',
  'Eletrodomésticos': 'fa-blender'
};

let currentPage = 1;
let totalPages = 1;
const ITEMS_PER_PAGE = 24;

document.addEventListener('DOMContentLoaded', () => {
  loadCategory();
});

function formatPrice(preco) {
  return 'R$ ' + preco.toFixed(2).replace('.', ',');
}

function getCategoryFromSlug(slug) {
  if (slugToCategory[slug]) return slugToCategory[slug];
  const decoded = decodeURIComponent(slug);
  return decoded.charAt(0).toUpperCase() + decoded.slice(1);
}

async function loadCategory(page) {
  currentPage = page || 1;
  const pathParts = window.location.pathname.split('/');
  const slug = pathParts[pathParts.length - 1];

  const titleEl = document.getElementById('categoryTitle');
  const container = document.getElementById('categoryProducts');

  if (!titleEl || !container) return;

  const categoryName = getCategoryFromSlug(slug);

  const icon = iconMap[categoryName] || 'fa-tag';
  titleEl.innerHTML = `<i class="fas ${icon}"></i> ${categoryName}`;

  try {
    const response = await fetch(`/api/products/category/${encodeURIComponent(categoryName)}?page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
    const data = await response.json();
    const products = data.products || [];
    totalPages = data.totalPages || 1;

    if (products.length === 0) {
      container.innerHTML = `
        <div class="no-products">
          <i class="fas fa-box-open"></i>
          <h3>Nenhum produto encontrado</h3>
          <p>Não encontramos produtos nesta categoria.</p>
        </div>
      `;
      renderPaginationCat();
      return;
    }

    container.innerHTML = products.map(product => {
      const inWish = isInWishlist(product.id);
      return `
      <div class="product-card" onclick="window.location.href='/produto/${product.id}'">
        <div class="product-image">
          <img src="${product.imagem}" alt="${product.nome}" loading="lazy">
          <button class="wishlist-btn${inWish ? ' active' : ''}" onclick="event.stopPropagation(); toggleWishlist(${product.id}, this)" title="${inWish ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
            <i class="${inWish ? 'fas' : 'far'} fa-heart"></i>
          </button>
        </div>
        <div class="product-info">
          <div class="product-name">${product.nome}</div>
          <div class="product-rating">
            <i class="fas fa-star"></i>
            <span>${product.avaliacao.toFixed(1)}</span>
            <span class="rating-count">(${product.reviews})</span>
          </div>
          <div class="product-price">${formatPrice(product.preco)}</div>
          <div class="product-shipping"><span class="old-shipping-card">R$ 14,99</span> <span class="free-shipping-badge-card"><i class="fas fa-truck"></i> Frete Grátis</span></div>
        </div>
      </div>
    `}).join('');

    renderPaginationCat();
  } catch (error) {
    console.error('Erro ao carregar categoria:', error);
    container.innerHTML = `
      <div class="no-products">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erro ao carregar</h3>
        <p>Não foi possível carregar os produtos. Tente novamente.</p>
      </div>
    `;
  }
}

function renderPaginationCat() {
  const container = document.getElementById('pagination');
  if (!container) return;
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '<div class="pagination">';
  html += '<button class="page-btn" onclick="loadCategory(' + (currentPage - 1) + ')" ' + (currentPage <= 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i></button>';
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
      html += '<button class="page-btn' + (i === currentPage ? ' active' : '') + '" onclick="loadCategory(' + i + ')">' + i + '</button>';
    } else if (Math.abs(i - currentPage) === 3) {
      html += '<span class="page-dots">...</span>';
    }
  }
  html += '<button class="page-btn" onclick="loadCategory(' + (currentPage + 1) + ')" ' + (currentPage >= totalPages ? 'disabled' : '') + '><i class="fas fa-chevron-right"></i></button>';
  html += '</div>';
  container.innerHTML = html;
}
