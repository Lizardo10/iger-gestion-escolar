# Cómo Configurar el Webhook de PayPal

## Problema Actual

Después de completar un pago en PayPal, el sistema no está:
- ✅ Descontando el dinero de la cuenta del pagador
- ✅ Acreditando el dinero en la cuenta del receptor
- ✅ Actualizando el estado de la inscripción a "activa"
- ✅ Activando al estudiante
- ✅ Enviando la factura por correo

**Causa:** El webhook de PayPal no está configurado o no está recibiendo los eventos correctamente.

## Solución: Configurar Webhook en PayPal

### Paso 1: Obtener la URL del Webhook

La URL del webhook es la siguiente:
```
https://[TU_API_GATEWAY_URL]/dev/payments/webhook
```

Para obtener tu URL de API Gateway:
1. Ve a AWS Console → API Gateway
2. Busca tu API `iger-backend-dev`
3. Ve a "Stages" → "dev"
4. Copia la "Invoke URL" (algo como: `https://xxxxx.execute-api.us-east-1.amazonaws.com/dev`)
5. La URL completa del webhook será: `https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/payments/webhook`

**O ejecuta este comando para obtenerla:**
```bash
aws apigateway get-rest-apis --query "items[?name=='iger-backend-dev'].id" --output text | xargs -I {} aws apigateway get-stage --rest-api-id {} --stage-name dev --query "invokeUrl" --output text
```

### Paso 2: Configurar Webhook en PayPal Developer

1. **Ve a PayPal Developer Dashboard:**
   - URL: https://developer.paypal.com/dashboard/
   - Inicia sesión con tu cuenta de PayPal

2. **Selecciona tu aplicación:**
   - Busca tu aplicación de Sandbox
   - O crea una nueva si es necesario

3. **Ve a Webhooks:**
   - En el menú lateral, busca "Webhooks"
   - O ve directamente a: https://developer.paypal.com/dashboard/webhooks

4. **Crea un nuevo Webhook:**
   - Haz clic en "Create Webhook" o "Add Webhook"
   - URL del Webhook: Pega la URL que obtuviste en el Paso 1
   - **Eventos a escuchar** (selecciona estos eventos críticos):
     - ✅ `CHECKOUT.ORDER.APPROVED` - Cuando el usuario aprueba el pago
     - ✅ `PAYMENT.CAPTURE.COMPLETED` - Cuando el pago se completa exitosamente
     - ✅ `PAYMENT.CAPTURE.DENIED` - Si el pago es rechazado (opcional)
     - ✅ `PAYMENT.CAPTURE.REFUNDED` - Si hay un reembolso (opcional)

5. **Guarda el Webhook:**
   - Haz clic en "Save" o "Create"
   - **Importante:** Copia el "Webhook ID" que te proporciona PayPal

### Paso 3: Verificar que el Webhook Funciona

#### Opción A: Probar con una inscripción real

1. Crea una nueva inscripción desde el frontend
2. Completa el pago en PayPal
3. Revisa los logs en AWS CloudWatch:
   ```bash
   aws logs tail /aws/lambda/iger-backend-dev-paypalWebhook --follow
   ```
4. Deberías ver logs como:
   ```
   🔔 PayPal Webhook recibido: {...}
   💰 Orden X aprobada, capturando pago...
   ✅ Pago capturado exitosamente
   ```

#### Opción B: Simular un Webhook desde PayPal Dashboard

1. Ve a tu webhook en PayPal Dashboard
2. Haz clic en "Send test event" o "Simulate event"
3. Selecciona el evento `CHECKOUT.ORDER.APPROVED`
4. Revisa los logs en CloudWatch para ver si llegó

### Paso 4: Verificar Logs en CloudWatch

Si el webhook no funciona, revisa los logs:

```bash
# Ver logs recientes del webhook
aws logs tail /aws/lambda/iger-backend-dev-paypalWebhook --since 10m

# Ver todos los logs del backend
aws logs tail /aws/lambda/iger-backend-dev-paypalWebhook --follow
```

Busca estos mensajes:
- ✅ `🔔 PayPal Webhook recibido:` - El webhook llegó correctamente
- ✅ `✅ Pago capturado exitosamente` - El pago se capturó
- ✅ `✅ Factura X marcada como pagada` - La factura se actualizó
- ✅ `✅ Enrollment X marcado como activo` - La inscripción se activó
- ✅ `✅ Estudiante X activado` - El estudiante se activó
- ✅ `📧 Email con factura enviado` - El email se envió

Si ves errores, copia el mensaje completo y revisa el problema.

### Problemas Comunes

#### 1. "Webhook no recibido"
- **Causa:** La URL del webhook es incorrecta o no es accesible
- **Solución:** Verifica que la URL esté correcta y que API Gateway esté desplegado

#### 2. "Firma de webhook inválida"
- **Causa:** PayPal está enviando una firma que no podemos validar en sandbox
- **Solución:** El código ya maneja esto (en sandbox acepta todas las firmas). Esto no debería ser un problema.

#### 3. "No se encontró factura con orderId"
- **Causa:** El `orderId` no coincide con el que se guardó en la base de datos
- **Solución:** Revisa los logs para ver qué `orderId` está llegando y compara con lo que se guardó

#### 4. "Pago capturado pero no se actualizó nada"
- **Causa:** Error en la lógica de actualización o en la base de datos
- **Solución:** Revisa los logs completos para ver dónde falló

### Verificar Estado Manualmente

Si el webhook no funciona inmediatamente, puedes verificar manualmente:

1. **Obtener el orderId:**
   - Revisa la inscripción en la base de datos
   - El `paypalOrderId` está guardado en la factura

2. **Capturar el pago manualmente:**
   - Ve a PayPal Dashboard → Orders
   - Busca la orden por ID
   - Si está en estado "APPROVED", necesitas capturarla

3. **O usar la API directamente:**
   ```bash
   curl -X POST https://api.sandbox.paypal.com/v2/checkout/orders/[ORDER_ID]/capture \
     -H "Authorization: Bearer [ACCESS_TOKEN]"
   ```

## Nota Importante

⚠️ **El webhook es crítico para el funcionamiento del sistema.** Sin él, los pagos se completan en PayPal pero el sistema no:
- Actualiza el estado de las facturas
- Activa los estudiantes
- Envía las facturas por correo

**Asegúrate de configurarlo correctamente antes de usar el sistema en producción.**

