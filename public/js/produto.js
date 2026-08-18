// Carregar produto
let currentProduct = null;
let selectedRating = 0;
let currentUserId = null;
let selectedVariant = null;
let selectedVariantIndex = null;
let selectedColor = null;
let selectedColorIndex = null;
let baseSpecs = null;
let baseGalleryImages = [];

const colorMap = {
  preto: '#1a1a1a', branco: '#ffffff', cinza: '#9e9e9e', prata: '#c0c0c0',
  grafite: '#37474f', azul: '#1e88e5', 'azul-marinho': '#1a237e', 'azul claro': '#90caf9',
  vermelho: '#e53935', vinho: '#7f1d1d', verde: '#43a047', amarelo: '#fdd835',
  rosa: '#ec407a', roxo: '#8e24aa', lilas: '#9c8fb8', laranja: '#fb8c00',
  dourado: '#d4af37', bege: '#e8d5b7', marrom: '#6d4c41', champagne: '#f7e7ce',
  gelo: '#f3f8fb', turquesa: '#26c6da', ciano: '#00acc1', salmao: '#fa8072'
};
function colorSwatch(cor) {
  const key = String(cor || '').trim().toLowerCase();
  return colorMap[key] || null;
}

const specLabels = {
  sistema_operacional: 'Sistema Operacional',
  processador: 'Processador',
  tela: 'Tela',
  armazenamento: 'Armazenamento',
  memoria_ram: 'Memória RAM',
  bateria: 'Bateria',
  camera_principal: 'Câmera Principal',
  conectividade: 'Conectividade',
  modelo: 'Modelo',
  cor: 'Cor',
  placa_video: 'Placa de Vídeo',
  resolucao: 'Resolução',
  taxa_atualizacao: 'Taxa de Atualização',
  material: 'Material',
  genero: 'Gênero',
  tamanhos_disponiveis: 'Tamanhos Disponíveis',
  cores_disponiveis: 'Cores Disponíveis',
  cuidados: 'Cuidados',
  peso_aproximado: 'Peso Aproximado',
  garantia: 'Garantia',
  dimensoes: 'Dimensões',
  capacidade: 'Capacidade',
  compativel_lava_loucas: 'Compatível com Lava-Louças',
  autor: 'Autor',
  editora: 'Editora',
  paginas: 'Páginas',
  idioma: 'Idioma',
  tipo_capa: 'Tipo de Capa',
  tipo: 'Tipo',
  plataforma: 'Plataforma',
  voltagem: 'Voltagem',
  eficiencia_energetica: 'Eficiência Energética',
  potencia: 'Potência',
  montagem: 'Montagem',
  volume: 'Volume'
};

function buildSpecsHtml(specs) {
  if (!specs) return '';
  let rows = '';
  const hiddenKeys = ['link_fornecedor'];
  for (const [key, value] of Object.entries(specs)) {
    if (hiddenKeys.includes(key)) continue;
    if (value && value !== 'N/A') {
      const label = specLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      rows += '<tr><td class="spec-label">' + escapeHtml(label) + '</td><td class="spec-value">' + escapeHtml(value) + '</td></tr>';
    }
  }
  if (!rows) return '';
  return '<div class="specs-section" id="specsSection"><h2><i class="fas fa-microchip"></i> Especificações Técnicas</h2><table class="specs-table">' + rows + '</table></div>';
}

document.addEventListener('DOMContentLoaded', async () => {
  const productId = window.location.pathname.split('/').pop();
  await loadProduct(productId);
  initStarRating();
  document.getElementById('commentText')?.addEventListener('input', function() {
    document.getElementById('charCount').textContent = this.value.length + '/500';
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'ArrowRight') nextSlide();
  });
});

