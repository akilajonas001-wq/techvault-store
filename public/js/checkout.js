let profileData = null;
let appliedCoupon = null;
let savedAddresses = [];

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  loadCartItems('orderCartItems', 'orderTotal');
  loadCartItems('orderCartItems2', 'orderTotal2');
  await loadUserData();
  loadUserCoupons();
});

async function checkAuth() {
  const token = localStorage.getItem('techvault-token');
  if (!token) {
    window.location.href = '/login?redirect=checkout';
    return;
  }
  try {
    const response = await fetch('/api/auth/check', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.authenticated) {
      currentUser = data.user;
      if (typeof showUserMenu === 'function') showUserMenu();
    } else {
      localStorage.removeItem('techvault-token');
      window.location.href = '/login?redirect=checkout';
    }
  } catch (error) {
    console.error('Erro ao verificar auth:', error);
    window.location.href = '/login?redirect=checkout';
  }
}

async function loadUserData() {
  if (!currentUser) return;
  const token = localStorage.getItem('techvault-token');
  try {
    const res = await fetch('/api/profile', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.ok) profileData = await res.json();
  } catch {}
  try {
    const res = await fetch('/api/addresses', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.ok) {
      savedAddresses = await res.json();
      if (savedAddresses.length > 0) {
        renderAddressCards(savedAddresses);
        document.getElementById('savedDataSection').style.display = 'block';
        document.getElementById('fullFormSection').style.display = 'none';
        return;
      }
    }
  } catch {}
  if (profileData && profileData.nome && profileData.cep) {
    renderLegacyDataCards(profileData);
    document.getElementById('savedDataSection').style.display = 'block';
    document.getElementById('fullFormSection').style.display = 'none';
  }
}

function renderAddressCards(addresses) {
  const container = document.getElementById('dataCardsContainer');
  container.innerHTML = addresses.map((a, idx) => {
    const enderecoLinha = [a.logradouro, a.numero, a.complemento].filter(Boolean).join(', ');
    const cidadeLinha = [a.bairro, a.cidade + '/' + a.estado].filter(Boolean).join(' - ');
    return `
      <div class="data-card ${idx === 0 ? 'selected' : ''}" onclick="selectAddressCard(this, ${a.id})">
        <input type="radio" name="selectedAddress" value="${a.id}" ${idx === 0 ? 'checked' : ''}>
        <div class="data-card-body">
          <strong><i class="fas fa-map-marker-alt"></i> ${a.label || 'Endereço ' + (idx + 1)}</strong>
          <span>${a.nome || ''}${a.cpf ? ' • CPF: ' + a.cpf : ''}</span>
          <span>${enderecoLinha}${enderecoLinha && cidadeLinha ? '<br>' : ''}${cidadeLinha}</span>
          <span><i class="fas fa-phone"></i> ${a.telefone || ''} ${a.cep ? '• CEP: ' + a.cep : ''}</span>
        </div>
      </div>
    `;
  }).join('');
  document.getElementById('dataCardsInfo').textContent = '✓ Selecione o endereço para entrega';
}

function renderLegacyDataCards(profile) {
  const container = document.getElementById('dataCardsContainer');
  const enderecoCompleto = [profile.logradouro, profile.numero, profile.complemento, profile.bairro, profile.cidade + '/' + profile.estado, 'CEP: ' + profile.cep].filter(Boolean).join(', ');
  container.innerHTML = `
    <div class="data-card selected" onclick="selectAddressCard(this, null)">
      <input type="radio" name="selectedAddress" value="" checked>
      <div class="data-card-body">
        <strong><i class="fas fa-user"></i> Dados do Perfil</strong>
        <span>${profile.nome || ''}${profile.cpf ? ' • CPF: ' + profile.cpf : ''}</span>
        <span><i class="fas fa-map-marker-alt"></i> ${enderecoCompleto || 'Não informado'}</span>
        <span><i class="fas fa-phone"></i> ${profile.telefone || ''}</span>
      </div>
    </div>
  `;
  document.getElementById('dataCardsInfo').textContent = '✓ Dados carregados do seu perfil';
}

