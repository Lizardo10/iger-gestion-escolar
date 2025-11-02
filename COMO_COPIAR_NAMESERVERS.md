# 📋 Cómo Copiar los 4 Nameservers de AWS Amplify

## 🎯 Ubicación de los Nameservers

Los nameservers están en la **misma pantalla de Amplify** que ya tienes abierta.

## 📍 Dónde Están en tu Pantalla

En tu pantalla de AWS Amplify que ya tienes abierta, busca esta sección:

**"Servidores de nombres de zonas alojadas"** o **"Hosted zone name servers"**

En esa sección verás:

```
Servidor de nombres 1: ns-855.awsdns-42.net    [📋]
Servidor de nombres 2: ns-1152.awsdns-16.org   [📋]
Servidor de nombres 3: ns-358.awsdns-44.com    [📋]
Servidor de nombres 4: ns-1812.awsdns-34.co.uk [📋]
```

**Nota:** Los nombres exactos de tus nameservers serán diferentes, pero el formato es igual.

## 🖱️ Cómo Copiarlos

### **Método 1: Usando el botón de copiar**

1. Mira cada línea que dice "Servidor de nombres X"
2. Al final de cada línea verás un **ícono de copiar** 📋 (dos cuadrados superpuestos)
3. **Click en ese ícono** para copiar ese nameserver
4. Repite para los 4 nameservers

### **Método 2: Seleccionar y copiar manualmente**

1. Selecciona el texto completo del nameserver (ej: `ns-855.awsdns-42.net`)
2. Presiona `Ctrl + C` para copiar
3. Pégalo en un archivo de texto o papel
4. Repite para los otros 3

## ✅ Ejemplo Visual

Tu pantalla se ve así:

```
┌───────────────────────────────────────────────┐
│ Servidores de nombres de zonas alojadas      │
├───────────────────────────────────────────────┤
│                                               │
│ Servidor de nombres 1:                        │
│ [ns-855.awsdns-42.net]                        │
│                                     [📋 Copiar] │
│                                               │
│ Servidor de nombres 2:                        │
│ [ns-1152.awsdns-16.org]                       │
│                                     [📋 Copiar] │
│                                               │
│ Servidor de nombres 3:                        │
│ [ns-358.awsdns-44.com]                        │
│                                     [📋 Copiar] │
│                                               │
│ Servidor de nombres 4:                        │
│ [ns-1812.awsdns-34.co.uk]                     │
│                                     [📋 Copiar] │
│                                               │
├───────────────────────────────────────────────┤
│ ☐ He agregado los servidores de nombres...   │
└───────────────────────────────────────────────┘
```

## 📝 Qué Anotar

Anota los 4 nameservers así:

```
1. ns-855.awsdns-42.net
2. ns-1152.awsdns-16.org
3. ns-358.awsdns-44.com
4. ns-1812.awsdns-34.co.uk
```

(Usa los nombres exactos que aparecen en TU pantalla)

## ⚠️ Importante

- Copia **SOLO** el texto del nameserver
- **NO incluyas** espacios
- **NO incluyas** "Servidor de nombres X:"
- **NO incluyas** https:// o http://
- Copia **EXACTAMENTE** como aparece

## 🎯 Próximo Paso

Una vez que tengas los 4 nameservers copiados, continúa con:

1. Ve a Namecheap
2. Domain List → iger.online → Manage → Nameservers
3. Cambia a "CustomDNS"
4. Pega los 4 nameservers
5. Guarda