async function loadRelatedProducts(categoria, currentId) {
  try {
    const response = await fetch('/api/products/search?categoria=' + encodeURIComponent(categoria) + '&limit=50');
    const data = await response.json();
    let products = (data.products || data).filter(p => p.id != currentId).slice(0, 10);

    if (products.length === 0) return;

    const container = document.getElementById('relatedProducts');
    const section = document.getElementById('relatedSection');
    const seeAll = document.getElementById('relatedSeeAll');

    container.innerHTML = products.map(p => {
      const price = 'R$ ' + p.preco.toFixed(2).replace('.', ',');
      return '<div class="related-product-card" onclick="window.location.href=\'/produto/' + p.id + '\'">' +
        '<div class="related-product-image">' +
          '<img src="' + escapeHtml(p.imagem) + '" alt="' + escapeHtml(p.nome) + '" loading="lazy">' +
        '</div>' +
        '<div class="related-product-info">' +
          '<div class="related-product-name">' + escapeHtml(p.nome) + '</div>' +
          '<div class="related-product-price">' + price + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    seeAll.href = '/busca?categoria=' + encodeURIComponent(categoria);
    section.style.display = 'block';
  } catch (error) {
    console.error('Erro ao carregar relacionados:', error);
  }
}

function initStarRating() {
  document.addEventListener('click', function(e) {
    const star = e.target.closest('#starsInput i');
    if (!star) return;
    const rating = parseInt(star.dataset.star);
    selectedRating = rating;
    const stars = document.querySelectorAll('#starsInput i');
    stars.forEach((s, i) => {
      s.className = i < rating ? 'fas fa-star active' : 'far fa-star';
    });
  });
}

async function loadComments(productId) {
  try {
    const container = document.getElementById('commentsList');
    const countEl = document.getElementById('commentsCount');
    const response = await fetch('/api/products/' + productId + '/comments');
    const comments = await response.json();

    countEl.textContent = comments.length + ' comentário' + (comments.length !== 1 ? 's' : '');

    if (comments.length === 0) {
      container.innerHTML =
        '<div class="comments-empty">' +
          '<i class="fas fa-comment-dots"></i>' +
          '<h3>Nenhum comentário ainda</h3>' +
          '<p>Seja o primeiro a avaliar este produto!</p>' +
        '</div>';
      return;
    }

    container.innerHTML = comments.map(c => {
      const date = new Date(c.createdAt).toLocaleDateString('pt-BR');
      const initials = c.userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      let stars = '';
      for (let i = 1; i <= 5; i++) {
        stars += i <= c.rating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
      }
      const canDelete = currentUserId && c.userId === currentUserId;
      return '<div class="comment-card">' +
        '<div class="comment-card-header">' +
          '<div class="comment-user">' +
            '<div class="comment-avatar">' + escapeHtml(initials) + '</div>' +
            '<div class="comment-user-info">' +
              '<span class="comment-user-name">' + escapeHtml(c.userName) + '</span>' +
              '<span class="comment-date">' + date + '</span>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<div class="comment-stars">' + stars + '</div>' +
            (canDelete ? '<button class="comment-delete-btn" onclick="deleteComment(' + c.id + ')" title="Remover comentário"><i class="fas fa-trash-alt"></i></button>' : '') +
          '</div>' +
        '</div>' +
        '<div class="comment-text">' + escapeHtml(c.comment) + '</div>' +
      '</div>';
    }).join('');
  } catch (error) {
    console.error('Erro ao carregar comentários:', error);
  }
}

async function deleteComment(commentId) {
  if (!confirm('Tem certeza que deseja remover seu comentário?')) return;

  const token = localStorage.getItem('techvault-token');
  if (!token) {
    showNotification('Faça login para remover comentários', 'error');
    return;
  }

  try {
    const response = await fetch('/api/products/' + currentProduct.id + '/comments/' + commentId, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });

    const data = await response.json();

    if (data.success) {
      showNotification('Comentário removido com sucesso!', 'success');
      await loadComments(currentProduct.id);
    } else {
      showNotification(data.error || 'Erro ao remover comentário', 'error');
    }
  } catch (error) {
    console.error('Erro ao deletar comentário:', error);
    showNotification('Erro ao remover comentário', 'error');
  }
}

function updateCommentAuth() {
  const el = document.getElementById('commentAuth');
  const token = localStorage.getItem('techvault-token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = payload.id;
      el.innerHTML = 'Comentando como <strong>' + escapeHtml(payload.email || 'usuário') + '</strong>';
    } catch {
      currentUserId = null;
      el.innerHTML = '<a href="/login">Faça login</a> para comentar';
    }
  } else {
    currentUserId = null;
    el.innerHTML = '<a href="/login">Faça login</a> para comentar';
  }
}

