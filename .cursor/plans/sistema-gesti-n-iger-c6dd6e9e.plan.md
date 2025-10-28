<!-- c6dd6e9e-6778-4dda-ba1e-9dbddcfa7f97 f595dbd5-159f-458a-9619-2ac5da067dc7 -->
# Plan Técnico: Sistema de Gestión Escolar Iger

## 1. Arquitectura del Sistema

### 1.1 Diagrama de Componentes

Crear diagrama que muestre:

- **Frontend (React + Babylon.js)** → AWS Amplify Hosting + CloudFront
- **Service Worker + IndexedDB** → Capa offline
- **Amazon Cognito** → Autenticación y autorización
- **API Gateway (REST)** → Enrutamiento de peticiones
- **AWS Lambda (Node.js + TypeScript)** → Lógica de negocio
- **Amazon DynamoDB** → Base de datos NoSQL
- **Amazon S3** → Assets 3D, documentos, archivos
- **CloudWatch** → Logging y monitoreo
- **OpenAI API** → Integración desde Lambda (resúmenes, tutor IA)
- **PayPal API** → Procesamiento de pagos desde Lambda

### 1.2 Flujo de Datos

- Usuario → Amplify (CDN) → React App
- React App → API Gateway → Lambda → DynamoDB/S3
- Lambda → OpenAI/PayPal (server-side)
- Service Worker intercepta requests offline → IndexedDB → Sync cuando hay conexión

## 2. Servicios AWS y Justificación (Capa Gratuita)

### Servicios Principales

- **AWS Amplify Hosting**: 1000 min build + 15GB servidos/mes gratis → hosting frontend
- **Amazon Cognito**: 50,000 MAU gratis → autenticación de usuarios
- **API Gateway**: 1M llamadas/mes gratis (12 meses) → endpoints REST
- **AWS Lambda**: 1M requests + 400,000 GB-segundo/mes gratis → backend serverless
- **DynamoDB**: 25GB almacenamiento + 25 RCU/WCU gratis → base de datos
- **S3**: 5GB almacenamiento + 20,000 GET + 2,000 PUT gratis (12 meses) → assets
- **CloudWatch**: 5GB logs + 10 métricas custom gratis → monitoreo básico

### Alternativas si se excede capa gratuita

- **CloudFront**: Si Amplify CDN no es suficiente (50GB transferencia/mes gratis)
- **Systems Manager Parameter Store**: Parámetros básicos gratis → secretos
- **EventBridge**: 14M eventos custom gratis (si se necesita orquestación)

## 3. Especificación API (Endpoints Principales)

### 3.1 Autenticación (`/auth`)

```
POST /auth/register
Body: { email, password, role, firstName, lastName }
Response: { userId, confirmationRequired: true }

POST /auth/login
Body: { email, password }
Response: { accessToken, refreshToken, user: {...} }

POST /auth/refresh
Body: { refreshToken }
Response: { accessToken }
```

### 3.2 Gestión de Alumnos (`/students`)

```
GET /students?page=1&limit=20
Response: { students: [...], total, page }

POST /students
Body: { firstName, lastName, birthDate, parentIds, grade, ... }
Response: { studentId, ...studentData }

GET /students/{studentId}
Response: { student: {...}, enrollments: [...] }

PUT /students/{studentId}
Body: { ...fieldsToUpdate }

DELETE /students/{studentId}
```

### 3.3 Clases y Tareas (`/classes`, `/tasks`)

```
GET /classes/{classId}/tasks
Response: { tasks: [...] }

POST /tasks
Body: { classId, title, description, dueDate, attachments: [...] }
Response: { taskId, ...taskData }

POST /tasks/{taskId}/submissions
Body: { studentId, content, attachments: [...] }
Response: { submissionId, status }

GET /tasks/{taskId}/submissions
Response: { submissions: [...] }
```

### 3.4 Calendario y Eventos (`/events`)

```
GET /events?from=2025-01-01&to=2025-12-31
Response: { events: [...] }

POST /events
Body: { title, description, startDate, endDate, type, attendees: [...] }
Response: { eventId, ...eventData }

PUT /events/{eventId}
DELETE /events/{eventId}
```

### 3.5 Finanzas y Pagos (`/payments`)

