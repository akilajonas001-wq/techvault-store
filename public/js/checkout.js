// Checkout JavaScript
const PICPAY_FEE = 0.0099;
const TAX_RATE = 0.06;
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  loadCartItems();
  loadUserData();
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

// Carregar dados do usuário
async function loadUserData() {
  if (!currentUser) return;
  
  try {
    const nomeCompletoElement = document.getElementById('nomeCompleto');
    if (nomeCompletoElement && currentUser.nome) {
      nomeCompletoElement.value = currentUser.nome;
    }
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
}

// Carregar itens do carrinho
function loadCartItems() {
  const cart = JSON.parse(localStorage.getItem('techvault-cart') || '[]');
  const cartItemsContainer = document.getElementById('cartItems');
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
  
  updatePriceBreakdown(total);
  
  return { cart, total };
}

function updatePriceBreakdown(total) {
  const subtotalEl = document.getElementById('bdSubtotal');
  const picpayFeeEl = document.getElementById('bdPicpayFee');
  const taxEl = document.getElementById('bdTax');
  const netEl = document.getElementById('bdNet');
  if (!subtotalEl) return;
  
  const picpayFee = total * PICPAY_FEE;
  const tax = total * TAX_RATE;
  const netAmount = total - picpayFee - tax;
  
  subtotalEl.textContent = `R$ ${total.toFixed(2)}`;
  picpayFeeEl.textContent = `- R$ ${picpayFee.toFixed(2)}`;
  taxEl.textContent = `- R$ ${tax.toFixed(2)}`;
  netEl.textContent = `R$ ${netAmount.toFixed(2)}`;
}

// Buscar CEP via API ViaCEP
async function buscarCEP() {
  const cepInput = document.getElementById('cep');
  let cep = cepInput.value.replace(/\D/g, '');
  
  if (cep.length !== 8) return;
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    
    if (!data.erro) {
      document.getElementById('logradouro').value = data.logradouro;
      document.getElementById('bairro').value = data.bairro;
      document.getElementById('cidade').value = data.localidade;
      document.getElementById('estado').value = data.uf;
    } else {
      showNotification('CEP não encontrado', 'error');
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    showNotification('Erro ao buscar CEP', 'error');
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
  const successMessage = document.getElementById('successMessage');
  
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // Limpar carrinho
      localStorage.removeItem('techvault-cart');
      // Limpar carrinho no servidor
      fetch('/api/cart/clear', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      }).catch(() => {});
      
      // Mostrar mensagem de sucesso
      const picpayFee = finalTotal * PICPAY_FEE;
      const tax = finalTotal * TAX_RATE;
      const netAmount = finalTotal - picpayFee - tax;
      
      successMessage.innerHTML = `
        <h3><i class="fas fa-check-circle"></i> Pedido Realizado com Sucesso!</h3>
        <p>Número do pedido: #${data.orderId}</p>
        <p>Total: R$ ${finalTotal.toFixed(2).replace('.', ',')}</p>
        <div style="margin: 12px 0; padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; font-size: 13px;">
          <p><strong>Pagamento via PicPay PIX</strong></p>
          <p>Escaneie o QR Code ou copie o código PIX abaixo:</p>
          <div style="background: white; padding: 16px; border-radius: 8px; margin: 12px 0; text-align: center; border: 2px dashed var(--border);">
            <div style="font-size: 48px; margin-bottom: 8px; letter-spacing: 4px; font-family: monospace;">
              <i class="fas fa-qrcode" style="font-size: 80px; color: var(--text);"></i>
            </div>
            <p style="font-size: 11px; word-break: break-all; color: var(--text-light); font-family: monospace;">
              00020126580014br.gov.bcb.pix0136${data.pixKey || 'techvault@picpay.com'}5204000053039865406${finalTotal.toFixed(2)}5802BR5913TechVault6008Sao Paulo62070503***6304ABCD
            </p>
          </div>
          <p style="font-size: 12px; color: var(--text-light);">
            <i class="fas fa-info-circle"></i> Taxa PicPay: R$ ${picpayFee.toFixed(2).replace('.', ',')} (0,99%)<br>
            <i class="fas fa-receipt"></i> Imposto: R$ ${tax.toFixed(2).replace('.', ',')} (6% Simples Nacional)<br>
            <i class="fas fa-arrow-down"></i> Você recebe limpo: <strong style="color: var(--success);">R$ ${netAmount.toFixed(2).replace('.', ',')}</strong>
          </p>
        </div>
        <p>Em breve você receberá mais informações sobre o seu pedido.</p>
      `;
      successMessage.style.display = 'block';
      errorMessage.style.display = 'none';
      
      // Redirecionar após alguns segundos
      setTimeout(() => {
        window.location.href = '/';
      }, 5000);
    } else {
      errorMessage.textContent = data.error || 'Erro ao processar pedido';
      errorMessage.style.display = 'block';
      successMessage.style.display = 'none';
    }
  } catch (error) {
    console.error('Erro ao finalizar pedido:', error);
    errorMessage.textContent = 'Erro de conexão. Tente novamente.';
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
  }
}

// Cupom de desconto
let appliedCoupon = null;

async function applyCoupon() {
  const input = document.getElementById('couponInput');
  const result = document.getElementById('couponResult');
  const code = input.value.trim();
  if (!code) { result.innerHTML = '<span style="color:var(--error)">Digite um código</span>'; return; }

  const cartData = loadCartItems();
  if (!cartData) return;
  const total = cartData.total;

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