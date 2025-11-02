# 🌐 Configurar Dominio Personalizado `iger.online` en AWS Amplify

Esta guía te ayudará a enlazar tu dominio `iger.online` de Namecheap con tu aplicación en AWS Amplify.

## ✅ Prerrequisitos

- Cuenta AWS activa
- Dominio `iger.online` comprado en Namecheap
- Aplicación ya desplegada en AWS Amplify
- Acceso a la cuenta de Namecheap

## 🚀 Pasos para Configurar el Dominio

### Paso 1: Acceder a AWS Amplify Console

1. Ve a: https://console.aws.amazon.com/amplify/home?region=us-east-1
2. Busca tu aplicación `dev-iger-frontend` o similar
3. Click en el nombre de tu aplicación para abrirla

### Paso 2: Agregar Dominio Personalizado

1. En el panel izquierdo, busca **"Domains"** o **"Dominios"**
2. Click en **"Add domain"** o **"Agregar dominio"**
3. Ingresa tu dominio: `iger.online`
4. Click en **"Configure domain"**

### Paso 3: Opciones de Configuración DNS

Amplify te dará **2 opciones**:

#### **Opción A: Usar Route 53 (Recomendada - Más fácil)**

Si eliges Route 53:

1. Amplify creará automáticamente un Hosted Zone en Route 53
2. Te dará **4 nameservers** (servidores de nombres)
3. Copia estos nameservers - se verán así:
   ```
   ns-1234.awsdns-56.com
   ns-2345.awsdns-67.net
   ns-3456.awsdns-78.org
   ns-4567.awsdns-89.co.uk
   ```

**Luego en Namecheap:**
1. Login en: https://www.namecheap.com/myaccount/login/
2. Ve a **"Domain List"**
3. Click en **"Manage"** al lado de `iger.online`
4. Ve a la pestaña **"Advanced DNS"**
5. Scroll hasta **"Nameservers"**
6. Click en **"Custom"**
7. Cambia cada nameserver por los que te dio AWS:
   - Reemplaza los 4 nameservers actuales de Namecheap
   - Por los 4 nameservers de AWS Route 53
8. Click en **"Save"** (verde checkmark)

#### **Opción B: Configuración Manual en Namecheap**

Si prefieres manejar DNS en Namecheap:

1. Amplify te dará registros DNS específicos
2. Los más importantes son registros **CNAME**

**Luego en Namecheap:**
1. Login en Namecheap
2. Ve a **"Domain List"** → Click **"Manage"** en `iger.online`
3. Ve a **"Advanced DNS"**
4. En **"Host Records"**, agrega:

**Registros para el dominio raíz (@):**
```
Type: CNAME Record
Host: @
Value: [El dominio de CloudFront que te da Amplify]
TTL: Automatic
```

**Registros para subdominio www:**
```
Type: CNAME Record
Host: www
Value: [El dominio de CloudFront que te da Amplify]
TTL: Automatic
```

**También agrega el registro de verificación:**
```
Type: CNAME Record
Host: _verify.[valor que te da Amplify]
Value: [valor que te da Amplify]
TTL: Automatic
```

### Paso 4: Verificación y Propagación

1. Después de agregar los registros, ve a Amplify Console
2. Confirm que has completado la configuración
3. Amplify comenzará a:
   - ✅ Verificar propiedad del dominio
   - ✅ Solicitar certificado SSL/TLS gratuito
   - ✅ Configurar CloudFront

**⏱️ Tiempo estimado:**
- Verificación: 15-30 minutos
- Propagación DNS: 1-48 horas
- Certificado SSL: 1-24 horas

### Paso 5: Monitorear Estado

En Amplify Console → **"Domains"**, verás el estado:

- 🟡 **Pending validation**: Esperando verificación DNS
- 🟡 **Pending deployment**: Esperando certificado SSL
- 🟢 **Available**: ¡Listo! Tu dominio funciona

## 🔍 Verificar que Funciona

Una vez que el estado sea **"Available"**:

1. Abre tu navegador
2. Ve a: https://iger.online
3. Deberías ver tu aplicación funcionando
4. También debería funcionar: https://www.iger.online

## 📊 URLs Finales

Después de la configuración, tendrás:

- **Dominio principal**: https://iger.online
- **Subdominio www**: https://www.iger.online (redirige a iger.online)
- **URL antigua**: https://dev.d2umdnu9x2m9qg.amplifyapp.com (sigue funcionando)

## ⚠️ Importante Actualizar CORS

Después de configurar el dominio, **actualiza CORS en el backend**:

```bash
cd backend
# Edita serverless.yml, línea 19:
ALLOWED_ORIGIN: ${env:ALLOWED_ORIGIN, 'https://iger.online'}
```

Luego redeploya:
```bash
export AWS_PROFILE=IgerApp
serverless deploy --stage dev
```

Y actualiza `amplify.yml` en la raíz del proyecto:

```yaml
environmentVariables:
  VITE_API_URL: https://unfepih103.execute-api.us-east-1.amazonaws.com/dev
  VITE_COGNITO_USER_POOL_ID: us-east-1_gY5JpRMyV
  VITE_COGNITO_CLIENT_ID: 55hal9q6ogn0orhutff3tbohsv
  # Si necesitas configurar más variables
```

## 🆘 Solución de Problemas

### DNS no se propaga después de 24 horas

1. Verifica que los nameservers sean correctos en Namecheap
2. Usa: https://www.whatsmydns.net/#CNAME/iger.online
3. Asegúrate de que no hay registros **A** conflictivos en Namecheap

### Error: "Domain verification failed"

1. Verifica que el registro CNAME de verificación sea exacto
2. Revisa que no haya espacios o caracteres extra
3. Espera 15-30 minutos y reintenta

### El sitio no carga después de configurar

1. Verifica que el build de Amplify esté exitoso
2. Revisa el estado del certificado SSL
3. Prueba con `curl https://iger.online` desde terminal

## 📝 Checklist Final

- [ ] Dominio agregado en Amplify Console
- [ ] DNS configurado en Namecheap
- [ ] Dominio verificado en AWS
- [ ] Certificado SSL generado
- [ ] Sitio accesible en https://iger.online
- [ ] CORS actualizado en backend
- [ ] Backend redeployado con nuevo dominio permitido

## 🎉 ¡Listo!

Una vez completado, tu aplicación estará disponible en:
- **Producción**: https://iger.online
- **SSL**: Automático y gratuito
- **CDN**: CloudFront global

## 📚 Referencias

- [AWS Amplify Custom Domains](https://docs.aws.amazon.com/amplify/latest/userguide/to-add-a-custom-domain.html)
- [Namecheap DNS Configuration](https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-do-i-add-edit-or-delete-host-records-for-a-domain/)
- [Route 53 Hosted Zones](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/hosted-zones-working-with.html)

