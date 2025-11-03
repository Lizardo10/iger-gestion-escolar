# 🔍 Cómo Verificar que las URLs de PayPal son Correctas

## 📋 Opción 1: Verificar desde el Navegador (Más Fácil)

### Paso 1: Abrir Herramientas de Desarrollador
1. Abre tu aplicación en el navegador: `https://dev.d2umdnu9x2m9qg.amplifyapp.com`
2. Presiona `F12` o `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
3. Ve a la pestaña **"Console"** (Consola)

### Paso 2: Crear una Nueva Inscripción
1. Inicia sesión con tu usuario
2. Ve a la sección **"Inscripción"**
3. Completa el formulario y haz clic en **"Inscribir Alumno"**
4. **IMPORTANTE:** No hagas clic en el link de PayPal todavía

### Paso 3: Verificar en la Consola del Navegador
En la consola del navegador, busca:
- Mensajes que muestren la respuesta del servidor
- Busca palabras como: `returnUrl`, `cancelUrl`, `paymentUrl`, `approvalUrl`
- O simplemente busca: `dev.d2umdnu9x2m9qg.amplifyapp.com` o `iger.online`

**Ejemplo de lo que deberías ver:**
```javascript
✅ API Response: /enrollment 201
{enrollment: {...}, paymentUrl: "https://www.sandbox.paypal.com/...?returnUrl=https://dev.d2umdnu9x2m9qg.amplifyapp.com/..."}
```

### Paso 4: Verificar el Link de PayPal Directamente
1. Copia el link de PayPal que aparece en el mensaje de éxito
2. Pégalo en un editor de texto o en la barra de direcciones (no hagas clic todavía)
3. Busca en la URL la parte que dice `returnUrl=`
4. Verifica que después de `returnUrl=` aparezca: `https://dev.d2umdnu9x2m9qg.amplifyapp.com`
5. **NO debe aparecer:** `iger.online`

**Ejemplo de URL correcta:**
```
https://www.sandbox.paypal.com/checkoutnow?token=XXXXX&returnUrl=https://dev.d2umdnu9x2m9qg.amplifyapp.com/payments/success?enrollmentId=...
```

**Ejemplo de URL incorrecta (NO deberías ver esto):**
```
https://www.sandbox.paypal.com/checkoutnow?token=XXXXX&returnUrl=https://iger.online/payments/success?enrollmentId=...
```

---

## 🌐 Opción 2: Verificar desde AWS CloudWatch (Más Técnico)

### Paso 1: Acceder a AWS Console
1. Ve a: https://console.aws.amazon.com
2. Inicia sesión con tus credenciales
3. En la barra de búsqueda superior, escribe: **"CloudWatch"**
4. Haz clic en **CloudWatch**

### Paso 2: Acceder a Log Groups
1. En el menú izquierdo, haz clic en **"Log groups"**
2. En el buscador, escribe: `iger-backend-dev-enrollStudent`
3. Haz clic en el log group: `/aws/lambda/iger-backend-dev-enrollStudent`

### Paso 3: Ver Logs Recientes
1. Verás una lista de "Log streams" (flujos de log)
2. Haz clic en el más reciente (el que tiene la fecha/hora más actual)
3. Se abrirá una ventana con los logs

### Paso 4: Buscar URLs en los Logs
1. En la página de logs, usa `Ctrl+F` (o `Cmd+F` en Mac) para buscar
2. Busca estas palabras:
   - `returnUrl`
   - `cancelUrl`
   - `FRONTEND_URL`
   - `dev.d2umdnu9x2m9qg.amplifyapp.com`
   - `iger.online` (para confirmar que NO aparece)

**Ejemplo de log correcto:**
```
INFO  returnUrl: https://dev.d2umdnu9x2m9qg.amplifyapp.com/payments/success?enrollmentId=...
INFO  cancelUrl: https://dev.d2umdnu9x2m9qg.amplifyapp.com/payments/cancel?enrollmentId=...
```

### Paso 5: Verificar Logs de createPayPalOrder
Repite los pasos pero busca el log group:
- `/aws/lambda/iger-backend-dev-createPayPalOrder`

---

## 💻 Opción 3: Verificar desde la Terminal (Avanzado)

Si tienes AWS CLI configurado, puedes usar estos comandos:

```bash
# Ver logs recientes de enrollStudent
aws logs tail /aws/lambda/iger-backend-dev-enrollStudent \
  --since 1h \
  --region us-east-1 \
  --filter-pattern "returnUrl" \
  | grep -i "returnUrl\|cancelUrl\|dev.d2umdnu9x2m9qg"

# Ver logs recientes de createPayPalOrder
aws logs tail /aws/lambda/iger-backend-dev-createPayPalOrder \
  --since 1h \
  --region us-east-1 \
  --filter-pattern "returnUrl" \
  | grep -i "returnUrl\|cancelUrl\|dev.d2umdnu9x2m9qg"
```

**Nota:** Si tienes problemas con Git Bash en Windows, puedes usar PowerShell o la terminal de Windows.

---

## ✅ Checklist de Verificación

- [ ] La URL contiene `dev.d2umdnu9x2m9qg.amplifyapp.com`
- [ ] La URL NO contiene `iger.online`
- [ ] El `returnUrl` apunta a `/payments/success?enrollmentId=...`
- [ ] El `cancelUrl` apunta a `/payments/cancel?enrollmentId=...`

---

## 🆘 Si Encuentras `iger.online`

Si todavía ves `iger.online` en alguna parte:

1. **Verifica que el backend esté desplegado:**
   ```bash
   cd backend
   serverless deploy
   ```

2. **Verifica que el frontend esté actualizado:**
   ```bash
   cd frontend
   amplify publish
   ```

3. **Limpia la caché del navegador:**
   - `Ctrl+Shift+Delete` → Limpiar caché
   - O prueba en modo incógnito

4. **Verifica que estés creando una NUEVA inscripción:**
   - Las inscripciones antiguas tienen la URL vieja guardada
   - Solo las nuevas usarán la URL correcta

---

## 📝 Nota Importante

Las **órdenes antiguas de PayPal** que ya fueron creadas seguirán teniendo la URL antigua porque PayPal guarda esa información cuando se crea la orden. 

**Solo las nuevas órdenes** creadas después del deploy usan la URL correcta.

Para probar completamente, crea una **nueva inscripción** o **nueva factura** después de haber desplegado los cambios.