async function submitComment() {
  const text = document.getElementById('commentText');
  const comment = text.value.trim();
  const token = localStorage.getItem('techvault-token');

  if (!token) {
    showNotification('Faça login para comentar', 'error');
    setTimeout(() => { window.location.href = '/login'; }, 1200);
    return;
  }

  if (!comment) {
    showNotification('Escreva um comentário antes de enviar', 'error');
    return;
  }

  if (selectedRating === 0) {
    showNotification('Selecione uma avaliação (1 a 5 estrelas)', 'error');
    return;
  }

  let userId = null;
  let userName = '';

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    userId = payload.id;
    const userResponse = await fetch('/api/auth/check', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const userData = await userResponse.json();
    if (userData.authenticated) {
      userName = userData.user.nome;
    } else {
      showNotification('Sessão expirada. Faça login novamente.', 'error');
      localStorage.removeItem('techvault-token');
      setTimeout(() => { window.location.href = '/login'; }, 1200);
      return;
    }
  } catch {
    showNotification('Erro de autenticação. Faça login novamente.', 'error');
    setTimeout(() => { window.location.href = '/login'; }, 1200);
    return;
  }

  try {
    const response = await fetch('/api/products/' + currentProduct.id + '/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userName, rating: selectedRating, comment })
    });

    const data = await response.json();

    if (data.success) {
      text.value = '';
      selectedRating = 0;
      document.querySelectorAll('#starsInput i').forEach(s => s.className = 'far fa-star');
      document.getElementById('charCount').textContent = '0/500';
      showNotification('Comentário enviado com sucesso!', 'success');
      await loadComments(currentProduct.id);
    } else {
      showNotification(data.error || 'Erro ao enviar comentário', 'error');
    }
  } catch (error) {
    console.error('Erro ao enviar comentário:', error);
    showNotification('Erro ao enviar comentário', 'error');
  }
}

