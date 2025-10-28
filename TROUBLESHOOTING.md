# 🔧 Troubleshooting - Pantalla en Blanco

## Situación Actual
La aplicación se está ejecutando pero muestra pantalla en blanco.

## Posibles Causas

### 1. Error en Consola del Navegador
**Solución:** 
- Abre F12 → Console
- Busca errores en rojo
- Los errores más comunes:
  - `Cannot read property of undefined`
  - Errores de importación
  - Errores de módulos

### 2. Service Worker bloqueando
**Solución:** Ya removido el Service Worker

### 3. ProtectedRoute redirigiendo
**Solución:** Ya removido, la app va directo a Layout

### 4. Tailwind CSS no cargando
**Solución:**
```bash
# En terminal, asegúrate de que postcss esté instalado
cd frontend
npm install postcss autoprefixer
```

### 5. Cache del navegador
**Solución:**
- Ctrl + Shift + R (recarga forzada)
- O abre ventana de incógnito (Ctrl + Shift + N)

## Pasos de Debugging

### Paso 1: Verificar que Vite esté corriendo
En la terminal deberías ver:
```
VITE v5.4.21  ready in XXX ms
➜  Local:   http://localhost:3001/
```

### Paso 2: Abrir en el navegador
Ve a: http://localhost:3001

### Paso 3: Ver console
Presiona F12 y ver mensajes en "Console"

### Paso 4: Ver Network
En DevTools → Network, verifica que los archivos se carguen (200 OK)

## Estado Actual del App.tsx

```tsx
function App() {
  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ color: '#0ea5e9' }}>
        🎉 Proyecto Iger
      </h1>
      <p>¡La aplicación está funcionando correctamente!</p>
    </div>
  );
}
```

**Si esto NO se ve, el problema está en:**
- main.tsx (registro de React)
- index.html (no encuentra #root)
- Errores en consola

## Comandos para Resetear

```bash
# Detener servidor
Ctrl + C

# Limpiar cache
cd frontend
rm -rf node_modules dist
npm cache clean --force

# Reinstalar
npm install

# Iniciar de nuevo
npm run dev
```

## ¿Qué deberías ver?

En http://localhost:3001 deberías ver:

```
🎉 Proyecto Iger

¡La aplicación está funcionando correctamente!

Sistema de Gestión Escolar
```

**Si ves eso, significa que todo funciona y puedes restaurar los componentes.**

## Próximo Paso

Una vez que funcione, restauraré todos los componentes (Layout, Header, Sidebar, etc.)


