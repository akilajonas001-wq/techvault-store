let profileData = null;
let appliedCoupon = null;
let savedAddresses = [];

let pendingOrderData = null;
let currentOrderId = null;
let currentPaymentRef = null;
let paymentMethod = 'pix';
let mpInstance = null;
let pixPollTimer = null;
let lastCardBrand = null;

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
          <strong><i class="fas fa-map-marker-alt"></i> ${escapeHtml(a.label || 'Endereço ' + (idx + 1))}</strong>
          <span>${escapeHtml(a.nome || '')}${a.cpf ? ' • CPF: ' + escapeHtml(a.cpf) : ''}</span>
          <span>${escapeHtml(enderecoLinha)}${enderecoLinha && cidadeLinha ? '<br>' : ''}${escapeHtml(cidadeLinha)}</span>
          <span><i class="fas fa-phone"></i> ${escapeHtml(a.telefone || '')} ${a.cep ? '• CEP: ' + escapeHtml(a.cep) : ''}</span>
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
        <span>${escapeHtml(profile.nome || '')}${profile.cpf ? ' • CPF: ' + escapeHtml(profile.cpf) : ''}</span>
        <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(enderecoCompleto || 'Não informado')}</span>
        <span><i class="fas fa-phone"></i> ${escapeHtml(profile.telefone || '')}</span>
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

async function goToPaymentStep(mode) {
  const token = localStorage.getItem('techvault-token');
  if (!token || !currentUser) {
    showNotification('Você precisa estar logado', 'error');
    setTimeout(() => { window.location.href = '/login'; }, 1200);
    return;
  }

  const brStates = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

  let endereco, cliente;
  if (mode === 'quick') {
    const addr = getSelectedAddress();
    if (!addr) {
      showNotification('Selecione um endereço de entrega', 'error');
      return;
    }
    const cepClean = (addr.cep || '').replace(/\D/g, '');
    if (cepClean.length !== 8 || !brStates.includes(addr.estado)) {
      showNotification('Só realizamos entregas dentro do Brasil. Verifique o CEP e o estado do endereço.', 'error');
      return;
    }
    endereco = {
      cep: addr.cep || '', logradouro: addr.logradouro || '', numero: addr.numero || '',
      complemento: addr.complemento || '', bairro: addr.bairro || '',
      cidade: addr.cidade || '', estado: addr.estado || ''
    };
    cliente = { nome: addr.nome || '', telefone: addr.telefone || '', cpf: addr.cpf || '' };
  } else {
    endereco = {
      cep: document.getElementById('cep').value,
      logradouro: document.getElementById('logradouro').value,
      numero: document.getElementById('numero').value,
      complemento: document.getElementById('complemento').value,
      bairro: document.getElementById('bairro').value,
      cidade: document.getElementById('cidade').value,
      estado: document.getElementById('estado').value
    };
    const cepClean = (endereco.cep || '').replace(/\D/g, '');
    if (cepClean.length !== 8 || !brStates.includes(endereco.estado)) {
      showNotification('Só realizamos entregas dentro do Brasil. Verifique o CEP e o estado do endereço.', 'error');
      return;
    }
    cliente = {
      nome: document.getElementById('nomeCompleto').value,
      telefone: document.getElementById('telefone').value,
      cpf: document.getElementById('cpfCheckout').value
    };
  }

  const cartData = loadCartItems('paymentCartItems', null);
  if (!cartData || cartData.cart.length === 0) {
    showNotification('Seu carrinho está vazio', 'error');
    return;
  }
  const { cart, total } = cartData;
  let finalTotal = total;
  if (appliedCoupon) {
    finalTotal = total - appliedCoupon.discountValue;
  }

  pendingOrderData = {
    endereco,
    itens: cart.map(item => ({
      id: item.id, nome: item.nome, categoria: item.categoria,
      preco: item.preco, quantidade: item.quantidade,
      variantIndex: item.variantIndex,
      variantSpecs: item.variantSpecs || null,
      cor: item.cor || null
    })),
    total: finalTotal,
    totalOriginal: total,
    cupom: appliedCoupon ? { code: appliedCoupon.code, desconto: appliedCoupon.discountValue } : null,
    cliente
  };

  document.getElementById('savedDataSection').style.display = 'none';
  document.getElementById('fullFormSection').style.display = 'none';
  document.getElementById('pixPanel').style.display = 'none';
  document.getElementById('cardPanel').style.display = 'none';
  document.getElementById('paymentError').style.display = 'none';
  document.getElementById('paymentSection').style.display = 'block';
  document.getElementById('paymentTotal').textContent = formatMoney(finalTotal);
  updateCardAmounts(finalTotal);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selectPaymentMethod(method) {
  paymentMethod = method;
  document.getElementById('pmPixOption').classList.toggle('selected', method === 'pix');
  document.getElementById('pmCardOption').classList.toggle('selected', method === 'card');
  const radio = document.querySelector('input[name="paymentMethod"][value="' + method + '"]');
  if (radio) radio.checked = true;
  if (method === 'card' && pendingOrderData) updateCardAmounts(pendingOrderData.total);
}

async function finalizePayment() {
  if (!pendingOrderData) {
    showNotification('Preencha os dados de entrega primeiro', 'error');
    return;
  }
  if (currentOrderId) {
    document.getElementById('paymentError').style.display = 'none';
    if (paymentMethod === 'pix') return createPixPayment(currentOrderId);
    return showCardPanel(currentOrderId);
  }

  const token = localStorage.getItem('techvault-token');
  const loadingOverlay = document.getElementById('loadingOverlay');
  loadingOverlay.style.display = 'flex';
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(pendingOrderData)
    });
    const data = await response.json();
    if (response.ok && data.success) {
      currentOrderId = data.orderId;
      currentPaymentRef = data.paymentRef;
      localStorage.removeItem('techvault-cart');
      fetch('/api/cart/clear', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } }).catch(() => {});
      loadingOverlay.style.display = 'none';
      if (paymentMethod === 'pix') return createPixPayment(currentOrderId);
      return showCardPanel(currentOrderId);
    } else {
      loadingOverlay.style.display = 'none';
      showPaymentError(data.error || 'Erro ao criar pedido. Tente novamente.');
    }
  } catch (error) {
    console.error('Erro:', error);
    loadingOverlay.style.display = 'none';
    showPaymentError('Erro de conexão. Tente novamente.');
  }
}

