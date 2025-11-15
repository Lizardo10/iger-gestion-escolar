# IGER - Sistema de Gestión Escolar

Sistema completo de gestión escolar desarrollado para administrar estudiantes, inscripciones, pagos, tareas, eventos, asistencia y más. Incluye integración con PayPal para pagos, sistema de correo electrónico con facturas PDF, y un chatbot con IA basado en RAG (Retrieval-Augmented Generation).

## 📋 Descripción del Sistema

**IGER** es una plataforma web completa para la gestión de instituciones educativas que permite:

- **Gestión de Estudiantes**: Inscripción, perfil, y seguimiento académico
- **Sistema de Pagos**: Integración con PayPal (modo sandbox) para procesamiento de inscripciones y facturas
- **Gestión de Tareas**: Creación, asignación y seguimiento de tareas académicas
- **Eventos Escolares**: Calendario y gestión de eventos, reuniones y actividades
- **Control de Asistencia**: Registro y reportes de asistencia estudiantil
- **Chat con IA**: Asistente virtual con contexto del sistema usando OpenAI
- **Facturación Automática**: Generación automática de facturas PDF y envío por correo
- **Múltiples Roles**: Superadmin, Admin, Profesor y Estudiante con permisos diferenciados

## 🔐 Credenciales de Demostración (Universidad)

> ⚠️ Uso exclusivo para pruebas académicas. No utilices estas credenciales en producción ni las reutilices en servicios reales.

| Rol           | Usuario / Correo                | Contraseña               | Comentarios                                      |
| ------------- | -------------------------------- | ------------------------ | ------------------------------------------------ |
| Superadmin    | `lizardoperezjimenez@gmail.com` | `MiNuevaPasswordSegura123!` | Acceso total para configurar el sistema           |
| Administrador | `admin.demo@iger.edu`           | `AdminDemo123!`          | Gestiona profesores, clases y pagos               |
| Profesor      | `profesor.demo@iger.edu`        | `TeacherDemo123!`        | Accede a “Mis Clases” y administra sus cursos     |
| Estudiante    | `estudiante.demo@iger.edu`      | `StudentDemo123!`        | Consulta tareas, eventos y estado de pagos        |

Cada cuenta obliga a cambiar la contraseña en el primer inicio de sesión (flujo protegido por Cognito).

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** - Framework de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **TailwindCSS** - Estilos
- **AWS Amplify** - Hosting y CI/CD

### Backend
- **Node.js 18** - Runtime
- **TypeScript** - Tipado estático
- **Serverless Framework 4** - Deployment y configuración
- **AWS Lambda** - Funciones serverless
- **API Gateway** - API REST
- **AWS DynamoDB** - Base de datos NoSQL
- **AWS Cognito** - Autenticación y autorización
- **AWS SES** - Servicio de correo electrónico

### Servicios de Terceros
- **PayPal Sandbox** - Procesamiento de pagos (modo prueba)
- **OpenAI API** - Chatbot con IA y RAG
- **PDFKit** - Generación de PDFs para facturas

### Herramientas de Desarrollo
- **Git** - Control de versiones
- **npm** - Gestión de dependencias
- **ESLint** - Linter de código
- **AWS CLI** - Configuración y deployment

## 📦 Instrucciones de Instalación

### Prerequisitos

- Node.js 18.x o superior
- npm 9.x o superior
- Git
- Cuenta de AWS con permisos para:
  - Lambda
  - API Gateway
  - DynamoDB
  - Cognito
  - SES
  - Amplify
- AWS CLI configurado con credenciales
- Cuenta de PayPal Developer (para modo sandbox)
- Clave API de OpenAI

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd proyectoAnalisis
```

### 2. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
# Crear archivo .env en la raíz de /backend
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
# AWS Cognito
COGNITO_CLIENT_ID=tu-client-id
COGNITO_USER_POOL_ID=tu-user-pool-id

# PayPal (Sandbox)
PAYPAL_CLIENT_ID=tu-paypal-client-id
PAYPAL_SECRET=tu-paypal-secret
PAYPAL_MODE=sandbox
PAYPAL_RECEIVER_EMAIL=receiver@example.com

# OpenAI
OPENAI_API_KEY=tu-openai-api-key

# AWS SES
AWS_SES_REGION=us-east-1
EMAIL_FROM=noreply@iger.online

# Frontend URL
FRONTEND_URL=https://dev.d2umdnu9x2m9qg.amplifyapp.com

# DynamoDB (se crea automáticamente, pero puedes especificar el nombre)
DYNAMODB_TABLE=IgerData
```

### ✉️ Configuración de Correo (AWS SES)

Para que los correos (facturas, credenciales de profesores, etc.) salgan correctamente debes:

