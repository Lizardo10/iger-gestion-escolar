# 🧹 Guía: Limpiar Caché y localStorage

## 🔧 Problema

Si experimentas problemas de autenticación, redirecciones extrañas, o el sistema te desloguea constantemente, puede ser por datos corruptos en el caché del navegador o en `localStorage`.

## ✅ Soluciones Automáticas

El sistema ahora incluye limpieza automática de datos corruptos:

1. **Validación automática al iniciar**: Detecta y limpia datos incompletos o corruptos
2. **Control de versión**: Si cambia la versión del formato de datos, limpia automáticamente
3. **Parámetro URL**: Puedes forzar limpieza agregando `?clearCache=true` a la URL

## 🚀 Cómo Limpiar el Caché (Métodos)

### Método 1: Parámetro URL (Más Fácil)

1. Ve a: `https://dev.d2umdnu9x2m9qg.amplifyapp.com/?clearCache=true`
2. El sistema limpiará automáticamente el caché
3. Serás redirigido a login
4. Vuelve a iniciar sesión

### Método 2: Consola del Navegador (Manual)

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Console**
3. Ejecuta este comando:

```javascript
// Limpiar todo el localStorage relacionado con Iger
localStorage.removeItem('iger_auth_state');
localStorage.removeItem('iger_auth_version');
console.log('✅ Caché limpiado');
location.reload();
```

### Método 3: DevTools Application (Completo)

1. Abre DevTools (F12)
2. Ve a la pestaña **Application**
3. En el menú izquierdo, expande **Local Storage**
4. Selecciona tu dominio (`dev.d2umdnu9x2m9qg.amplifyapp.com`)
5. Busca las siguientes claves:
   - `iger_auth_state`
   - `iger_auth_version`
6. Haz click derecho en cada una y selecciona **Delete**
7. Recarga la página (F5)

### Método 4: Limpiar Todo el Caché del Navegador (Nuclear)

⚠️ **Esto eliminará TODOS los datos del sitio, no solo los de autenticación**

**Chrome/Edge:**
1. Presiona `Ctrl + Shift + Delete` (Windows) o `Cmd + Shift + Delete` (Mac)
2. Selecciona **Todo el tiempo**
3. Marca:
   - ✅ Cookies y otros datos de sitios
   - ✅ Imágenes y archivos en caché
4. Click en **Borrar datos**

**Firefox:**
1. Presiona `Ctrl + Shift + Delete`
2. Selecciona **Todo**
3. Marca:
   - ✅ Cookies
   - ✅ Caché
4. Click en **Limpiar ahora**

### Método 5: Modo Incógnito (Prueba)

Para probar si el problema es el caché:

1. Abre una ventana de incógnito/privada (`Ctrl + Shift + N`)
2. Ve a: `https://dev.d2umdnu9x2m9qg.amplifyapp.com/`
3. Inicia sesión
4. Si funciona bien en incógnito, confirma que el problema es el caché

## 🔍 Verificar Estado del Caché

Para ver qué hay almacenado en el caché:

```javascript
// En la consola del navegador (F12 > Console)
const authState = localStorage.getItem('iger_auth_state');
if (authState) {
  const parsed = JSON.parse(authState);
  console.log('Usuario:', parsed.user?.email);
  console.log('Tiene token:', !!parsed.token);
  console.log('Tiene refreshToken:', !!parsed.refreshToken);
} else {
  console.log('No hay estado de autenticación guardado');
}
```

## 🛠️ Mejoras Implementadas

### Validación Automática

El sistema ahora valida automáticamente:

- ✅ Estructura de datos correcta
- ✅ Token y usuario presentes ambos
- ✅ Versión de datos actualizada
- ✅ Limpieza de datos corruptos

### Control de Versión

- Si el formato de datos cambia, se limpia automáticamente
- Evita problemas con datos de versiones antiguas

### Manejo de Errores

- Si localStorage está lleno, intenta limpiar y guardar de nuevo
- Registra errores en la consola para debugging

## 📝 Notas Importantes

1. **Limpiar caché NO elimina tu cuenta de usuario** - Solo elimina datos locales
2. **Tendrás que iniciar sesión de nuevo** después de limpiar el caché
3. **El caché se regenera** automáticamente al iniciar sesión
4. **Los datos en el servidor NO se afectan** - Solo se limpian datos locales

## 🐛 Si el Problema Persiste

Si después de limpiar el caché el problema continúa:

1. Verifica la consola del navegador (F12) para errores
2. Verifica la pestaña Network para ver si hay errores 401/403
3. Prueba en modo incógnito
4. Prueba en otro navegador
5. Contacta al administrador del sistema

## 🔄 Después de Limpiar

Una vez limpiado el caché:

1. ✅ Ve a la página de login
2. ✅ Inicia sesión con tus credenciales
3. ✅ El sistema guardará nuevos datos válidos
4. ✅ Navega normalmente por el sistema

---

**Última actualización:** Enero 2025


