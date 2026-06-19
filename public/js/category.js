// Página de Categoria
const categoryNames = {
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

// Produtos de exemplo por categoria
const categoryProducts = {
  'processadores': [
    { id: 101, nome: 'AMD Ryzen 7 7800X3D', categoria: 'Processadores', preco: 2899.90, imagem: 'fa-microchip' },
    { id: 102, nome: 'Intel Core i9-14900K', categoria: 'Processadores', preco: 3299.90, imagem: 'fa-microchip' },
    { id: 103, nome: 'AMD Ryzen 5 7600X', categoria: 'Processadores', preco: 1599.90, imagem: 'fa-microchip' },
    { id: 104, nome: 'Intel Core i5-14600K', categoria: 'Processadores', preco: 1899.90, imagem: 'fa-microchip' }
  ],
  'ram': [
    { id: 201, nome: 'Memória RAM DDR5 32GB (2x16GB) 6000MHz', categoria: 'RAM', preco: 899.90, imagem: 'fa-memory' },
    { id: 202, nome: 'Memória RAM DDR4 16GB (2x8GB) 3200MHz', categoria: 'RAM', preco: 349.90, imagem: 'fa-memory' },
    { id: 203, nome: 'Memória RAM DDR5 16GB 5200MHz', categoria: 'RAM', preco: 449.90, imagem: 'fa-memory' }
  ],
  'ssds': [
    { id: 301, nome: 'SSD NVMe 1TB Kingston KC3000', categoria: 'SSDs', preco: 549.90, imagem: 'fa-hdd' },
    { id: 302, nome: 'SSD NVMe 2TB Samsung 980 Pro', categoria: 'SSDs', preco: 899.90, imagem: 'fa-hdd' },
    { id: 303, nome: 'SSD SATA 480GB Kingston A400', categoria: 'SSDs', preco: 199.90, imagem: 'fa-hdd' }
  ],
  'hds': [
    { id: 401, nome: 'HD 1TB Seagate Barracuda', categoria: 'HDs', preco: 249.90, imagem: 'fa-database' },
    { id: 402, nome: 'HD 2TB WD Blue', categoria: 'HDs', preco: 349.90, imagem: 'fa-database' },
    { id: 403, nome: 'HD 4TB Seagate IronWolf', categoria: 'HDs', preco: 599.90, imagem: 'fa-database' }
  ],
  'monitores': [
    { id: 501, nome: 'Monitor Gamer 27" 144Hz IPS', categoria: 'Monitores', preco: 1599.90, imagem: 'fa-desktop' },
    { id: 502, nome: 'Monitor Ultrawide 34" 100Hz', categoria: 'Monitores', preco: 2299.90, imagem: 'fa-desktop' },
    { id: 503, nome: 'Monitor 24" Full HD 75Hz', categoria: 'Monitores', preco: 799.90, imagem: 'fa-desktop' }
  ],
  'gabinetes': [
    { id: 601, nome: 'Gabinete Gamer NZXT H510', categoria: 'Gabinetes', preco: 549.90, imagem: 'fa-box' },
    { id: 602, nome: 'Gabinete Corsair 4000D RGB', categoria: 'Gabinetes', preco: 649.90, imagem: 'fa-box' },
    { id: 603, nome: 'Gabinete Minimalista Monte Branco', categoria: 'Gabinetes', preco: 299.90, imagem: 'fa-box' }
  ],
  'pcs-premontados': [
    { id: 701, nome: 'PC Gamer RTX 4060 Ti 16GB', categoria: 'PCs Premontados', preco: 5499.90, imagem: 'fa-computer' },
    { id: 702, nome: 'PC Gamer RTX 4070 Super', categoria: 'PCs Premontados', preco: 7499.90, imagem: 'fa-computer' },
    { id: 703, nome: 'PC Office Intel i5 16GB', categoria: 'PCs Premontados', preco: 2499.90, imagem: 'fa-computer' }
  ],
  'acessorios': [
    { id: 801, nome: 'Headset Gamer 7.1 RGB', categoria: 'Acessórios', preco: 299.90, imagem: 'fa-headset' },
    { id: 802, nome: 'Teclado Mecânico Red Switch', categoria: 'Acessórios', preco: 399.90, imagem: 'fa-keyboard' },
    { id: 803, nome: 'Mouse Gamer 16000 DPI', categoria: 'Acessórios', preco: 199.90, imagem: 'fa-mouse' }
  ],
  'utilitarios': [
    { id: 901, nome: 'Fonte 750W 80 Plus Gold', categoria: 'Utilitários', preco: 599.90, imagem: 'fa-plug' },
    { id: 902, nome: 'Cooler CPU Air Cooler', categoria: 'Utilitários', preco: 249.90, imagem: 'fa-fan' },
    { id: 903, nome: 'Pasta Térmica MX-4', categoria: 'Utilitários', preco: 49.90, imagem: 'fa-syringe' }
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  loadCategory();
});

function loadCategory() {
  const pathParts = window.location.pathname.split('/');
  const categorySlug = pathParts[pathParts.length - 1];
  
  const categoryTitle = document.getElementById('categoryTitle');
  const productsContainer = document.getElementById('categoryProducts');
  
  if (!categoryTitle || !productsContainer) return;
  
  const categoryName = categoryNames[categorySlug] || 'Categoria';
  const products = categoryProducts[categorySlug] || [];
  
  categoryTitle.textContent = categoryName;
  
  if (products.length === 0) {
    productsContainer.innerHTML = `
      <div style="text-align: center; padding: 60px 0; color: var(--text-secondary);">
        <i class="fas fa-box-open" style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;"></i>
        <h2>Nenhum produto nesta categoria ainda</h2>
        <p>Em breve teremos novidades!</p>
      </div>
    `;
    return;
  }
  
  productsContainer.innerHTML = products.map(product => `
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
        </div>
      </div>
    </div>
  `).join('');
}