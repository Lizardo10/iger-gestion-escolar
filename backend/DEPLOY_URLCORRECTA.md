# 🔧 Deploy para Corregir URLs de PayPal

## ✅ Estado Actual

**El código fuente ya está actualizado** - Todas las referencias a `iger.online` han sido reemplazadas por `https://dev.d2umdnu9x2m9qg.amplifyapp.com`

## 🚀 Pasos para Aplicar los Cambios

### 1. Hacer Deploy del Backend

```bash
cd backend
npm run build
serverless deploy
```

O si prefieres solo actualizar funciones específicas:

```bash
serverless deploy function -f enrollmentEnrollStudent
serverless deploy function -f paymentsCreatePayPalOrder
```

### 2. Verificar Variables de Entorno en AWS

**Importante:** Si tienes una variable de entorno `FRONTEND_URL` configurada en AWS Lambda, podría estar sobrescribiendo el valor por defecto.

Para verificar:

```bash
# Ver todas las funciones Lambda
aws lambda list-functions --region us-east-1 | grep iger

# Ver variables de entorno de una función específica (reemplaza FUNCTION_NAME)
aws lambda get-function-configuration \
  --function-name FUNCTION_NAME \
  --region us-east-1 \
  --query 'Environment.Variables'
```

**Si encuentras `FRONTEND_URL=iger.online`, actualízala:**

```bash
# Actualizar variable de entorno para todas las funciones Lambda
# O mejor, elimínala para que use el valor por defecto del serverless.yml
```

### 3. Verificar en CloudWatch

Después del deploy, verifica los logs en CloudWatch para confirmar que se están usando las URLs correctas:

```bash
# Ver logs recientes de una función Lambda
aws logs tail /aws/lambda/iger-backend-dev-enrollmentEnrollStudent --follow --region us-east-1
```

Busca en los logs líneas que muestren las URLs generadas para PayPal.

## 📋 Resumen de Cambios Aplicados

✅ `backend/serverless.yml` - FRONTEND_URL por defecto actualizado
✅ `backend/src/handlers/enrollment.ts` - returnUrl y cancelUrl actualizados
✅ `backend/src/handlers/payments.ts` - returnUrl y cancelUrl actualizados  
✅ `backend/src/lib/paypal.ts` - URLs por defecto actualizadas

**NOTA:** Solo quedan referencias a `iger.online` en `EMAIL_FROM`, que es solo para el remitente del email (no afecta las URLs de PayPal).

## ⚠️ Importante

Después del deploy, **todas las nuevas órdenes de PayPal** usarán la URL correcta de Amplify. Las órdenes antiguas que ya se crearon seguirán teniendo la URL antigua porque ya están guardadas en PayPal.

## 🔍 Cómo Verificar que Funcionó

1. Crea una nueva inscripción o factura
2. Genera un link de pago de PayPal
3. Antes de pagar, en la consola del navegador (F12), verifica que la URL de retorno muestre `dev.d2umdnu9x2m9qg.amplifyapp.com` y NO `iger.online`


