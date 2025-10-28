# Arquitectura del Sistema Iger

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USUARIOS FINALES                               │
│                      (Admin, Docente, Alumno, Padre)                        │
└────────────────────────┬────────────────────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AWS AMPLIFY (Frontend)                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        React + TypeScript                             │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────────┐│  │
│  │  │  UI Pages    │  │  3D Babylon   │  │  Service Worker (Workbox)   ││  │
│  │  │  - Login     │  │  - Scene3D   │  │  - Offline Cache            ││  │
│  │  │  - Dashboard │  │  - Models    │  │  - Network Strategies       ││  │
│  │  │  - Students  │  │  - Animations│  │  - Request Interception    ││  │
│  │  │  - Tasks     │  └──────────────┘  └─────────────────────────────┘│  │
│  │  │  - Events    │                          │                          │  │
│  │  │  - Payments  │                          ▼                          │  │
│  │  └──────────────┘              ┌─────────────────────────────────────┐│  │
│  │                                 │      IndexedDB (idb)                ││  │
│  │  ┌──────────────┐              │  - cachedData (offline cache)      ││  │
│  │  │  Hooks        │              │  - pendingOperations (sync queue)  ││  │
│  │  │  - useAuth    │              │  - syncMetadata (timestamps)       ││  │
│  │  │  - useOffline │              └─────────────────────────────────────┘│  │
│  │  │  - useSync    │                          │                          │  │
│  │  └──────────────┘                          │                          │  │
│  └──────────────────────────────────────────┼─────────────────────────────┘  │
└─────────────────────────────────────────────┼─────────────────────────────────┘
                                              │ REST API
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (REST)                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         Endpoints REST                                │  │
│  │  /auth/*           │  /students/*    │  /tasks/*                     │  │
│  │  /events/*         │  /payments/*    │  /sync/*                      │  │
│  │  /ai/*             │  /attendance/*  │  /classes/*                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────┬───────────────────────────────────────────────────┘
                         │ IAM Roles & Policies
                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AWS LAMBDA (Backend)                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     Handlers (TypeScript + Node.js 18)               │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌──────────────────────┐  │  │
│  │  │ auth.ts        │  │ students.ts    │  │ tasks.ts             │  │  │
│  │  │ - login        │  │ - list         │  │ - create             │  │  │
│  │  │ - register     │  │ - get         │  │ - update             │  │  │
│  │  │ - refresh      │  │ - create       │  │ - submissions        │  │  │
│  │  └────────────────┘  │ - update      │  └──────────────────────┘  │  │
│  │                       │ - delete      │                            │  │
│  │  ┌────────────────┐  └────────────────┘  ┌──────────────────────┐  │  │
│  │  │ events.ts      │                       │ payments.ts          │  │  │
│  │  │ - list         │  ┌────────────────┐  │ - create invoice     │  │  │
│  │  │ - create       │  │ sync.ts         │  │ - PayPal order       │  │  │
│  │  │ - update       │  │ - pull changes  │  │ - webhook handler    │  │  │
│  │  │ - delete       │  │ - push changes  │  │ - status check       │  │  │
│  │  └────────────────┘  │ - conflict res  │  └──────────────────────┘  │  │
│  │                       └────────────────┘                            │  │
│  │  ┌────────────────┐                     ┌──────────────────────┐  │  │
│  │  │ ai.ts          │                     │ attendance.ts         │  │  │
│  │  │ - summarize    │                     │ - register            │  │  │
│  │  │ - tutor        │                     │ - list                │  │  │
│  │  │ - generate     │                     │ - reports             │  │  │
│  │  └────────────────┘                     └──────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────┬───────────────────┬───────────────────┬─────────────────┘
                  │                   │                   │
        ┌─────────▼──────────┐ ┌─────▼──────┐  ┌────────▼─────────┐
        │   AMAZON COGNITO   │ │ DYNAMODB   │  │  AMAZON S3       │
        │  - User Pools      │ │ Single     │  │  - 3D Models     │
        │  - Auth Tokens     │ │ Table      │  │  - Documents     │
        │  - MFA Support     │ │ Design     │  │  - Attachments   │
        │  - Role Groups     │ │            │  │  - Static Assets│
        │  (admin, teacher,  │ │ Attributes │  │  - CloudFront CDN│
        │   student, parent) │ │ PK, SK     │  └──────────────────┘
        └────────────────────┘ │ GSI1, GSI2 │
                               └────────────┘
                          
                              ┌──────────────────┐
                              │  INTEGRACIONES   │
                              │     EXTERNAS     │
                              └────────┬─────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
          ┌─────────▼────────┐  ┌─────▼──────┐  ┌────────▼─────────┐
          │   OPENAI API     │  │  PAYPAL    │  │  CLOUDWATCH      │
          │  - GPT-4         │  │  - Orders  │  │  - Logs          │
          │  - Summaries     │  │  - Payments│  │  - Metrics       │
          │  - Tutor Chat    │  │  - Webhooks│  │  - Alarms        │
          │  - Content Gen   │  │  - Sandbox │  │  - Monitoring    │
          └──────────────────┘  └────────────┘  └───────────────────┘
```

## Flujos de Datos Principales

### 1. Autenticación
```
Usuario → Amplify (Frontend) → API Gateway → Lambda (auth.ts)
Lambda → Cognito (validar credenciales) → JWT Token
Token → Frontend → Guardar en localStorage
```

### 2. Lectura de Datos
```
Frontend → API Gateway → Lambda Handler → DynamoDB
Lambda → Retorna datos → Frontend (actualiza cache IndexedDB)
```

### 3. Escritura de Datos (Online)
```
Frontend → API Gateway → Lambda Handler → DynamoDB
Lambda → Retorna confirmación → Frontend (actualiza UI)
```

### 4. Escritura de Datos (Offline)
```
Frontend → Service Worker → IndexedDB (guardar en pendingOperations)
Service Worker → Intentar sync cuando hay conexión
Sync exitoso → Marcar operación como synced en IndexedDB
```

### 5. Pagos
```
Frontend → API Gateway → Lambda (payments.ts)
Lambda → Crear factura en DynamoDB
Lambda → PayPal API (crear order)
PayPal → Retorna approval URL → Frontend (redirige a PayPal)
Usuario completa pago en PayPal
PayPal → Webhook → Lambda (payments.ts)
Lambda → Actualiza estado en DynamoDB
```

### 6. Integración OpenAI
```
Frontend → API Gateway → Lambda (ai.ts)
Lambda → Parameter Store (obtener API key)
Lambda → OpenAI API
OpenAI → Retorna contenido → Lambda
Lambda → Opcionalmente guardar en DynamoDB
Lambda → Retorna respuesta → Frontend
```

## Servicios AWS y Justificación

### Capa Gratuita (Free Tier)

1. **AWS Amplify Hosting**
   - 1,000 minutos de build/mes gratis
   - 15 GB de transferencia/mes gratis
   - Hosting del frontend React

2. **Amazon Cognito**
   - 50,000 MAU (usuarios activos mensuales) gratis
   - Autenticación y gestión de usuarios
   - Grupos de usuarios (roles)

3. **API Gateway**
   - 1 millón de llamadas/mes gratis (primeros 12 meses)
   - Enrutamiento de endpoints REST

4. **AWS Lambda**
   - 1 millón de requests/mes gratis
   - 400,000 GB-segundos/mes gratis
   - Backend serverless

5. **Amazon DynamoDB**
   - 25 GB de almacenamiento gratis
   - 25 RCU (Read Capacity Units) gratis
   - 25 WCU (Write Capacity Units) gratis
   - Base de datos NoSQL

6. **Amazon S3**
   - 5 GB de almacenamiento gratis (primeros 12 meses)
   - 20,000 GET requests/mes gratis
   - 2,000 PUT requests/mes gratis
   - Assets 3D, documentos, archivos

7. **CloudWatch**
   - 5 GB de logs/mes gratis
   - 10 métricas custom gratis
   - Monitoreo básico

8. **CloudFront (opcional)**
   - 50 GB de transferencia/mes gratis (primeros 12 meses)
   - CDN para assets 3D

9. **Systems Manager Parameter Store**
   - Parámetros básicos gratis
   - Almacenar secretos (OpenAI key, PayPal credentials)

### Alternativas si se Excede la Capa Gratuita

- **RDS** o **DocumentDB** si DynamoDB no es suficiente
- **SES** para emails (si se necesita notificaciones por email)
- **SNS** para notificaciones push
- **EventBridge** (14M eventos/mes gratis) si se necesita orquestación compleja

## Seguridad

### 1. Autenticación con Cognito
- JWT tokens con expiración
- Refresh tokens
- MFA opcional para admins
- Grupos de usuarios con permisos diferenciados

### 2. Autorización IAM
- Principio de menor privilegio
- Roles específicos por función
- Políticas restrictivas en DynamoDB, S3

### 3. Encriptación
- HTTPS obligatorio (TLS 1.2+)
- Encriptación en reposo (DynamoDB, S3)
- Secrets en Parameter Store encriptados

### 4. Validación y Sanitización
- Todos los inputs validados en Lambda
- Schemas con Joi/Zod
- Prevención de injection attacks

### 5. Rate Limiting
- API Gateway throttling (100 req/s por IP)
- Quotas para prevenir abuso
- CloudWatch alarms para anomalías

## Modelo de Datos DynamoDB

### Estrategia: Single Table Design

**Tabla: IgerData**

**Primary Keys:**
- `PK`: Partition Key (STRING)
- `SK`: Sort Key (STRING)

**Global Secondary Indexes:**
- `GSI1`: `GSI1PK` (HASH), `GSI1SK` (RANGE)
- `GSI2`: `GSI2PK` (HASH), `GSI2SK` (RANGE)

**Atributos Comunes:**
- `Type`: Tipo de entidad (STRING)
- `Data`: Datos de la entidad (MAP)
- `CreatedAt`: Timestamp de creación (NUMBER)
- `UpdatedAt`: Timestamp de actualización (NUMBER)
- `TTL`: Tiempo de vida (NUMBER) - para datos temporales

### Patrones de Acceso

Ver sección 4 del plan técnico para detalles completos de patrones de acceso.

## Sincronización Offline

### Componentes
1. **Service Worker** (Workbox)
   - Intercepta requests HTTP
   - Estrategias de cache
   - Retorna datos offline desde IndexedDB

2. **IndexedDB** (via idb library)
   - **Store**: cachedData
     - Cache de datos leídos
     - Key-value por entidad
   - **Store**: pendingOperations
     - Cola de operaciones pendientes
     - Orden cronológico
   - **Store**: syncMetadata
     - Última sincronización
     - Resolución de conflictos

3. **Sync Manager**
   - Detecta conexión
   - Envía operaciones pendientes
   - Aplica cambios del servidor
   - Maneja conflictos (last-write-wins)

### Flujo de Sync
```
Offline → Usuario crea/modifica → Guardar en IndexedDB
Online → Service Worker detecta → Obtener pendingOperations
Push → POST /sync/push → Lambda aplica cambios
Pull → POST /sync/pull → Lambda retorna cambios desde lastSyncTimestamp
Actualizar → IndexedDB con nuevos datos
UI → Actualizar vista
```

## Integración con PayPal

### Flow de Pago
```
1. Admin crea factura → POST /payments/invoices
2. Lambda crea registro en DynamoDB
3. Padre inicia pago → POST /payments/create-order
4. Lambda crea PayPal Order via API
5. PayPal retorna approval URL
6. Frontend redirige a PayPal
7. Usuario completa pago
8. PayPal envía webhook → POST /payments/webhook
9. Lambda valida webhook y actualiza estado
10. Frontend verifica estado → GET /payments/invoices/{invoiceId}
```

## Integración con OpenAI

### Endpoints
- `POST /ai/summarize` - Resumir contenido de tareas
- `POST /ai/tutor` - Chat de tutoría inteligente
- `POST /ai/generate-content` - Generar contenido educativo

### Seguridad
- API key en Parameter Store
- Rate limiting (prevenir abuso)
- Logging de uso (auditoría)
- Filtros de contenido (moderación)

## Monitoreo y Logging

### CloudWatch
- Logs de todas las Lambdas
- Métricas custom (errores, latencia, uso)
- Alarmas para errores críticos
- Dashboards para métricas clave

### Auditoría
- Logs de auditoría en DynamoDB (tabla AuditLog)
- Acciones críticas registradas
- Cumplimiento normativo (LOPD)

## Despliegue

### Frontend
- Amplify Console (CI/CD automático)
- Build en cada push a main
- Preview para pull requests
- Despliegue por ambientes (dev, prod)

### Backend
- Serverless Framework
- Deploy por stages (dev, prod)
- Rollback automático si hay errores
- Variables de entorno por stage

## Escalabilidad

### DynamoDB
- On-demand (sin límite de capacidad)
- Auto-scaling para consumir capa gratuita eficientemente
- GSIs para queries optimizadas

### Lambda
- Auto-scaling automático
- Concurrencia configurada
- Timeouts apropiados

### API Gateway
- Throttling para prevenir abuso
- Cache de respuestas opcional
- Integración con CloudFront

## Optimización de Costos

1. Uso de capa gratuita al máximo
2. Lazy loading en frontend
3. Code splitting
4. Cache agresivo (Service Worker)
5. Compresión de assets (gzip, brotli)
6. Límites de TTL en DynamoDB
7. Archivar datos antiguos en S3 Glacier (futuro)



