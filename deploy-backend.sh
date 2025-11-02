#!/bin/bash

# Script para deploy del backend a AWS Lambda (Serverless)
# Uso: ./deploy-backend.sh

echo "🚀 Iniciando deploy del backend a AWS Lambda..."

# Verificar que Serverless CLI esté instalado
if ! command -v serverless &> /dev/null; then
    echo "❌ Serverless CLI no está instalado"
    echo "Instala con: npm install -g serverless"
    exit 1
fi

# Verificar configuración AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI no está configurado"
    echo "Configura con: aws configure"
    exit 1
fi

echo "✅ Serverless CLI encontrado"
echo "✅ AWS CLI configurado"

# Ir al directorio backend
cd backend || exit 1

# Verificar que las dependencias estén instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Build del backend
echo "🔨 Compilando TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error en la compilación del backend"
    exit 1
fi

echo "✅ Compilación completada"

# Ejecutar tests
echo "🧪 Ejecutando tests..."
npm test

if [ $? -ne 0 ]; then
    echo "⚠️  Advertencia: Los tests fallaron"
    read -p "¿Continuar con el deploy de todos modos? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Deploy con Serverless
echo "📤 Desplegando a AWS Lambda..."
serverless deploy

if [ $? -eq 0 ]; then
    echo "✅ Deploy del backend completado exitosamente"
    echo "🌐 URL de la API se mostrará arriba"
else
    echo "❌ Error durante el deploy"
    exit 1
fi

