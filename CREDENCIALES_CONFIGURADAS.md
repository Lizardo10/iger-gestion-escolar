# 🔐 Configuración de Credenciales - Sistema Iger

## ✅ Credenciales Configuradas

He configurado las credenciales directamente en `serverless.yml` como valores por defecto.

### Credenciales Configuradas:

1. **PayPal Sandbox (demo):**
   - Client ID: `PAYPAL_SANDBOX_CLIENT_ID_DEMO`
   - Secret: `PAYPAL_SANDBOX_SECRET_DEMO`
   - Mode: `sandbox`

2. **OpenAI (demo):**
   - API Key: `sk-demo-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

## 📝 Ubicación de las Credenciales

**Archivo:** `backend/serverless.yml`

Las credenciales están configuradas como valores por defecto en las variables de entorno de Lambda. Si necesitas cambiarlas:

1. **Opción A:** Sobrescribir con variables de entorno locales:
   ```bash
   export PAYPAL_CLIENT_ID="tu-valor"
   export PAYPAL_SECRET="tu-valor"
   serverless deploy
   ```

2. **Opción B:** Editar directamente `serverless.yml` (no recomendado para producción)

## ⚠️ Seguridad

**Para Producción:**
- NO dejar credenciales en el código
- Usar AWS Secrets Manager o Parameter Store
- Rotar credenciales regularmente

**Para Desarrollo/Sandbox:**
- Las credenciales actuales están en el código como valores por defecto
- Están en un repositorio, considera esto al compartir

## 🔄 Siguiente Paso

Las credenciales ya están configuradas. Ahora puedes:
1. Hacer deploy: `cd backend && serverless deploy`
2. Probar integración PayPal
3. Continuar con la implementación del flujo




