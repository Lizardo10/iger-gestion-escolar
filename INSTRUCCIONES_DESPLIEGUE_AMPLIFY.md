# 🚀 Instrucciones para Desplegar en Amplify

## ⚠️ Problema Actual

El navegador está mostrando la **versión antigua** del frontend que no tiene las rutas corregidas.

## ✅ Solución Rápida

### 1. **Hard Refresh del Navegador** (PRUEBA ESTO PRIMERO)
1. Abre la aplicación en Chrome/Edge: https://dev.d2umdnu9x2m9qg.amplifyapp.com/tasks
2. Presiona `Ctrl + Shift + R` (Windows) o `Ctrl + F5`
3. Espera 10 segundos y recarga de nuevo
4. Intenta editar/eliminar una tarea

### 2. **Verificar Estado del Build en Amplify**

1. Ve a: https://console.aws.amazon.com/amplify/home?region=us-east-1#/
2. Haz clic en tu app `dev-iger-frontend` o similar
3. Busca la sección **"Deployments"**
4. Verifica que el último commit sea del día de hoy con el mensaje:
   - `Fix: Corregir rutas de API en TasksService`
   - `docs: Agregar documentación de soluciones`
5. Si el build está **verde (éxito)**, continúa con el paso 3
6. Si el build está **rojo (error)** o **amarillo (en proceso)**, espera

### 3. **Despliegue Manual (si es necesario)**

Si Amplify no detectó automáticamente los cambios:

1. En Amplify Console, haz clic en **"Hosting"**
2. En la sección de "Build settings", haz clic en **"Edit"**
3. Verifica que esté conectado a tu repositorio de GitHub
4. Haz clic en **"Save and deploy"**

### 4. **Forzar Nuevo Build**

Si aún no funciona:

1. En Amplify Console, ve a **"App settings"**
2. Haz clic en **"Build settings"**
3. Hacer scroll hasta abajo
4. Haz clic en **"Redeploy this version"** en el último commit exitoso
5. Espera 3-5 minutos a que termine

## 🔍 Cómo Verificar que Funciona

Después de que Amplify termine de desplegar:

1. Ve a: https://dev.d2umdnu9x2m9qg.amplifyapp.com/tasks
2. Presiona `Ctrl + Shift + R` para hard refresh
3. Abre las **DevTools** (`F12`)
4. Ve a la pestaña **"Network"**
5. Intenta eliminar una tarea
6. Deberías ver una petición a: `/classes/default-class/tasks/{taskId}` (con `/classes/` en medio)
7. Si aún ves `/tasks/default-class/...` sin `/classes/`, el caché sigue activo

## 🧹 Limpiar Caché Completamente

Si nada funciona:

1. En Chrome, presiona `F12` para abrir DevTools
2. Haz clic derecho en el botón de recargar
3. Selecciona **"Empty Cache and Hard Reload"**
4. Cierra todas las pestañas de la aplicación
5. Abre una nueva pestaña incógnito: `Ctrl + Shift + N`
6. Ve a la aplicación y prueba de nuevo

## 📝 Estado Esperado

**ANTES (incorrecto):**
```
DELETE /dev/tasks/default-class/{taskId}  ❌ 404
```

**DESPUÉS (correcto):**
```
DELETE /dev/classes/default-class/tasks/{taskId}  ✅ 200
```

## 💡 Tips

- Los cambios pueden tardar **2-5 minutos** en propagarse después del push a GitHub
- Amplify normalmente detecta los cambios automáticamente
- Si Amplify no está configurado para auto-deploy desde GitHub, necesitarás desplegar manualmente

