#!/bin/bash

# Script para deploy completo (frontend + backend)
# Uso: ./deploy-all.sh

echo "🚀 Iniciando deploy completo del proyecto..."

# Verificar herramientas necesarias
if ! command -v amplify &> /dev/null; then
    echo "❌ Amplify CLI no está instalado"
    exit 1
fi

if ! command -v serverless &> /dev/null; then
    echo "❌ Serverless CLI no está instalado"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI no está configurado"
    exit 1
fi

echo "✅ Todas las herramientas están instaladas y configuradas"

# Deploy del backend primero
echo ""
echo "========================================="
echo "📦 DESPLEGANDO BACKEND"
echo "========================================="
./deploy-backend.sh

if [ $? -ne 0 ]; then
    echo "❌ Error en el deploy del backend. Abortando."
    exit 1
fi

# Esperar un momento para que el backend esté listo
echo ""
echo "⏳ Esperando 5 segundos antes de continuar..."
sleep 5

# Deploy del frontend
echo ""
echo "========================================="
echo "📦 DESPLEGANDO FRONTEND"
echo "========================================="
./deploy-frontend.sh

if [ $? -ne 0 ]; then
    echo "❌ Error en el deploy del frontend"
    exit 1
fi

echo ""
echo "========================================="
echo "✅ DEPLOY COMPLETO EXITOSO"
echo "========================================="
echo "🌐 Frontend: Revisa la URL en Amplify Console"
echo "🔗 Backend: La URL de la API se mostró arriba"
echo ""
echo "⚠️  Recuerda actualizar las variables de entorno en Amplify"
echo "   si la URL de la API cambió"

