let googleButtonRendered = false;

function handleCredentialResponse(response) {
  const credential = response.credential;
  if (!credential) {
    showNotification('Erro ao obter credencial do Google', 'error');
    return;
  }
  sendGoogleCredentialToBackend(credential);
}

async function sendGoogleCredentialToBackend(credential) {
  const isRegister = document.title.includes('Registro');
  const endpoint = isRegister ? '/api/auth/google-register' : '/api/auth/google';
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      localStorage.setItem('techvault-token', data.token);
      const msg = isRegister
        ? (data.needsUsername ? 'Conta criada! Escolha seu nome de usuário na página inicial.' : 'Conta criada com Google!')
        : 'Login com Google realizado!';
      showNotification(msg, 'success');
      setTimeout(() => { window.location.href = '/'; }, 1200);
    } else {
      showNotification(data.error || 'Erro ao autenticar com Google', 'error');
    }
  } catch (error) {
    console.error('Erro no Google:', error);
    showNotification('Erro de conexão. Tente novamente.', 'error');
  }
}

function renderGoogleButton(clientId) {
  if (googleButtonRendered || typeof google === 'undefined' || !google.accounts) return;
  const googleButton = document.getElementById('googleButton');
  if (!googleButton || !clientId) return;
  googleButtonRendered = true;

  google.accounts.id.initialize({
    client_id: clientId,
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(googleButton, {
    type: 'standard',
    shape: 'rectangular',
    theme: 'outline',
    text: document.title.includes('Registro') ? 'signup_with' : 'signin_with',
    size: 'large',
    width: '100%',
    logo_alignment: 'center'
  });
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const errorMessage = document.getElementById('errorMessage');

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      localStorage.setItem('techvault-token', data.token);
      showNotification('Login realizado com sucesso!', 'success');
      setTimeout(() => { window.location.href = '/'; }, 1000);
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

async function handleRegistro(event) {
  event.preventDefault();

  const nome = document.getElementById('nome').value;
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const confirmarSenha = document.getElementById('confirmarSenha').value;
  const telefone = document.getElementById('telefone').value;
  const errorMessage = document.getElementById('errorMessage');

  if (!username || username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    errorMessage.textContent = 'Nome de usuário deve ter pelo menos 3 caracteres (apenas letras, números e _)';
    errorMessage.style.display = 'block';
    return;
  }

  if (senha !== confirmarSenha) {
    errorMessage.textContent = 'As senhas não coincidem';
    errorMessage.style.display = 'block';
    return;
  }

  if (senha.length < 6) {
    errorMessage.textContent = 'A senha deve ter pelo menos 6 caracteres';
    errorMessage.style.display = 'block';
    return;
  }

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, username, email, senha, telefone })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      localStorage.setItem('techvault-token', data.token);
      showNotification('Conta criada com sucesso!', 'success');
      setTimeout(() => { window.location.href = '/'; }, 1000);
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

  #googleButton > div > div {
    width: 100% !important;
  }
`;
document.head.appendChild(style);
