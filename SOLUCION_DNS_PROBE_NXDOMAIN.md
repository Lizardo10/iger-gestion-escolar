# 🔧 Solución: DNS_PROBE_FINISHED_NXDOMAIN

## ❌ Problema

El error `DNS_PROBE_FINISHED_NXDOMAIN` significa que el DNS **NO** encuentra el dominio `iger.online`.

**Causa:** Aunque configuraste los nameservers correctamente en Namecheap, AWS Amplify necesita **verificar la propiedad del dominio** con un registro DNS especial.

---

## ✅ Solución: Agregar Registro CNAME de Verificación

### **Paso 1: Abrir el modal de AWS Amplify**

Ya tienes el modal abierto con los registros DNS. Si lo cerraste, ábrelo de nuevo:

1. En AWS Amplify → Domains → `iger.online`
2. Click en **"Configuración del dominio"** (botón con ícono de engranaje)
3. Se abrirá el modal **"Registros DNS"**

---

### **Paso 2: Copiar el Registro de Verificación**

En el modal verás esta sección:

**Registro de verificación:**

| Campo | Valor |
|-------|-------|
| **Nombre de host:** | `_cbb4e24e3e4b99e383995a753789b43f.iger.online.` |
| **Tipo:** | `CNAME` |
| **Datos/URL:** | `_beb244acbd28b0c4978d800dec23187b.jkddzztszm.acm-validations.aws.` |

**Acción:** Click en los íconos de **copiar** 📋 para copiar cada valor.

---

### **Paso 3: Agregar el Registro en Namecheap**

1. Ve a Namecheap: https://ap.www.namecheap.com/Domains/DomainControlPanel/iger.online/advancedns

2. En la sección **"HOST RECORDS"**, verás el botón azul:
   ```
   Change DNS Type
   ```
   
3. **⚠️ MUY IMPORTANTE:** Es posible que necesites cambiar a "BasicDNS" primero.

4. Si ya estás en BasicDNS, verás una tabla. Agrega este registro:

   - **Type:** `CNAME`
   - **Host:** `_cbb4e24e3e4b99e383995a753789b43f`
   - **Value:** `_beb244acbd28b0c4978d800dec23187b.jkddzztszm.acm-validations.aws`
   - **TTL:** `Automatic` o `1800`

5. Click en **"Save All Changes"** (o el botón guardar)

---

### **Paso 4: Esperar Propagación**

- **Tiempo:** 5-30 minutos
- **Verificar:** https://www.whatsmydns.net/#CNAME/_cbb4e24e3e4b99e383995a753789b43f.iger.online

---

## 🎯 Resultado Esperado

Después de agregar el registro CNAME:

1. **En 5-30 minutos:** AWS Amplify verificará automáticamente el dominio
2. **En Amplify:** El estado cambiará de "Pending verification" → "Available"
3. **En el navegador:** `https://iger.online` funcionará ✅

---

## ⚠️ Problema Actual

### **Verificación en Namecheap**

Si en Namecheap ves este mensaje:

```
You can manage host records in your cPanel account, 
or transfer DNS back to Namecheap BasicDNS 
to manage the records here.

[Change DNS Type]
```

Significa que tienes **Custom DNS** activado (los nameservers de AWS).

### **Opciones:**

**Opción A: Cambiar a BasicDNS (Recomendado si tienes problemas)**

1. Click en **"Change DNS Type"**
2. Selecciona **"Namecheap BasicDNS"**
3. Guardar
4. Esperar 5-15 minutos
5. Agregar el registro CNAME
6. Cambiar de vuelta a Custom DNS después

**Opción B: Agregar CNAME en Route53 (Si tienes acceso AWS)**

Si prefieres mantener Custom DNS, debes agregar el CNAME directamente en AWS Route53:

1. Ve a AWS Console → Route53
2. Busca la hosted zone de `iger.online`
3. Agrega el registro CNAME de verificación
4. Esperar verificación

---

## 📋 Checklist Completo

- [ ] Copiar los 3 valores del registro CNAME de AWS Amplify
- [ ] Ir a Advanced DNS en Namecheap
- [ ] Verificar si necesitas cambiar a BasicDNS
- [ ] Agregar el registro CNAME:
  - Type: CNAME
  - Host: `_cbb4e24e3e4b99e383995a753789b43f`
  - Value: `_beb244acbd28b0c4978d800dec23187b.jkddzztszm.acm-validations.aws`
- [ ] Guardar cambios
- [ ] Esperar 5-30 minutos
- [ ] Verificar en https://www.whatsmydns.net
- [ ] Probar https://iger.online

---

## 🆘 Si Sigue Sin Funcionar

### **Alternativa: Usar Subdominio Temporal**

Mientras tanto, puedes usar la URL de Amplify:
```
https://dev.d2umdnu9x2m9qg.amplifyapp.com
```

### **Verificación de Nameservers**

Verifica que los nameservers estén correctos:
```
1. ns-1152.awsdns-16.org
2. ns-1812.awsdns-34.co.uk
3. ns-358.awsdns-44.com
4. ns-855.awsdns-42.net
```

Usa: https://www.whatsmydns.net/#NS/iger.online

---

## 📞 Contacto

Si después de 1 hora sigue sin funcionar:
1. Verifica todos los pasos del checklist ✅
2. Verifica que no haya registros A conflictivos
3. Contacta con soporte de AWS Amplify

---

**Última actualización:** Enero 2025


