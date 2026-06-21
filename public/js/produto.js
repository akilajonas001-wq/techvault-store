// Carregar produto
let currentProduct = null;

document.addEventListener('DOMContentLoaded', async () => {
  const productId = window.location.pathname.split('/').pop();
  await loadProduct(productId);
});

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
    
    const breadcrumbCategory = document.getElementById('breadcrumbCategory');
    if (breadcrumbCategory) {
      breadcrumbCategory.textContent = product.categoria;
    }
    
    document.getElementById('productContent').innerHTML = 
      '<div class="product-detail">' +
        '<div class="product-gallery">' +
          '<div class="main-image">' +
            '<i class="fas ' + product.imagem + '"></i>' +
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