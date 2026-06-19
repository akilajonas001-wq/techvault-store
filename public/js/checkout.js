// Checkout JavaScript
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
    return `
      <div class="cart-item">
        <div>
          <strong>${item.nome}</strong><br>
          <small>Categoria: ${item.categoria} | ${item.quantidade}x R$ ${item.preco.toFixed(2)}</small>
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
  const orderData = {
    userId: currentUser.id,
    endereco,
    itens: cart.map(item => ({
      id: item.id,
      nome: item.nome,
      categoria: item.categoria,
      preco: item.preco,
      quantidade: item.quantidade
    })),
    total,
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
      
      // Mostrar mensagem de sucesso
      successMessage.innerHTML = `
        <h3><i class="fas fa-check-circle"></i> Pedido Realizado com Sucesso!</h3>
        <p>Número do pedido: #${data.orderId}</p>
        <p>Enviamos os detalhes para o email <strong>akilajonas001@gmail.com</strong></p>
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

// Mostrar notificação
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