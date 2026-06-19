#!/bin/bash
# Script para iniciar a TechVault Store

echo "🚀 Iniciando TechVault Store..."
echo ""

cd ~/techvault-store

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependências..."
  npm install
  echo ""
fi

# Iniciar o servidor
echo "🌐 Servidor disponível em: http://localhost:3000"
echo "📧 Emails serão enviados para: akilajonas001@gmail.com"
echo ""
echo "⚠️  Para configurar o email, edite o arquivo .env"
echo "   See README.md for instructions"
echo ""

npm start