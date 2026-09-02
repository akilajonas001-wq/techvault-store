const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API = 'https://api.brevo.com/v3';
const SENDER_EMAIL = 'privacidadetechvault@gmail.com';
const SENDER_NAME = 'TechVault';

async function brevoSend({ to, subject, html }) {
  if (!BREVO_API_KEY) {
    console.warn('BREVO_API_KEY não configurada. Email não enviado:', subject);
    return false;
  }
  try {
    const res = await fetch(`${BREVO_API}/smtp/email`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html
      })
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Brevo send error:', res.status, err);
      return false;
    }
    console.log(`Email enviado via Brevo: "${subject}" → ${to}`);
    return true;
  } catch (e) {
    console.error('Brevo send exception:', e.message);
    return false;
  }
}

// ==================== TEMPLATES ====================

function baseTemplate(body) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:30px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#ff7a1a,#ff9a44);padding:28px 40px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;letter-spacing:0.5px;">⚡ TechVault</h1>
  </td></tr>
  <tr><td style="padding:40px 44px;">${body}</td></tr>
  <tr><td style="background:#f9fafb;padding:20px 44px;text-align:center;border-top:1px solid #eee;">
    <p style="margin:0;color:#999;font-size:12px;">TechVault Store &bull; Sua loja de tecnologia</p>
    <p style="margin:6px 0 0;color:#bbb;font-size:11px;">Se não foi você, ignore este email.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function btnStyle() {
  return 'display:inline-block;background:linear-gradient(135deg,#ff7a1a,#ff9a44);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:16px;font-weight:600;letter-spacing:0.3px;';
}

// ==================== 1. BOAS-VINDAS ====================

function welcomeHtml(nome) {
  const body = `
    <h2 style="margin:0 0 8px;color:#333;font-size:22px;">Bem-vindo(a), ${nome}! 🎉</h2>
    <p style="margin:0 0 20px;color:#666;font-size:15px;line-height:1.7;">
      Ficamos muito felizes em ter você por aqui! A <strong>TechVault</strong> é o seu lugar pra encontrar
      os melhores produtos de tecnologia com preços incríveis.
    </p>
    <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.7;">
      Pra começar, que tal dar uma olhada nos nossos <strong>destaques da semana</strong>? Tem coisas boas te esperando! 😄
    </p>
    <div style="text-align:center;margin:30px 0;">
      <a href="${process.env.STORE_URL || 'https://techvault-store.onrender.com'}" style="${btnStyle()}">
        🛒 Explorar a Loja
      </a>
    </div>
    <p style="margin:24px 0 0;color:#888;font-size:13px;line-height:1.6;">
      Qualquer dúvida, é só responder este email ou acessar nossa
      <a href="${process.env.STORE_URL || 'https://techvault-store.onrender.com'}/central-ajuda" style="color:#ff7a1a;">Central de Ajuda</a>.
      Estamos aqui pra te ajudar!
    </p>`;
  return baseTemplate(body);
}

// ==================== 2. CARRINHO ABANDONADO ====================

function abandonedCartHtml(nome, itens, orderId) {
  const itensList = (itens || []).map(i =>
    `<li style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#444;font-size:14px;">
      ${i.nome || i.name || 'Produto'} ${i.quantidade > 1 ? `(x${i.quantidade})` : ''}
    </li>`
  ).join('');

  const storeUrl = process.env.STORE_URL || 'https://techvault-store.onrender.com';
  const body = `
    <h2 style="margin:0 0 8px;color:#333;font-size:22px;">Ei ${nome}, parece que você esqueceu algo! 🛒</h2>
    <p style="margin:0 0 20px;color:#666;font-size:15px;line-height:1.7;">
      Percebemos que você deixou alguns produtos incríveis no carrinho e não finalizou a compra.
      Acontece com todo mundo! Mas a gente não quer que você perca esses produtos.
    </p>
    <div style="background:#fafafa;border-radius:12px;padding:20px 24px;margin:20px 0;">
      <p style="margin:0 0 10px;color:#333;font-size:14px;font-weight:600;">Itens no seu carrinho:</p>
      <ul style="margin:0;padding:0 0 0 18px;list-style:disc;">${itensList}</ul>
    </div>
    <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.7;">
      Esses produtos estão te esperando! Clique no botão abaixo pra finalizar sua compra
      <strong>antes que acabe o estoque</strong>. ⏳
    </p>
    <div style="text-align:center;margin:30px 0;">
      <a href="${storeUrl}/checkout" style="${btnStyle()}">
        💳 Finalizar Compra
      </a>
    </div>
    <p style="margin:24px 0 0;color:#888;font-size:13px;line-height:1.6;">
      Se teve algum problema no pagamento ou tem alguma dúvida, nossa
      <a href="${storeUrl}/central-ajuda" style="color:#ff7a1a;">Central de Ajuda</a> resolve tudo rapidinho!
    </p>`;
  return baseTemplate(body);
}

