# ⚡ Instrucciones Inmediatas: Configurar Namecheap AHORA

## 🎯 Lo que Ves en la Pantalla de Amplify

Tu pantalla muestra:
- **4 Servidores de nombres** de AWS Route 53
- Un checkbox: "He agregado los servidores de nombres anteriores..."

## 📋 PASOS AHORA MISMO:

### **PASO 1: Copiar los 4 Nameservers**

En tu pantalla de Amplify, verás algo como:

```
ns-855.awsdns-42.net
ns-1152.awsdns-16.org
ns-358.awsdns-44.com
ns-1812.awsdns-34.co.uk
```

**Haz esto:**
1. Click en el ícono de copiar 📋 al lado de **cada uno** de los 4 nameservers
2. Copia cada uno (o anótalos todos)
3. **Guárdalos** - los necesitarás en Namecheap

### **PASO 2: Ir a Namecheap**

1. Abre una **nueva pestaña** en tu navegador
2. Ve a: https://www.namecheap.com/myaccount/login/
3. Login con tu cuenta de Namecheap

### **PASO 3: Configurar DNS en Namecheap**

Dentro de Namecheap:

1. Ve a **"Domain List"** (en el menú superior)
2. Busca tu dominio **`iger.online`**
3. Click en el botón **"Manage"** (a la derecha de tu dominio)

### **PASO 4: Cambiar Nameservers**

1. Ve a la pestaña **"Nameservers"** 
2. Deberías ver algo como:
   ```
   BasicDNS (Default)
   or
   CustomDNS
   ```
3. Click en **"CustomDNS"** o **"Custom nameservers"**

### **PASO 5: Agregar los 4 Nameservers de AWS**

Reemplaza los nameservers actuales de Namecheap por los 4 de AWS:

**En los 4 campos, pega los nombres de AWS:**

1. **Nameserver 1:** `ns-855.awsdns-42.net`
2. **Nameserver 2:** `ns-1152.awsdns-16.org`
3. **Nameserver 3:** `ns-358.awsdns-44.com`
4. **Nameserver 4:** `ns-1812.awsdns-34.co.uk`

**⚠️ IMPORTANTE:** 
- Usa **SOLO** los 4 nameservers que te da Amplify
- **NO agregues** `https://` o `http://`
- **NO agregues** espacios extra

### **PASO 6: Guardar en Namecheap**

1. Click en el botón verde **"Save"** o **"✓"**
2. Namecheap te pedirá confirmación
3. Click **"OK"** para confirmar
4. Verás un mensaje: "Nameservers updated successfully"

### **PASO 7: Volver a AWS Amplify**

1. **Vuelve a la pestaña** de AWS Amplify Console
2. Scroll hacia abajo donde está el checkbox
3. **MARCA** el checkbox que dice:
   ```
   ☑ He agregado los servidores de nombres anteriores 
     a mi registro de dominios.
   ```
4. Click en **"Continue"** o **"Guardar"** o **"Next"**

### **PASO 8: ¡ESPERAR!**

Amplify comenzará a verificar automáticamente:

```
⏳ Estado: Verificando DNS...
⏳ Estado: Solicitando certificado SSL...
⏳ Estado: Configurando CloudFront...
✅ Estado: Disponible (Available)
```

**Tiempo:** 15 minutos - 4 horas

## ✅ Después de Marcar el Checkbox

**NO HAGAS NADA MÁS** hasta que veas el estado "Available" 🟢

## 🎯 Resumen Ultra Corto

1. ➡️ Copia 4 nameservers de AWS Amplify
2. ➡️ Ve a Namecheap → Domain List → Manage → Nameservers
3. ➡️ Cambia a "CustomDNS"
4. ➡️ Pega los 4 nameservers de AWS
5. ➡️ Guarda en Namecheap
6. ➡️ Vuelve a Amplify → Marca el checkbox
7. ➡️ **ESPERA**

¡Eso es todo! AWS hará el resto automáticamente.

## 🔍 Cómo Saber que Namecheap Funcionó

Si guardaste correctamente en Namecheap, verás un mensaje verde:
- ✅ "Nameservers updated successfully"
- ✅ "Changes saved"

