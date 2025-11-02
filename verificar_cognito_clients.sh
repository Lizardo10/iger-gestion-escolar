#!/bin/bash
# Script para verificar la configuración de los App Clients de Cognito

USER_POOL_ID="us-east-1_gY5JpRMyV"
CLIENT_ID_1="2bkp4td01pdt895cbi0kqem50a"  # igermaf601b757_app_clientWeb
CLIENT_ID_2="2fnlqplfrqakied4notp6i626i"  # igermaf601b757_app_client

echo "=== Verificando Client 1: igermaf601b757_app_clientWeb ==="
aws cognito-idp describe-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-id $CLIENT_ID_1 \
  --profile IgerApp \
  --query 'UserPoolClient.{Name:ClientName,ExplicitAuthFlows:ExplicitAuthFlows,AllowedOAuthFlows:AllowedOAuthFlows}' \
  --output json

echo ""
echo "=== Verificando Client 2: igermaf601b757_app_client ==="
aws cognito-idp describe-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-id $CLIENT_ID_2 \
  --profile IgerApp \
  --query 'UserPoolClient.{Name:ClientName,ExplicitAuthFlows:ExplicitAuthFlows,AllowedOAuthFlows:AllowedOAuthFlows}' \
  --output json


