const API_URL = '';

let cart = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  loadCart();
  await checkAuth();
  updateCartCount();
  initScrollReveal();
  initBackToTop();
  trackVisit();
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
      initUserChat();
      if (!currentUser.username) {
        showUsernamePrompt();
      }
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
  const mobileUserInfo = document.getElementById('mobileUserInfo');
  const mobileAuthLinks = document.querySelectorAll('.mobile-auth-link');
  const mobileMyAccount = document.querySelector('.mobile-myaccount');
  const mobileLogout = document.querySelector('.mobile-logout');
  const mobileAdminLink = document.querySelector('.mobile-admin-link');

  // Desktop
  if (authButtons) authButtons.style.display = 'flex';
  if (userMenu) {
    userMenu.classList.remove('shown');
    userMenu.innerHTML = '';
    userMenu.style.display = 'none';
  }
  
  // Mobile nav
  if (mobileUserInfo) mobileUserInfo.classList.remove('active');
  mobileAuthLinks.forEach(el => el.style.display = 'flex');
  if (mobileMyAccount) mobileMyAccount.style.display = 'none';
  if (mobileLogout) mobileLogout.style.display = 'none';
  if (mobileAdminLink) mobileAdminLink.style.display = 'none';
}

function showUserMenu() {
  const authButtons = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  const mobileUserInfo = document.getElementById('mobileUserInfo');
  const mobileAuthLinks = document.querySelectorAll('.mobile-auth-link');
  const mobileMyAccount = document.querySelector('.mobile-myaccount');
  const mobileLogout = document.querySelector('.mobile-logout');
  const mobileAdminLink = document.querySelector('.mobile-admin-link');

  // Desktop
  if (authButtons) authButtons.style.display = 'none';
  if (userMenu) {
    userMenu.style.display = '';
    userMenu.classList.add('shown');
    const firstName = (currentUser?.nome || '').split(' ')[0];
    let adminLink = '';
    if (currentUser && currentUser.admin) {
      adminLink = `<a href="/painel" style="order:7;font-size:13px;font-weight:600;color:#1a73e8;text-decoration:none;display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:8px;background:rgba(26,115,232,0.08);transition:all .2s;white-space:nowrap;"><i class="fas fa-shield-alt"></i> Painel</a>`;
    }
    userMenu.innerHTML = `
      <a href="/conta" style="order:1;font-size:13px;font-weight:500;color:var(--text-light);text-decoration:none;transition:color 0.2s;padding:5px 8px;border-radius:6px;white-space:nowrap;">Minha Conta</a>
      <span style="order:2;font-size:13px;font-weight:500;color:var(--text);white-space:nowrap;display:flex;align-items:center;gap:4px;padding:5px 8px;">${firstName}${currentUser?.username ? ' <span style="font-weight:400;color:var(--text-muted);font-size:11px;">(@' + currentUser.username + ')</span>' : ''}</span>
      <div id="notifBell" style="order:5;position:relative;display:inline-flex;align-items:center;cursor:pointer;font-size:16px;color:var(--text-light);padding:5px;" onclick="toggleNotifs()" title="Notificações">
        <i class="far fa-bell"></i>
        <span id="notifCount" style="display:none;position:absolute;top:0;right:0;background:#ef4444;color:white;font-size:9px;font-weight:700;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px;box-shadow:0 2px 4px rgba(0,0,0,.2);">0</span>
      </div>
      ${adminLink}
      <a href="#" onclick="logout()" style="order:8;font-size:13px;color:var(--text-light);text-decoration:none;padding:5px 8px;border-radius:6px;display:flex;align-items:center;gap:4px;white-space:nowrap;"><i class="fas fa-sign-out-alt"></i> Sair</a>
    `;
    checkNotifications();
  }
  
  // Mobile nav
  if (mobileUserInfo) {
    mobileUserInfo.classList.add('active');
    document.getElementById('mobileUserName').textContent = currentUser?.nome || 'Usuário';
    document.getElementById('mobileUserEmail').textContent = currentUser?.email || '';
  }
  mobileAuthLinks.forEach(el => el.style.display = 'none');
  if (mobileMyAccount) mobileMyAccount.style.display = 'flex';
  if (mobileLogout) mobileLogout.style.display = 'flex';
  if (mobileAdminLink && currentUser && currentUser.admin) {
    mobileAdminLink.style.display = 'flex';
  }
}