function showPaymentError(msg) {
  const el = document.getElementById('paymentError');
  el.textContent = msg;
  el.style.display = 'flex';
}

async function createPixPayment(orderId) {
  const token = localStorage.getItem('techvault-token');
  document.getElementById('paymentSection').style.display = 'none';
  document.getElementById('cardPanel').style.display = 'none';
  document.getElementById('pixPanel').style.display = 'block';
  resetPixPanel();
  try {
    const response = await fetch('/api/payments/pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ orderId })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      showPixError(data.error || 'Erro ao gerar PIX. Tente novamente.');
      return;
    }
    if (data.alreadyPaid) { redirectSuccess(); return; }
    document.getElementById('pixQr').innerHTML = data.qr_code_base64
      ? '<img src="data:image/png;base64,' + data.qr_code_base64 + '" alt="QR Code PIX">'
      : (data.ticket_url ? '<a href="' + data.ticket_url + '" target="_blank">Abrir QR Code</a>' : '');
    document.getElementById('pixCopyPaste').value = data.qr_code || '';
    if (data.expires_at) {
      const expires = new Date(data.expires_at);
      document.getElementById('pixExpiry').textContent = 'O código expira às ' + expires.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    startPixPolling(orderId);
  } catch (error) {
    console.error('Erro PIX:', error);
    showPixError('Erro de conexão ao gerar o PIX.');
  }
}

function resetPixPanel() {
  clearInterval(pixPollTimer);
  document.getElementById('pixQr').innerHTML = '<div class="spinner"></div>';
  document.getElementById('pixCopyPaste').value = '';
  document.getElementById('pixExpiry').textContent = '';
  document.getElementById('pixWaiting').innerHTML =
    '<div class="spinner"></div>' +
    '<p>Aguardando pagamento...</p>' +
    '<small>O pedido será confirmado automaticamente ao receber o pagamento</small>';
}

function showPixError(msg) {
  document.getElementById('pixWaiting').innerHTML =
    '<p style="color:var(--error);font-weight:600;"><i class="fas fa-exclamation-circle"></i> ' + escapeHtml(msg) + '</p>' +
    '<button class="btn btn-primary" style="margin-top:8px;padding:12px 20px;font-size:14px;" onclick="retryPix()"><i class="fas fa-redo"></i> Tentar novamente</button>';
}

function retryPix() {
  if (currentOrderId) createPixPayment(currentOrderId);
}

function startPixPolling(orderId) {
  clearInterval(pixPollTimer);
  pixPollTimer = setInterval(async () => {
    try {
      const token = localStorage.getItem('techvault-token');
      const response = await fetch('/api/payments/' + orderId + '/status', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await response.json();
      if (data.status === 'aprovado') {
        clearInterval(pixPollTimer);
        redirectSuccess();
      } else if (data.status === 'reprovado' || data.status === 'cancelado' || data.status === 'reembolsado' || data.status === 'estornado') {
        clearInterval(pixPollTimer);
        showPixError('Pagamento não concluído. ' + (data.statusDetail || ''));
      }
    } catch (e) {}
  }, 4000);
}

function copyPixCode() {
  const code = document.getElementById('pixCopyPaste').value;
  if (!code) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(() => {
      showNotification('Código PIX copiado!', 'success');
    }).catch(() => fallbackCopy(code));
  } else {
    fallbackCopy(code);
  }
}

function fallbackCopy(text) {
  const el = document.createElement('textarea');
  el.value = text;
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.select();
  try { document.execCommand('copy'); showNotification('Código PIX copiado!', 'success'); }
  catch (e) { showNotification('Copie o código manualmente', 'error'); }
  document.body.removeChild(el);
}

function redirectSuccess() {
  clearInterval(pixPollTimer);
  window.location.href = '/pedido-sucesso?id=' + currentOrderId + '&ref=' + (currentPaymentRef || '');
}

async function showCardPanel(orderId) {
  document.getElementById('paymentSection').style.display = 'none';
  document.getElementById('pixPanel').style.display = 'none';
  document.getElementById('cardPanel').style.display = 'block';
  document.getElementById('cardError').style.display = 'none';
  if (pendingOrderData) updateCardAmounts(pendingOrderData.total);
  if (!mpInstance) {
    try {
      const cfg = await (await fetch('/api/config')).json();
      if (cfg.mercadoPagoPublicKey && typeof MercadoPago !== 'undefined') {
        mpInstance = new MercadoPago(cfg.mercadoPagoPublicKey);
      }
    } catch (e) {}
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function detectCardBrand() {
  const bin = document.getElementById('cardNumber').value.replace(/\D/g, '').slice(0, 6);
  if (bin.length < 6 || !mpInstance) return;
  mpInstance.getPaymentMethods({ bin }).then(res => {
    if (res && res[0] && res[0].id) {
      lastCardBrand = res[0].id;
      document.getElementById('cardBrandLabel').style.display = 'flex';
      document.getElementById('cardBrandText').textContent = lastCardBrand;
    }
  }).catch(() => {});
}

function updateCardAmounts(total) {
  const btn = document.getElementById('cardPayButton');
  if (btn) btn.innerHTML = '<i class="fas fa-lock"></i> Pagar à vista ' + formatMoney(total);
}

function mascaraCartao(input) {
  let v = input.value.replace(/\D/g, '');
  v = v.replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
  input.value = v;
}

function mascaraValidade(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
  input.value = v;
}

function formatMoney(v) {
  return 'R$ ' + (parseFloat(v) || 0).toFixed(2).replace('.', ',');
}

async function processCardPayment(event) {
  event.preventDefault();
  if (!currentOrderId) {
    showCardError('Pedido não encontrado. Volte e finalize novamente.');
    return;
  }
  if (!mpInstance) {
    showCardError('Serviço de pagamento indisponível no momento.');
    return;
  }

  const cardNumber = document.getElementById('cardNumber').value.replace(/\D/g, '');
  const cardholderName = document.getElementById('cardholderName').value.trim();
  const expiry = document.getElementById('cardExpiry').value.trim();
  const securityCode = document.getElementById('cardCvv').value;
  const identificationNumber = document.getElementById('cardCpf').value.replace(/\D/g, '');

  if (cardNumber.length < 13) return showCardError('Número do cartão inválido.');
  if (!cardholderName) return showCardError('Informe o nome impresso no cartão.');
  if (!/^\d{2}\/\d{2}$/.test(expiry)) return showCardError('Validade inválida. Use MM/AA.');
  if (securityCode.length < 3) return showCardError('CVV inválido.');
  if (identificationNumber.length !== 11) return showCardError('CPF do titular inválido.');

  const [mm, yy] = expiry.split('/');
  const token = localStorage.getItem('techvault-token');
  const loadingOverlay = document.getElementById('loadingOverlay');
  document.getElementById('cardError').style.display = 'none';

  loadingOverlay.style.display = 'flex';
  try {
    const cardTokenData = await mpInstance.createCardToken({
      cardNumber,
      cardholderName,
      cardExpirationMonth: mm,
      cardExpirationYear: '20' + yy,
      securityCode,
      identificationType: 'CPF',
      identificationNumber
    });
    if (!cardTokenData || !cardTokenData.id) {
      loadingOverlay.style.display = 'none';
      return showCardError('Não foi possível processar o cartão. Verifique os dados.');
    }

    let paymentMethodId;
    try {
      const methods = await mpInstance.getPaymentMethods({ bin: cardNumber.slice(0, 6) });
      paymentMethodId = methods && methods[0] ? methods[0].id : undefined;
    } catch (e) {}

    const response = await fetch('/api/payments/card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({
        orderId: currentOrderId,
        token: cardTokenData.id,
        installments: 1,
        cpf: identificationNumber,
        paymentMethodId
      })
    });
    const data = await response.json();
    loadingOverlay.style.display = 'none';

    if (data.status === 'approved') {
      redirectSuccess();
    } else if (data.status === 'in_process' || data.status === 'pending' || data.status === 'authorized') {
      document.getElementById('cardPanel').style.display = 'none';
      document.getElementById('pixPanel').style.display = 'block';
      resetPixPanel();
      document.getElementById('pixQr').innerHTML = '';
      document.getElementById('pixCopyPaste').value = '';
      document.getElementById('pixWaiting').innerHTML =
        '<div class="spinner"></div>' +
        '<p>Pagamento em processamento...</p>' +
        '<small>Isso pode levar alguns instantes. Acompanhe o status do pedido.</small>';
      startPixPolling(currentOrderId);
    } else if (data.status === 'rejected') {
      const detail = rejectDetail(data.statusDetail);
      showCardError(detail);
    } else {
      showCardError(data.error || 'Não foi possível aprovar o pagamento.');
    }
  } catch (error) {
    console.error('Erro cartão:', error);
    loadingOverlay.style.display = 'none';
    showCardError('Erro ao processar o cartão. Verifique os dados e tente novamente.');
  }
}