async function loadProduct(productId) {
  try {
    const response = await fetch('/api/products/' + productId);
    const product = await response.json();
    
    if (product.error) {
      document.getElementById('productContent').innerHTML = 
        '<div class="loading">' +
        '<i class="fas fa-exclamation-circle"></i>' +
        '<p>Produto não encontrado</p>' +
        '<a href="/" class="btn btn-primary" style="display: inline-block; margin-top: 20px; text-decoration: none;">Voltar ao início</a>' +
        '</div>';
      return;
    }
    
    currentProduct = product;
    selectedVariant = null;
    selectedVariantIndex = null;
    selectedColor = null;
    selectedColorIndex = null;
    baseSpecs = product.especificacoes ? { ...product.especificacoes } : null;
    product.variantes = (product.variantes || []).filter(v => v && ((v.nome && String(v.nome).trim()) || v.imagem || (v.preco && v.preco > 0)));
    const inWish = isInWishlist(product.id);
    
    const breadcrumbCategory = document.getElementById('breadcrumbCategory');
    if (breadcrumbCategory) {
      breadcrumbCategory.textContent = product.categoria;
    }
    
    const specsHtml = buildSpecsHtml(baseSpecs);
    
    // Build variant selector (collapsible)
    let variantHtml = '';
    if (product.variantes && product.variantes.length > 0) {
      const v0 = product.variantes[0];
      const v0Preco = v0.preco || product.preco;
      const showSearch = product.variantes.length > 12;
      variantHtml = '<div class="variant-section" id="variantSection">' +
        '<h3><i class="fas fa-layer-group"></i> Opções do Produto</h3>' +
        '<div class="variant-trigger" id="variantTrigger" onclick="toggleVariantPanel()">' +
          (v0.imagem ? '<img class="variant-trigger-img" id="variantTriggerImg" src="' + escapeHtml(v0.imagem) + '" alt="">' : '') +
          '<div class="variant-trigger-info">' +
            '<div class="variant-trigger-label">Modelo selecionado</div>' +
            '<div class="variant-trigger-name" id="variantTriggerName">' + escapeHtml(v0.nome || product.nome) + '</div>' +
          '</div>' +
          '<div class="variant-trigger-price" id="variantTriggerPrice">R$ ' + v0Preco.toFixed(2).replace('.', ',') + '</div>' +
          '<div class="variant-trigger-chevron"><i class="fas fa-chevron-down"></i></div>' +
        '</div>' +
        '<div class="variant-panel" id="variantPanel">' +
          (showSearch ? '<div class="variant-panel-search"><input type="text" placeholder="Buscar modelo..." oninput="searchVariants(this.value)" onclick="event.stopPropagation()"></div>' : '') +
          '<div class="variant-panel-inner" id="variantPanelInner">';
      product.variantes.forEach(function(v, idx) {
        const selected = idx === 0 ? ' selected' : '';
        variantHtml += '<div class="variant-grid-item' + selected + '" data-variant="' + idx + '" data-name="' + escapeHtml((v.nome || '').toLowerCase()) + '" onclick="selectVariant(' + idx + ')">' +
          (v.imagem ? '<img class="variant-grid-img" src="' + escapeHtml(v.imagem) + '" alt="' + escapeHtml(v.nome || '') + '">' : '') +
          '<div class="variant-grid-name">' + escapeHtml(v.nome || '') + '</div>' +
        '</div>';
      });
      variantHtml += '</div></div></div>';
    }
    
    // Build color selector
    let colorHtml = '';
    if (product.colors && product.colors.length > 0) {
      colorHtml = '<div class="color-section"><h3><i class="fas fa-palette"></i> Cor</h3><div class="color-list">' +
        product.colors.map(function(c, i) {
          const swatch = colorSwatch(c);
          return '<div class="color-item' + (i === 0 ? ' selected' : '') + '" data-color-index="' + i + '" onclick="selectColor(' + i + ')">' +
            (swatch ? '<span class="color-swatch" style="background:' + swatch + ';"></span>' : '<span class="color-swatch color-swatch-text">' + escapeHtml(String(c).charAt(0).toUpperCase()) + '</span>') +
            '<span class="color-name">' + escapeHtml(c) + '</span>' +
          '</div>';
        }).join('') +
      '</div></div>';
    }
    
    const allImages = (product.imagens && product.imagens.length > 0) ? product.imagens : [product.imagem];
    baseGalleryImages = allImages;
    const thumbsHtml = allImages.map((img, i) =>
      '<div class="thumb-item' + (i === 0 ? ' active' : '') + '" data-index="' + i + '" onclick="goToSlide(' + i + ')">' +
        '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(product.nome) + ' ' + (i+1) + '">' +
      '</div>'
    ).join('');

    document.getElementById('productContent').innerHTML = 
      '<div class="product-detail">' +
        '<div class="product-gallery">' +
          '<div class="carousel-container">' +
            '<div class="carousel-track" id="carouselTrack">' +
              allImages.map((img, i) =>
                '<div class="carousel-slide' + (i === 0 ? ' active' : '') + '" data-index="' + i + '">' +
                  '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(product.nome) + ' ' + (i+1) + '">' +
                '</div>'
              ).join('') +
            '</div>' +
            (allImages.length > 1 ?
              '<button class="carousel-arrow carousel-prev" onclick="prevSlide()" aria-label="Anterior"><i class="fas fa-chevron-left"></i></button>' +
              '<button class="carousel-arrow carousel-next" onclick="nextSlide()" aria-label="Próximo"><i class="fas fa-chevron-right"></i></button>' :
            '') +
            '<div class="carousel-counter" id="carouselCounter">1 / ' + allImages.length + '</div>' +
            '<button class="wishlist-btn product-wishlist-btn' + (inWish ? ' active' : '') + '" onclick="event.stopPropagation(); toggleWishlist(' + product.id + ', this)" title="' + (inWish ? 'Remover dos favoritos' : 'Adicionar aos favoritos') + '">' +
              '<i class="' + (inWish ? 'fas' : 'far') + ' fa-heart"></i>' +
            '</button>' +
          '</div>' +
          (allImages.length > 1 ? '<div class="thumbs-row">' + thumbsHtml + '</div>' : '') +
        '</div>' +
        '<div class="product-info-section">' +
          '<h1>' + escapeHtml(product.nome) + '</h1>' +
          '<div class="product-rating-large">' +
            '<div class="stars">' + generateStars(product.avaliacao) + '</div>' +
            '<span class="rating-text">' + product.avaliacao.toFixed(1) + ' (' + product.reviews + ' avaliações)</span>' +
          '</div>' +
          variantHtml +
          colorHtml +
          '<div class="price-section">' +
            '<div class="price" id="productPrice">R$ ' + product.preco.toFixed(2).replace('.', ',') + '</div>' +
            '<div class="shipping-price"><span class="old-shipping">R$ 14,99</span> <span class="free-shipping-badge"><i class="fas fa-truck"></i> Frete Grátis</span></div>' +
            '<div class="stock-info">' + (!product.paused ? '<i class="fas fa-check-circle" style="color:#00a650;"></i> Disponível' : '<i class="fas fa-times-circle" style="color:var(--danger);"></i> <span style="color:var(--danger);">Indisponível</span>') + '</div>' +
          '</div>' +
          '<div class="action-buttons">' +
            '<button class="btn btn-primary" onclick="addToCartFromProduct()"' + (product.paused ? ' disabled' : '') + '>' +
              '<i class="fas fa-cart-plus"></i> Adicionar ao carrinho' +
            '</button>' +
            '<button class="btn btn-success" onclick="buyNow()"' + (product.paused ? ' disabled' : '') + '>' +
              '<i class="fas fa-bolt"></i> Comprar agora' +
            '</button>' +
          '</div>' +
          '<div class="benefits-panel">' +
            '<div class="benefit-item"><i class="fas fa-truck"></i><div><strong>Frete grátis</strong><span>Disponível para este produto</span></div></div>' +
            '<div class="benefit-item"><i class="fas fa-undo"></i><div><strong>Devolução grátis</strong><span>Até 7 dias a partir do recebimento</span></div></div>' +
            '<div class="benefit-item"><i class="fas fa-shield-alt"></i><div><strong>Compra garantida</strong><span>Saia satisfeito ou devolvemos seu dinheiro</span></div></div>' +
            '<div class="benefit-item"><i class="fas fa-fire"></i><div><strong>Mais vendido</strong><span>Entre os produtos da coleção</span></div></div>' +
          '</div>' +
          specsHtml +
          '<div class="description-section">' +
            '<h2>Descrição do Produto</h2>' +
            '<p id="productDescription">' + escapeHtml(product.descricao || 'Descrição não disponível') + '</p>' +
          '</div>' +
        '</div>' +
      '</div>';
    
    // Auto-select first variant
    if (product.variantes && product.variantes.length > 0) {
      selectVariant(0);
    }
    // Auto-select first color
    if (product.colors && product.colors.length > 0) {
      selectColor(0);
    }

    loadRelatedProducts(product.categoria, product.id);
    loadComments(product.id);
    updateCommentAuth();
    if (!product.variantes || product.variantes.length === 0) {
      initCarousel(allImages.length);
    }
  } catch (error) {
    console.error('Erro ao carregar produto:', error);
    document.getElementById('productContent').innerHTML = 
      '<div class="loading">' +
        '<i class="fas fa-exclamation-circle"></i>' +
        '<p>Erro ao carregar produto</p>' +
      '</div>';
  }
}

function generateStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars += '<i class="fas fa-star"></i>';
    } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
      stars += '<i class="fas fa-star-half-alt"></i>';
    } else {
      stars += '<i class="far fa-star"></i>';
    }
  }
  return stars;
}

function selectVariant(idx) {
  if (!currentProduct || !currentProduct.variantes || !currentProduct.variantes[idx]) return;
  selectedVariant = currentProduct.variantes[idx];
  selectedVariantIndex = idx;
  
  // Update price (use || to fallback to main price when variant preco is 0)
  const priceEl = document.getElementById('productPrice');
  if (priceEl) {
    const displayPrice = selectedVariant.preco || currentProduct.preco;
    priceEl.textContent = 'R$ ' + displayPrice.toFixed(2).replace('.', ',');
  }

  // Update description with subcategory-specific text
  const descEl = document.getElementById('productDescription');
  if (descEl) {
    descEl.textContent = selectedVariant.descricao || currentProduct.descricao || 'Descrição não disponível';
  }

  // Update gallery with the subcategory's photos (falls back to product photos)
  applyVariantGallery(selectedVariant);
  
  // Update trigger card
  const triggerImg = document.getElementById('variantTriggerImg');
  const triggerName = document.getElementById('variantTriggerName');
  const triggerPrice = document.getElementById('variantTriggerPrice');
  if (triggerImg && selectedVariant.imagem) triggerImg.src = selectedVariant.imagem;
  if (triggerName) triggerName.textContent = selectedVariant.nome || currentProduct.nome;
  if (triggerPrice) triggerPrice.textContent = 'R$ ' + (selectedVariant.preco || currentProduct.preco).toFixed(2).replace('.', ',');
  
  // Highlight selected in grid
  document.querySelectorAll('.variant-grid-item').forEach(function(el) {
    el.classList.remove('selected');
  });
  const gridItems = document.querySelectorAll('.variant-grid-item');
  if (gridItems[idx]) gridItems[idx].classList.add('selected');
  
  // Collapse panel after selection
  closeVariantPanel();
  
  // Update specs table with variant-specific values
  if (baseSpecs && selectedVariant.especificacoes) {
    const mergedSpecs = Object.assign({}, baseSpecs, selectedVariant.especificacoes);
    const newSpecsHtml = buildSpecsHtml(mergedSpecs);
    const specsSection = document.getElementById('specsSection');
    if (specsSection) {
      specsSection.outerHTML = newSpecsHtml;
    }
  }
}

