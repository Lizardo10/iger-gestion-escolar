# 📋 INFORME COMPLETO DE APIS - SISTEMA IGER

**Fecha de actualización:** Enero 2025  
**Versión del API:** 1.0.0  
**Base URL:** `https://unfepih103.execute-api.us-east-1.amazonaws.com/dev`

---

## 📊 RESUMEN EJECUTIVO

El sistema IGER cuenta con **55 endpoints REST** organizados en **8 módulos principales**:
- 🔐 Autenticación y Autorización (15 endpoints)
- 👨‍🎓 Gestión de Estudiantes (5 endpoints)
- 📝 Gestión de Tareas (6 endpoints)
- 📅 Gestión de Eventos (5 endpoints)
- 💳 Pagos y Facturación (5 endpoints)
- ✅ Asistencia (3 endpoints)
- 🔄 Sincronización (2 endpoints)
- 🤖 IA y Contenido (3 endpoints)

---

## 🔐 1. MÓDULO DE AUTENTICACIÓN Y AUTORIZACIÓN

**Base path:** `/auth`  
**Tecnología:** AWS Cognito  
**Autenticación:** Bearer Token (JWT)

### 1.1 Registro y Login

#### POST `/auth/register`
**Descripción:** Registro público de nuevos usuarios (principalmente estudiantes)  
**Autenticación:** ❌ No requiere  
**Permisos:** Público  
**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "Password123!",
  "firstName": "Juan",
  "lastName": "Pérez"
}
```
**Response:**
```json
{
  "message": "Usuario registrado exitosamente. Revisa tu email para confirmar tu cuenta.",
  "userId": "uuid-del-usuario"
}
```
**Flujo:**
1. Usuario se registra
2. Cognito envía código de confirmación por email
3. Usuario debe confirmar email con `/auth/confirm-email`
4. Luego puede hacer login

---

#### POST `/auth/login`
**Descripción:** Inicio de sesión con email y contraseña  
**Autenticación:** ❌ No requiere (es el login)  
**Permisos:** Público  
**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "Password123!"
}
```
**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "idToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "role": "student",
    "orgId": "org-123"
  }
}
```
**Casos especiales:**
- Si MFA está habilitado, retorna `challengeName: "SOFTWARE_TOKEN_MFA"` y `session`
- Si es primera vez con contraseña temporal, retorna `challengeName: "NEW_PASSWORD_REQUIRED"`

---

#### POST `/auth/refresh`
**Descripción:** Renovar tokens de acceso (usar refreshToken)  
**Autenticación:** ✅ Requiere refreshToken  
**Permisos:** Usuario autenticado  
**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```
**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "idToken": "eyJhbGc..."
}
```

---

#### POST `/auth/logout`
**Descripción:** Cerrar sesión (invalidar tokens)  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** Usuario autenticado  
**Request Body:**
```json
{
  "accessToken": "eyJhbGc..."
}
```
**Response:**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

---

### 1.2 Gestión de Usuarios por Administradores

#### POST `/auth/admin/create-user`
**Descripción:** Crear usuarios (solo admin/superadmin)  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** `users:create` (admin, superadmin)  
**Request Body:**
```json
{
  "email": "profesor@example.com",
  "firstName": "María",
  "lastName": "González",
  "role": "teacher",
  "orgId": "org-123"
}
```
**Response:**
```json
{
  "message": "Usuario creado exitosamente",
  "userId": "uuid",
  "temporaryPassword": "Temp123!@#"
}
```
**Flujo:**
1. Admin crea usuario con contraseña temporal
2. Admin comparte `temporaryPassword` con el usuario
3. Usuario hace login con contraseña temporal
4. Sistema pide cambiar contraseña
5. Usuario cambia contraseña con `/auth/change-password`

---

### 1.3 Cambio de Contraseña

#### POST `/auth/change-password`
**Descripción:** Cambiar contraseña (usuario autenticado)  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** Usuario autenticado  
**Request Body:**
```json
{
  "oldPassword": "Temp123!@#",
  "newPassword": "MiPasswordSegura123!"
}
```
**Response:**
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

---

#### POST `/auth/respond-new-password`
**Descripción:** Responder a desafío de nueva contraseña (primera vez)  
**Autenticación:** ❌ No requiere (usa session del desafío)  
**Permisos:** Público (con session válida)  
**Request Body:**
```json
{
  "email": "usuario@example.com",
  "session": "session-token-del-desafio",
  "newPassword": "MiPasswordSegura123!"
}
```
**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "idToken": "eyJhbGc...",
  "user": { ... }
}
```

