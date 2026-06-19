# TechVault - Loja Virtual de Tecnologia

🚀 Sua loja virtual moderna de produtos de tecnologia!

## 📋 Recursos

- **Página Inicial** com design moderno e futurista
- **Catálogo de Produtos** por categorias:
  - Processadores
  - Memória RAM
  - SSDs
  - HDs
  - Monitores
  - Gabinetes
  - PCs Premontados
  - Acessórios
  - Utilitários
- **Sistema de Autenticação**:
  - Registro de usuário
  - Login com email/senha
  - Login com Google (simulado)
- **Carrinho de Compras**
- **Checkout Completo**:
  - Formulário de endereço com busca automática de CEP
  - Dados completos do cliente
  - Resumo do pedido
- **Envio de Email Automático**:
  - Notificação de pedidos para akilajonas001@gmail.com
  - Detalhes completos do cliente e pedido

## 🛠️ Instalação

### 1. Instale as dependências

```bash
cd ~/techvault-store
npm install
```

### 2. Configure o Email (Opcional)

Para receber os pedidos por email, configure sua conta Gmail:

1. Ative a verificação em 2 etapas na sua conta Google
2. Gere uma "Senha de Aplicativo" em: https://myaccount.google.com/apppasswords
3. Edite o arquivo `.env` e adicione sua senha:

```
EMAIL_USER=akilajonas001@gmail.com
EMAIL_PASS=sua-senha-de-aplicativo-aqui
```

**Sem configurar o email, a loja funciona normalmente, mas você não receberá as notificações por email.**

### 3. Inicie o Servidor

```bash
npm start
```

Ou para desenvolvimento com auto-reload:

```bash
npm run dev
```

### 4. Acesse a Loja

Abra seu navegador e acesse:
```
http://localhost:3000
```

## 📁 Estrutura do Projeto

```
techvault-store/
├── backend/
│   ├── server.js          # Servidor Node.js/Express
│   └── data/              # Dados (users.json, orders.json)
├── public/
│   ├── index.html         # Página inicial
│   ├── login.html         # Login
│   ├── registro.html      # Registro
│   ├── checkout.html      # Checkout
│   ├── categoria.html     # Página de categoria
│   ├── js/
│   │   ├── main.js        # Funções globais
│   │   ├── home.js        # Página inicial
│   │   ├── auth.js        # Autenticação
│   │   ├── checkout.js    # Checkout
│   │   └── category.js    # Categorias
│   └── styles/
│       └── main.css       # Estilos globais
├── package.json
├── .env                   # Variáveis de ambiente
└── README.md
```

## 🎨 Design

O site possui um design **futurista/cyberpunk** com:
- Cores neon (ciano, roxo, rosa)
- Fundo escuro
- Animações suaves
- Totalmente responsivo (mobile-friendly)

## 🛒 Funcionamento

### Para o Cliente:
1. Navega pela loja sem precisar de login
2. Adiciona produtos ao carrinho
3. Ao finalizar compra, precisa registrar ou login
4. Preenche endereço completo (CEP é buscado automaticamente)
5. Finaliza o pedido

### Para Você (Lojista):
1. Recebe email com todos os detalhes do pedido:
   - Dados do cliente (nome, email, telefone)
   - Endereço completo
   - Lista de produtos
   - Valores
2. O dinheiro cai na sua conta (sistema de pagamento a ser implementado)
3. Você compra o produto do fornecedor
4. Envia para o endereço do cliente

## 🔄 Próximos Passos (A Implementar)

- [ ] Integração com gateway de pagamento (Mercado Pago, Stripe, PagSeguro)
- [ ] Sistema de dropshipping automático com fornecedores
- [ ] Painel administrativo para gerenciar pedidos
- [ ] Upload de produtos via painel
- [ ] Integração com APIs de fornecedores
- [ ] Rastreamento de pedidos
- [ ] Sistema de avaliações

## 📧 Suporte

Email: akilajonas001@gmail.com

## 📄 Licença

Projeto pessoal - TechVault © 2026

---

**Divirta-se montando sua loja!** 🚀