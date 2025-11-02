#!/bin/bash
# Script para crear un App Client de Cognito con las configuraciones correctas

USER_POOL_ID="us-east-1_gY5JpRMyV"

echo "Creando App Client para backend Iger..."

aws cognito-idp create-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-name iger-backend-client \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --generate-secret \
  --profile IgerApp \
  --query 'UserPoolClient.{ClientId:ClientId,ClientName:ClientName,ExplicitAuthFlows:ExplicitAuthFlows}' \
  --output json

echo ""
echo "✅ App Client creado. Copia el 'ClientId' de arriba y úsalo como COGNITO_CLIENT_ID"


