# Iger - Sistema de Gestión Escolar (Frontend)

## Descripción
Aplicación web moderna para la gestión integral de instituciones educativas, con soporte offline completo y visualizaciones 3D.

## Tecnologías
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Babylon.js
- AWS Amplify
- IndexedDB (idb)
- Workbox (Service Workers)

## Requisitos Previos
- Node.js 18+
- npm o yarn
- Cuenta AWS configurada
- Amplify CLI instalado

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-org/iger-frontend.git
cd iger-frontend

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Configurar Amplify
amplify pull --appId <tu-app-id> --envName dev
```

## Configuración

### Variables de Entorno
```env
VITE_API_URL=https://api.iger.com
VITE_COGNITO_USER_POOL_ID=...
VITE_COGNITO_CLIENT_ID=...
VITE_S3_ASSETS_URL=...
```

## Desarrollo

```bash
# Modo desarrollo
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Tests
npm run test

# Linting
npm run lint

# Format
npm run format
```

## Despliegue

```bash
# Despliegue a Amplify
amplify publish

# O mediante CI/CD (push a main)
git push origin main
```

## Funcionalidades Offline
La aplicación funciona completamente offline:
- Consulta de datos en cache
- Creación/edición de contenido
- Sincronización automática al recuperar conexión
- Indicador visual de estado

## Estructura de Componentes
- `/components/common`: Componentes reutilizables
- `/components/features`: Componentes por funcionalidad
- `/components/3d`: Componentes de visualización 3D
- `/components/ui`: Biblioteca de UI (botones 3D, tarjetas, etc.)
- `/pages`: Páginas principales
- `/lib/offline`: Lógica de sincronización offline

## Botón 3D (`ThreeDButton`)

El componente `ThreeDButton` ofrece un estilo unificado con animaciones Babylon.js y soporte accesible.

```tsx
import { ThreeDButton } from '@/components/ui/ThreeDButton';

<ThreeDButton variant="primary" showOrb onClick={...}>
  Acción principal
</ThreeDButton>
```

### Variantes

| Prop `variant` | Uso recomendado | Estilos |
| -------------- | --------------- | ------- |
| `primary` (default) | Acciones principales o CTA | Degradado azul, sombra intensa, texto blanco |
| `secondary` | Acciones secundarias / botones complementarios | Fondo claro, borde suave, glow tenue |
| `ghost` | Acciones neutras, iconos dentro de tablas o chips | Fondo translúcido, sin borde (ideal para botones compactos) |

### Tamaños (`size`)

| Valor | Altura | Usos |
| ----- | ------ | ---- |
| `sm` | ~40px | Tablas, paginación, icon buttons |
| `md` (default) | ~48px | Formularios y acciones generales |
| `lg` | ~56px | Hero, landing o CTA prominentes |

### Accesibilidad

- Incluye `focus-visible` con anillos accesibles (`FocusVisible`).
- Acepta `aria-*`, `aria-expanded`, `aria-pressed`, etc. Igual que un `<button>` nativo.
- Para enlaces, usar `as="a"` y proveer `href` (renderiza `<a>` con roles correctos).

```tsx
<ThreeDButton as="a" href="/docs" variant="secondary" showOrb>
  Ver documentación
</ThreeDButton>
```

### Estados

- `loading={true}` muestra spinner con semitransparencia y bloquea interacciones.
- `disabled` combina con `loading` para states consistentes.
- `showOrb` activa el orbe 3D animado (cuidado con múltiples instancias en móviles muy antiguos).
- `orbColor={{ primary, accent }}` permite customizar colores Babylon.js, útil para contextos como “pagar”, “eliminar” o “sincronizar”.

### Recomendaciones de rendimiento (móvil)

- El orbe 3D usa un `Engine` Babylon ligero, pero en listas grandes conviene desactivar `showOrb` o usar la variante `ghost`.
- En vistas con muchos botones (ej. tablas extensas) limitar la animación a los iconos principales para evitar gastos de GPU.
- El componente respeta `prefers-reduced-motion` (si el usuario reduce animaciones se puede desactivar `showOrb` en un wrapper personalizado).

### Ejemplos prácticos

```tsx
// Primario con loading
<ThreeDButton loading showOrb>
  Guardando...
</ThreeDButton>

// Secundario compacto para paginación
<ThreeDButton size="sm" variant="secondary" showOrb>
  Siguiente
</ThreeDButton>

// Ghost para acciones en tabla con color personalizado
<ThreeDButton
  size="sm"
  variant="ghost"
  showOrb
  orbColor={{ primary: '#dc2626', accent: '#f87171' }}
  onClick={handleDelete}
>
  Eliminar
</ThreeDButton>
```

## Contribución
Ver [CONTRIBUTING.md](../CONTRIBUTING.md)

## Licencia
MIT