function rejectDetail(detail) {
  const map = {
    'cc_rejected_other_reason': 'Cartão não aprovado. Tente outro cartão ou forma de pagamento.',
    'cc_rejected_bad_filled_card_number': 'Número do cartão inválido.',
    'cc_rejected_bad_filled_security_code': 'CVV inválido.',
    'cc_rejected_bad_filled_date': 'Validade inválida.',
    'cc_rejected_card_disabled': 'Cartão bloqueado. Contate seu banco.',
    'cc_rejected_card_error': 'Erro ao processar cartão.',
    'cc_rejected_insufficient_amount': 'Limite insuficiente.',
    'cc_rejected_high_risk': 'Pagamento recusado por segurança.',
    'cc_rejected_call_for_authorize': 'Contate seu banco para autorizar a compra.'
  };
  return map[detail] || 'Pagamento recusado pelo emissor do cartão. Tente novamente.';
}

function showCardError(msg) {
  const el = document.getElementById('cardError');
  el.textContent = msg;
  el.style.display = 'flex';
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
      if (specs) specsInfo = '<br><small style="color: var(--text-muted); font-size: 11px;">' + escapeHtml(specs) + '</small>';
    }
    if (item.cor) {
      specsInfo += '<br><small style="color: var(--text-muted); font-size: 11px;"><i class="fas fa-palette"></i> Cor: ' + escapeHtml(item.cor) + '</small>';
    }
    return `
      <div class="cart-item">
        <div>
          <strong>${escapeHtml(item.nome)}</strong><br>
          <small>Categoria: ${escapeHtml(item.categoria || 'N/A')} | ${item.quantidade}x R$ ${item.preco.toFixed(2)}</small>${specsInfo}
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
      const safeCode = escapeHtml(c.code);
      couponHtml += '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:white;border-radius:6px;margin-bottom:4px;border:1px solid #fef9c3;">' +
        '<div><span style="font-size:12px;font-weight:700;color:#d97706;">' + safeCode + '</span><span style="font-size:11px;color:#6b7280;margin-left:6px;">' + escapeHtml(c.discount) + '% off</span></div>' +
        '<button onclick="quickApplyCoupon(\'' + safeCode.replace(/'/g, "&#39;") + '\')" style="padding:4px 10px;border:none;border-radius:4px;background:#d97706;color:white;font-size:11px;font-weight:600;cursor:pointer;">Usar</button>' +
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
      result.innerHTML = '<span style="color:var(--error)">' + escapeHtml(data.error || 'Cupom inválido') + '</span>';
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
