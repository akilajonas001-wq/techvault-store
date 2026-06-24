const API_URL = '';

let cart = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  loadCart();
  await checkAuth();
  updateCartCount();
  initScrollReveal();
  initBackToTop();
});

function loadCart() {
  const savedCart = localStorage.getItem('techvault-cart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
  }
}

function saveCart() {
  localStorage.setItem('techvault-cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const countElement = document.getElementById('cartCount');
  if (countElement) {
    const totalCount = cart.reduce((sum, item) => sum + item.quantidade, 0);
    countElement.textContent = totalCount;
    countElement.style.transform = 'scale(1.3)';
    setTimeout(() => { countElement.style.transform = 'scale(1)'; }, 200);
  }
}

async function checkAuth() {
  const token = localStorage.getItem('techvault-token');

  if (!token) {
    showAuthButtons();
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/check`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (data.authenticated) {
      currentUser = data.user;
      showUserMenu();
      syncCartToServer();
    } else {
      localStorage.removeItem('techvault-token');
      showAuthButtons();
    }
  } catch (error) {
    console.error('Erro ao verificar auth:', error);
    showAuthButtons();
  }
}

function showAuthButtons() {
  const authButtons = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav a[href="/login"], .mobile-nav a[href="/registro"]');

  if (authButtons) authButtons.style.display = 'flex';
  if (userMenu) userMenu.style.display = 'none';
  mobileNavLinks.forEach(el => el.style.display = 'flex');
  const mobileLogout = document.querySelector('.mobile-nav .mobile-logout');
  if (mobileLogout) mobileLogout.remove();
  const mobileMyAccount = document.querySelector('.mobile-nav .mobile-myaccount');
  if (mobileMyAccount) mobileMyAccount.style.display = 'flex';
}

function showUserMenu() {
  const authButtons = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  const userName = document.getElementById('userName');

  if (authButtons) authButtons.style.display = 'none';
  if (userMenu) {
    userMenu.style.display = 'flex';
    let adminLink = '';
    if (currentUser && currentUser.admin) {
      adminLink = `<a href="/painel" style="font-size: 14px; font-weight: 600; color: #1a73e8; text-decoration: none; transition: color 0.2s; display: flex; align-items: center; gap: 4px;"><i class="fas fa-shield-alt"></i> Painel</a>`;
    }
    userMenu.innerHTML = `
      <a href="/conta" style="font-size: 14px; font-weight: 500; color: var(--text-light); text-decoration: none; transition: color 0.2s;">Minha Conta</a>
      ${adminLink}
      <a href="#" onclick="logout()" style="font-size: 14px; color: var(--text-light); text-decoration: none;">Sair</a>
    `;
  }
  if (userName && currentUser) userName.textContent = `Olá, ${currentUser.nome}`;

  // Update mobile nav
  const mobileNav = document.getElementById('mobileNav');
  if (mobileNav) {
    const loginLink = mobileNav.querySelector('a[href="/login"]');
    const registerLink = mobileNav.querySelector('a[href="/registro"]');
    const myAccountLink = mobileNav.querySelector('a[href="/conta"]');
    const existingLogout = mobileNav.querySelector('.mobile-logout');
    const existingAdminLink = mobileNav.querySelector('.mobile-admin-link');
    if (loginLink) loginLink.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';
    if (myAccountLink) myAccountLink.style.display = 'flex';
    if (!existingLogout) {
      const logoutLink = document.createElement('a');
      logoutLink.href = '#';
      logoutLink.className = 'mobile-logout';
      logoutLink.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair';
      logoutLink.onclick = (e) => { e.preventDefault(); logout(); };
      myAccountLink?.after(logoutLink);
    }
    if (currentUser && currentUser.admin && !existingAdminLink) {
      const adminLink = document.createElement('a');
      adminLink.href = '/painel';
      adminLink.className = 'mobile-admin-link';
      adminLink.innerHTML = '<i class="fas fa-shield-alt" style="color:#1a73e8"></i> Painel Admin';
      adminLink.onclick = () => { toggleMobileMenu(); };
      myAccountLink?.after(adminLink);
    }
    if (existingAdminLink && (!currentUser || !currentUser.admin)) {
      existingAdminLink.remove();
    }
  }
}

function logout() {
  localStorage.removeItem('techvault-token');
  currentUser = null;
  showAuthButtons();
  const mobileNav = document.getElementById('mobileNav');
  if (mobileNav) {
    const loginLink = mobileNav.querySelector('a[href="/login"]');
    const registerLink = mobileNav.querySelector('a[href="/registro"]');
    const myAccountLink = mobileNav.querySelector('a[href="/conta"]');
    const logoutLink = mobileNav.querySelector('.mobile-logout');
    if (loginLink) loginLink.style.display = 'flex';
    if (registerLink) registerLink.style.display = 'flex';
    if (myAccountLink) myAccountLink.style.display = 'none';
    if (logoutLink) logoutLink.remove();
  }
  window.location.href = '/';
}

// Sincronizar carrinho com o servidor (para admin ver carrinhos ativos)
async function syncCartToServer() {
  const token = localStorage.getItem('techvault-token');
  if (!token || !currentUser) return;
  try {
    await fetch('/api/cart/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ items: cart })
    });
  } catch (e) { /* silencioso */ }
}

function addToCart(produto) {
  const existingItem = cart.find(item => item.id === produto.id);

  if (existingItem) {
    existingItem.quantidade += 1;
  } else {
    cart.push({ ...produto, quantidade: 1 });
  }

  saveCart();
  syncCartToServer();
  showNotification(`${produto.nome} adicionado ao carrinho!`, 'success');
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  syncCartToServer();
  renderCartItems();
}

function viewCart() {
  const modal = document.getElementById('cartModal');
  if (modal) {
    renderCartItems();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeCart() {
  const modal = document.getElementById('cartModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

document.addEventListener('click', (e) => {
  const modal = document.getElementById('cartModal');
  if (modal && modal.classList.contains('active') && e.target === modal) {
    closeCart();
  }
});

function renderCartItems() {
  const cartItemsContainer = document.getElementById('cartItems');
  const cartTotalElement = document.getElementById('cartTotal');

  if (!cartItemsContainer) return;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <i class="fas fa-shopping-cart" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
        <p style="font-size: 18px; font-weight: 500;">Seu carrinho está vazio</p>
        <p style="font-size: 14px; margin-top: 8px;">Adicione produtos para começar</p>
      </div>`;
    if (cartTotalElement) cartTotalElement.textContent = 'R$ 0,00';
    return;
  }

  let total = 0;
  cartItemsContainer.innerHTML = cart.map(item => {
    const subtotal = item.preco * item.quantidade;
    total += subtotal;
    let specsInfo = '';
    if (item.variantSpecs) {
      const specs = Object.values(item.variantSpecs).filter(Boolean).join(' | ');
      if (specs) specsInfo = '<div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">' + specs + '</div>';
    }
    return `
      <div class="cart-item" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--border);">
        <div style="flex: 1;">
          <strong style="font-size: 14px; color: var(--text);">${item.nome}</strong>
          ${specsInfo}
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
            <button onclick="changeQuantity('${item.id}', -1)" style="width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-cool); cursor: pointer; font-size: 14px; color: var(--text); display: flex; align-items: center; justify-content: center; transition: all 0.2s;">−</button>
            <span style="font-weight: 600; min-width: 24px; text-align: center;">${item.quantidade}</span>
            <button onclick="changeQuantity('${item.id}', 1)" style="width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-cool); cursor: pointer; font-size: 14px; color: var(--text); display: flex; align-items: center; justify-content: center; transition: all 0.2s;">+</button>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 700; color: var(--text); font-size: 16px;">R$ ${subtotal.toFixed(2).replace('.', ',')}</div>
          <button onclick="removeFromCart('${item.id}')" style="margin-top: 8px; background: none; border: none; color: #ef4444; cursor: pointer; font-size: 13px; transition: all 0.2s;">
            <i class="fas fa-trash-alt"></i> Remover
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (cartTotalElement) {
    cartTotalElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
  }
}

function changeQuantity(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.quantidade += delta;
  if (item.quantidade <= 0) {
    removeFromCart(productId);
  } else {
    saveCart();
    syncCartToServer();
    renderCartItems();
  }
}

function showNotification(message, type = 'info') {
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle'
  };

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    setTimeout(() => notification.remove(), 400);
  }, 3000);
}

function formatCurrency(value) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function scrollToProducts() {
  document.querySelector('.products-section')?.scrollIntoView({ behavior: 'smooth' });
}

function showOffers() {
  document.querySelector('.products-section')?.scrollIntoView({ behavior: 'smooth' });
}

function proceedToCheckout() {
  if (cart.length === 0) {
    showNotification('Seu carrinho está vazio', 'error');
    return;
  }
  window.location.href = '/checkout';
}

function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children').forEach(el => {
    observer.observe(el);
  });
}

function initBackToTop() {
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  btn.setAttribute('aria-label', 'Voltar ao topo');
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Newsletter
async function subscribeNewsletter(email) {
  try {
    const response = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    if (data.success) {
      showNotification('Inscrição realizada com sucesso!', 'success');
      return true;
    } else {
      showNotification(data.error || 'Erro ao inscrever', 'error');
      return false;
    }
  } catch {
    showNotification('Erro de conexão', 'error');
    return false;
  }
}

// Wishlist
function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem('techvault-wishlist') || '[]');
  } catch { return []; }
}

function saveWishlist(list) {
  localStorage.setItem('techvault-wishlist', JSON.stringify(list));
}

function toggleWishlist(productId, btn) {
  let list = getWishlist();
  const idx = list.indexOf(productId);
  if (idx > -1) {
    list.splice(idx, 1);
    btn.classList.remove('active');
    btn.querySelector('i').className = 'far fa-heart';
    showNotification('Removido dos favoritos', 'info');
  } else {
    list.push(productId);
    btn.classList.add('active');
    btn.querySelector('i').className = 'fas fa-heart';
    showNotification('Adicionado aos favoritos!', 'success');
  }
  saveWishlist(list);
}

function isInWishlist(productId) {
  return getWishlist().includes(productId);
}
