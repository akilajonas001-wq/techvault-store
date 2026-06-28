document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  loadCartItems();
  loadUserData();
  loadUserCoupons();
});

// Verificar autenticação
async function checkAuth() {
  const token = localStorage.getItem('techvault-token');
  
  if (!token) {
    // Redirecionar para login se não estiver autenticado
    window.location.href = '/login?redirect=checkout';
    return;
  }
  
  try {
    const response = await fetch('/api/auth/check', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.authenticated) {
      currentUser = data.user;
    } else {
      localStorage.removeItem('techvault-token');
      window.location.href = '/login?redirect=checkout';
    }
  } catch (error) {
    console.error('Erro ao verificar auth:', error);
    window.location.href = '/login?redirect=checkout';
  }
}

// Carregar dados do usuário (perfil completo)
async function loadUserData() {
  if (!currentUser) return;
  
  try {
    const token = localStorage.getItem('techvault-token');
    const res = await fetch('/api/profile', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return;
    const profile = await res.json();
    
    const fields = {
      nomeCompleto: profile.nome,
      telefone: profile.telefone,
      cep: profile.cep,
      logradouro: profile.logradouro,
      numero: profile.numero,
      complemento: profile.complemento,
      bairro: profile.bairro,
      cidade: profile.cidade,
      estado: profile.estado
    };
    
    for (const [id, value] of Object.entries(fields)) {
      const el = document.getElementById(id);
      if (el && value) el.value = value;
    }
    
    // Se tinha CEP salvo, buscar dados do ViaCEP
    const cepEl = document.getElementById('cep');
    if (cepEl && profile.cep) {
      const cep = profile.cep.replace(/\D/g, '');
      if (cep.length === 8) {
        try {
          const viaRes = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          const data = await viaRes.json();
          if (!data.erro) {
            if (!document.getElementById('logradouro').value) document.getElementById('logradouro').value = data.logradouro || '';
            if (!document.getElementById('bairro').value) document.getElementById('bairro').value = data.bairro || '';
            if (!document.getElementById('cidade').value) document.getElementById('cidade').value = data.localidade || '';
            if (!document.getElementById('estado').value) document.getElementById('estado').value = data.uf || '';
          }
        } catch {}
      }
    }
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
  }
}

// Carregar itens do carrinho
function loadCartItems() {
  const cart = JSON.parse(localStorage.getItem('techvault-cart') || '[]');
  const cartItemsContainer = document.getElementById('orderCartItems');
  const orderTotalElement = document.getElementById('orderTotal');
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="cart-empty">Seu carrinho está vazio</p>';
    if (orderTotalElement) orderTotalElement.textContent = 'R$ 0,00';
    return;
  }
  
  let total = 0;
  cartItemsContainer.innerHTML = cart.map(item => {
    const subtotal = item.preco * item.quantidade;
    total += subtotal;
    let specsInfo = '';
    if (item.variantSpecs) {
      const specs = Object.values(item.variantSpecs).filter(Boolean).join(' | ');
      if (specs) specsInfo = '<br><small style="color: var(--text-muted); font-size: 11px;">' + specs + '</small>';
    }
    return `
      <div class="cart-item">
        <div>
          <strong>${item.nome}</strong><br>
          <small>Categoria: ${item.categoria || 'N/A'} | ${item.quantidade}x R$ ${item.preco.toFixed(2)}</small>${specsInfo}
        </div>
        <div>
          <span>R$ ${subtotal.toFixed(2)}</span>
        </div>
      </div>
    `;
  }).join('');
  
  if (orderTotalElement) {
    orderTotalElement.textContent = `R$ ${total.toFixed(2)}`;
  }
  
  return { cart, total };
}

// Máscara de CEP
function mascaraCEP(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5, 8);
  input.value = v;
}