function toggleVariantPanel() {
  var panel = document.getElementById('variantPanel');
  var trigger = document.getElementById('variantTrigger');
  if (!panel || !trigger) return;
  var isOpen = panel.classList.contains('open');
  if (isOpen) {
    closeVariantPanel();
  } else {
    panel.classList.add('open');
    trigger.classList.add('open');
  }
}

function closeVariantPanel() {
  var panel = document.getElementById('variantPanel');
  var trigger = document.getElementById('variantTrigger');
  if (panel) panel.classList.remove('open');
  if (trigger) trigger.classList.remove('open');
}

function searchVariants(query) {
  var items = document.querySelectorAll('.variant-grid-item');
  var q = (query || '').toLowerCase().trim();
  items.forEach(function(el) {
    var name = el.getAttribute('data-name') || '';
    el.style.display = (!q || name.indexOf(q) !== -1) ? '' : 'none';
  });
}

function selectColor(idx) {
  if (!currentProduct || !currentProduct.colors || !currentProduct.colors[idx]) return;
  selectedColor = currentProduct.colors[idx];
  selectedColorIndex = idx;
  document.querySelectorAll('.color-item').forEach(function(el, i) {
    el.classList.toggle('selected', i === idx);
  });
}

function applyVariantGallery(variant) {
  let images;
  if (variant && variant.imagem) {
    images = [variant.imagem];
  } else {
    images = baseGalleryImages.length > 0 ? baseGalleryImages : [currentProduct.imagem];
  }
  rebuildGallery(images);
}