```
POST /payments/invoices
Body: { studentId, items: [...], dueDate, amount }
Response: { invoiceId, paymentUrl }

POST /payments/create-order
Body: { invoiceId }
Response: { orderId, approvalUrl } // PayPal Order

POST /payments/webhook
Body: { ...paypalWebhookData }
Response: { received: true }

GET /payments/invoices/{invoiceId}
Response: { invoice: {...}, status, transactions: [...] }
```

### 3.6 Sincronización Offline (`/sync`)

```
POST /sync/pull
Body: { lastSyncTimestamp, entities: ['students', 'events', 'tasks'] }
Response: { changes: {...}, serverTimestamp }

POST /sync/push
Body: { operations: [{ id, type, entity, data, timestamp }, ...] }
Response: { applied: [...], conflicts: [...], serverTimestamp }
```

### 3.7 Integración OpenAI (`/ai`)

```
POST /ai/summarize
Body: { taskId, content }
Response: { summary }

POST /ai/tutor
Body: { studentId, question, context }
Response: { answer, references: [...] }

POST /ai/generate-content
Body: { subject, topic, gradeLevel, type }
Response: { content, metadata }
```

### 3.8 Asistencia (`/attendance`)

```
POST /attendance
Body: { classId, date, records: [{ studentId, status }] }
Response: { attendanceId }

GET /attendance?classId=X&from=Y&to=Z
Response: { records: [...] }
```

## 4. Modelo de Datos DynamoDB

### 4.1 Estrategia: Single Table Design con GSIs

**Tabla Principal: `IgerData`**

```
PK (Partition Key): STRING
SK (Sort Key): STRING
GSI1PK: STRING
GSI1SK: STRING
GSI2PK: STRING
GSI2SK: STRING
Type: STRING
Data: MAP
CreatedAt: NUMBER
UpdatedAt: NUMBER
```

### 4.2 Patrones de Acceso

#### Usuarios

```
PK: ORG#<orgId>
SK: USER#<userId>
GSI1PK: USER#<email>
GSI1SK: USER#<userId>
Type: User
Data: { firstName, lastName, role, email, ... }
```

#### Estudiantes

```
PK: ORG#<orgId>
SK: STUDENT#<studentId>
GSI1PK: PARENT#<parentId>
GSI1SK: STUDENT#<studentId>
Type: Student
Data: { firstName, lastName, grade, parentIds, ... }
```

#### Clases

```
PK: ORG#<orgId>
SK: CLASS#<classId>
GSI1PK: TEACHER#<teacherId>
GSI1SK: CLASS#<classId>
Type: Class
Data: { name, subject, teacherId, studentIds, ... }
```

#### Tareas

```
PK: CLASS#<classId>
SK: TASK#<taskId>
GSI1PK: DUEDATE#<YYYY-MM-DD>
GSI1SK: TASK#<taskId>
Type: Task
Data: { title, description, dueDate, attachments, ... }
```

#### Entregas de Tareas

```
PK: TASK#<taskId>
SK: SUBMISSION#<studentId>
GSI1PK: STUDENT#<studentId>
GSI1SK: SUBMISSION#<taskId>#<timestamp>
Type: Submission
Data: { content, attachments, grade, feedback, ... }
```

#### Eventos

```
PK: ORG#<orgId>
SK: EVENT#<eventId>
GSI1PK: DATE#<YYYY-MM-DD>
GSI1SK: EVENT#<eventId>
Type: Event
Data: { title, description, startDate, endDate, attendees, ... }
```

#### Pagos/Facturas

```
PK: ORG#<orgId>
SK: INVOICE#<invoiceId>
GSI1PK: STUDENT#<studentId>
GSI1SK: INVOICE#<invoiceId>
GSI2PK: STATUS#<status>
GSI2SK: DUEDATE#<YYYY-MM-DD>
Type: Invoice
Data: { studentId, amount, items, status, paypalOrderId, ... }
```

#### Asistencia

```
PK: CLASS#<classId>
SK: ATTENDANCE#<YYYY-MM-DD>
Type: Attendance
Data: { date, records: [{ studentId, status }] }
```

#### Audit Log