function selectAddressCard(el, addrId) {
  document.querySelectorAll('.data-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  el.querySelector('input[type="radio"]').checked = true;
}

function getSelectedAddress() {
  const checked = document.querySelector('input[name="selectedAddress"]:checked');
  if (!checked) return null;
  const addrId = parseInt(checked.value);
  if (!addrId) return profileData;
  return savedAddresses.find(a => a.id === addrId) || null;
}

function showFullForm() {
  document.getElementById('savedDataSection').style.display = 'none';
  document.getElementById('fullFormSection').style.display = 'block';
  const addr = getSelectedAddress();
  if (addr) {
    fillFormFields(addr);
  }
}

function fillFormFields(addr) {
  const map = {
    cep: 'cep', logradouro: 'logradouro', numero: 'numero', complemento: 'complemento',
    bairro: 'bairro', cidade: 'cidade', estado: 'estado',
    nomeCompleto: 'nome', cpfCheckout: 'cpf', telefone: 'telefone'
  };
  for (const [fieldId, dataKey] of Object.entries(map)) {
    const el = document.getElementById(fieldId);
    if (el && addr[dataKey]) el.value = addr[dataKey];
  }
}

async function handleQuickCheckout() {
  const token = localStorage.getItem('techvault-token');
  if (!token || !currentUser) {
    showNotification('Você precisa estar logado', 'error');
    return;
  }

  const addr = getSelectedAddress();
  if (!addr) {
    showNotification('Selecione um endereço de entrega', 'error');
    return;
  }

  const cartData = loadCartItems('orderCartItems', 'orderTotal');
  if (!cartData || cartData.cart.length === 0) {
    showNotification('Seu carrinho está vazio', 'error');
    return;
  }

  const { cart, total } = cartData;
  let finalTotal = total;
  if (appliedCoupon) {
    finalTotal = total - appliedCoupon.discountValue;
  }

  const selectedId = document.querySelector('input[name="selectedAddress"]:checked');
  const isProfileAddr = selectedId && !parseInt(selectedId.value);

  const orderData = {
    userId: currentUser.id,
    endereco: {
      cep: addr.cep || '',
      logradouro: addr.logradouro || '',
      numero: addr.numero || '',
      complemento: addr.complemento || '',
      bairro: addr.bairro || '',
      cidade: addr.cidade || '',
      estado: addr.estado || ''
    },
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
      nome: addr.nome || '',
      telefone: addr.telefone || '',
      cpf: addr.cpf || ''
    }
  };

  const loadingOverlay = document.getElementById('loadingOverlay');
  const errorMessage = document.getElementById('errorMessage');

  try {
    loadingOverlay.style.display = 'flex';
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(orderData)
    });
    const data = await response.json();
    if (response.ok && data.success && data.checkout_url) {
      localStorage.removeItem('techvault-cart');
      fetch('/api/cart/clear', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } }).catch(() => {});
      window.location.href = data.checkout_url;
    } else {
      loadingOverlay.style.display = 'none';
      let msg = data.error || 'Erro ao processar pedido';
      if (!data.checkout_url && data.success) msg = 'Pedido criado, mas houve um erro ao gerar o link de pagamento. Tente novamente.';
      errorMessage.textContent = msg;
      errorMessage.style.display = 'block';
    }
  } catch (error) {
    console.error('Erro:', error);
    document.getElementById('loadingOverlay').style.display = 'none';
    errorMessage.textContent = 'Erro de conexão. Tente novamente.';
    errorMessage.style.display = 'block';
  }
}

function loadCartItems(containerId, totalId) {
  const cart = JSON.parse(localStorage.getItem('techvault-cart') || '[]');
  const container = document.getElementById(containerId);
  const totalEl = document.getElementById(totalId);
  if (!container) return;
  if (cart.length === 0) {
    container.innerHTML = '<p class="cart-empty" style="padding:20px 0;color:var(--text-muted);font-size:13px;">Seu carrinho está vazio</p>';
    if (totalEl) totalEl.textContent = 'R$ 0,00';
    return;
  }
  let total = 0;
  container.innerHTML = cart.map(item => {
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
  if (totalEl) totalEl.textContent = `R$ ${total.toFixed(2)}`;
  return { cart, total };
}

function mascaraCEP(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5, 8);
  input.value = v;
}

function mascaraCPF(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length > 9) v = v.slice(0, 3) + '.' + v.slice(3, 6) + '.' + v.slice(6, 9) + '-' + v.slice(9, 11);
  else if (v.length > 6) v = v.slice(0, 3) + '.' + v.slice(3, 6) + '.' + v.slice(6);
  else if (v.length > 3) v = v.slice(0, 3) + '.' + v.slice(3);
  input.value = v;
}

