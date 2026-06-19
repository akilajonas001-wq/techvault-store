// Produtos em destaque (exemplo - será substituído por banco de dados depois)
const featuredProducts = [
  {
    id: 1,
    nome: 'Processador AMD Ryzen 7 7800X3D',
    categoria: 'Processadores',
    preco: 2899.90,
    imagem: 'fa-microchip'
  },
  {
    id: 2,
    nome: 'Memória RAM DDR5 32GB (2x16GB) 6000MHz',
    categoria: 'RAM',
    preco: 899.90,
    imagem: 'fa-memory'
  },
  {
    id: 3,
    nome: 'SSD NVMe 1TB Kingston KC3000',
    categoria: 'SSDs',
    preco: 549.90,
    imagem: 'fa-hdd'
  },
  {
    id: 4,
    nome: 'Monitor Gamer 27" 144Hz IPS',
    categoria: 'Monitores',
    preco: 1599.90,
    imagem: 'fa-desktop'
  },
  {
    id: 5,
    nome: 'PC Gamer Completo RTX 4060 Ti',
    categoria: 'PCs Premontados',
    preco: 5499.90,
    imagem: 'fa-computer'
  },
  {
    id: 6,
    nome: 'Headset Gamer 7.1 RGB',
    categoria: 'Acessórios',
    preco: 299.90,
    imagem: 'fa-headset'
  }
];

// Carregar produtos em destaque
document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedProducts();
});

function loadFeaturedProducts() {
  const container = document.getElementById('featuredProducts');
  if (!container) return;
  
  container.innerHTML = featuredProducts.map(product => `
    <div class="product-card">
      <div class="product-image">
        <i class="fas ${product.imagem}"></i>
      </div>
      <div class="product-info">
        <div class="product-category">${product.categoria}</div>
        <h3 class="product-name">${product.nome}</h3>
        <div class="product-price">R$ ${product.preco.toFixed(2)}</div>
        <div class="product-actions">
          <button class="btn btn-primary" onclick='addToCart(${JSON.stringify(product)})'>
            <i class="fas fa-cart-plus"></i> Adicionar
          </button>
          <button class="btn btn-outline" onclick="viewProduct(${product.id})">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function viewProduct(productId) {
  showNotification('Detalhes do produto em breve!', 'info');
}