```
PK: ORG#<orgId>
SK: LOG#<timestamp>#<logId>
GSI1PK: USER#<userId>
GSI1SK: LOG#<timestamp>
Type: AuditLog
Data: { action, userId, entity, changes, ... }
```

### 4.3 Índices GSI

- **GSI1**: Consultas por entidades relacionadas (ej: tareas por profesor, alumnos por padre)
- **GSI2**: Consultas por estados y fechas (ej: facturas pendientes, eventos próximos)

## 5. Estrategia Offline Completa

### 5.1 Arquitectura Local-First

**Componentes:**

- **Service Worker (Workbox)**: Intercepta requests, cache de assets estáticos
- **IndexedDB (idb)**: Almacén local de datos y cola de operaciones
- **Sync Manager**: Gestiona sincronización bidireccional

**Bases de datos IndexedDB:**

```
DB: IgerOffline
Stores:
  - cachedData: { key, entity, data, timestamp }
  - pendingOperations: { id, type, entity, operation, data, timestamp, status }
  - syncMetadata: { key, lastSyncTimestamp, conflictResolution }
```

### 5.2 Flujo de Operaciones Offline

**Lectura:**

1. App intenta fetch a API
2. Service Worker intercepta
3. Si offline: devuelve desde IndexedDB cache
4. Si online: fetch real, actualiza cache, devuelve datos

**Escritura:**

```javascript
// Pseudocódigo
async function createTaskOffline(taskData) {
  const operationId = generateUUID();
  const operation = {
    id: operationId,
    type: 'CREATE',
    entity: 'task',
    data: taskData,
    timestamp: Date.now(),
    status: 'pending'
  };
  
  // Guardar en IndexedDB
  await db.pendingOperations.add(operation);
  
  // Actualizar UI optimista
  await db.cachedData.add({
    key: `task_${operationId}`,
    entity: 'task',
    data: { ...taskData, id: operationId, _localOnly: true },
    timestamp: Date.now()
  });
  
  // Intentar sync si hay conexión
  if (navigator.onLine) {
    await syncPendingOperations();
  }
  
  return operationId;
}
```

**Sincronización:**

```javascript
// Pseudocódigo
async function syncPendingOperations() {
  const pending = await db.pendingOperations
    .where('status').equals('pending')
    .sortBy('timestamp');
  
  for (const op of pending) {
    try {
      const result = await fetch('/sync/push', {
        method: 'POST',
        body: JSON.stringify({ operations: [op] })
      });
      
      if (result.conflicts.length > 0) {
        // Resolver conflicto (last-write-wins o UI de resolución)
        await handleConflict(op, result.conflicts[0]);
      } else {
        // Marcar como aplicado
        await db.pendingOperations.update(op.id, { status: 'synced' });
        
        // Actualizar cache con ID real del servidor
        if (result.applied[0].serverId) {
          await updateLocalCache(op.id, result.applied[0].serverId);
        }
      }
    } catch (error) {
      // Reintentar después
      await db.pendingOperations.update(op.id, { 
        retries: (op.retries || 0) + 1,
        lastError: error.message 
      });
    }
  }
}
```

### 5.3 Service Worker con Workbox

**Estrategias de cache:**

- Assets estáticos (JS, CSS, fonts): Cache First
- Modelos 3D: Cache First con expiration
- API calls: Network First con fallback a cache
- Imágenes: Stale While Revalidate

### 5.4 UI de Estado de Sincronización

**Indicadores:**

- Badge/icono mostrando: online/offline/syncing
- Contador de operaciones pendientes
- Toast notifications cuando sync completa
- Lista de conflictos para resolución manual

## 6. Pipeline 3D con Babylon.js

### 6.1 Formatos y Compresión

**Formato recomendado:** glTF 2.0 (.glb para binario compacto)

**Optimización de modelos:**

- Exportar desde Blender/Maya con plugin glTF
- Aplicar Draco compression (reducción 90% geometría)
- Texturas: atlas combinado, formato WebP, max 2048x2048
- LOD (Level of Detail): 3 niveles (high, medium, low)
- Eliminar datos no utilizados (tangentes si no hay normal mapping)

**Herramientas:**