// ==================== 3. CONFIRMAÇÃO DE PAGAMENTO ====================

function paymentConfirmedHtml(nome, order) {
  const itens = (order.itens || []).map(i =>
    `<li style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#444;font-size:14px;">
      ${i.nome || i.name || 'Produto'} ${i.quantidade > 1 ? `(x${i.quantidade})` : ''}
      <span style="float:right;font-weight:600;color:#333;">R$ ${((i.preco || i.price || 0) * (i.quantidade || 1)).toFixed(2).replace('.', ',')}</span>
    </li>`
  ).join('');

  const storeUrl = process.env.STORE_URL || 'https://techvault-store.onrender.com';
  const body = `
    <h2 style="margin:0 0 8px;color:#333;font-size:22px;">Pagamento confirmado, ${nome}! ✅</h2>
    <p style="margin:0 0 20px;color:#666;font-size:15px;line-height:1.7;">
      Boa! Seu pagamento foi aprovado com sucesso. Seu pedido já está sendo preparado
      e em breve sai pra entrega. 🚀
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#166534;font-size:14px;font-weight:700;">📦 Pedido #${order.id}</p>
      <ul style="margin:10px 0 0;padding:0 0 0 18px;list-style:disc;">${itens}</ul>
      <p style="margin:16px 0 0;color:#166534;font-size:18px;font-weight:700;text-align:right;">
        Total: R$ ${(order.total || 0).toFixed(2).replace('.', ',')}
      </p>
    </div>
    ${order.endereco ? `
    <div style="background:#fafafa;border-radius:12px;padding:16px 24px;margin:16px 0;">
      <p style="margin:0 0 6px;color:#333;font-size:14px;font-weight:600;">📍 Endereço de entrega:</p>
      <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
        ${order.endereco.logradouro || ''}, ${order.endereco.numero || ''} ${order.endereco.complemento ? '- ' + order.endereco.complemento : ''}<br>
        ${order.endereco.bairro || ''} - ${order.endereco.cidade || ''}/${order.endereco.estado || ''}<br>
        CEP: ${order.endereco.cep || ''}
      </p>
    </div>` : ''}
    <div style="text-align:center;margin:30px 0;">
      <a href="${storeUrl}/comprovante/${order.id}" style="${btnStyle()}">
        📄 Ver Comprovante
      </a>
    </div>
    <p style="margin:24px 0 0;color:#888;font-size:13px;line-height:1.6;">
      Acompanhe seu pedido pela sua conta na TechVault. Qualquer dúvida, estamos aqui!
    </p>`;
  return baseTemplate(body);
}

// ==================== EXPORTS ====================

module.exports = {
  async sendWelcomeEmail(nome, email) {
    return brevoSend({
      to: email,
      subject: '🎉 Bem-vindo(a) à TechVault!',
      html: welcomeHtml(nome)
    });
  },

  async sendAbandonedCartEmail(nome, email, itens, orderId) {
    return brevoSend({
      to: email,
      subject: '🛒 Você esqueceu algo no carrinho!',
      html: abandonedCartHtml(nome, itens, orderId)
    });
  },

  async sendPaymentConfirmedEmail(nome, email, order) {
    return brevoSend({
      to: email,
      subject: '✅ Pagamento confirmado - Pedido #' + order.id,
      html: paymentConfirmedHtml(nome, order)
    });
  },

  brevoSend
};
