# 🔧 Guía: Configurar Redirects en AWS Amplify

## ⚠️ Problema
Al recargar cualquier página (F5), aparece error 404.

## ✅ Solución
Configurar redirects en la consola de AWS Amplify.

## 📍 Paso a Paso

### 1. Acceder a Amplify Console
1. Ve a: **https://console.aws.amazon.com/amplify/**
2. Inicia sesión con tu cuenta AWS
3. Selecciona región: **N. Virginia (us-east-1)**

### 2. Abrir tu App
1. Busca en la lista: **igerManagement** o **dev.d2umdnu9x2m9qg**
2. Haz clic en el nombre de la app

### 3. Ir a Rewrites and Redirects
1. En el menú lateral izquierdo
2. Busca sección **"Rewrites and redirects"** o **"Rewrites and redirects"**
3. Haz clic

### 4. Configurar el Redirect

Debes ver un editor de código JSON. **REEMPLAZA** todo el contenido con:

```json
[
  {
    "source": "/<*>",
    "target": "/index.html",
    "status": "200"
  }
]
```

### 5. Guardar
1. Haz clic en **"Guardar"** o **"Save"**
2. Espera 1-2 minutos

### 6. Probar
Después de guardar, prueba estas URLs:

- https://dev.d2umdnu9x2m9qg.amplifyapp.com/dashboard (sin barra)
- https://dev.d2umdnu9x2m9qg.amplifyapp.com/students (sin barra)
- https://dev.d2umdnu9x2m9qg.amplifyapp.com/tasks (sin barra)

**Deberían funcionar sin 404! ✅**

## 🎯 Qué Hace Esto

- `"source": "/<*>"` → Captura TODAS las rutas que no son archivos
- `"target": "/index.html"` → Sirve index.html en lugar
- `"status": "200"` → HTTP 200 OK (no redirect)

React Router maneja el resto.

## 📝 Nota
Esta es la ÚNICA forma de arreglar el problema 404 en Amplify Console.

No depende de código, sino de configuración en la consola de AWS.


