# ✅ Pasos Finales para Completar la Configuración del Dominio

## 📋 Checklist Final

### ✅ Ya Completado:
- [x] Nameservers de AWS configurados en Namecheap
- [x] Tipo DNS cambiado a BasicDNS en Namecheap
- [x] Registro CNAME de verificación agregado (`_cbb4e24e3e4b99e383995a753789b43f`)

### 🔄 Pendiente:
- [ ] **Agregar registro CNAME para apuntar dominio a Amplify**
- [ ] Esperar propagación DNS (10-30 minutos)
- [ ] Esperar verificación de AWS Amplify (5-30 minutos)
- [ ] Esperar certificado SSL (30 min - 4 horas)

---

## 🎯 Paso Último: Agregar Registro CNAME Principal

### En Namecheap → Advanced DNS → HOST RECORDS:

1. **Click en "+ ADD NEW RECORD"** (botón rojo)

2. **Selecciona "CNAME Record"**

3. **Completa estos campos:**
   ```
   Type:  CNAME Record
   Host:  @
   Value: d2umdnu9x2m9qg.amplifyapp.com
          (SIN "dev." al inicio, SIN punto final ".")
   TTL:   Automatic
   ```

4. **Click en "Save" o "Guardar"**

5. **(Opcional pero recomendado) Agrega también www:**
   - Click "+ ADD NEW RECORD" otra vez
   - Type: `CNAME Record`
   - Host: `www`
   - Value: `d2umdnu9x2m9qg.amplifyapp.com` (SIN punto final)
   - TTL: `Automatic`

---

## ⏱️ Tiempos de Espera

### 1. Propagación DNS
**Tiempo:** 10-30 minutos  
**Qué verificar:**
- https://www.whatsmydns.net/#CNAME/iger.online
- Debe mostrar `d2umdnu9x2m9qg.amplifyapp.com` en la mayoría de servidores

### 2. Verificación AWS Amplify
**Tiempo:** 5-30 minutos  
**Dónde verificar:**
- AWS Amplify Console → Domains → `iger.online`
- Estado cambiará de "Pending verification" → "Available"

### 3. Certificado SSL
**Tiempo:** 30 minutos - 4 horas  
**Dónde verificar:**
- AWS Amplify Console → Domains → `iger.online`
- Estado cambiará a "Available" con SSL activo

---

## ✅ Resultado Final

Cuando todo esté listo:

- ✅ https://iger.online → Funciona
- ✅ https://www.iger.online → Redirige a iger.online
- ✅ SSL válido (candado verde en el navegador)
- ✅ Estado en Amplify: "Available" 🟢

---

## 🚨 Si Algo No Funciona

### Después de 1 hora sin cambios:

1. **Verifica los registros en Namecheap:**
   - Debe haber exactamente 2 registros CNAME:
     - `_cbb4e24e3e4b99e383995a753789b43f` → `_beb244acbd28b0c4978d800dec23187b.jkddzztszm.acm-validations.aws`
     - `@` → `d2umdnu9x2m9qg.amplifyapp.com`

2. **Verifica propagación DNS:**
   - https://www.whatsmydns.net/#CNAME/iger.online
   - Debe mostrar `d2umdnu9x2m9qg.amplifyapp.com` en al menos 50% de servidores

3. **Verifica en AWS Amplify:**
   - Ve a Domains → `iger.online`
   - Revisa si hay algún mensaje de error

4. **Limpia caché del navegador:**
   - Ctrl + Shift + Delete
   - O prueba en modo incógnito

---

## 📞 Siguiente Paso

Una vez que el dominio esté funcionando, **NO olvides:**

1. **Actualizar CORS en el backend** (ya está hecho, pero verifica):
   ```yaml
   ALLOWED_ORIGIN: ${env:ALLOWED_ORIGIN, '*'}
   ```

2. **Probar que todo funciona:**
   - Login en https://iger.online
   - Verificar que las APIs funcionan
   - Verificar que los estilos se cargan correctamente

---

**¡Eso es todo! 🎉**  
**Una vez agregues el registro CNAME de `@`, solo queda esperar.**


