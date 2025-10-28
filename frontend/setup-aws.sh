#!/bin/bash
# Script para configurar el perfil AWS por defecto

export AWS_PROFILE=IgerApp

echo "‚úÖ AWS Profile configurado: $AWS_PROFILE"
echo ""

# Verificar que funciona
echo "Verificando configuraci√≥n AWS..."
aws sts get-caller-identity

echo ""
echo "Ì≥ù Para usar este perfil en otras terminales, ejecuta:"
echo "   export AWS_PROFILE=IgerApp"