```bash
# Instalar gltf-pipeline
npm install -g gltf-pipeline

# Comprimir modelo
gltf-pipeline -i model.gltf -o model.glb -d

# Optimizar texturas
gltf-pipeline -i model.glb -o optimized.glb -t
```

### 6.2 Código de Ejemplo: Carga Progresiva en React

**Componente Scene3D:**

```typescript
// src/components/Scene3D.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { DracoCompression } from '@babylonjs/core/Meshes/Compression';

interface Scene3DProps {
  modelUrl: string;
  onLoadProgress?: (progress: number) => void;
}

export const Scene3D: React.FC<Scene3DProps> = ({ modelUrl, onLoadProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BABYLON.Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      powerPreference: 'high-performance'
    });

    const scene = new BABYLON.Scene(engine);
    
    // Configuración de cámara y luz básica
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 2.5,
      3,
      BABYLON.Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);

    const light = new BABYLON.HemisphericLight(
      'light',
      new BABYLON.Vector3(0, 1, 0),
      scene
    );

    // Habilitar Draco compression
    DracoCompression.Configuration = {
      decoder: {
        wasmUrl: '/draco/draco_wasm_wrapper.js',
        wasmBinaryUrl: '/draco/draco_decoder.wasm',
        fallbackUrl: '/draco/draco_decoder.js'
      }
    };

    // Cargar modelo con progreso
    BABYLON.SceneLoader.LoadAssetContainerAsync(
      '',
      modelUrl,
      scene,
      (event) => {
        const progress = event.lengthComputable
          ? (event.loaded / event.total) * 100
          : 0;
        onLoadProgress?.(progress);
      }
    ).then((container) => {
      container.addAllToScene();
      setLoading(false);

      // Optimizaciones post-carga
      scene.meshes.forEach((mesh) => {
        mesh.isPickable = false; // Si no necesita interacción
        if (mesh.material) {
          mesh.material.freeze(); // Freeze si no cambia
        }
      });

      // Shadow generator opcional (costoso)
      // const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    });

    // Loop de render optimizado
    let frameCount = 0;
    engine.runRenderLoop(() => {
      frameCount++;
      // Reducir FPS en mobile si es necesario
      if (frameCount % 2 === 0 || !isMobile()) {
        scene.render();
      }
    });

    // Resize
    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
    };
  }, [modelUrl, onLoadProgress]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white">Cargando modelo 3D...</div>
        </div>
      )}
    </div>
  );
};

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
```

### 6.3 Lazy Loading y Code Splitting

```typescript
// Lazy load del componente 3D
const Scene3D = React.lazy(() => import('./components/Scene3D'));

// En el componente padre
<React.Suspense fallback={<div>Cargando vista 3D...</div>}>
  <Scene3D modelUrl="/assets/models/classroom.glb" />
</React.Suspense>
```

### 6.4 Estructura de Assets en S3

```
s3://iger-assets/
  models/
    classroom-high.glb
    classroom-medium.glb
    classroom-low.glb
  textures/
    atlas-diffuse.webp
    atlas-normal.webp
  draco/
    draco_decoder.wasm
    draco_wasm_wrapper.js
```

## 7. Plan de Seguridad (10 Pasos)

### 7.1 Autenticación y Autorización

1. **Amazon Cognito con MFA**: Configurar pools de usuarios con verificación de email y opción de MFA para roles admin
2. **Roles y políticas IAM**: Crear roles específicos por función (admin, docente, alumno, padre) con menor privilegio
3. **JWT validation**: Validar tokens en cada request Lambda usando Cognito public keys

### 7.2 Comunicación Segura

4. **HTTPS obligatorio**: Amplify y API Gateway solo HTTPS, no HTTP
5. **CORS restrictivo**: Configurar CORS en API Gateway solo para dominio de producción

### 7.3 Datos y Secretos

6. **Encriptación en reposo**: Habilitar encryption en DynamoDB y S3
7. **Secrets en Parameter Store**: API keys de OpenAI y PayPal en Systems Manager, acceso solo via IAM
8. **No secrets en frontend**: Verificar que no hay keys/tokens en código JavaScript

### 7.4 Input y Rate Limiting

9. **Validación y sanitización**: Validar todos los inputs en Lambda (usar Joi/Zod), sanitizar para prevenir injection
10. **Rate limiting en API Gateway**: Configurar throttling (ej: 100 req/s por IP) y quotas para prevenir abuso

