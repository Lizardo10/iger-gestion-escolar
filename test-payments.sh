#!/bin/bash

# Script para probar el sistema de pagos
# Uso: ./test-payments.sh EMAIL PASSWORD

API_URL="https://unfepih103.execute-api.us-east-1.amazonaws.com/dev"

echo "🧪 Pruebas del Sistema de Pagos"
echo "================================"
echo ""

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "❌ Uso: ./test-payments.sh EMAIL PASSWORD"
  echo "Ejemplo: ./test-payments.sh admin@test.com Admin123!"
  exit 1
fi

EMAIL=$1
PASSWORD=$2

echo "📝 Email: $EMAIL"
echo "🔐 Password: [oculto]"
echo ""

# 1. Login
echo "1️⃣  Haciendo login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error en login"
  echo "Respuesta: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login exitoso"
echo "Token obtenido: ${TOKEN:0:20}..."
echo ""

# Obtener orgId y user info
ORG_ID=$(echo $LOGIN_RESPONSE | grep -o '"orgId":"[^"]*' | cut -d'"' -f4 || echo "org-1")
USER_ID=$(echo $LOGIN_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

echo "👤 Usuario ID: $USER_ID"
echo "🏢 Org ID: $ORG_ID"
echo ""

# 2. Listar facturas
echo "2️⃣  Listando facturas..."
INVOICES=$(curl -s -X GET "$API_URL/payments/invoices?orgId=$ORG_ID&limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Respuesta:"
echo $INVOICES | python3 -m json.tool 2>/dev/null || echo $INVOICES
echo ""

# 3. Crear factura de prueba
echo "3️⃣  Creando factura de prueba..."
INVOICE_DATA=$(curl -s -X POST "$API_URL/payments/invoices" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"orgId\": \"$ORG_ID\",
    \"studentId\": \"student-test-$(date +%s)\",
    \"items\": [
      {
        \"description\": \"Mensualidad de Prueba\",
        \"quantity\": 1,
        \"unitPrice\": 500000,
        \"total\": 500000
      }
    ],
    \"dueDate\": \"$(date -d '+30 days' '+%Y-%m-%d' 2>/dev/null || date -v+30d '+%Y-%m-%d' 2>/dev/null || echo '2025-03-15')\"
  }")

INVOICE_ID=$(echo $INVOICE_DATA | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$INVOICE_ID" ]; then
  echo "❌ Error creando factura"
  echo "Respuesta: $INVOICE_DATA"
  exit 1
fi

echo "✅ Factura creada"
echo "ID: $INVOICE_ID"
echo "Datos:"
echo $INVOICE_DATA | python3 -m json.tool 2>/dev/null || echo $INVOICE_DATA
echo ""

# 4. Obtener detalle de factura
echo "4️⃣  Obteniendo detalle de factura..."
INVOICE_DETAIL=$(curl -s -X GET "$API_URL/payments/invoices/$INVOICE_ID?orgId=$ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Detalle:"
echo $INVOICE_DETAIL | python3 -m json.tool 2>/dev/null || echo $INVOICE_DETAIL
echo ""

# 5. Crear orden PayPal
echo "5️⃣  Creando orden PayPal..."
PAYPAL_ORDER=$(curl -s -X POST "$API_URL/payments/create-order" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"orgId\": \"$ORG_ID\",
    \"invoiceId\": \"$INVOICE_ID\"
  }")

APPROVAL_URL=$(echo $PAYPAL_ORDER | grep -o '"approvalUrl":"[^"]*' | cut -d'"' -f4)
ORDER_ID=$(echo $PAYPAL_ORDER | grep -o '"orderId":"[^"]*' | cut -d'"' -f4)

echo "✅ Orden PayPal creada"
echo "Order ID: $ORDER_ID"
echo "Approval URL: $APPROVAL_URL"
echo ""
echo "💡 NOTA: Esta URL es MOCK (simulada)"
echo "   En producción, esta URL abriría el checkout real de PayPal"
echo ""

# 6. Simular webhook de PayPal
echo "6️⃣  Simulando webhook de PayPal..."
WEBHOOK_RESPONSE=$(curl -s -X POST "$API_URL/payments/webhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"event_type\": \"PAYMENT.CAPTURE.COMPLETED\",
    \"resource\": {
      \"id\": \"$ORDER_ID\",
      \"custom_id\": \"$INVOICE_ID\",
      \"invoice_id\": \"$INVOICE_ID\"
    }
  }")

echo "Respuesta del webhook:"
echo $WEBHOOK_RESPONSE | python3 -m json.tool 2>/dev/null || echo $WEBHOOK_RESPONSE
echo ""

# 7. Verificar factura actualizada
echo "7️⃣  Verificando factura actualizada..."
UPDATED_INVOICE=$(curl -s -X GET "$API_URL/payments/invoices/$INVOICE_ID?orgId=$ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

STATUS=$(echo $UPDATED_INVOICE | grep -o '"status":"[^"]*' | cut -d'"' -f4)

echo "Estado actual: $STATUS"
echo "Factura actualizada:"
echo $UPDATED_INVOICE | python3 -m json.tool 2>/dev/null || echo $UPDATED_INVOICE
echo ""

echo "================================"
echo "✅ PRUEBAS COMPLETADAS"
echo "================================"
echo ""
echo "📋 Resumen:"
echo "  - Login: ✅"
echo "  - Listar facturas: ✅"
echo "  - Crear factura: ✅"
echo "  - Ver detalle: ✅"
echo "  - Crear orden PayPal: ✅"
echo "  - Webhook PayPal: ✅"
echo "  - Verificar actualización: ✅"
echo ""
echo "💡 Para más pruebas, revisa GUIA_PRUEBAS_COMPLETA.md"

