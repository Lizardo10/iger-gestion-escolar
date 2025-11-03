# 🔐 Configuración de Credenciales - Sistema Iger

## ✅ Credenciales Configuradas

He configurado las credenciales directamente en `serverless.yml` como valores por defecto.

### Credenciales Configuradas:

1. **PayPal Sandbox:**
   - Client ID: `AVtfXKf2gDJ2SxQ57e4gZAAG9OK29bks29d6RiE_VFwh3F6Pp7i0FoUicoaG67GfQbQWgaCea5c_gJKH`
   - Secret: `EN5JatASQxiC1GJLbjc66JwSQvcKEhCGKUsZWOlnSAEqnmP2Um8HrSHmLmj_VAkp2mr5zIa51vPJsr9f`
   - Mode: `sandbox` (siempre)

2. **OpenAI:**
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