async function buscarCEP() {
  const cepInput = document.getElementById('cep');
  let cep = cepInput.value.replace(/\D/g, '');
  if (cep.length !== 8) return;
  const campos = ['logradouro', 'bairro', 'cidade', 'estado'];
  campos.forEach(id => { const el = document.getElementById(id); if (el) el.value = 'Buscando...'; });
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
      campos.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    }
  } catch (error) {
    showNotification('Erro ao buscar CEP', 'error');
    campos.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  }
}

async function handleCheckout(event) {
  event.preventDefault();
  const token = localStorage.getItem('techvault-token');
  if (!token || !currentUser) {
    showNotification('Você precisa estar logado', 'error');
    setTimeout(() => { window.location.href = '/login'; }, 1500);
    return;
  }

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
  const cpf = document.getElementById('cpfCheckout').value;

  const cartData = loadCartItems('orderCartItems2', 'orderTotal2');
  if (!cartData || cartData.cart.length === 0) {
    showNotification('Seu carrinho está vazio', 'error');
    return;
  }

  const { cart, total } = cartData;
  let finalTotal = total;
  if (appliedCoupon) {
    finalTotal = total - appliedCoupon.discountValue;
  }

  const orderData = {
    userId: currentUser.id,
    endereco,
    itens: cart.map(item => ({
      id: item.id, nome: item.nome, categoria: item.categoria,
      preco: item.preco, quantidade: item.quantidade,
      variantSpecs: item.variantSpecs || null
    })),
    total: finalTotal,
    totalOriginal: total,
    cupom: appliedCoupon ? { code: appliedCoupon.code, desconto: appliedCoupon.discountValue } : null,
    cliente: { nome: nomeCompleto, telefone, cpf }
  };

  const errorMessage = document.getElementById('errorMessage');
  const loadingOverlay = document.getElementById('loadingOverlay');

  try {
    loadingOverlay.style.display = 'flex';
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(orderData)
    });
    const data = await response.json();
    if (response.ok && data.success && data.checkout_url) {
      localStorage.removeItem('techvault-cart');
      fetch('/api/cart/clear', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } }).catch(() => {});
      window.location.href = data.checkout_url;
    } else {
      loadingOverlay.style.display = 'none';
      let msg = data.error || 'Erro ao processar pedido';
      if (!data.checkout_url && data.success) msg = 'Pedido criado, mas houve um erro ao gerar o link de pagamento. Tente novamente.';
      errorMessage.textContent = msg;
      errorMessage.style.display = 'block';
    }
  } catch (error) {
    console.error('Erro:', error);
    document.getElementById('loadingOverlay').style.display = 'none';
    errorMessage.textContent = 'Erro de conexão. Tente novamente.';
    errorMessage.style.display = 'block';
  }
}

async function loadUserCoupons() {
  try {
    const token = localStorage.getItem('techvault-token');
    if (!token) return;
    const res = await fetch('/api/coupons/my', { headers: { 'Authorization': 'Bearer ' + token } });
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
  const cartData = loadCartItems('orderCartItems', 'orderTotal');
  if (!cartData) return;
  const total = cartData.total;
  const token = localStorage.getItem('techvault-token');
  if (token) {
    try {
      const myRes = await fetch('/api/coupons/my', { headers: { 'Authorization': 'Bearer ' + token } });
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
    position: fixed; top: 20px; right: 20px;
    background: ${type === 'success' ? '#00ff88' : type === 'error' ? '#ff4757' : '#00d4ff'};
    color: ${type === 'success' || type === 'error' ? 'white' : '#0a0a0f'};
    padding: 15px 25px; border-radius: 8px; z-index: 3000;
    font-weight: 600; animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
  .success-message h3 { font-size: 20px; margin-bottom: 10px; }
  .success-message p { margin: 8px 0; }
`;
document.head.appendChild(style);