function rebuildGallery(images) {
  const track = document.getElementById('carouselTrack');
  if (!track || !images || !images.length) return;
  const hasMulti = images.length > 1;
  track.innerHTML = images.map((img, i) =>
    '<div class="carousel-slide' + (i === 0 ? ' active' : '') + '" data-index="' + i + '">' +
      '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(currentProduct.nome) + ' ' + (i + 1) + '">' +
    '</div>').join('');
  const thumbsRow = document.querySelector('.thumbs-row');
  if (thumbsRow) {
    thumbsRow.innerHTML = images.map((img, i) =>
      '<div class="thumb-item' + (i === 0 ? ' active' : '') + '" data-index="' + i + '" onclick="goToSlide(' + i + ')">' +
        '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(currentProduct.nome) + ' ' + (i + 1) + '">' +
      '</div>').join('');
    thumbsRow.style.display = hasMulti ? '' : 'none';
  }
  document.querySelectorAll('.carousel-arrow').forEach(function(arrow) {
    arrow.style.display = hasMulti ? '' : 'none';
  });
  initCarousel(images.length);
}

function getSelectedVariantData() {
  if (!currentProduct) return null;
  if (selectedVariant) {
    const idx = selectedVariantIndex != null ? selectedVariantIndex : 0;
    return {
      id: currentProduct.id,
      cartKey: currentProduct.id + '-v' + idx + (selectedColorIndex != null ? '-c' + selectedColorIndex : ''),
      variantIndex: idx,
      cor: selectedColor || null,
      nome: selectedVariant.nome || currentProduct.nome,
      preco: selectedVariant.preco || currentProduct.preco,
      imagem: selectedVariant.imagem || currentProduct.imagem,
      quantidade: 1,
      categoria: currentProduct.categoria,
      variantSpecs: selectedVariant.especificacoes || null
    };
  }
  return {
    id: currentProduct.id,
    cartKey: currentProduct.id + (selectedColorIndex != null ? '-c' + selectedColorIndex : ''),
    cor: selectedColor || null,
    nome: currentProduct.nome,
    preco: currentProduct.preco,
    imagem: currentProduct.imagem,
    quantidade: 1,
    categoria: currentProduct.categoria
  };
}

var carouselIndex = 0;
var totalCarouselSlides = 0;

function initCarousel(totalSlides) {
  totalCarouselSlides = totalSlides;
  carouselIndex = 0;
  var track = document.getElementById('carouselTrack');
  if (!track) return;
  updateCarouselPosition();
  setupSwipe();
}

function updateCarouselPosition() {
  var track = document.getElementById('carouselTrack');
  var counter = document.getElementById('carouselCounter');
  if (!track) return;
  track.style.transform = 'translateX(-' + (carouselIndex * 100) + '%)';
  document.querySelectorAll('.carousel-slide').forEach(function(slide, i) {
    slide.classList.toggle('active', i === carouselIndex);
  });
  document.querySelectorAll('.thumb-item').forEach(function(thumb, i) {
    thumb.classList.toggle('active', i === carouselIndex);
  });
  if (counter) counter.textContent = (carouselIndex + 1) + ' / ' + totalCarouselSlides;
}

function nextSlide() {
  carouselIndex = (carouselIndex + 1) % totalCarouselSlides;
  updateCarouselPosition();
}

function prevSlide() {
  carouselIndex = (carouselIndex - 1 + totalCarouselSlides) % totalCarouselSlides;
  updateCarouselPosition();
}

function goToSlide(index) {
  carouselIndex = index;
  updateCarouselPosition();
}

