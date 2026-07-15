# Sistema de Rastreio de Pedidos - TechVault

## Visão Geral
Sistema completo de rastreio de pedidos adicionado ao painel administrativo e à área do cliente.

## Funcionalidades Implementadas

### 1. Painel Administrativo (`/painel`)
- **Botão de Rastreio**: Cada pedido agora tem um botão roxo com ícone de caminhão (`fa-shipping-fast`)
- **Modal de Rastreio**: Ao clicar, abre um modal onde você pode:
  - Inserir o **número de rastreio** do fornecedor/correios
  - Selecionar as **etapas concluídas**:
    - ✅ O pedido saiu para a entrega
    - ✅ O pedido chegou na sua cidade
    - ✅ O pedido foi entregue
- **Atualização em Tempo Real**: As informações são salvas imediatamente no banco de dados

### 2. Área do Cliente (`/conta`)
- **Botão "Rastrear"**: Aparece em cada pedido que possui número de rastreio cadastrado
- **Visualização das Etapas**: O cliente vê:
  - Código de rastreio em destaque
  - Lista das etapas já concluídas com ícones coloridos:
    - 🚚 Roxo: Saiu para entrega
    - 📍 Azul: Chegou na cidade
    - ✅ Verde: Entregue

## Como Usar

### No Painel Admin:
1. Acesse `/painel`
2. Na aba "Pedidos", localize o pedido desejado
3. Clique no botão roxo de rastreio (ícone de caminhão)
4. Digite o código de rastreio (ex: `ABC123456789BR`)
5. Marque as etapas já concluídas
6. Clique em "Salvar Rastreio"

### Para o Cliente:
1. O cliente acessa `/conta`
2. Vai em "Meus Pedidos"
3. Pedidos com rastreio terão um botão "Rastrear"
4. Ao clicar, vê o código e as etapas do rastreio

## Alterações Técnicas

### Banco de Dados
Novas colunas na tabela `orders`:
- `trackingNumber TEXT DEFAULT ''` - Código de rastreio
- `trackingStatus TEXT DEFAULT '[]'` - Array JSON das etapas concluídas

### Backend
**Arquivo**: `backend/db.js`
- Nova função: `updateOrderTracking(id, trackingNumber, trackingStatus)`

**Arquivo**: `backend/routes/admin.js`
- Novo endpoint: `PUT /api/admin/orders/:id/tracking`

### Frontend Admin
**Arquivo**: `public/painel.html`
- Botão de rastreio na tabela de pedidos
- Modal de rastreio com formulário
- Funções JavaScript: `openTrackingModal()`, `closeTrackingModal()`, `saveTracking()`

### Frontend Cliente
**Arquivo**: `public/conta.html`
- Botão "Rastrear" nos pedidos com trackingNumber
- Modal de visualização do rastreio
- Funções: `showOrderTracking()`, `closeTrackingModal()`

## Banco de Dados - Migração Automática
Ao iniciar o servidor, as novas colunas são criadas automaticamente se não existirem:
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS trackingNumber TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS trackingStatus TEXT DEFAULT '[]';
```

## Etapas do Rastreio (Status)
O sistema usa 3 etapas padrão:
1. `saiu_entrega` - Ícone de caminhão (roxo)
2. `chegou_cidade` - Ícone de marcador (azul)
3. `entregue` - Ícone de check (verde)

## Segurança
- Apenas funcionários e administradores podem atualizar o rastreio
- O número de rastreio é visível apenas para pedidos que foram atualizados
- O cliente só vê as informações após o admin salvar

## Próximos Passos (Sugestões)
- [ ] Integração com API dos Correios para busca automática
- [ ] Envio de notificações por email/SMS quando o status mudar
- [ ] Histórico completo de movimentações com data/hora
- [ ] Upload de comprovante de entrega