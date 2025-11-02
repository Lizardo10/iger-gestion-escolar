# 🔄 Cómo Ir Desde "Advanced DNS" a "Nameservers" en Namecheap

## ⚠️ Problema

Estás en la pestaña **"Advanced DNS"** que muestra los registros CNAME.

**Esta NO es la pantalla correcta para cambiar nameservers.**

## ✅ Solución: Ir a la Pestaña Correcta

### **Paso 1: Buscar la Barra de Navegación Horizontal**

Arriba de donde ves "HOST RECORDS", hay una barra horizontal con pestañas:

```
[Domain] [Products] [Sharing & Transfer] [Advanced DNS] ← Estás aquí
```

### **Paso 2: Click en "Domain"**

1. Click en la pestaña **"Domain"** (la primera de la izquierda)
2. Esta pestaña te llevará a la configuración general del dominio

### **Paso 3: Buscar "Nameservers"**

Una vez en la pestaña "Domain", busca en la página:

- Una sección que dice **"Nameservers"**
- O **"DNS Settings"**
- O **"Domain DNS"**

Dentro de esa sección verás opciones como:

```
○ Namecheap BasicDNS
○ Namecheap Web Hosting DNS  
● Custom DNS  ← Esta es la opción correcta
```

### **Paso 4: Seleccionar "Custom DNS"**

1. Selecciona la opción **"Custom DNS"**
2. Se desplegarán 4 campos de texto vacíos
3. Ahí es donde pegarás los 4 nameservers de AWS

### **Paso 5: Pegar los Nameservers**

Pega los 4 nameservers en los campos:

```
Nameserver 1: [ns-855.awsdns-42.net        ]
Nameserver 2: [ns-1152.awsdns-16.org       ]
Nameserver 3: [ns-358.awsdns-44.com        ]
Nameserver 4: [ns-1812.awsdns-34.co.uk     ]
```

### **Paso 6: Guardar**

1. Click en el botón **"Save"** o **"✓"**
2. Confirmar los cambios

## 📍 Ubicación Visual

```
Namecheap Dashboard
  └── Domain List
      └── iger.online
          └── [Domain] ← CLICK AQUÍ (no en Advanced DNS)
              └── Nameservers
                  └── Custom DNS ← AQUÍ pegas los nameservers
```

## ⚠️ Importante

**NO configures nada en "Advanced DNS"** (donde estás ahora).

**Los registros CNAME que ves en "Advanced DNS"** son para configuración manual de DNS, pero tú vas a usar **nameservers de AWS**.

Al cambiar a Custom DNS con los nameservers de AWS, **Namecheap ya no manejará el DNS** - AWS lo hará todo.

## 🎯 Resumen

1. Click en pestaña **"Domain"** (no Advanced DNS)
2. Busca sección **"Nameservers"**
3. Selecciona **"Custom DNS"**
4. Pega los **4 nameservers** de AWS
5. **Guarda**

