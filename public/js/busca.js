// Estado da busca
let currentFilters = {
  q: '',
  categoria: '',
  precoMin: '',
  precoMax: '',
  ordem: 'relevancia',
  freteGratis: false
};
let currentPage = 1;
const ITEMS_PER_PAGE = 24;
let totalPages = 1;

// Carregar página
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  currentFilters.q = params.get('q') || '';
  currentFilters.categoria = params.get('categoria') || '';
  currentFilters.precoMin = params.get('precoMin') || '';
  currentFilters.precoMax = params.get('precoMax') || '';
  currentFilters.ordem = params.get('ordem') || 'relevancia';
  currentFilters.freteGratis = params.get('freteGratis') === 'true';
  const page = parseInt(params.get('page')) || 1;

  if (currentFilters.q) {
    document.getElementById('searchInput').value = currentFilters.q;
  }

  const freteCheckbox = document.getElementById('freteGratis');
  if (freteCheckbox) freteCheckbox.checked = currentFilters.freteGratis;

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.value = currentFilters.ordem;

  await loadCategoriesFilter();
  await loadProducts(page);
});

// Sincronizar filtros com a URL (sem recarregar a página)
function syncFiltersToURL(page) {
  const params = new URLSearchParams();
  if (currentFilters.q) params.set('q', currentFilters.q);
  if (currentFilters.categoria) params.set('categoria', currentFilters.categoria);
  if (currentFilters.precoMin) params.set('precoMin', currentFilters.precoMin);
  if (currentFilters.precoMax) params.set('precoMax', currentFilters.precoMax);
  if (currentFilters.ordem && currentFilters.ordem !== 'relevancia') params.set('ordem', currentFilters.ordem);
  if (currentFilters.freteGratis) params.set('freteGratis', 'true');
  if (page && page > 1) params.set('page', page);
  const url = params.toString() ? '/busca?' + params.toString() : '/busca';
  history.replaceState(null, '', url);
}

// Carregar categorias no filtro (desktop e mobile)
async function loadCategoriesFilter() {
  try {
    const response = await fetch('/api/categories');
    const categorias = await response.json();
    
    const container = document.getElementById('categoriesFilter');
    const mobileContainer = document.getElementById('mobileCategoriesFilter');
    
    if (container) {
      container.innerHTML = categorias.map(function(cat) {
        return '<div class="filter-option">' +
          '<input type="checkbox" id="cat_' + cat.replace(/\s+/g, '_') + '" value="' + cat + '" ' + (currentFilters.categoria === cat ? 'checked' : '') + ' onchange="selectCategory(\'' + cat + '\')">' +
          '<label for="cat_' + cat.replace(/\s+/g, '_') + '">' + cat + '</label>' +
        '</div>';
      }).join('');
    }
    
    if (mobileContainer) {
      mobileContainer.innerHTML = '<div class="filter-section" style="padding:0;"><div class="filter-title" style="padding:0 0 12px 0;"><i class="fas fa-tags"></i> Categorias</div></div>' +
        categorias.map(function(cat) {
          return '<div class="filter-option">' +
            '<input type="checkbox" id="mcat_' + cat.replace(/\s+/g, '_') + '" value="' + cat + '" ' + (currentFilters.categoria === cat ? 'checked' : '') + ' onchange="selectCategory(\'' + cat + '\')">' +
            '<label for="mcat_' + cat.replace(/\s+/g, '_') + '">' + cat + '</label>' +
          '</div>';
        }).join('');
    }
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
  }
}

// Selecionar categoria
function selectCategory(categoria) {
  currentFilters.categoria = currentFilters.categoria === categoria ? '' : categoria;
  
  // Verificar filtro de frete grátis
  const freteGratisCheckbox = document.getElementById('freteGratis');
  if (freteGratisCheckbox) {
    currentFilters.freteGratis = freteGratisCheckbox.checked;
  }
  
  syncFiltersToURL();
  loadProducts();
}

