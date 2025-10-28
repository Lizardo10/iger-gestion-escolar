# Iger - Sistema de Gestión Escolar

Sistema completo de gestión escolar con arquitectura serverless en AWS, soporte offline, visualizaciones 3D e integración con OpenAI y PayPal.

## 📋 Descripción

Sistema integral para la gestión de instituciones educativas que permite:
- Administración de estudiantes, docentes y padres
- Gestión de tareas y calificaciones
- Control de asistencia
- Calendario de eventos
- Sistema de pagos integrado
- Funcionalidad offline completa
- Visualizaciones 3D optimizadas
- Asistente de IA para tutoría

## 🏗️ Arquitectura

### Stack Tecnológico

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Babylon.js (visualizaciones 3D)
- AWS Amplify
- IndexedDB + Workbox (offline)

**Backend:**
- Node.js 18 + TypeScript
- AWS Lambda
- API Gateway (REST)
- DynamoDB (Single Table Design)
- Amazon Cognito

**Servicios AWS:**
- Amplify Hosting (frontend)
- Lambda (backend serverless)
- DynamoDB (base de datos)
- S3 (archivos y assets 3D)
- Cognito (autenticación)
- CloudFront (CDN opcional)
- CloudWatch (monitoreo)

**Integraciones:**
- OpenAI (resúmenes, tutoría, generación de contenido)
- PayPal (pagos seguros)

## 🚀 Inicio Rápido

### Prerrequisitos

```bash
# Verificar instalaciones
node --version  # v18+
npm --version
aws --version
amplify --version  # npm install -g @aws-amplify/cli
serverless --version  # npm install -g serverless
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Desarrollo
npm run dev

# Build
npm run build
```

### Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar secretos en AWS
aws ssm put-parameter --name "/iger/openai-key" --value "sk-..." --type "SecureString"

# Desarrollo local
npm run dev

# Despliegue
npm run deploy:dev
```

## 📁 Estructura del Proyecto

```
iger/
├── frontend/           # Aplicación React
│   ├── src/
│   │   ├── components/ # Componentes React
│   │   ├── pages/     # Páginas principales
│   │   ├── lib/       # Utilidades y helpers
│   │   └── types/     # Tipos TypeScript
│   └── amplify.yml    # Configuración Amplify
│
├── backend/           # API Serverless
│   ├── src/
│   │   ├── handlers/  # Handlers Lambda
│   │   ├── lib/       # Utilidades y servicios
│   │   └── types/     # Tipos TypeScript
│   └── serverless.yml # Configuración Serverless
│
└── docs/             # Documentación
    ├── ARCHITECTURE.md
    ├── API.md
    └── DEPLOYMENT.md
```

## 📚 Documentación

- [Arquitectura del Sistema](docs/ARCHITECTURE.md)
- [Especificación de API](docs/API.md)
- [Guía de Despliegue](docs/DEPLOYMENT.md)
- [README Frontend](frontend/README.md)
- [README Backend](backend/README.md)

## 🎯 Funcionalidades

### ✅ Implementadas

- [x] Estructura base del proyecto
- [x] Configuración TypeScript
- [x] Autenticación (Cognito)
- [x] Handlers Lambda básicos
- [x] Integración DynamoDB
- [x] Frontend con routing
- [x] Componentes de UI básicos

### 🚧 En Desarrollo

- [ ] Implementación completa de endpoints
- [ ] Funcionalidad offline (Service Worker)
- [ ] Visualizaciones 3D (Babylon.js)
- [ ] Integración PayPal
- [ ] Integración OpenAI
- [ ] Tests unitarios e integración
- [ ] CI/CD completo

## 🔐 Seguridad

- Autenticación con Amazon Cognito
- Autorización por roles (IAM)
- HTTPS obligatorio
- Encriptación en reposo (DynamoDB, S3)
- Secrets en AWS Parameter Store
- Rate limiting en API Gateway
- Validación de inputs
- Audit logging

## 💰 Costos

Diseñado para maximizar el uso de la capa gratuita de AWS:

- **Lambda**: 1M requests/mes gratis
- **DynamoDB**: 25GB + 25 RCU/WCU gratis
- **API Gateway**: 1M requests/mes gratis (12 meses)
- **Amplify**: 1000 min build/mes gratis
- **Cognito**: 50,000 MAU gratis
- **S3**: 5GB almacenamiento gratis (12 meses)

Ver [Arquitectura](docs/ARCHITECTURE.md) para detalles completos.

## 🧪 Testing

```bash
# Frontend
cd frontend
npm run test

# Backend
cd backend
npm run test
npm run test:integration
```

## 📦 Despliegue

Ver [Guía de Despliegue Completa](docs/DEPLOYMENT.md)

```bash
# Frontend
cd frontend
amplify push

# Backend
cd backend
npm run deploy:dev
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Autores

- Equipo de Desarrollo Iger

## 🙏 Agradecimientos

- AWS por la infraestructura gratuita
- React Team
- Babylon.js Team
- OpenAI
- PayPal



