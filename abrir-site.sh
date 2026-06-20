#!/bin/bash
# Launcher rápido para TechVault Store
# Abre o site automaticamente no navegador

SITE_URL="http://localhost:3000"
SITE_DIR="/home/jonas/techvault-store"

echo "🚀 Abrindo TechVault Store..."

# Verificar se o servidor já está rodando
if curl -s --head "$SITE_URL" > /dev/null 2>&1; then
    echo "✅ Servidor já está rodando!"
    echo "🌐 Abrindo $SITE_URL no navegador..."
else
    echo "⚠️  Servidor não está rodando. Iniciando..."
    cd "$SITE_DIR"
    
    # Iniciar em background
    npm start > /dev/null 2>&1 &
    echo "📦 Aguardando servidor inicializar..."
    
    # Aguardar até o servidor estar pronto
    for i in {1..30}; do
        if curl -s --head "$SITE_URL" > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done
fi

# Abrir no navegador
if command -v xdg-open &> /dev/null; then
    xdg-open "$SITE_URL"
elif command -v gnome-open &> /dev/null; then
    gnome-open "$SITE_URL"
elif command -v kde-open &> /dev/null; then
    kde-open "$SITE_URL"
else
    echo "🌐 Abra manualmente: $SITE_URL"
fi

echo "✅ TechVault Store abierta!"