// Buscar CEP via API ViaCEP
async function buscarCEP() {
  const cepInput = document.getElementById('cep');
  let cep = cepInput.value.replace(/\D/g, '');
  
  if (cep.length !== 8) return;

  // Mostrar loading
  const campos = ['logradouro', 'bairro', 'cidade', 'estado'];
  campos.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = 'Buscando...';
  });

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    
    if (!data.erro) {
      document.getElementById('logradouro').value = data.logradouro || '';
      document.getElementById('bairro').value = data.bairro || '';
      document.getElementById('cidade').value = data.localidade || '';
      document.getElementById('estado').value = data.uf || '';
      document.getElementById('numero')?.focus();
    } else {
      showNotification('CEP não encontrado', 'error');
      campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    showNotification('Erro ao buscar CEP. Tente novamente.', 'error');
    campos.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }
}

// Handle Checkout
async function handleCheckout(event) {
  event.preventDefault();
  
  const token = localStorage.getItem('techvault-token');
  if (!token || !currentUser) {
    showNotification('Você precisa estar logado para finalizar o pedido', 'error');
    setTimeout(() => {
      window.location.href = '/login';
    }, 1500);
    return;
  }
  
  // Coletar dados do formulário
  const endereco = {
    cep: document.getElementById('cep').value,
    logradouro: document.getElementById('logradouro').value,
    numero: document.getElementById('numero').value,
    complemento: document.getElementById('complemento').value,
    bairro: document.getElementById('bairro').value,
    cidade: document.getElementById('cidade').value,
    estado: document.getElementById('estado').value
  };
  
  const nomeCompleto = document.getElementById('nomeCompleto').value;
  const telefone = document.getElementById('telefone').value;
  
  // Validar carrinho
  const cartData = loadCartItems();
  if (!cartData || cartData.cart.length === 0) {
    showNotification('Seu carrinho está vazio', 'error');
    return;
  }
  
  const { cart, total } = cartData;
  
  // Preparar dados do pedido
  let finalTotal = total;
  if (appliedCoupon) {
    finalTotal = total - appliedCoupon.discountValue;
  }

  const orderData = {
    userId: currentUser.id,
    endereco,
    itens: cart.map(item => ({
      id: item.id,
      nome: item.nome,
      categoria: item.categoria,
      preco: item.preco,
      quantidade: item.quantidade,
      variantSpecs: item.variantSpecs || null
    })),
    total: finalTotal,
    totalOriginal: total,
    cupom: appliedCoupon ? { code: appliedCoupon.code, desconto: appliedCoupon.discountValue } : null,
    cliente: {
      nome: nomeCompleto,
      telefone
    }
  };
  
  const errorMessage = document.getElementById('errorMessage');
  const loadingOverlay = document.getElementById('loadingOverlay');
  
  try {
    loadingOverlay.style.display = 'flex';
    
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });
    
    const data = await response.json();
    
    if (response.ok && data.success && data.orderId) {
      // Limpar carrinho
      localStorage.removeItem('techvault-cart');
      fetch('/api/cart/clear', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      }).catch(() => {});
      
      // Redirecionar para página do PIX
      window.location.href = '/pedido-sucesso?id=' + data.orderId;
    } else {
      loadingOverlay.style.display = 'none';
      errorMessage.textContent = data.error || 'Erro ao processar pedido';
      errorMessage.style.display = 'block';
    }
  } catch (error) {
    console.error('Erro ao finalizar pedido:', error);
    document.getElementById('loadingOverlay').style.display = 'none';
    errorMessage.textContent = 'Erro de conexão. Tente novamente.';
    errorMessage.style.display = 'block';
  }
}

// Cupom de desconto
let appliedCoupon = null;

