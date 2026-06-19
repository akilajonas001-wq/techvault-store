// Handle Login
async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const errorMessage = document.getElementById('errorMessage');
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, senha })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      localStorage.setItem('techvault-token', data.token);
      showNotification('Login realizado com sucesso!', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } else {
      errorMessage.textContent = data.error || 'Erro ao fazer login';
      errorMessage.style.display = 'block';
    }
  } catch (error) {
    console.error('Erro no login:', error);
    errorMessage.textContent = 'Erro de conexão. Tente novamente.';
    errorMessage.style.display = 'block';
  }
}

// Handle Registro
async function handleRegistro(event) {
  event.preventDefault();
  
  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const confirmarSenha = document.getElementById('confirmarSenha').value;
  const telefone = document.getElementById('telefone').value;
  const errorMessage = document.getElementById('errorMessage');
  
  // Validar senhas
  if (senha !== confirmarSenha) {
    errorMessage.textContent = 'As senhas não coincidem';
    errorMessage.style.display = 'block';
    return;
  }
  
  // Validar senha mínima
  if (senha.length < 6) {
    errorMessage.textContent = 'A senha deve ter pelo menos 6 caracteres';
    errorMessage.style.display = 'block';
    return;
  }
  
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nome, email, senha, telefone })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      localStorage.setItem('techvault-token', data.token);
      showNotification('Conta criada com sucesso!', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } else {
      errorMessage.textContent = data.error || 'Erro ao criar conta';
      errorMessage.style.display = 'block';
    }
  } catch (error) {
    console.error('Erro no registro:', error);
    errorMessage.textContent = 'Erro de conexão. Tente novamente.';
    errorMessage.style.display = 'block';
  }
}

// Login com Google (simulado)
async function loginWithGoogle() {
  // Em produção, isso usaria o OAuth real do Google
  showNotification('Login com Google será implementado em breve!', 'info');
  
  // Simulação para teste
  setTimeout(() => {
    const mockUser = {
      id: Date.now(),
      nome: 'Usuário Google',
      email: 'usuario@gmail.com'
    };
    
    // Criar token mock (em produção viria do backend)
    const mockToken = 'mock-google-token-' + Date.now();
    localStorage.setItem('techvault-token', mockToken);
    
    showNotification('Login com Google realizado!', 'success');
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  }, 1500);
}

// Mostrar notificação
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification`;
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

// Adicionar animações CSS
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
`;
document.head.appendChild(style);