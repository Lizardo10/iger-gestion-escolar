#!/bin/bash

# Script para crear usuario administrador
# Uso: ./crear_admin.sh

USER_POOL_ID="us-east-1_gY5JpRMyV"
EMAIL="lizardoperezjimenez@gmail.com"
FIRST_NAME="Lizardo"
LAST_NAME="Pérez"
ROLE="admin"
ORG_ID="org-1"

echo "Creando usuario administrador: $EMAIL"

# Generar contraseña temporal
TEMP_PASSWORD=$(openssl rand -base64 12 | tr -d "=+/" | cut -c1-12)
TEMP_PASSWORD="${TEMP_PASSWORD}Aa1!"

echo "Contraseña temporal generada: $TEMP_PASSWORD"
echo ""

# Crear usuario
aws cognito-idp admin-create-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "$EMAIL" \
  --user-attributes \
    Name=email,Value="$EMAIL" \
    Name=email_verified,Value=true \
    Name=given_name,Value="$FIRST_NAME" \
    Name=family_name,Value="$LAST_NAME" \
    Name=custom:role,Value="$ROLE" \
    Name=custom:orgId,Value="$ORG_ID" \
  --message-action SUPPRESS \
  --temporary-password "$TEMP_PASSWORD" \
  --profile IgerApp

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Usuario creado exitosamente"
  echo ""
  echo "📧 Email: $EMAIL"
  echo "🔑 Contraseña temporal: $TEMP_PASSWORD"
  echo ""
  echo "⚠️ IMPORTANTE: Guarda esta contraseña. El usuario deberá cambiarla en el primer login."
  echo ""
  echo "Para iniciar sesión:"
  echo "1. curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/login \\"
  echo "   -H 'Content-Type: application/json' \\"
  echo "   -d '{\"email\": \"$EMAIL\", \"password\": \"$TEMP_PASSWORD\"}'"
  echo ""
  echo "2. Si te pide cambiar contraseña, usa /auth/respond-new-password"
else
  echo ""
  echo "❌ Error al crear usuario"
fi