async function loadUserCoupons() {
  try {
    const token = localStorage.getItem('techvault-token');
    if (!token) return;
    const res = await fetch('/api/coupons/my', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const coupons = await res.json();
    if (!coupons.length) return;
    
    const infoSection = document.querySelector('.checkout-section');
    if (!infoSection) return;
    
    const cupomSection = infoSection.querySelector('[class*="gift"]')?.closest('div[style*="padding"]') || infoSection.querySelector('[style*="background: linear-gradient(135deg, rgba(26, 115, 232, 0.05)"]');
    if (!cupomSection) return;
    
    let couponHtml = '<div style="margin-top:12px;padding:12px;background:#fefce8;border-radius:8px;border:1px solid #fde68a;">' +
      '<p style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:8px;"><i class="fas fa-tag"></i> Seus cupons disponíveis:</p>';
    
    coupons.forEach(c => {
      couponHtml += '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:white;border-radius:6px;margin-bottom:4px;border:1px solid #fef9c3;">' +
        '<div><span style="font-size:12px;font-weight:700;color:#d97706;">' + c.code + '</span><span style="font-size:11px;color:#6b7280;margin-left:6px;">' + c.discount + '% off</span></div>' +
        '<button onclick="quickApplyCoupon(\'' + c.code + '\')" style="padding:4px 10px;border:none;border-radius:4px;background:#d97706;color:white;font-size:11px;font-weight:600;cursor:pointer;">Usar</button>' +
      '</div>';
    });
    
    couponHtml += '</div>';
    cupomSection.insertAdjacentHTML('afterend', couponHtml);
  } catch {}
}

async function quickApplyCoupon(code) {
  document.getElementById('couponInput').value = code;
  await applyCoupon();
}

async function applyCoupon() {
  const input = document.getElementById('couponInput');
  const result = document.getElementById('couponResult');
  const code = input.value.trim();
  if (!code) { result.innerHTML = '<span style="color:var(--error)">Digite um código</span>'; return; }

  const cartData = loadCartItems();
  if (!cartData) return;
  const total = cartData.total;

  // Try personal coupon first
  const token = localStorage.getItem('techvault-token');
  if (token) {
    try {
      const myRes = await fetch('/api/coupons/my', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const myCoupons = await myRes.json();
      const personal = myCoupons.find(c => c.code.toUpperCase() === code.toUpperCase());
      if (personal) {
        const applyRes = await fetch('/api/coupons/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ code })
        });
        const applyData = await applyRes.json();
        if (applyData.success) {
          const discountValue = total * (personal.discount / 100);
          appliedCoupon = { code: personal.code, discountValue, discount: personal.discount, type: 'percent' };
          const novoTotal = total - discountValue;
          result.innerHTML = '<span style="color:var(--success)">✓ Cupom pessoal aplicado! Desconto de R$ ' + discountValue.toFixed(2).replace('.', ',') + '</span>';
          document.getElementById('orderTotal').textContent = 'R$ ' + novoTotal.toFixed(2).replace('.', ',');
          loadUserCoupons();
          return;
        }
      }
    } catch {}
  }

  // Fallback: try global coupon validation
  try {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, total })
    });
    const data = await res.json();
    if (data.success) {
      appliedCoupon = data.coupon;
      const desconto = appliedCoupon.discountValue;
      const novoTotal = total - desconto;
      result.innerHTML = '<span style="color:var(--success)">✓ Cupom aplicado! Desconto de R$ ' + desconto.toFixed(2).replace('.', ',') + '</span>';
      document.getElementById('orderTotal').textContent = 'R$ ' + novoTotal.toFixed(2).replace('.', ',');
    } else {
      appliedCoupon = null;
      result.innerHTML = '<span style="color:var(--error)">' + (data.error || 'Cupom inválido') + '</span>';
    }
  } catch (err) {
    result.innerHTML = '<span style="color:var(--error)">Erro ao validar cupom</span>';
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#00ff88' : type === 'error' ? '#ff4757' : '#00d4ff'};
    color: ${type === 'success' || type === 'error' ? 'white' : '#0a0a0f'};
    padding: 15px 25px;
    border-radius: 8px;
    z-index: 3000;
    font-weight: 600;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Adicionar animações
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .success-message h3 {
    font-size: 20px;
    margin-bottom: 10px;
  }
  
  .success-message p {
    margin: 8px 0;
  }
`;
document.head.appendChild(style);