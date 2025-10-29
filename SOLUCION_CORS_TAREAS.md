# 🔧 Solución: CORS en Tareas

## 🐛 Problema

Cuando intentas editar o eliminar una tarea, aparece el error:
```
Access to XMLHttpRequest ... has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
It does not have HTTP ok status
```

## 🔍 Causa REAL

**NO era un problema de CORS**, sino que las rutas en el frontend estaban **incorrectas**:

- Frontend estaba llamando: `/tasks/{classId}/{taskId}`
- Backend espera: `/classes/{classId}/tasks/{taskId}`

Esto causaba un 404, y el 404 sin headers CORS era interpretado como error CORS por el navegador.

## ✅ Solución APLICADA

**Se corrigieron las rutas en `frontend/src/services/tasks.ts`:**

```typescript
// ❌ ANTES (incorrecto):
/api.delete(`/tasks/${classId}/${taskId}`)

// ✅ AHORA (correcto):
api.delete(`/classes/${classId}/tasks/${taskId}`)
```

Esto se aplicó a los métodos `update`, `delete` y `get` en TasksService.

**Frontend reconstruido y listo para desplegar a Amplify.**

## 📋 Otras Soluciones (si aún hay problemas CORS)

### Solución 1: Configurar Gateway Responses (RECOMENDADO)

**Paso 1: Configurar Default 4XX**

1. Ve a **AWS Console** → **API Gateway** → Busca tu API `dev-iger-backend`
2. En el menú lateral izquierdo, haz clic en **"Respuestas de puerta de enlace"** (Gateway Responses)
3. Haz clic en **"Default 4XX"** → **"Editar"**
4. En **"Encabezados de respuesta"**, configura:
   - **Access-Control-Allow-Origin:** `'*'` (con comillas simples)
   - **Access-Control-Allow-Methods:** `'GET,POST,PUT,DELETE,OPTIONS'`
   - **Access-Control-Allow-Headers:** `'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'`
5. ⚠️ **IMPORTANTE**: En **"Código de estado"**, DEJA VACÍO (no pongas nada)
6. Haz clic en **"Guardar"**

**Paso 2: Configurar Default 5XX**

1. Haz clic en **"Default 5XX"** → **"Editar"**
2. Repite la misma configuración de headers del paso 1
3. ⚠️ **IMPORTANTE**: En **"Código de estado"**, DEJA VACÍO
4. Haz clic en **"Guardar"**

**Paso 3: Desplegar la API**

1. Haz clic en **"Actions"** → **"Deploy API"**
2. Selecciona stage: **`dev`**
3. Haz clic en **"Deploy"**
4. Espera 1-2 minutos para que los cambios se propaguen

### Solución 2: Probar con otro navegador o modo incógnito

A veces el caché del navegador causa problemas de CORS.

1. Abre **ventana incógnita:** `Ctrl + Shift + N`
2. Ve a: https://dev.d2umdnu9x2m9qg.amplifyapp.com/tasks
3. Intenta editar/eliminar una tarea

### Solución 3: Esperar propagación

Los cambios de CORS pueden tardar 1-2 minutos en propagarse.

## 📝 Estado Actual

✅ **Estudiantes:** Funcionan perfectamente
✅ **Eventos:** Funcionan correctamente (crear, editar, eliminar)
✅ **Tareas:** Rutas corregidas - **Listo para desplegar a Amplify**

## 🎯 Resumen

El problema era que las rutas en el frontend no coincidían con las del backend. Después de corregir las rutas en `tasks.ts`:
- `/tasks/{classId}/{taskId}` → `/classes/{classId}/tasks/{taskId}`

Ahora las tareas deberían funcionar correctamente una vez que se despliegue el frontend a Amplify.