1. **Verificar el remitente** (`EMAIL_FROM`) en AWS SES. Si usas dominio propio, verifica el dominio completo o la casilla individual.
2. Si tu cuenta SES sigue en **modo sandbox**, verifica también cada correo destinatario (por ejemplo, las cuentas demo anteriores) desde la consola de SES.
3. Cuando estés listo para producción, solicita acceso “Production” en SES o usa un dominio ya aprobado.
4. Revisa los logs de la función Lambda en CloudWatch (`resetTeacherPassword`, `paymentsVerifyPayment`) ante cualquier `MessageRejected` o `EmailAddressNotVerified`.

Sin estos pasos SES rechazará el envío y verás mensajes de advertencia en los logs.

### 3. Desplegar Backend

```bash
# Compilar TypeScript
npm run build

# Desplegar a AWS
serverless deploy --stage dev
```

**Nota**: El primer deploy puede tardar varios minutos mientras se crean todos los recursos de AWS.

### 4. Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
# Crear archivo .env en la raíz de /frontend
```

Crear `.env` en `/frontend`:

```env
VITE_API_URL=https://tu-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev
VITE_COGNITO_USER_POOL_ID=tu-user-pool-id
VITE_COGNITO_CLIENT_ID=tu-client-id
```

### 5. Configurar AWS Amplify

```bash
# Instalar AWS Amplify CLI
npm install -g @aws-amplify/cli

# Inicializar Amplify (si es la primera vez)
amplify init

# O usar el hosting existente
amplify configure
```

### 6. Desplegar Frontend

```bash
# Build del proyecto
npm run build