---

### 1.4 Confirmación de Email

#### POST `/auth/confirm-email`
**Descripción:** Confirmar correo electrónico con código  
**Autenticación:** ❌ No requiere  
**Permisos:** Público  
**Request Body:**
```json
{
  "email": "usuario@example.com",
  "confirmationCode": "123456"
}
```
**Response:**
```json
{
  "message": "Correo electrónico confirmado exitosamente"
}
```
**Flujo:**
1. Usuario se registra
2. Recibe código de 6 dígitos por email
3. Ingresa código en este endpoint
4. Email queda confirmado

---

### 1.5 Recuperación de Contraseña

#### POST `/auth/forgot-password`
**Descripción:** Solicitar recuperación de contraseña  
**Autenticación:** ❌ No requiere  
**Permisos:** Público  
**Request Body:**
```json
{
  "email": "usuario@example.com"
}
```
**Response:**
```json
{
  "message": "Código de recuperación enviado a tu email"
}
```

---

#### POST `/auth/confirm-forgot-password`
**Descripción:** Confirmar nueva contraseña con código de recuperación  
**Autenticación:** ❌ No requiere  
**Permisos:** Público  
**Request Body:**
```json
{
  "email": "usuario@example.com",
  "confirmationCode": "123456",
  "newPassword": "NuevaPassword123!"
}
```
**Response:**
```json
{
  "message": "Contraseña restablecida exitosamente"
}
```

---

### 1.6 Multi-Factor Authentication (MFA)

#### POST `/auth/mfa/setup`
**Descripción:** Configurar MFA (obtener código QR)  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** Usuario autenticado  
**Request Body:**
```json
{
  "accessToken": "eyJhbGc..."
}
```
**Response:**
```json
{
  "secretCode": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "data:image/png;base64,...",
  "session": "session-token"
}
```
**Flujo:**
1. Usuario solicita setup MFA
2. Recibe código secreto y QR
3. Escanea QR con app (Google Authenticator, Authy)
4. Verifica con `/auth/mfa/verify`
5. Habilita con `/auth/mfa/enable`

---

#### POST `/auth/mfa/verify`
**Descripción:** Verificar configuración MFA con código de 6 dígitos  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** Usuario autenticado  
**Request Body:**
```json
{
  "userCode": "123456",
  "friendlyDeviceName": "Mi Teléfono"
}
```
**Response:**
```json
{
  "message": "MFA verificado correctamente"
}
```

---

#### POST `/auth/mfa/enable`
**Descripción:** Habilitar MFA después de verificar  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** Usuario autenticado  
**Request Body:**
```json
{
  "accessToken": "eyJhbGc..."
}
```
**Response:**
```json
{
  "message": "MFA habilitado exitosamente"
}
```

---

#### POST `/auth/mfa/disable`
**Descripción:** Deshabilitar MFA  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** Usuario autenticado  
**Request Body:**
```json
{
  "accessToken": "eyJhbGc..."
}
```
**Response:**
```json
{
  "message": "MFA deshabilitado exitosamente"
}
```

---

