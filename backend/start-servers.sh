#!/bin/bash

echo "╔════════════════════════════════════════╗"
echo "║        Servidor de Vídeo               ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    echo ""
fi

echo "🚀 Iniciando servidor na porta 3000..."
echo ""

# Iniciar servidor
node server.js

echo ""
echo "✅ Servidor iniciado em http://localhost:3000"