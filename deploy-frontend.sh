#!/bin/bash

# Script para deploy del frontend a AWS Amplify
# Uso: ./deploy-frontend.sh

echo "🚀 Iniciando deploy del frontend a AWS Amplify..."

# Verificar que Amplify CLI esté instalado
if ! command -v amplify &> /dev/null; then
    echo "❌ Amplify CLI no está instalado"
    echo "Instala con: npm install -g @aws-amplify/cli"
    exit 1
fi

# Verificar configuración AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI no está configurado"
    echo "Configura con: aws configure"
    exit 1
fi

echo "✅ Amplify CLI encontrado"
echo "✅ AWS CLI configurado"

# Ir al directorio frontend
cd frontend || exit 1

# Verificar si hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Advertencia: Hay cambios sin commitear"
    read -p "¿Continuar de todos modos? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build del frontend
echo "📦 Construyendo frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error en el build del frontend"
    exit 1
fi

echo "✅ Build completado"

# Verificar si Amplify está inicializado
if [ ! -d "../amplify" ]; then
    echo "⚠️  Amplify no está inicializado en este proyecto"
    echo "Ejecuta primero: amplify init"
    exit 1
fi

# Hacer push/publish a Amplify
echo "📤 Publicando a AWS Amplify..."
amplify publish

if [ $? -eq 0 ]; then
    echo "✅ Deploy del frontend completado exitosamente"
    echo "🌐 Revisa la URL en la consola de Amplify"
else
    echo "❌ Error durante el deploy"
    exit 1
fi

