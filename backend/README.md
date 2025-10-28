# Iger - Sistema de Gestión Escolar (Backend)

## Descripción
API REST serverless para el sistema de gestión escolar Iger.

## Tecnologías
- Node.js 18 + TypeScript
- AWS Lambda
- API Gateway
- DynamoDB
- Amazon Cognito
- Serverless Framework

## Arquitectura
- Lambdas independientes por funcionalidad
- DynamoDB Single Table Design
- Cognito para autenticación
- Integración con OpenAI y PayPal

## Requisitos Previos
- Node.js 18+
- AWS CLI configurado
- Serverless Framework instalado
- Credenciales AWS con permisos adecuados

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-org/iger-backend.git
cd iger-backend

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local
```

## Configuración

### Secretos en AWS Parameter Store

```bash
aws ssm put-parameter --name "/iger/openai-key" --value "sk-..." --type "SecureString"
aws ssm put-parameter --name "/iger/paypal-client-id" --value "..." --type "SecureString"
aws ssm put-parameter --name "/iger/paypal-secret" --value "..." --type "SecureString"
```

### Variables de Entorno

```env
STAGE=dev
REGION=us-east-1
DYNAMODB_TABLE=IgerData
```

## Desarrollo

```bash
# Ejecutar localmente
npm run dev

# Tests unitarios
npm run test

# Tests de integración
npm run test:integration

# Linting
npm run lint

# Build
npm run build
```

## Despliegue

```bash
# Despliegue a dev
npm run deploy:dev

# Despliegue a producción
npm run deploy:prod

# Ver logs
serverless logs -f authLogin -t
```

## Endpoints Principales

Ver [docs/API.md](../docs/API.md) para documentación completa.

- `POST /auth/login` - Autenticación
- `POST /auth/register` - Registro de usuarios
- `GET /students` - Listar estudiantes
- `POST /students` - Crear estudiante
- `POST /tasks` - Crear tarea
- `POST /payments/create-order` - Crear orden de pago
- `POST /sync/push` - Sincronización offline

## Modelo de Datos

Ver [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)

## Testing

```bash
# Unit tests
npm run test

# Coverage
npm run test:coverage

# Load tests
npm run test:load
```

## Monitoreo

- CloudWatch Logs: Ver logs en tiempo real
- CloudWatch Metrics: Métricas custom
- Alarmas configuradas para errores críticos

## Contribución

Ver [CONTRIBUTING.md](../CONTRIBUTING.md)

## Licencia

MIT