// Carregar produtos
async function loadProducts(page) {
  try {
    currentPage = page || 1;
    syncFiltersToURL(currentPage);
    var params = new URLSearchParams();
    if (currentFilters.q) params.set('q', currentFilters.q);
    if (currentFilters.categoria) params.set('categoria', currentFilters.categoria);
    if (currentFilters.precoMin) params.set('precoMin', currentFilters.precoMin);
    if (currentFilters.precoMax) params.set('precoMax', currentFilters.precoMax);
    if (currentFilters.ordem && currentFilters.ordem !== 'relevancia') {
      params.set('ordem', currentFilters.ordem);
    }
    params.set('page', currentPage);
    params.set('limit', ITEMS_PER_PAGE);

    const response = await fetch('/api/products/search?' + params);
    const data = await response.json();
    let products = data.products || [];
    totalPages = data.totalPages || 1;

    const container = document.getElementById('productsGrid');
    const countElement = document.getElementById('resultsCount');
    
    if (!container) return;
    
    if (products.length === 0) {
      container.innerHTML = '<div class="no-results" style="grid-column: 1 / -1;">' +
        '<i class="fas fa-search"></i>' +
        '<h2>Nenhum produto encontrado</h2>' +
        '<p>Tente ajustar os filtros ou buscar por outros termos</p>' +
      '</div>';
      countElement.textContent = '0 produtos encontrados';
      renderPagination();
      return;
    }
    
    var plural = data.total !== 1 ? 's' : '';
    countElement.textContent = data.total + ' produto' + plural + ' encontrado' + plural;
    
    container.innerHTML = products.map(function(product) {
      const inWish = isInWishlist(product.id);
      return '<div class="product-card" onclick="window.location.href=\'/produto/' + product.id + '\'">' +
        '<div class="product-image">' +
          '<img src="' + product.imagem + '" alt="' + product.nome + '" loading="lazy">' +
          '<button class="wishlist-btn' + (inWish ? ' active' : '') + '" onclick="event.stopPropagation(); toggleWishlist(' + product.id + ', this)" title="' + (inWish ? 'Remover dos favoritos' : 'Adicionar aos favoritos') + '">' +
            '<i class="' + (inWish ? 'fas' : 'far') + ' fa-heart"></i>' +
          '</button>' +
        '</div>' +
        '<div class="product-info">' +
          '<div class="product-name">' + product.nome + '</div>' +
          '<div class="product-rating">' +
            '<i class="fas fa-star"></i> ' +
            '<span>' + product.avaliacao.toFixed(1) + '</span>' +
            '<span class="rating-count">(' + product.reviews + ')</span>' +
          '</div>' +
          '<div class="product-price">R$ ' + product.preco.toFixed(2).replace('.', ',') + '</div>' +
          '<div class="product-shipping"><span class="old-shipping-card">R$ 14,99</span> <span class="free-shipping-badge-card"><i class="fas fa-truck"></i> Frete Grátis</span></div>' +
        '</div>' +
      '</div>';
    }).join('');
    
    renderPagination();
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    document.getElementById('productsGrid').innerHTML = '<div class="no-results" style="grid-column: 1 / -1;">' +
      '<i class="fas fa-exclamation-circle"></i>' +
      '<h2>Erro ao carregar produtos</h2>' +
      '<p>Tente recarregar a página</p>' +
    '</div>';
  }
}

function renderPagination() {
  const container = document.getElementById('pagination');
  if (!container) return;
  if (totalPages <= 1) { container.innerHTML = ''; return; }
  
  let html = '<div class="pagination">';
  html += '<button class="page-btn" onclick="loadProducts(' + (currentPage - 1) + ')" ' + (currentPage <= 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i></button>';
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
      html += '<button class="page-btn' + (i === currentPage ? ' active' : '') + '" onclick="loadProducts(' + i + ')">' + i + '</button>';
    } else if (Math.abs(i - currentPage) === 3) {
      html += '<span class="page-dots">...</span>';
    }
  }
  html += '<button class="page-btn" onclick="loadProducts(' + (currentPage + 1) + ')" ' + (currentPage >= totalPages ? 'disabled' : '') + '><i class="fas fa-chevron-right"></i></button>';
  html += '</div>';
  container.innerHTML = html;
}

// Mudar ordenação
function changeSort() {
  currentFilters.ordem = document.getElementById('sortSelect').value;
  syncFiltersToURL();
  loadProducts();
}

// Ordenar produtos (chamado pelo select)
function sortProducts() {
  currentFilters.ordem = document.getElementById('sortSelect').value;
  currentFilters.referencePrice = null;
  currentFilters.priceOrder = null;
  syncFiltersToURL();
  loadProducts();
}

// Buscar produtos
function searchProducts() {
  const query = document.getElementById('searchInput').value;
  window.location.href = '/busca?q=' + encodeURIComponent(query);
}

var searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchProducts();
    }
  });
}

// Modal de Filtro de Preço
function openPriceFilterModal() {
  document.getElementById('priceFilterModal').style.display = 'flex';
}

function closePriceFilterModal() {
  document.getElementById('priceFilterModal').style.display = 'none';
}

function applyPriceFilter() {
  const referencePrice = parseFloat(document.getElementById('referencePrice').value) || 0;
  const order = document.getElementById('priceOrder').value;
  
  currentFilters.referencePrice = referencePrice;
  currentFilters.priceOrder = order;

  if (referencePrice > 0) {
    if (order === 'maior') {
      currentFilters.precoMin = referencePrice;
      currentFilters.precoMax = '';
    } else if (order === 'menor') {
      currentFilters.precoMax = referencePrice;
      currentFilters.precoMin = '';
    } else {
      currentFilters.precoMin = '';
      currentFilters.precoMax = '';
    }
  } else {
    currentFilters.precoMin = '';
    currentFilters.precoMax = '';
  }
  
  closePriceFilterModal();
  
  syncFiltersToURL();
  loadProducts();
  
  showNotification('Filtro de preço aplicado!', 'success');
}

// Fechar modal ao clicar fora
document.addEventListener('click', function(e) {
  const modal = document.getElementById('priceFilterModal');
  if (e.target === modal) {
    closePriceFilterModal();
  }
});