### 7.5 Adicionales

- **Audit logging**: Registrar acciones críticas en CloudWatch y tabla AuditLog
- **Vulnerabilities scan**: Usar npm audit y Snyk en CI/CD
- **Alertas CloudWatch**: Notificaciones por intentos de acceso fallidos excesivos

## 8. Guía de Despliegue AWS Amplify

### 8.1 Requisitos Previos

```bash
# Instalar Amplify CLI
npm install -g @aws-amplify/cli

# Configurar credenciales AWS
amplify configure
```

### 8.2 Inicializar Proyecto Frontend

```bash
cd frontend
amplify init
# Nombre del proyecto: IgerFrontend
# Environment: dev
# Editor: VSCode
# App type: javascript
# Framework: react
# Source Directory: src
# Distribution Directory: dist
# Build Command: npm run build
# Start Command: npm run dev
```

### 8.3 Configurar Hosting

```bash
amplify add hosting
# Select: Hosting with Amplify Console
# Type: Manual deployment (o Continuous si conectas Git)

amplify publish
```

### 8.4 Configurar Cognito

```bash
amplify add auth
# Do you want to use the default authentication: Default configuration
# How do you want users to be able to sign in: Email
# Do you want to configure advanced settings: Yes
# - Require attributes: email, name
# - Enable MFA: Optional
# - Add User Groups: admin, teacher, student, parent

amplify push
```

### 8.5 Archivo de Configuración Amplify

**amplify.yml** (para CI/CD):

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### 8.6 Despliegue Backend Serverless

**Opción A: Serverless Framework**

```bash
# Instalar
npm install -g serverless

cd backend
# Crear serverless.yml
serverless deploy --stage dev
```

**serverless.yml básico:**

```yaml
service: iger-backend

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    DYNAMODB_TABLE: IgerData
    OPENAI_API_KEY: ${ssm:/iger/openai-key}
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:Query
            - dynamodb:Scan
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
            - dynamodb:DeleteItem
          Resource: 
            - "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.DYNAMODB_TABLE}"
            - "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.DYNAMODB_TABLE}/index/*"

functions:
  authLogin:
    handler: src/handlers/auth.login
    events:
      - http:
          path: auth/login
          method: post
          cors: true
  
  getStudents:
    handler: src/handlers/students.list
    events:
      - http:
          path: students
          method: get
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref CognitoAuthorizer

resources:
  Resources:
    IgerTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.DYNAMODB_TABLE}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: PK
            AttributeType: S
          - AttributeName: SK
            AttributeType: S
          - AttributeName: GSI1PK
            AttributeType: S
          - AttributeName: GSI1SK
            AttributeType: S
        KeySchema:
          - AttributeName: PK
            KeyType: HASH
          - AttributeName: SK
            KeyType: RANGE
        GlobalSecondaryIndexes:
          - IndexName: GSI1
            KeySchema:
              - AttributeName: GSI1PK
                KeyType: HASH
              - AttributeName: GSI1SK
                KeyType: RANGE
            Projection:
              ProjectionType: ALL
```

**Opción B: AWS SAM**

```bash
# Instalar SAM CLI
pip install aws-sam-cli

cd backend
sam init --runtime nodejs18.x
sam build
sam deploy --guided
```

### 8.7 Configurar Secretos

```bash
aws ssm put-parameter \
  --name "/iger/openai-key" \
  --value "sk-..." \
  --type "SecureString"

aws ssm put-parameter \
  --name "/iger/paypal-client-id" \
  --value "..." \
  --type "SecureString"

aws ssm put-parameter \
  --name "/iger/paypal-secret" \
  --value "..." \
  --type "SecureString"
```

### 8.8 Variables de Entorno Frontend

**frontend/.env.production:**

```env
VITE_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_REGION=us-east-1
VITE_S3_ASSETS_URL=https://iger-assets.s3.amazonaws.com
```

## 9. Estructura de Repositorios

### 9.1 Repositorio Frontend