#### POST `/auth/mfa/respond`
**Descripción:** Responder a desafío MFA durante login  
**Autenticación:** ❌ No requiere (usa session del desafío)  
**Permisos:** Público (con session válida)  
**Request Body:**
```json
{
  "session": "session-token-del-desafio",
  "userCode": "123456"
}
```
**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "idToken": "eyJhbGc...",
  "user": { ... }
}
```

---

## 👨‍🎓 2. MÓDULO DE GESTIÓN DE ESTUDIANTES

**Base path:** `/students`  
**Tecnología:** AWS DynamoDB  
**Autenticación:** Bearer Token (JWT)  
**Permisos:** Solo admin y superadmin pueden crear/modificar/eliminar

### 2.1 Listar Estudiantes

#### GET `/students`
**Descripción:** Listar todos los estudiantes con paginación  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** Todos los roles autenticados  
**Query Parameters:**
- `orgId` (opcional): Filtrar por organización
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Items por página (default: 20, max: 100)
- `lastKey` (opcional): Token de paginación

**Response:**
```json
{
  "students": [
    {
      "id": "student-uuid",
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan.perez@example.com",
      "age": 15,
      "grade": "10º",
      "parentEmail": "padre@example.com",
      "orgId": "org-123",
      "createdAt": 1704067200000,
      "updatedAt": 1704067200000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "hasMore": true,
    "lastKey": "encoded-token"
  }
}
```

---

### 2.2 Obtener Estudiante Específico

#### GET `/students/{studentId}`
**Descripción:** Obtener información de un estudiante  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** Todos los roles autenticados  
**Response:**
```json
{
  "id": "student-uuid",
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan.perez@example.com",
  "age": 15,
  "grade": "10º",
  "parentEmail": "padre@example.com",
  "orgId": "org-123",
  "createdAt": 1704067200000,
  "updatedAt": 1704067200000
}
```

---

### 2.3 Crear Estudiante

#### POST `/students`
**Descripción:** Crear nuevo estudiante  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** `students:create` (admin, superadmin)  
**Request Body:**
```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan.perez@example.com",
  "age": 15,
  "grade": "10º",
  "parentEmail": "padre@example.com",
  "orgId": "org-123"
}
```
**Response:**
```json
{
  "id": "student-uuid",
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan.perez@example.com",
  "age": 15,
  "grade": "10º",
  "parentEmail": "padre@example.com",
  "orgId": "org-123",
  "createdAt": 1704067200000,
  "updatedAt": 1704067200000
}
```

---

### 2.4 Actualizar Estudiante

#### PUT `/students/{studentId}`
**Descripción:** Actualizar información de estudiante  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** `students:update` (admin, superadmin)  
**Request Body:**
```json
{
  "firstName": "Juan Carlos",
  "age": 16,
  "grade": "11º"
}
```
**Response:**
```json
{
  "id": "student-uuid",
  "firstName": "Juan Carlos",
  "lastName": "Pérez",
  "email": "juan.perez@example.com",
  "age": 16,
  "grade": "11º",
  "parentEmail": "padre@example.com",
  "orgId": "org-123",
  "createdAt": 1704067200000,
  "updatedAt": 1704070800000
}
```

---

### 2.5 Eliminar Estudiante

#### DELETE `/students/{studentId}`
**Descripción:** Eliminar estudiante  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** `students:delete` (admin, superadmin)  
**Response:**
```json
{
  "message": "Estudiante eliminado exitosamente"
}
```

---

## 📝 3. MÓDULO DE GESTIÓN DE TAREAS

**Base path:** `/tasks`  
**Tecnología:** AWS DynamoDB  
**Autenticación:** Bearer Token (JWT)  
**Permisos:** Teachers pueden crear/modificar, students solo pueden ver

### 3.1 Listar Tareas

#### GET `/tasks`
**Descripción:** Listar todas las tareas con paginación  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** Todos los roles autenticados  
**Query Parameters:**
- `classId` (opcional): Filtrar por clase
- `orgId` (opcional): Filtrar por organización
- `page` (opcional): Número de página
- `limit` (opcional): Items por página
- `lastKey` (opcional): Token de paginación

**Response:**
```json
{
  "tasks": [
    {
      "id": "task-uuid",
      "title": "Tarea de Matemáticas",
      "description": "Resolver ejercicios del capítulo 5",
      "dueDate": "2025-02-01T00:00:00Z",
      "classId": "class-123",
      "orgId": "org-123",
      "status": "active",
      "createdAt": 1704067200000,
      "updatedAt": 1704067200000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

---

### 3.2 Obtener Tarea Específica

#### GET `/classes/{classId}/tasks/{taskId}`
**Descripción:** Obtener información de una tarea  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** Todos los roles autenticados  
**Response:**
```json
{
  "id": "task-uuid",
  "title": "Tarea de Matemáticas",
  "description": "Resolver ejercicios del capítulo 5",
  "dueDate": "2025-02-01T00:00:00Z",
  "classId": "class-123",
  "orgId": "org-123",
  "status": "active",
  "createdAt": 1704067200000,
  "updatedAt": 1704067200000
}
```

---

### 3.3 Crear Tarea

#### POST `/tasks`
**Descripción:** Crear nueva tarea  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** `tasks:create` (admin, superadmin, teacher)  
**Request Body:**
```json
{
  "title": "Tarea de Matemáticas",
  "description": "Resolver ejercicios del capítulo 5",
  "dueDate": "2025-02-01T00:00:00Z",
  "classId": "class-123",
  "orgId": "org-123"
}
```
**Response:**
```json
{
  "id": "task-uuid",
  "title": "Tarea de Matemáticas",
  "description": "Resolver ejercicios del capítulo 5",
  "dueDate": "2025-02-01T00:00:00Z",
  "classId": "class-123",
  "orgId": "org-123",
  "status": "active",
  "createdAt": 1704067200000,
  "updatedAt": 1704067200000
}
```

---

### 3.4 Actualizar Tarea

#### PUT `/classes/{classId}/tasks/{taskId}`
**Descripción:** Actualizar información de tarea  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** `tasks:update` (admin, superadmin, teacher)  
**Request Body:**
```json
{
  "title": "Tarea de Matemáticas - Revisada",
  "description": "Resolver ejercicios del capítulo 5 y 6",
  "dueDate": "2025-02-05T00:00:00Z"
}
```
**Response:** (Objeto completo actualizado)

---

### 3.5 Eliminar Tarea

#### DELETE `/classes/{classId}/tasks/{taskId}`
**Descripción:** Eliminar tarea  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** `tasks:delete` (admin, superadmin, teacher)  
**Response:**
```json
{
  "message": "Tarea eliminada exitosamente"
}
```

---

### 3.6 Entregas de Tareas

#### POST `/tasks/{taskId}/submissions`
**Descripción:** Enviar/entregar tarea (para estudiantes)  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** `tasks/submissions:create` (student)  
**Request Body:**
```json
{
  "content": "Mis respuestas a la tarea...",
  "attachments": ["https://s3.amazonaws.com/bucket/file.pdf"]
}
```
**Response:**
```json
{
  "id": "submission-uuid",
  "taskId": "task-uuid",
  "studentId": "student-uuid",
  "content": "Mis respuestas a la tarea...",
  "attachments": ["https://s3.amazonaws.com/bucket/file.pdf"],
  "status": "submitted",
  "submittedAt": 1704067200000
}
```

---

#### GET `/tasks/{taskId}/submissions`
**Descripción:** Ver entregas de una tarea (para teachers)  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** `tasks/submissions:read` (admin, superadmin, teacher)  
**Response:**
```json
{
  "submissions": [
    {
      "id": "submission-uuid",
      "taskId": "task-uuid",
      "studentId": "student-uuid",
      "studentName": "Juan Pérez",
      "content": "Mis respuestas...",
      "attachments": [],
      "status": "submitted",
      "submittedAt": 1704067200000,
      "grade": null
    }
  ]
}
```

---

## 📅 4. MÓDULO DE GESTIÓN DE EVENTOS

**Base path:** `/events`  
**Tecnología:** AWS DynamoDB  
**Autenticación:** Bearer Token (JWT)  
**Permisos:** Teachers pueden crear/modificar, students solo pueden ver

### 4.1 Listar Eventos

#### GET `/events`
**Descripción:** Listar eventos del calendario con paginación  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** Todos los roles autenticados  
**Query Parameters:**
- `orgId` (requerido): Filtrar por organización
- `startDate` (opcional): Fecha inicio
- `endDate` (opcional): Fecha fin
- `type` (opcional): meeting, activity, holiday
- `page`, `limit`, `lastKey` (paginación)

**Response:**
```json
{
  "events": [
    {
      "id": "event-uuid",
      "title": "Día de la Independencia",
      "description": "Feriado nacional",
      "startDate": "2025-02-15T00:00:00Z",
      "endDate": "2025-02-15T23:59:59Z",
      "type": "holiday",
      "attendees": [],
      "location": "Escuela",
      "orgId": "org-123",
      "createdAt": 1704067200000,
      "updatedAt": 1704067200000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "hasMore": false
  }
}
```

---

### 4.2 Obtener Evento Específico

#### GET `/events/{eventId}`
**Descripción:** Obtener información de un evento  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** Todos los roles autenticados  
**Response:** (Objeto del evento)

---

### 4.3 Crear Evento

#### POST `/events`
**Descripción:** Crear nuevo evento  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** `events:create` (admin, superadmin, teacher)  
**Request Body:**
```json
{
  "title": "Día de la Independencia",
  "description": "Feriado nacional",
  "startDate": "2025-02-15T00:00:00Z",
  "endDate": "2025-02-15T23:59:59Z",
  "type": "holiday",
  "location": "Escuela",
  "orgId": "org-123",
  "attendees": []
}
```
**Validaciones:**
- `endDate` NO puede ser anterior a `startDate`
- `type` debe ser: "meeting", "activity", "holiday"
- `title` máximo 120 caracteres

**Response:** (Objeto del evento creado)

---

### 4.4 Actualizar Evento

#### PUT `/events/{eventId}`
**Descripción:** Actualizar información de evento  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** `events:update` (admin, superadmin, teacher)  
**Request Body:**
```json
{
  "title": "Día de la Independencia (Actualizado)",
  "location": "Escuela Principal"
}
```
**Response:** (Objeto completo actualizado)

---

### 4.5 Eliminar Evento

#### DELETE `/events/{eventId}`
**Descripción:** Eliminar evento  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** `events:delete` (admin, superadmin, teacher)  
**Response:**
```json
{
  "message": "Evento eliminado exitosamente"
}
```

---

## 💳 5. MÓDULO DE PAGOS Y FACTURACIÓN

**Base path:** `/payments`  
**Tecnología:** AWS DynamoDB + PayPal (mock)  
**Autenticación:** Bearer Token (JWT)  
**Permisos:** Solo admin y superadmin pueden ver facturas; todos pueden pagar

### 5.1 Listar Facturas

#### GET `/payments/invoices`
**Descripción:** Listar facturas con paginación y filtros  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** `invoices:read` (admin, superadmin)  
**Query Parameters:**
- `orgId` (requerido): Filtrar por organización
- `studentId` (opcional): Filtrar por estudiante
- `status` (opcional): pending, paid, cancelled
- `page`, `limit`, `lastKey` (paginación)

**Response:**
```json
{
  "invoices": [
    {
      "id": "invoice-uuid",
      "studentId": "student-uuid",
      "studentName": "Juan Pérez",
      "amount": 100.00,
      "currency": "USD",
      "description": "Matrícula Febrero 2025",
      "status": "pending",
      "dueDate": "2025-02-15T00:00:00Z",
      "paidAt": null,
      "paypalOrderId": null,
      "orgId": "org-123",
      "createdAt": 1704067200000,
      "updatedAt": 1704067200000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "hasMore": true
  },
  "total": 1500.00
}
```

---

### 5.2 Obtener Factura Específica

#### GET `/payments/invoices/{invoiceId}`
**Descripción:** Obtener información de una factura  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** `invoices:read` (admin, superadmin)  
**Response:** (Objeto de la factura)

---

### 5.3 Crear Factura

#### POST `/payments/invoices`
**Descripción:** Crear nueva factura  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** `invoices:create` (admin, superadmin)  
**Request Body:**
```json
{
  "studentId": "student-uuid",
  "amount": 100.00,
  "currency": "USD",
  "description": "Matrícula Febrero 2025",
  "dueDate": "2025-02-15T00:00:00Z",
  "orgId": "org-123"
}
```
**Response:** (Objeto de la factura creada)

---

### 5.4 Crear Orden de Pago PayPal

#### POST `/payments/create-order`
**Descripción:** Iniciar proceso de pago con PayPal  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** `payments:read` (cualquier usuario autenticado)  
**Request Body:**
```json
{
  "invoiceId": "invoice-uuid",
  "orgId": "org-123"
}
```
**Response:**
```json
{
  "orderId": "PAYPAL-ORDER-1704067200000",
  "approvalUrl": "https://api.sandbox.paypal.com/checkout/?token=mock-token-..."
}
```
**Flujo:**
1. Frontend recibe `approvalUrl`
2. Redirige al usuario a PayPal
3. Usuario completa pago en PayPal
4. PayPal redirige de vuelta a la app
5. PayPal envía webhook a `/payments/webhook`

---

### 5.5 Webhook PayPal

#### POST `/payments/webhook`
**Descripción:** Recibir notificaciones de PayPal  
**Autenticación:** ❌ No requiere (viene de PayPal)  
**Permisos:** Público  
**Request Body:**
```json
{
  "event_type": "PAYMENT.CAPTURE.COMPLETED",
  "resource": {
    "id": "PAYPAL-ORDER-123",
    "custom_id": "invoice-uuid",
    "amount": {
      "total": "100.00",
      "currency": "USD"
    }
  }
}
```
**Response:**
```json
{
  "message": "Webhook procesado exitosamente",
  "invoiceId": "invoice-uuid",
  "status": "paid"
}
```
**Nota:** En producción, validar firma del webhook para seguridad.

---

## ✅ 6. MÓDULO DE ASISTENCIA

**Base path:** `/attendance`  
**Tecnología:** AWS DynamoDB  
**Autenticación:** Bearer Token (JWT)  
**Permisos:** Teachers pueden registrar y ver reportes

### 6.1 Registrar Asistencia

#### POST `/attendance`
**Descripción:** Registrar asistencia de estudiantes  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** `attendance:create` (admin, superadmin, teacher)  
**Request Body:**
```json
{
  "date": "2025-02-01",
  "classId": "class-123",
  "records": [
    {
      "studentId": "student-uuid",
      "status": "present"
    },
    {
      "studentId": "student-uuid-2",
      "status": "absent"
    }
  ],
  "orgId": "org-123"
}
```
**Tipos de estado:** `present`, `absent`, `late`, `excused`

**Response:**
```json
{
  "message": "Asistencia registrada exitosamente",
  "recordsCount": 2
}
```

---

### 6.2 Obtener Asistencia

#### GET `/attendance`
**Descripción:** Consultar registros de asistencia  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** `attendance:read` (admin, superadmin, teacher)  
**Query Parameters:**
- `orgId` (requerido): Filtrar por organización
- `classId` (opcional): Filtrar por clase
- `startDate` (opcional): Fecha inicio
- `endDate` (opcional): Fecha fin
- `studentId` (opcional): Filtrar por estudiante

**Response:**
```json
{
  "attendance": [
    {
      "id": "attendance-uuid",
      "date": "2025-02-01",
      "classId": "class-123",
      "studentId": "student-uuid",
      "studentName": "Juan Pérez",
      "status": "present",
      "orgId": "org-123"
    }
  ]
}
```

---

### 6.3 Reportes de Asistencia

#### GET `/attendance/reports`
**Descripción:** Generar reportes estadísticos de asistencia  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** `attendance:read` (admin, superadmin, teacher)  
**Query Parameters:**
- `orgId` (requerido)
- `classId` (opcional)
- `startDate` (opcional)
- `endDate` (opcional)

**Response:**
```json
{
  "summary": {
    "totalDays": 20,
    "totalStudents": 25,
    "overallAttendanceRate": 0.92
  },
  "byStudent": [
    {
      "studentId": "student-uuid",
      "studentName": "Juan Pérez",
      "present": 18,
      "absent": 2,
      "late": 0,
      "excused": 0,
      "attendanceRate": 0.90
    }
  ]
}
```

---

## 🔄 7. MÓDULO DE SINCRONIZACIÓN OFFLINE

**Base path:** `/sync`  
**Tecnología:** AWS DynamoDB  
**Autenticación:** Bearer Token (JWT)  
**Descripción:** Sincronizar datos cuando el dispositivo vuelve a conectarse

### 7.1 Sincronizar Descarga

#### POST `/sync/pull`
**Descripción:** Descargar cambios pendientes desde el servidor  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** Usuario autenticado  
**Request Body:**
```json
{
  "orgId": "org-123",
  "lastSyncTimestamp": 1704067200000
}
```
**Response:**
```json
{
  "data": {
    "tasks": [...],
    "events": [...],
    "students": [...]
  },
  "lastSyncTimestamp": 1704070800000
}
```

---

### 7.2 Sincronizar Carga

#### POST `/sync/push`
**Descripción:** Enviar cambios locales al servidor  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** Usuario autenticado  
**Request Body:**
```json
{
  "orgId": "org-123",
  "changes": {
    "tasks": [...],
    "events": [...]
  }
}
```
**Response:**
```json
{
  "message": "Sincronización completada",
  "syncedItems": 5
}
```

---

## 🤖 8. MÓDULO DE IA Y CONTENIDO

**Base path:** `/ai`  
**Tecnología:** OpenAI API (mock actualmente)  
**Autenticación:** Bearer Token (JWT)  
**Descripción:** Funciones de IA para educación

### 8.1 Resumir Contenido

#### POST `/ai/summarize`
**Descripción:** Generar resumen automático de contenido  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** Usuario autenticado  
**Request Body:**
```json
{
  "content": "Texto largo a resumir...",
  "maxLength": 200
}
```
**Response:**
```json
{
  "summary": "Resumen del contenido...",
  "originalLength": 500,
  "summaryLength": 150
}
```

---

### 8.2 Tutor Virtual

#### POST `/ai/tutor`
**Descripción:** Obtener explicación de un tema  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** Usuario autenticado  
**Request Body:**
```json
{
  "question": "¿Qué es la fotosíntesis?",
  "context": "Biología, clase 8"
}
```
**Response:**
```json
{
  "answer": "La fotosíntesis es el proceso...",
  "relatedTopics": ["Clorofila", "Cloroplastos", "Oxígeno"]
}
```

---

### 8.3 Generar Contenido

#### POST `/ai/generate-content`
**Descripción:** Generar contenido educativo automático  
**Autenticación:** ✅ Requiere accessToken  
**Permisos:** Usuario autenticado  
**Request Body:**
```json
{
  "topic": "Aritmética básica",
  "level": "elementary",
  "format": "worksheet"
}
```
**Response:**
```json
{
  "content": "Contenido generado...",
  "format": "worksheet",
  "estimatedTime": "30 minutos"
}
```

---

## 🔒 SISTEMA DE ROLES Y PERMISOS

### Roles Disponibles

1. **superadmin**
   - Acceso total al sistema
   - Puede crear usuarios con cualquier rol
   - Control total sobre todos los recursos

2. **admin**
   - Acceso administrativo
   - Puede crear usuarios (admin, teacher, student)
   - Gestión completa de estudiantes, tareas, eventos
   - Acceso a facturación y pagos

3. **teacher**
   - Puede crear y gestionar tareas
   - Puede crear y gestionar eventos
   - Puede registrar y ver asistencia
   - Puede ver estudiantes
   - Puede ver entregas de tareas

4. **student**
   - Puede ver tareas
   - Puede enviar entregas de tareas
   - Puede ver eventos
   - NO puede crear ni modificar nada

### Matriz de Permisos

| Recurso | Acción | superadmin | admin | teacher | student |
|---------|--------|------------|-------|---------|---------|
| **users** | create/read/update/delete/list | ✅ | ✅ | ❌ | ❌ |
| **students** | create/update/delete | ✅ | ✅ | ❌ | ❌ |
| **students** | read/list | ✅ | ✅ | ✅ | ❌ |
| **tasks** | create/update/delete | ✅ | ✅ | ✅ | ❌ |
| **tasks** | read/list | ✅ | ✅ | ✅ | ✅ |
| **tasks/submissions** | create/update | ❌ | ❌ | ❌ | ✅ |
| **tasks/submissions** | read/list | ✅ | ✅ | ✅ | ❌ |
| **events** | create/update/delete | ✅ | ✅ | ✅ | ❌ |
| **events** | read/list | ✅ | ✅ | ✅ | ✅ |
| **invoices** | create/read/update/delete/list | ✅ | ✅ | ❌ | ❌ |
| **payments** | read/create-order | ✅ | ✅ | ❌ | ❌ |
| **attendance** | create/update | ✅ | ✅ | ✅ | ❌ |
| **attendance** | read/reports | ✅ | ✅ | ✅ | ❌ |

---

## 📊 ESTRUCTURA DE BASE DE DATOS

### DynamoDB - Single Table Design

**Tabla:** `IgerData`

#### Patrones de Claves

| PK | SK | Descripción |
|----|----|-------------|
| `ORG#{orgId}` | `STUDENT#{studentId}` | Información de estudiante |
| `ORG#{orgId}` | `TASK#{taskId}` | Tarea |
| `ORG#{orgId}` | `EVENT#{eventId}` | Evento |
| `ORG#{orgId}` | `INVOICE#{invoiceId}` | Factura |
| `ORG#{orgId}` | `ATTENDANCE#{date}#{studentId}` | Registro de asistencia |

#### Índices Globales Secundarios (GSI)

**GSI1:**
- GSI1PK: `CLASS#{classId}`
- GSI1SK: `TASK#{taskId}`
- **Uso:** Consultar tareas por clase

**GSI2:** (Para facturas)
- GSI2PK: `STUDENT#{studentId}`
- GSI2SK: `INVOICE#{invoiceId}`
- **Uso:** Consultar facturas por estudiante

---

## 🔐 AUTENTICACIÓN Y SEGURIDAD

### Flujo de Autenticación

1. **Login** → Usuario recibe `accessToken`, `refreshToken`, `idToken`
2. **Request** → Cliente envía `Authorization: Bearer {accessToken}`
3. **Validación** → Backend valida token con Cognito
4. **Permisos** → Verifica rol y permisos según recurso
5. **Response** → Retorna datos o error 401/403

### Tokens

- **Access Token:** Válido 1 hora. Usado para autenticar requests.
- **Refresh Token:** Válido 30 días. Usado para renovar access token.
- **ID Token:** Válido 1 hora. Contiene información del usuario.

### Headers de Seguridad

Todas las respuestas incluyen:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Content-Security-Policy: default-src 'self' * data: blob:; frame-ancestors 'none'
```

---

## 📈 PAGINACIÓN

Todos los endpoints de listado (`GET`) soportan paginación:

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Items por página (default: 20, max: 100)
- `lastKey` (opcional): Token de paginación para continuar

**Response:**
```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "hasMore": true,
    "lastKey": "base64-encoded-key"
  }
}
```

**Uso:**
1. Primera request: `GET /students?page=1&limit=20`
2. Si `hasMore: true`, obtener siguiente página con `lastKey`
3. Segunda request: `GET /students?page=2&limit=20&lastKey=...`

---

## ⚠️ CÓDIGOS DE ERROR

| Código | Significado |
|--------|-------------|
| **200** | Success |
| **201** | Created |
| **400** | Bad Request (validación fallida) |
| **401** | Unauthorized (no autenticado) |
| **403** | Forbidden (sin permisos) |
| **404** | Not Found |
| **500** | Internal Server Error |

---

## 🧪 EJEMPLOS DE USO

### Caso 1: Profesor crea tarea

```bash
# 1. Login
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "profesor@example.com",
    "password": "Password123!"
  }'

