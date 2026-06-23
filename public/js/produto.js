// Carregar produto
let currentProduct = null;
let selectedRating = 0;
let currentUserId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const productId = window.location.pathname.split('/').pop();
  await loadProduct(productId);
  initStarRating();
  document.getElementById('commentText')?.addEventListener('input', function() {
    document.getElementById('charCount').textContent = this.value.length + '/500';
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
          '<img src="' + p.imagem + '" alt="' + p.nome + '" loading="lazy">' +
        '</div>' +
        '<div class="related-product-info">' +
          '<div class="related-product-name">' + p.nome + '</div>' +
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
            '<div class="comment-avatar">' + initials + '</div>' +
            '<div class="comment-user-info">' +
              '<span class="comment-user-name">' + c.userName + '</span>' +
              '<span class="comment-date">' + date + '</span>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<div class="comment-stars">' + stars + '</div>' +
            (canDelete ? '<button class="comment-delete-btn" onclick="deleteComment(' + c.id + ')" title="Remover comentário"><i class="fas fa-trash-alt"></i></button>' : '') +
          '</div>' +
        '</div>' +
        '<div class="comment-text">' + c.comment + '</div>' +
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
      el.innerHTML = 'Comentando como <strong>' + (payload.email || 'usuário') + '</strong>';
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
    const inWish = isInWishlist(product.id);
    
    const breadcrumbCategory = document.getElementById('breadcrumbCategory');
    if (breadcrumbCategory) {
      breadcrumbCategory.textContent = product.categoria;
    }
    
    document.getElementById('productContent').innerHTML = 
      '<div class="product-detail">' +
        '<div class="product-gallery">' +
          '<div class="main-image">' +
            '<img src="' + product.imagem + '" alt="' + product.nome + '">' +
            '<button class="wishlist-btn product-wishlist-btn' + (inWish ? ' active' : '') + '" onclick="event.stopPropagation(); toggleWishlist(' + product.id + ', this)" title="' + (inWish ? 'Remover dos favoritos' : 'Adicionar aos favoritos') + '">' +
              '<i class="' + (inWish ? 'fas' : 'far') + ' fa-heart"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="product-info-section">' +
          '<h1>' + product.nome + '</h1>' +
          '<div class="product-rating-large">' +
            '<div class="stars">' + generateStars(product.avaliacao) + '</div>' +
            '<span class="rating-text">' + product.avaliacao.toFixed(1) + ' (' + product.reviews + ' avaliações)</span>' +
          '</div>' +
          '<div class="price-section">' +
            '<div class="price">R$ ' + product.preco.toFixed(2).replace('.', ',') + '</div>' +
            (product.frete === 'Grátis' ? '<div class="shipping-info"><i class="fas fa-truck"></i> Frete grátis</div>' : '<div class="shipping-info">' + product.frete + '</div>') +
            '<div class="stock-info"><i class="fas fa-check-circle" style="color: #00a650;"></i> ' + (product.estoque > 0 ? 'Em estoque (' + product.estoque + ' disponíveis)' : 'Produto esgotado') + '</div>' +
          '</div>' +
          '<div class="action-buttons">' +
            '<button class="btn btn-primary" onclick="addToCartFromProduct()">' +
              '<i class="fas fa-cart-plus"></i> Adicionar ao carrinho' +
            '</button>' +
            '<button class="btn btn-success" onclick="buyNow()">' +
              '<i class="fas fa-bolt"></i> Comprar agora' +
            '</button>' +
          '</div>' +
          '<div class="description-section">' +
            '<h2>Descrição do Produto</h2>' +
            '<p>' + (product.descricao || 'Descrição não disponível') + '</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    loadRelatedProducts(product.categoria, product.id);
    loadComments(product.id);
    updateCommentAuth();
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

function addToCartFromProduct() {
  if (!currentProduct) return;
  
  const cartItem = {
    id: currentProduct.id,
    nome: currentProduct.nome,
    preco: currentProduct.preco,
    imagem: currentProduct.imagem,
    quantidade: 1
  };
  
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