```
iger-frontend/
├── .github/
│   └── workflows/
│       └── ci.yml
├── public/
│   ├── draco/
│   │   ├── draco_decoder.wasm
│   │   └── draco_wasm_wrapper.js
│   └── service-worker.js
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   ├── 3d/
│   │   │   ├── Scene3D.tsx
│   │   │   └── ModelLoader.tsx
│   │   └── features/
│   │       ├── auth/
│   │       ├── students/
│   │       ├── tasks/
│   │       ├── events/
│   │       └── payments/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useOffline.ts
│   │   └── useSync.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── cognito.ts
│   │   ├── offline/
│   │   │   ├── db.ts
│   │   │   ├── sync.ts
│   │   │   └── service-worker-registration.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Students.tsx
│   │   ├── Tasks.tsx
│   │   ├── Events.tsx
│   │   └── Payments.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── routes.tsx
├── .env.example
├── .gitignore
├── amplify.yml
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### 9.2 Repositorio Backend

```
iger-backend/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── src/
│   ├── handlers/
│   │   ├── auth.ts
│   │   ├── students.ts
│   │   ├── tasks.ts
│   │   ├── events.ts
│   │   ├── payments.ts
│   │   ├── sync.ts
│   │   └── ai.ts
│   ├── lib/
│   │   ├── dynamodb.ts
│   │   ├── s3.ts
│   │   ├── cognito.ts
│   │   ├── openai.ts
│   │   ├── paypal.ts
│   │   └── utils.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── error-handler.ts
│   ├── models/
│   │   ├── student.ts
│   │   ├── task.ts
│   │   ├── event.ts
│   │   └── payment.ts
│   ├── schemas/
│   │   └── validation/
│   │       ├── student.schema.ts
│   │       ├── task.schema.ts
│   │       └── payment.schema.ts
│   └── types/
│       └── index.ts
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── .gitignore
├── jest.config.js
├── package.json
├── serverless.yml
├── tsconfig.json
└── README.md
```

### 9.3 README.md Plantilla (Frontend)

````markdown
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
````

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

Ver [CONTRIBUTING.md](CONTRIBUTING.md)

## Licencia

MIT

````

### 9.4 README.md Plantilla (Backend)

```markdown
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
````

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

Ver [docs/API.md](docs/API.md) para documentación completa.

- `POST /auth/login` - Autenticación
- `GET /students` - Listar estudiantes
- `POST /tasks` - Crear tarea
- `POST /payments/create-order` - Crear orden de pago
- `POST /sync/push` - Sincronización offline

## Modelo de Datos

Ver [docs/DATA_MODEL.md](docs/DATA_MODEL.md)

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

Ver [CONTRIBUTING.md](CONTRIBUTING.md)

## Licencia

MIT

