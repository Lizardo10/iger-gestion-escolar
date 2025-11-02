# 📋 Qué Hacer Después de Configurar DNS en Namecheap

## ✅ Después de Agregar los Registros en Namecheap

### **Paso 1: Regresar a AWS Amplify Console**

1. Ve a: https://console.aws.amazon.com/amplify/home?region=us-east-1
2. Busca y click en tu aplicación
3. En el menú izquierdo, busca **"Domains"**
4. Deberías ver tu dominio `iger.online` con estado **"Pending verification"**

### **Paso 2: Confirmar Configuración**

Amplify **verificará automáticamente** que los registros DNS estén correctos.

**No necesitas hacer nada más**, AWS:
- ✅ Verifica los registros CNAME automáticamente
- ✅ Solicita el certificado SSL de forma automática
- ✅ Configura CloudFront automáticamente

### **Paso 3: Esperar (Solo observar)**

El proceso toma tiempo automáticamente:

**⏱️ Tiempos estimados:**
- **Primeros 15-30 minutos**: AWS verificando DNS
- **De 30 min a 4 horas**: Solicitud de certificado SSL
- **De 4-24 horas**: Propaginación DNS global

### **Paso 4: Monitorear el Estado**

En Amplify Console → **"Domains"**, verás el progreso:

```
Estado: Pending verification  🟡 (0-30 minutos)
↓
Estado: Pending SSL certificate  🟡 (30 min - 4 horas)
↓
Estado: Available  🟢 (Listo!)
```

### **Paso 5: Cuando Estado Sea "Available"**

Cuando veas el estado **🟢 Available**, ¡todo listo!

1. Abre tu navegador
2. Ve a: https://iger.online
3. Deberías ver tu aplicación funcionando

## 🔧 IMPORTANTE: Actualizar CORS

**Una vez que https://iger.online funcione**, necesitas actualizar el backend:

```bash
cd backend

# Edita serverless.yml línea 19:
# ALLOWED_ORIGIN: ${env:ALLOWED_ORIGIN, 'https://iger.online'}
```

Actualiza esa línea para incluir tu dominio:

```yaml
environment:
  # ...
  ALLOWED_ORIGIN: ${env:ALLOWED_ORIGIN, 'https://iger.online,https://dev.d2umdnu9x2m9qg.amplifyapp.com'}
```

Luego redeploya el backend:

```bash
export AWS_PROFILE=IgerApp
serverless deploy --stage dev
```

## 📊 Resumen de URLs

| URL | Cuándo Funciona | Propósito |
|-----|----------------|-----------|
| https://iger.online | Después de verificar DNS | Dominio personalizado |
| https://www.iger.online | Después de verificar DNS | Redirige a iger.online |
| https://dev.d2umdnu9x2m9qg.amplifyapp.com | Siempre | URL de respaldo |

## ⚠️ Troubleshooting

### Si después de 1 hora sigue "Pending verification":

1. Verifica en Namecheap que los registros estén guardados correctamente
2. Usa: https://www.whatsmydns.net/#CNAME/iger.online
3. Verifica que no haya registros **A** conflictivos

### Si después de 4 horas sigue "Pending SSL":

Esto es normal, AWS puede tardar hasta 24 horas en aprobar el certificado.

### Si el dominio carga pero dice "Page not found":

Significa que DNS funciona pero la aplicación no está desplegada correctamente:
1. Verifica en Amplify que el último deployment sea exitoso
2. Puede necesitar un nuevo deployment

## 📱 Cómo Verificar el Progreso

### En Namecheap:

Verifica que los registros CNAME estén correctos:
1. Login en Namecheap
2. Domain List → Manage → Advanced DNS
3. Deberías ver 2-3 registros CNAME

### En AWS Amplify:

Monitorea el progreso en tiempo real:
1. AWS Console → Amplify → Tu App → Domains
2. Verás el estado en tiempo real
3. Puedes ver logs si hay errores

## ✨ ¡No Necesitas Hacer Nada Más!

Una vez que agregaste los registros en Namecheap:
- ✅ Solo **espera** y **observa** el estado en Amplify Console
- ✅ AWS hace todo el resto automáticamente
- ✅ Recibirás notificaciones (opcional) cuando esté listo

## 🎯 Checklist Simplificado

- [ ] ✅ Registros DNS agregados en Namecheap
- [ ] ✅ Verificado que los registros se guardaron correctamente
- [ ] ✅ Revisar estado en Amplify Console cada hora
- [ ] ✅ Cuando estado sea "Available", probar https://iger.online
- [ ] ✅ Actualizar CORS en backend cuando el dominio funcione
- [ ] ✅ Redeployar backend con nuevo dominio permitido
