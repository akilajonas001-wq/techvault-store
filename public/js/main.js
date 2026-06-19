// Configurações globais
const API_URL = '';

// Estado global
let cart = [];
let currentUser = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  loadCart();
  await checkAuth();
  updateCartCount();
});

// Carregar carrinho do localStorage
function loadCart() {
  const savedCart = localStorage.getItem('techvault-cart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
  }
}

// Salvar carrinho no localStorage
function saveCart() {
  localStorage.setItem('techvault-cart', JSON.stringify(cart));
  updateCartCount();
}

// Atualizar contador do carrinho
function updateCartCount() {
  const countElement = document.getElementById('cartCount');
  if (countElement) {
    const totalCount = cart.reduce((sum, item) => sum + item.quantidade, 0);
    countElement.textContent = totalCount;
  }
}

// Verificar autenticação
async function checkAuth() {
  const token = localStorage.getItem('techvault-token');
  
  if (!token) {
    showAuthButtons();
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/api/auth/check`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.authenticated) {
      currentUser = data.user;
      showUserMenu();
    } else {
      localStorage.removeItem('techvault-token');
      showAuthButtons();
    }
  } catch (error) {
    console.error('Erro ao verificar auth:', error);
    showAuthButtons();
  }
}

// Mostrar botões de auth
function showAuthButtons() {
  const authButtons = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  
  if (authButtons) authButtons.style.display = 'flex';
  if (userMenu) userMenu.style.display = 'none';
}

// Mostrar menu do usuário
function showUserMenu() {
  const authButtons = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  const userName = document.getElementById('userName');
  
  if (authButtons) authButtons.style.display = 'none';
  if (userMenu) userMenu.style.display = 'flex';
  if (userName && currentUser) userName.textContent = `Olá, ${currentUser.nome}`;
}

// Logout
function logout() {
  localStorage.removeItem('techvault-token');
  currentUser = null;
  showAuthButtons();
  window.location.href = '/';
}

// Adicionar ao carrinho
function addToCart(produto) {
  const existingItem = cart.find(item => item.id === produto.id);
  
  if (existingItem) {
    existingItem.quantidade += 1;
  } else {
    cart.push({
      ...produto,
      quantidade: 1
    });
  }
  
  saveCart();
  showNotification('Produto adicionado ao carrinho!', 'success');
}

// Remover do carrinho
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  renderCartItems();
}

// Ver carrinho
function viewCart() {
  const modal = document.getElementById('cartModal');
  if (modal) {
    renderCartItems();
    modal.classList.add('active');
  }
}

// Fechar carrinho
function closeCart() {
  const modal = document.getElementById('cartModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Renderizar itens do carrinho
function renderCartItems() {
  const cartItemsContainer = document.getElementById('cartItems');
  const cartTotalElement = document.getElementById('cartTotal');
  
  if (!cartItemsContainer) return;
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="cart-empty">Seu carrinho está vazio</p>';
    if (cartTotalElement) cartTotalElement.textContent = 'R$ 0,00';
    return;
  }
  
  let total = 0;
  cartItemsContainer.innerHTML = cart.map(item => {
    const subtotal = item.preco * item.quantidade;
    total += subtotal;
    return `
      <div class="cart-item">
        <div>
          <strong>${item.nome}</strong><br>
          <small>${item.quantidade}x R$ ${item.preco.toFixed(2)}</small>
        </div>
        <div>
          <span>R$ ${subtotal.toFixed(2)}</span>
          <button onclick="removeFromCart(${item.id})" style="margin-left: 10px; background: var(--error); color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  if (cartTotalElement) {
    cartTotalElement.textContent = `R$ ${total.toFixed(2)}`;
  }
}

// Mostrar notificação
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : 'var(--primary-color)'};
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    z-index: 3000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Formatar moeda
function formatCurrency(value) {
  return `R$ ${value.toFixed(2)}`;
}

// Scroll suave
function scrollToProducts() {
  document.querySelector('.products-section').scrollIntoView({ 
    behavior: 'smooth' 
  });
}

// Mostrar ofertas
function showOffers() {
  document.querySelector('.products-section').scrollIntoView({ 
    behavior: 'smooth' 
  });
}

// Ir para checkout
function proceedToCheckout() {
  if (cart.length === 0) {
    showNotification('Seu carrinho está vazio', 'error');
    return;
  }
  window.location.href = '/checkout';
}