# Respuesta:
# { "accessToken": "eyJhbGc...", "user": {...} }

# 2. Crear tarea
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/tasks \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tarea de Matemáticas",
    "description": "Resolver ejercicios",
    "dueDate": "2025-02-01T00:00:00Z",
    "classId": "class-123",
    "orgId": "org-123"
  }'
```

### Caso 2: Estudiante entrega tarea

```bash
# 1. Login
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "estudiante@example.com",
    "password": "Password123!"
  }'

# 2. Enviar entrega
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/tasks/task-uuid/submissions \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Mis respuestas...",
    "attachments": []
  }'
```

### Caso 3: Admin crea factura y proceso de pago

```bash
# 1. Crear factura
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/payments/invoices \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-uuid",
    "amount": 100.00,
    "currency": "USD",
    "description": "Matrícula Febrero 2025",
    "dueDate": "2025-02-15T00:00:00Z",
    "orgId": "org-123"
  }'

# Respuesta incluye invoiceId

# 2. Crear orden PayPal
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/payments/create-order \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "invoice-uuid",
    "orgId": "org-123"
  }'

# Respuesta:
# { "orderId": "PAYPAL-...", "approvalUrl": "https://..." }
```

---

## 🚀 DESPLIEGUE Y INFRAESTRUCTURA

### Tecnologías Backend

- **Runtime:** Node.js 18.x
- **Framework:** Serverless Framework
- **Provider:** AWS Lambda + API Gateway
- **Base de datos:** DynamoDB (Single Table Design)
- **Autenticación:** AWS Cognito
- **Pagos:** PayPal API (sandbox)
- **IA:** OpenAI API (configurable)

### Recursos AWS

- **Lambda Functions:** 55 funciones (una por endpoint)
- **DynamoDB Table:** `IgerData` con 2 GSI
- **Cognito User Pool:** `us-east-1_gY5JpRMyV`
- **API Gateway:** REST API con CORS habilitado
- **CloudWatch:** Logs y alarmas
- **SNS:** Topic para alertas

### Monitoreo

- **API Gateway 5XX Errors:** Alarma si >= 1 error en 5 min
- **API Gateway Latency P95:** Alarma si > 1 segundo
- **Lambda Errors:** Alarma para funciones críticas
- **SNS:** Envía notificaciones por email

### Throttling

- **Rate Limit:** 100 requests/segundo
- **Burst Limit:** 200 requests
- **Quota:** 10,000 requests/día

---

## 📝 NOTAS IMPORTANTES

1. **Todos los endpoints requieren CORS** habilitado
2. **El orgId** se filtra automáticamente según el usuario autenticado
3. **Las validaciones** se hacen tanto en frontend como backend
4. **El MFA** es opcional por rol en Cognito
5. **Los webhooks de PayPal** deben validar firma en producción
6. **La sincronización offline** requiere almacenamiento local en el frontend
7. **Los reportes de asistencia** se calculan en tiempo real

---

## 🔗 URLS IMPORTANTES

- **Base API:** `https://unfepih103.execute-api.us-east-1.amazonaws.com/dev`
- **Frontend:** `https://iger.online` (en proceso de configuración)
- **Cognito User Pool:** `us-east-1_gY5JpRMyV`
- **Cognito App Client:** `55hal9q6ogn0orhutff3tbohsv`

---

## 📞 SOPORTE

Para más información, consultar:
- `GUIA_PRACTICA_AUTENTICACION.md` - Ejemplos de uso con curl
- `CONFIGURACION_COMPLETA_COGNITO.md` - Setup de Cognito
- `README.md` - Documentación general del backend

---

**Versión del documento:** 1.0  
**Última actualización:** Enero 2025


