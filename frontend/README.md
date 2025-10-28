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
- `/pages`: Páginas principales
- `/lib/offline`: Lógica de sincronización offline

## Contribución
Ver [CONTRIBUTING.md](../CONTRIBUTING.md)

## Licencia
MIT