function logout() {
  localStorage.removeItem('techvault-token');
  currentUser = null;
  showAuthButtons();
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
  const existingItem = cart.find(item => String(item.id) === String(produto.id));

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
  cart = cart.filter(item => String(item.id) !== String(productId));
  saveCart();
  syncCartToServer();
  renderCartItems();
}

function viewCart() {
  const modal = document.getElementById('cartModal');
  if (modal) {
    renderCartItems();
    modal.classList.add('active');
    document.body.dataset.scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${window.scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
  }
}

function closeCart() {
  const modal = document.getElementById('cartModal');
  if (modal) {
    modal.classList.remove('active');
    const scrollY = parseInt(document.body.dataset.scrollY || '0');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    window.scrollTo(0, scrollY);
    delete document.body.dataset.scrollY;
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
  const item = cart.find(i => String(i.id) === String(productId));
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

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 400) {
          btn.classList.add('visible');
        } else {
          btn.classList.remove('visible');
        }
        ticking = false;
      });
      ticking = true;
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

// === MOBILE MENU ===
function toggleMobileMenu() {
  const nav = document.getElementById('mobileNav');
  const overlay = document.getElementById('mobileOverlay');
  const hamburger = document.querySelector('.hamburger');
  if (!nav || !overlay) return;
  const willOpen = !nav.classList.contains('active');
  nav.classList.toggle('active');
  overlay.classList.toggle('active');
  if (hamburger) hamburger.classList.toggle('active');
  if (willOpen) {
    document.body.dataset.scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${window.scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
  } else {
    const scrollY = parseInt(document.body.dataset.scrollY || '0');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    window.scrollTo(0, scrollY);
    delete document.body.dataset.scrollY;
  }
}

function mobileSearch() {
  const input = document.getElementById('mobileSearchInput');
  if (!input) return;
  const query = input.value.trim();
  if (query) {
    window.location.href = `/busca?q=${encodeURIComponent(query)}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('mobileSearchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') mobileSearch();
  });
});

// === CHAT DO USUÁRIO ===
let userChatInterval = null;
let userChatModalActive = false;
let activeConvKey = null;

function initUserChat() {
  if (!currentUser) return;
  loadUnreadCount();

  // Create chat bubble
  if (!document.getElementById('userChatBubble')) {
    const bubble = document.createElement('div');
    bubble.id = 'userChatBubble';
    bubble.innerHTML = '<i class="fas fa-comment-dots"></i><span id="chatBadge" style="display:none">0</span>';
    bubble.onclick = toggleUserChat;
    document.body.appendChild(bubble);
  }

  // Create chat modal
  if (!document.getElementById('userChatModal')) {
    const modal = document.createElement('div');
    modal.id = 'userChatModal';
    modal.className = 'user-chat-modal';
    modal.innerHTML = `
      <div class="user-chat-header">
        <span><i class="fas fa-headset"></i> <span id="userChatTitle">Atendimento</span></span>
        <button onclick="toggleUserChat()"><i class="fas fa-times"></i></button>
      </div>
      <div id="userChatBody" style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
        <div class="user-chat-tabs" id="userChatTabs"></div>
        <div class="user-chat-messages" id="userChatMessages">
          <div class="empty-state" style="padding:30px;"><i class="fas fa-comment-dots"></i><p>Nenhuma mensagem ainda</p></div>
        </div>
        <div class="user-chat-input">
          <input type="text" id="userChatInput" placeholder="Digite sua mensagem..." onkeypress="if(event.key==='Enter') sendUserMessage()">
          <button onclick="sendUserMessage()"><i class="fas fa-paper-plane"></i></button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const style = document.createElement('style');
    style.textContent = `
      #userChatBubble {
        position:fixed;bottom:100px;right:24px;z-index:9999;
        width:56px;height:56px;border-radius:50%;
        background:var(--primary-gradient, linear-gradient(135deg,#1a73e8,#0d47a1));
        color:white;border:none;cursor:pointer;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 4px 20px rgba(0,0,0,0.25);
        font-size:22px;transition:transform .2s, bottom .2s;
      }
      #userChatBubble:hover { transform:scale(1.1); }
      #userChatBubble:active { transform:scale(0.95); }
      #chatBadge {
        position:absolute;top:-4px;right:-4px;
        background:#ef4444;color:white;font-size:11px;
        min-width:20px;height:20px;border-radius:10px;
        display:flex;align-items:center;justify-content:center;
        font-weight:700;padding:0 5px;
      }
      .user-chat-modal {
        position:fixed;bottom:170px;right:24px;z-index:9999;
        width:360px;max-width:calc(100vw - 48px);
        background:white;border-radius:16px;
        box-shadow:0 8px 40px rgba(0,0,0,0.2);
        display:none;flex-direction:column;
        max-height:500px;overflow:hidden;
        font-family:var(--font-family, 'Segoe UI', sans-serif);
        animation:chatFadeIn .2s ease;
      }
      @keyframes chatFadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      .user-chat-modal.active { display:flex; }
      .user-chat-header {
        display:flex;justify-content:space-between;align-items:center;
        padding:12px 16px;background:var(--primary, #1a73e8);color:white;
        font-weight:600;font-size:14px;border-radius:16px 16px 0 0;
      }
      .user-chat-header button {
        background:none;border:none;color:white;font-size:16px;cursor:pointer;padding:4px;
        display:flex;align-items:center;justify-content:center;
      }
      .user-chat-tabs {
        display:flex;gap:2px;background:#f1f5f9;padding:4px 6px 0;
        overflow-x:auto;scrollbar-width:none;flex-shrink:0;
      }
      .user-chat-tabs::-webkit-scrollbar { display:none; }
      .user-chat-tab {
        padding:6px 12px;border-radius:8px 8px 0 0;border:none;
        font-size:11px;font-weight:600;cursor:pointer;
        background:transparent;color:var(--text-muted);
        white-space:nowrap;display:flex;align-items:center;gap:4px;
        font-family:inherit;flex-shrink:0;
      }
      .user-chat-tab:hover { color:var(--text); }
      .user-chat-tab.active { background:white;color:var(--primary);box-shadow:0 -1px 3px rgba(0,0,0,0.05); }
      .user-chat-tab .tab-close { font-size:10px;color:var(--text-muted);margin-left:2px;padding:2px;border-radius:4px; }
      .user-chat-tab .tab-close:hover { background:rgba(239,68,68,0.1);color:var(--error); }
      .user-chat-messages {
        flex:1;padding:12px;overflow-y:auto;
        display:flex;flex-direction:column;gap:6px;
        background:#f8f9fa;min-height:200px;
      }
      .user-chat-input {
        display:flex;gap:6px;padding:10px 12px;
        border-top:1px solid #e2e8f0;
        background:white;border-radius:0 0 16px 16px;
      }
      .user-chat-input input {
        flex:1;padding:8px 12px;border:2px solid #e2e8f0;
        border-radius:10px;font-size:13px;outline:none;
        font-family:inherit;
      }
      .user-chat-input input:focus { border-color:var(--primary, #1a73e8); }
      .user-chat-input button {
        width:38px;height:38px;border-radius:10px;
        background:var(--primary-gradient, linear-gradient(135deg,#1a73e8,#0d47a1));
        color:white;border:none;cursor:pointer;font-size:15px;
        display:flex;align-items:center;justify-content:center;
        flex-shrink:0;
      }
      .user-chat-input button:active { transform:scale(0.95); }
      @media (max-width:768px) {
        #userChatBubble { bottom:80px; right:16px; width:50px; height:50px; font-size:19px; }
        .user-chat-modal { bottom:145px; right:16px; width:calc(100vw - 32px); max-height:60vh; }
      }
      @media (max-width:480px) {
        #userChatBubble { bottom:70px; right:12px; width:46px; height:46px; font-size:17px; }
        .user-chat-modal { bottom:130px; right:12px; width:calc(100vw - 24px); max-height:55vh; }
        .user-chat-messages { min-height:150px; padding:8px; }
        .user-chat-input { padding:8px 10px; }
        .user-chat-input input { padding:6px 10px; font-size:12px; }
        .user-chat-input button { width:34px; height:34px; }
        .user-chat-tab { font-size:10px;padding:4px 8px; }
      }
    `;
    document.head.appendChild(style);
  }

  if (userChatInterval) clearInterval(userChatInterval);
  userChatInterval = setInterval(() => {
    if (!currentUser || document.hidden) return;
    loadUnreadCount();
    if (userChatModalActive) loadSupportMessages();
  }, 15000);
}

async function loadUnreadCount() {
  if (!currentUser) return;
  try {
    const token = localStorage.getItem('techvault-token');
    const res = await fetch('/api/chat/messages/' + encodeURIComponent('support:' + currentUser.id), {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    const msgs = data.messages || [];
    const unread = msgs.filter(m => m.from === 'admin' && !m.read).length;
    const badge = document.getElementById('chatBadge');
    if (badge) {
      if (unread > 0) {
        badge.textContent = unread;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch {}
}

function toggleUserChat() {
  const modal = document.getElementById('userChatModal');
  if (!modal) return;
  userChatModalActive = !modal.classList.contains('active');
  modal.classList.toggle('active');
  if (userChatModalActive) {
    activeConvKey = 'support:' + currentUser.id;
    document.getElementById('userChatTitle').textContent = 'Atendimento';
    loadSupportMessages();
    markMessagesRead(activeConvKey);
  }
}

async function loadSupportMessages() {
  if (!currentUser) return;
  const key = 'support:' + currentUser.id;
  activeConvKey = key;
  try {
    const token = localStorage.getItem('techvault-token');
    const res = await fetch('/api/chat/messages/' + encodeURIComponent(key), {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    renderSupportMessages(data.messages || []);
  } catch { renderSupportMessages([]); }
}

function renderSupportMessages(messages) {
  const container = document.getElementById('userChatMessages');
  const tabs = document.getElementById('userChatTabs');
  if (!container) return;
  if (tabs) tabs.innerHTML = '';
  if (!messages.length) {
    container.innerHTML = '<div class="empty-state" style="padding:30px;"><i class="fas fa-comment-dots"></i><p>Envie uma mensagem para entrar em contato com nosso suporte!</p></div>';
    return;
  }
  container.innerHTML = messages.map(m => {
    const isAdmin = m.from === 'admin';
    const align = isAdmin ? 'flex-start' : 'flex-end';
    const bg = isAdmin ? '#e8f0fe' : 'var(--primary-gradient, linear-gradient(135deg,#1a73e8,#0d47a1))';
    const color = isAdmin ? 'var(--text, #1a1a2e)' : 'white';
    const time = new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const name = isAdmin ? (m.adminName || 'Atendente') : 'Você';
    return '<div style="display:flex;flex-direction:column;align-items:' + align + ';max-width:85%;align-self:' + align + ';">' +
      '<span style="font-size:10px;color:#94a3b8;margin-bottom:2px;">' + name + ' - ' + time + '</span>' +
      '<div style="background:' + bg + ';color:' + color + ';padding:8px 12px;border-radius:14px;' + (isAdmin ? 'border-bottom-left-radius:4px;' : 'border-bottom-right-radius:4px;') + 'box-shadow:0 1px 3px rgba(0,0,0,0.08);font-size:13px;">' +
      m.message +
      '</div></div>';
  }).join('');
  container.scrollTop = container.scrollHeight;
}

async function sendUserMessage() {
  const input = document.getElementById('userChatInput');
  const message = input.value.trim();
  if (!message) return;
  input.value = '';

  try {
    const token = localStorage.getItem('techvault-token');
    const res = await fetch('/api/chat/send/support/' + currentUser.id, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    if (data.success) {
      loadSupportMessages();
    }
  } catch {}
}

async function markMessagesRead(convKey) {
  if (!currentUser || !convKey) return;
  try {
    const token = localStorage.getItem('techvault-token');
    await fetch('/api/chat/read/' + encodeURIComponent(convKey), {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
  } catch {}
}

// Notificações
let notifCount = 0;
let notifInterval = null;

function getToken() {
  return localStorage.getItem('techvault-token');
}

async function checkNotifications() {
  try {
    const token = getToken();
    if (!token) { hideNotifBadge(); return; }
    const res = await fetch('/api/notifications/my', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) { hideNotifBadge(); return; }
    const notifs = await res.json();
    notifCount = notifs.length;
    const badge = document.getElementById('notifCount');
    const bell = document.getElementById('notifBell');
    const mobileBadge = document.getElementById('mobileNotifBadge');
    if (badge) {
      if (notifCount > 0) {
        badge.style.display = 'flex';
        badge.textContent = notifCount > 99 ? '99+' : notifCount;
        if (bell) bell.style.color = '#f59e0b';
      } else {
        hideNotifBadge();
      }
    }
    if (mobileBadge) {
      if (notifCount > 0) {
        mobileBadge.style.display = 'inline';
        mobileBadge.textContent = notifCount > 99 ? '99+' : notifCount;
      } else {
        mobileBadge.style.display = 'none';
      }
    }
  } catch { hideNotifBadge(); }
}

function hideNotifBadge() {
  const badge = document.getElementById('notifCount');
  const bell = document.getElementById('notifBell');
  if (badge) { badge.style.display = 'none'; }
  if (bell) { bell.style.color = ''; }
  const mobileBadge = document.getElementById('mobileNotifBadge');
  if (mobileBadge) { mobileBadge.style.display = 'none'; }
}

function toggleNotifs() {
  const existing = document.getElementById('notifDropdown');
  if (existing) { existing.remove(); return; }

  const bell = document.getElementById('notifBell');
  const dropdown = document.createElement('div');
  dropdown.id = 'notifDropdown';
  dropdown.style.cssText = 'position:fixed;top:' + (bell ? bell.getBoundingClientRect().bottom + 8 : 60) + 'px;right:20px;width:340px;max-height:400px;overflow-y:auto;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.15);z-index:99999;padding:0;';

  dropdown.innerHTML = '<div style="padding:16px;border-bottom:1px solid #e5e7eb;"><strong style="font-size:14px;">Notificações</strong></div>';

  const token = getToken();
  if (!token) { dropdown.innerHTML += '<div style="padding:20px;text-align:center;color:#9ca3af;font-size:13px;">Faça login para ver notificações</div>'; document.body.appendChild(dropdown); return; }

  fetch('/api/notifications/my', { headers: { 'Authorization': 'Bearer ' + token } })
    .then(r => r.json())
    .then(notifs => {
      if (!notifs.length) {
        dropdown.innerHTML += '<div style="padding:20px;text-align:center;color:#9ca3af;font-size:13px;">Nenhuma notificação</div>';
      } else {
        notifs.forEach(n => {
          dropdown.innerHTML += '<div style="padding:12px 16px;border-bottom:1px solid #f3f4f6;cursor:pointer;transition:background .15s;" onmouseover="this.style.background=\'#f9fafb\'" onmouseout="this.style.background=\'\'" onclick="readNotif(\'' + n.id + '\',\'' + (n.couponCode || '') + '\')">' +
            '<div style="font-size:13px;font-weight:600;color:#111;margin-bottom:2px;">' + (n.title || 'Notificação') + '</div>' +
            '<div style="font-size:12px;color:#6b7280;line-height:1.4;">' + (n.message || '') + '</div>' +
            (n.couponCode ? '<div style="margin-top:6px;display:inline-block;background:#fef3c7;color:#d97706;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;">Código: ' + n.couponCode + '</div>' : '') +
          '</div>';
        });
      }
      document.body.appendChild(dropdown);
    })
    .catch(() => {
      dropdown.innerHTML += '<div style="padding:20px;text-align:center;color:#9ca3af;font-size:13px;">Erro ao carregar</div>';
      document.body.appendChild(dropdown);
    });

  document.addEventListener('click', function closeDropdown(e) {
    if (!dropdown.contains(e.target) && e.target.closest('#notifBell') !== document.getElementById('notifBell')) {
      dropdown.remove();
      document.removeEventListener('click', closeDropdown);
    }
  });
}

async function readNotif(notifId, couponCode) {
  try {
    await fetch('/api/notifications/read/' + notifId, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    checkNotifications();
    const dd = document.getElementById('notifDropdown');
    if (dd) dd.remove();
    if (couponCode) {
      window.location.href = '/checkout?coupon=' + couponCode;
    }
  } catch {}
}

// Check notifications when tab becomes visible again
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) checkNotifications();
});

// Modal para escolher nome de usuário (quando Google não fornece)
function showUsernamePrompt() {
  if (document.getElementById('usernamePromptModal')) return;
  const overlay = document.createElement('div');
  overlay.id = 'usernamePromptModal';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(2px);';

  const modal = document.createElement('div');
  modal.style.cssText = 'background:white;border-radius:16px;padding:32px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.2);animation:chatFadeIn .2s ease;text-align:center;';

  modal.innerHTML = `
    <div style="font-size:40px;margin-bottom:12px;">👤</div>
    <h3 style="font-size:18px;font-weight:700;margin-bottom:4px;color:var(--text);">Escolha seu nome de usuário</h3>
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">Você precisa de um nome de usuário único para continuar.</p>
    <input type="text" id="usernamePromptInput" placeholder="Seu nome de usuário" autocomplete="off"
      style="width:100%;padding:12px 16px;border:2px solid var(--border);border-radius:10px;font-size:15px;font-family:inherit;outline:none;text-align:center;margin-bottom:12px;"
      onkeypress="if(event.key==='Enter') submitUsername()">
    <div id="usernamePromptError" style="font-size:13px;color:var(--error);margin-bottom:12px;display:none;"></div>
    <button onclick="submitUsername()" style="width:100%;padding:12px;border:none;border-radius:10px;background:var(--primary-gradient);color:white;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;">
      <i class="fas fa-check"></i> Confirmar
    </button>
    <p style="font-size:11px;color:var(--text-muted);margin-top:12px;">Apenas letras, números e underscore (_). Mínimo 3 caracteres.</p>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('usernamePromptInput')?.focus(), 100);
}

async function submitUsername() {
  const input = document.getElementById('usernamePromptInput');
  const error = document.getElementById('usernamePromptError');
  const username = input.value.trim();

  if (!username || username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    error.textContent = 'Mínimo 3 caracteres. Apenas letras, números e _.';
    error.style.display = 'block';
    return;
  }

  try {
    const res = await fetch('/api/user/set-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
      body: JSON.stringify({ username })
    });
    const data = await res.json();
    if (data.success) {
      currentUser.username = data.username;
      if (data.token) {
        localStorage.setItem('techvault-token', data.token);
      }
      document.getElementById('usernamePromptModal')?.remove();
      showUserMenu();
      showNotification('Nome de usuário salvo permanentemente!', 'success');
    } else {
      error.textContent = data.error || 'Erro ao salvar nome de usuário';
      error.style.display = 'block';
    }
  } catch {
    error.textContent = 'Erro de conexão. Tente novamente.';
    error.style.display = 'block';
  }
}

// === PREVENT HORIZONTAL SWIPE ON MOBILE ===
// Impede que o usuario arraste a tela para o lado
// e revele o menu mobile ou crie barra de rolagem horizontal
function trackVisit() {
  navigator.sendBeacon('/api/visits/track', '');
}

(function() {
  if (!('ontouchstart' in window)) return;

  let startX = 0, startY = 0;

  document.addEventListener('touchstart', function(e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchmove', function(e) {
    if (e.touches.length !== 1) return;
    const dx = Math.abs(e.touches[0].clientX - startX);
    const dy = Math.abs(e.touches[0].clientY - startY);
    if (dx > dy * 1.5 && dx > 15) {
      e.preventDefault();
    }
  }, { passive: false });
})();
