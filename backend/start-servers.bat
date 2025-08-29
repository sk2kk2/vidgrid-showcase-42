@echo off
echo ╔════════════════════════════════════════╗
echo ║        Servidor de Vídeo               ║
echo ╚════════════════════════════════════════╝
echo.

REM Instalar dependências se necessário
if not exist "node_modules" (
    echo 📦 Instalando dependências...
    call npm install
    echo.
)

echo 🚀 Iniciando servidor na porta 3000...
echo.

REM Iniciar servidor na porta 3000
node server.js

echo.
echo ✅ Servidor iniciado em http://localhost:3000
echo.
pause