```

## 10. Estimación de Hitos MVP

### Sprint 1: Infraestructura y Autenticación (1-2 semanas)
- Configurar repositorios frontend y backend
- Configurar AWS Amplify y Cognito
- Crear tabla DynamoDB con modelo básico
- Implementar endpoints de autenticación (/auth/login, /auth/register)
- UI de login y registro en React
- Configurar CI/CD básico

### Sprint 2: Gestión de Estudiantes y Clases (1-2 semanas)
- Endpoints CRUD de estudiantes
- Endpoints CRUD de clases
- UI para listar/crear/editar estudiantes
- UI para gestión de clases
- Implementar autorización por roles (admin, docente)
- Tests unitarios para handlers principales

### Sprint 3: Tareas y Calendario (1-2 semanas)
- Endpoints de tareas (crear, listar, entregar)
- Endpoints de eventos/calendario
- UI de calendario con vista mensual
- UI de tareas (lista, detalle, entrega)
- Upload de archivos a S3 (presigned URLs)
- Validación de inputs con schemas

### Sprint 4: Funcionalidad Offline (1-2 semanas)
- Configurar Service Worker con Workbox
- Implementar IndexedDB para cache local
- Sistema de cola de operaciones pendientes
- Endpoints /sync/pull y /sync/push
- UI de indicador de estado de sincronización
- Manejo de conflictos básico (last-write-wins)

### Sprint 5: Integración 3D con Babylon.js (1 semana)
- Setup de Babylon.js en React
- Componente Scene3D reutilizable
- Carga de modelo 3D simple (classroom.glb)
- Optimización con Draco compression
- Lazy loading del componente 3D
- Subida de assets 3D a S3 + CloudFront

### Sprint 6: Pagos con PayPal (1-2 semanas)
- Configurar cuenta PayPal sandbox
- Endpoints de creación de facturas
- Endpoint /payments/create-order (PayPal API)
- Webhook handler para confirmación de pagos
- UI de facturas y estado de pagos
- Flow completo: factura → pago → confirmación
- Tests de integración con PayPal sandbox

### Sprint 7: Integración OpenAI (1 semana)
- Endpoints /ai/summarize, /ai/tutor, /ai/generate-content
- Configurar API key de OpenAI en Parameter Store
- Implementar rate limiting y logging de uso
- UI para funciones de IA (botón "Resumir tarea", chat tutor)
- Filtros de contenido generado
- Tests con mocks de OpenAI

### Sprint 8: Asistencia y Finanzas (1 semana)
- Endpoints de registro de asistencia
- UI de toma de asistencia (check-in rápido)
- Dashboard de finanzas (facturas pendientes, pagadas)
- Reportes básicos (asistencia por alumno, ingresos por mes)
- Exportar datos a CSV

### Sprint 9: Pulido y Optimización (1 semana)
- Optimización de bundle size (code splitting, tree shaking)
- Audit de performance con Lighthouse
- Mejorar animaciones y transiciones
- Responsive design (mobile-first)
- Tests E2E con Cypress (flows críticos)
- Documentación de API (OpenAPI spec)

### Sprint 10: Testing, Seguridad y Despliegue (1 semana)
- Audit de seguridad (npm audit, OWASP checklist)
- Configurar rate limiting en API Gateway
- Implementar logging completo (CloudWatch)
- Setup de alarmas para errores críticos
- Despliegue a producción
- Guía de usuario básica
- Video demo del MVP

### Entregables Finales MVP
✅ Aplicación frontend desplegada en Amplify  
✅ Backend serverless funcionando en AWS  
✅ Autenticación con Cognito (4 roles)  
✅ CRUD de estudiantes, clases, tareas, eventos  
✅ Sistema offline completo con sincronización  
✅ 1 escena 3D optimizada funcionando  
✅ Integración de pagos con PayPal (sandbox)  
✅ 3 funciones de IA con OpenAI  
✅ Documentación técnica completa  
✅ Scripts de despliegue automatizados  

**Tiempo estimado total MVP:** 10-14 semanas (2.5-3.5 meses)

## Notas Adicionales

- Todos los textos de la UI deben estar en español
- Priorizar uso de servicios dentro de la capa gratuita de AWS
- Documentar cualquier decisión arquitectónica importante
- Mantener código limpio, tipado y testeado
- Seguir principios SOLID y clean architecture
- Implementar logging exhaustivo para debugging
- Configurar alertas para errores críticos desde el inicio
```

### To-dos

- [ ] Crear diagrama de arquitectura visual con todos los componentes AWS, flujos de datos y integraciones externas
- [ ] Crear estructura de repositorios frontend y backend con configuraciones iniciales (TypeScript, ESLint, Prettier)
- [ ] Configurar servicios AWS: Amplify, Cognito, DynamoDB, S3, API Gateway, Lambda básicas
- [ ] Implementar sistema de autenticación completo con Cognito (login, register, roles) en frontend y backend
- [ ] Desarrollar endpoints y UI para gestión de estudiantes y clases (CRUD completo)
- [ ] Desarrollar sistema de tareas y calendario con endpoints, UI y upload de archivos a S3
- [ ] Implementar funcionalidad offline completa: Service Worker, IndexedDB, sincronización bidireccional
- [ ] Integrar Babylon.js, crear componente Scene3D, optimizar carga de modelos glTF con Draco
- [ ] Integrar PayPal: crear facturas, procesar pagos, webhook handler, UI de pagos
- [ ] Integrar OpenAI desde backend: endpoints de IA (resúmenes, tutor, generación contenido), UI
- [ ] Desarrollar sistema de asistencia: endpoints, UI de check-in rápido, reportes
- [ ] Optimizar performance, implementar tests (unit, integration, E2E), audit de seguridad
- [ ] Crear documentación completa, guías de despliegue, READMEs, especificación OpenAPI, video demo