function setupSwipe() {
  var track = document.getElementById('carouselTrack');
  if (!track) return;
  var startX = 0;
  var distX = 0;
  var threshold = 50;

  track.addEventListener('touchstart', function(e) {
    startX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchmove', function(e) {
    distX = e.touches[0].clientX - startX;
  }, { passive: true });

  track.addEventListener('touchend', function() {
    if (Math.abs(distX) > threshold) {
      if (distX < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    distX = 0;
  });
}

function changeMainImage(src, thumbEl) {
  if (thumbEl && thumbEl.dataset && thumbEl.dataset.index !== undefined) {
    goToSlide(parseInt(thumbEl.dataset.index));
  }
}

function addToCartFromProduct() {
  if (!currentProduct) return;
  const cartItem = getSelectedVariantData();
  addToCart(cartItem);
}

function buyNow() {
  addToCartFromProduct();
  window.location.href = '/checkout';
}

function searchProducts() {
  const query = document.getElementById('searchInput').value;
  if (query.trim()) {
    window.location.href = '/busca?q=' + encodeURIComponent(query);
  }
}

var searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchProducts();
    }
  });
}

// Close variant panel when clicking outside
document.addEventListener('click', function(e) {
  var section = document.getElementById('variantSection');
  if (section && !section.contains(e.target)) {
    closeVariantPanel();
  }
});

/* Lightbox */
var lightboxIndex = 0;
var lightboxImages = [];

function openLightbox(idx) {
  var track = document.getElementById('carouselTrack');
  if (!track) return;
  var slides = track.querySelectorAll('.carousel-slide');
  lightboxImages = [];
  slides.forEach(function(slide) {
    var img = slide.querySelector('img');
    if (img) lightboxImages.push(img.src);
  });
  if (!lightboxImages.length) return;
  lightboxIndex = idx || 0;
  var overlay = document.getElementById('lightbox');
  var lbImg = document.getElementById('lightboxImg');
  var counter = document.getElementById('lightboxCounter');
  lbImg.src = lightboxImages[lightboxIndex];
  counter.textContent = (lightboxIndex + 1) + ' / ' + lightboxImages.length;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  // hide arrows if only 1 image
  var arrows = overlay.querySelectorAll('.lightbox-arrow');
  arrows.forEach(function(a) { a.style.display = lightboxImages.length > 1 ? '' : 'none'; });
  counter.style.display = lightboxImages.length > 1 ? '' : 'none';
}

function closeLightbox(e) {
  if (e && e.target !== e.currentTarget && !e.target.closest('.lightbox-close')) return;
  var overlay = document.getElementById('lightbox');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

function lightboxPrev(e) {
  if (e) e.stopPropagation();
  lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
  updateLightbox();
}

function lightboxNext(e) {
  if (e) e.stopPropagation();
  lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
  updateLightbox();
}

function updateLightbox() {
  var lbImg = document.getElementById('lightboxImg');
  var counter = document.getElementById('lightboxCounter');
  lbImg.src = lightboxImages[lightboxIndex];
  counter.textContent = (lightboxIndex + 1) + ' / ' + lightboxImages.length;
}

// Event delegation: click on carousel slide image opens lightbox
document.addEventListener('click', function(e) {
  var slideImg = e.target.closest('.carousel-slide img');
  if (slideImg) {
    e.preventDefault();
    e.stopPropagation();
    var slide = slideImg.closest('.carousel-slide');
    if (slide) openLightbox(parseInt(slide.dataset.index) || 0);
  }
});

// Keyboard: Escape closes, arrows navigate
document.addEventListener('keydown', function(e) {
  var overlay = document.getElementById('lightbox');
  if (!overlay || !overlay.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox({ currentTarget: overlay, target: overlay });
  if (e.key === 'ArrowLeft') lightboxPrev();
  if (e.key === 'ArrowRight') lightboxNext();
});

// Touch swipe on lightbox
(function() {
  var startX = 0;
  var overlay = document.getElementById('lightbox');
  if (!overlay) return;
  overlay.addEventListener('touchstart', function(e) {
    startX = e.touches[0].clientX;
  }, { passive: true });
  overlay.addEventListener('touchend', function(e) {
    var diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) lightboxNext();
      else lightboxPrev();
    }
  }, { passive: true });
})();