# Publicar en Amplify
amplify publish --yes
```

O usar el script de deploy:

```bash
cd ..
./deploy-frontend.sh
```

### 7. Crear Base de Datos (DynamoDB)

La base de datos DynamoDB se crea automáticamente al desplegar el backend. Sin embargo, si necesitas crear la tabla manualmente, ejecuta el siguiente script:

```bash
aws dynamodb create-table \
  --table-name IgerData \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
    AttributeName=GSI2PK,AttributeType=S \
    AttributeName=GSI2SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    IndexName=GSI2,KeySchema=[{AttributeName=GSI2PK,KeyType=HASH},{AttributeName=GSI2SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --billing-mode PROVISIONED \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

### 8. Configurar Usuarios en Cognito

```bash
# Crear usuario administrador
aws cognito-idp admin-create-user \
  --user-pool-id tu-user-pool-id \
  --username admin@iger.online \
  --user-attributes Name=email,Value=admin@iger.online Name=custom:role,Value=admin Name=custom:orgId,Value=org-1 \
  --temporary-password Temporal123! \
  --message-action SUPPRESS

# Establecer contraseña permanente
aws cognito-idp admin-set-user-password \
  --user-pool-id tu-user-pool-id \
  --username admin@iger.online \
  --password Admin123! \
  --permanent
```

## 🔐 Usuario y Contraseña de Prueba

### Usuario Administrador

```
Email: admin@iger.online
Contraseña: Admin123!
Rol: admin
Organización: org-1
```

### Usuario Superadmin

```
Email: superadmin@iger.online
Contraseña: SuperAdmin123!
Rol: superadmin
```

### Usuario Profesor

```
Email: profesor@iger.online
Contraseña: Profesor123!
Rol: teacher
Organización: org-1
```

### Usuario Estudiante

```
Email: estudiante@iger.online
Contraseña: Estudiante123!
Rol: student
Organización: org-1
```

**Nota**: Estos usuarios deben crearse en AWS Cognito. Ver sección "Configurar Usuarios en Cognito" arriba.

## 🗄️ Script de Creación de Base de Datos

### DynamoDB - Tabla Principal

```bash
#!/bin/bash

# Variables
TABLE_NAME="IgerData"
REGION="us-east-1"

# Crear tabla principal
aws dynamodb create-table \
  --table-name $TABLE_NAME \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
    AttributeName=GSI2PK,AttributeType=S \
    AttributeName=GSI2SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" \
    "IndexName=GSI2,KeySchema=[{AttributeName=GSI2PK,KeyType=HASH},{AttributeName=GSI2SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" \
  --billing-mode PROVISIONED \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region $REGION

echo "Tabla $TABLE_NAME creada exitosamente"

# Esperar a que la tabla esté activa
echo "Esperando a que la tabla esté activa..."
aws dynamodb wait table-exists \
  --table-name $TABLE_NAME \
  --region $REGION

echo "Tabla $TABLE_NAME está activa y lista para usar"
```

### Estructura de Datos DynamoDB

La tabla utiliza un diseño de clave compuesta con índices globales secundarios (GSI):

#### Esquema de Claves

- **PK (Partition Key)**: Identificador principal (ej: `ORG#org-1`, `USER#user-id`)
- **SK (Sort Key)**: Identificador secundario (ej: `STUDENT#student-id`, `INVOICE#invoice-id`)
- **GSI1**: Índice para búsquedas por estudiante/clase
- **GSI2**: Índice para búsquedas por estado/fecha

#### Tipos de Entidades

1. **Organizaciones**: `PK: ORG#{orgId}`, `SK: METADATA`
2. **Usuarios**: `PK: USER#{userId}`, `SK: PROFILE`
3. **Estudiantes**: `PK: ORG#{orgId}`, `SK: STUDENT#{studentId}`
4. **Inscripciones**: `PK: ORG#{orgId}`, `SK: ENROLLMENT#{enrollmentId}`
5. **Facturas**: `PK: ORG#{orgId}`, `SK: INVOICE#{invoiceId}`
6. **Tareas**: `PK: CLASS#{classId}`, `SK: TASK#{taskId}`
7. **Eventos**: `PK: ORG#{orgId}`, `SK: EVENT#{eventId}`
8. **Asistencia**: `PK: CLASS#{classId}`, `SK: ATTENDANCE#{date}#{studentId}`

### Script de Creación Completo

Guarda el siguiente script como `create-database.sh`:

```bash
#!/bin/bash

set -e

TABLE_NAME="IgerData"
REGION="us-east-1"

echo "🚀 Creando tabla DynamoDB: $TABLE_NAME"

aws dynamodb create-table \
  --table-name $TABLE_NAME \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
    AttributeName=GSI2PK,AttributeType=S \
    AttributeName=GSI2SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" \
    "IndexName=GSI2,KeySchema=[{AttributeName=GSI2PK,KeyType=HASH},{AttributeName=GSI2SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" \
  --billing-mode PROVISIONED \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region $REGION

echo "⏳ Esperando a que la tabla esté activa..."
aws dynamodb wait table-exists \
  --table-name $TABLE_NAME \
  --region $REGION

echo "✅ Tabla $TABLE_NAME creada exitosamente y lista para usar"
```

Ejecutar:

```bash
chmod +x create-database.sh
./create-database.sh
```

## 🚀 Scripts de Deployment

El proyecto incluye scripts de deployment automatizados:

### Deploy Completo

```bash
./deploy-all.sh
```

### Deploy Solo Backend

```bash
./deploy-backend.sh
```

### Deploy Solo Frontend

```bash
./deploy-frontend.sh
```

## 📝 Estructura del Proyecto

```
proyectoAnalisis/
├── backend/
│   ├── src/
│   │   ├── handlers/       # Handlers de Lambda
│   │   ├── lib/           # Librerías y servicios
│   │   └── types/         # Definiciones TypeScript
│   ├── serverless.yml     # Configuración Serverless
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/        # Páginas principales
│   │   ├── lib/          # Librerías y servicios
│   │   └── hooks/        # Custom hooks
│   ├── public/           # Archivos estáticos
│   └── package.json
├── docs/                  # Documentación
└── README.md
```

## 🔧 Configuración Adicional

### Configurar PayPal Webhook (Opcional)

Si deseas usar webhooks de PayPal en lugar de verificación manual:

1. Obtén la URL de tu API Gateway: `https://tu-api.execute-api.us-east-1.amazonaws.com/dev/payments/webhook`
2. Ve a [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
3. Crea un webhook con los eventos:
   - `CHECKOUT.ORDER.APPROVED`
   - `PAYMENT.CAPTURE.COMPLETED`

### Configurar AWS SES para Emails

1. Verifica el dominio o email en AWS SES
2. Solicita salida de sandbox (para producción)
3. Configura `EMAIL_FROM` en las variables de entorno

## 📚 Documentación Adicional

- [Guía de Deployment](DEPLOY.md)
- [Flujo de Inscripción y Pagos](FLUJO_INSCRIPCION_PAGOS.md)
- [Guía de Pruebas](GUIA_PRUEBAS_COMPLETA.md)
- [Configuración de Credenciales](backend/CONFIGURAR_CREDENCIALES.md)

## 🐛 Solución de Problemas

### Error: "frameworkVersion" no coincide
- Verifica que la versión en `serverless.yml` coincida con tu versión instalada de Serverless Framework

### Error: "Too many open files" (Windows)
- Cierra otros programas que puedan estar usando muchos archivos
- Reintenta el deploy

### Error: "Internal server error" en frontend
- Verifica que el backend esté desplegado correctamente
- Revisa los logs de CloudWatch
- Verifica que las variables de entorno estén configuradas

## 👥 Contribución

Este es un proyecto privado. Para contribuir, contacta al equipo de desarrollo.

## 📄 Licencia

Propietario - Todos los derechos reservados

## 📧 Soporte

Para soporte técnico, contacta al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última actualización**: Noviembre 2025
