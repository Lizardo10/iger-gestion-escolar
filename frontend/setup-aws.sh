#!/bin/bash
# Script para configurar el perfil AWS por defecto

export AWS_PROFILE=IgerApp

echo "✅ AWS Profile configurado: $AWS_PROFILE"
echo ""

# Verificar que funciona
echo "Verificando configuración AWS..."
aws sts get-caller-identity

echo ""
echo "� Para usar este perfil en otras terminales, ejecuta:"
echo "   export AWS_PROFILE=IgerApp"
