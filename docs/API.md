# API Specification - Iger

## Endpoints de Autenticación

### POST /auth/register

Registra un nuevo usuario en el sistema.

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "Password123!",
  "role": "admin",
  "firstName": "Juan",
  "lastName": "Pérez"
}
```

**Response:**
```json
{
  "userId": "user-123",
  "confirmationRequired": true,
  "message": "Usuario registrado correctamente"
}
```

### POST /auth/login

Inicia sesión de un usuario.

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh-token-here",
  "user": {
    "id": "user-123",
    "email": "usuario@ejemplo.com",
    "role": "admin",
    "firstName": "Juan",
    "lastName": "Pérez"
  }
}
```

### POST /auth/refresh

Renueva el token de acceso.

**Request Body:**
```json
{
  "refreshToken": "refresh-token-here"
}
```

**Response:**
```json
{
  "accessToken": "new-access-token"
}
```

## Endpoints de Estudiantes

### GET /students

Lista todos los estudiantes.

**Query Parameters:**
- `page` (number): Número de página
- `limit` (number): Elementos por página
- `grade` (string): Filtrar por grado
- `active` (boolean): Filtrar por estado activo

**Response:**
```json
{
  "students": [
    {
      "id": "student-123",
      "firstName": "María",
      "lastName": "González",
      "birthDate": "2010-05-15",
      "grade": "5to",
      "parentIds": ["parent-1", "parent-2"],
      "enrollmentDate": "2023-01-10",
      "active": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

### POST /students

Crea un nuevo estudiante.

**Request Body:**
```json
{
  "firstName": "María",
  "lastName": "González",
  "birthDate": "2010-05-15",
  "grade": "5to",
  "parentIds": ["parent-1", "parent-2"],
  "orgId": "org-123"
}
```

**Response:**
```json
{
  "id": "student-123",
  "firstName": "María",
  "lastName": "González",
  "birthDate": "2010-05-15",
  "grade": "5to",
  "parentIds": ["parent-1", "parent-2"],
  "orgId": "org-123",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### GET /students/{studentId}

Obtiene un estudiante específico.

**Response:**
```json
{
  "student": {
    "id": "student-123",
    "firstName": "María",
    "lastName": "González",
    "birthDate": "2010-05-15",
    "grade": "5to",
    "parentIds": ["parent-1", "parent-2"],
    "enrollments": [
      {
        "classId": "class-1",
        "className": "Matemáticas",
        "startDate": "2024-01-01"
      }
    ]
  }
}
```

## Endpoints de Tareas

### GET /tasks

Lista todas las tareas.

**Query Parameters:**
- `classId` (string): Filtrar por clase
- `studentId` (string): Filtrar por estudiante
- `status` (string): Filtrar por estado

**Response:**
```json
{
  "tasks": [
    {
      "id": "task-123",
      "classId": "class-1",
      "title": "Tarea de Matemáticas",
      "description": "Resolver problemas de álgebra",
      "dueDate": "2024-01-15",
      "attachments": ["file1.pdf", "file2.doc"],
      "maxScore": 100,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /tasks

Crea una nueva tarea.

**Request Body:**
```json
{
  "classId": "class-1",
  "title": "Tarea de Matemáticas",
  "description": "Resolver problemas de álgebra",
  "dueDate": "2024-01-15",
  "attachments": [],
  "maxScore": 100
}
```

### POST /tasks/{taskId}/submissions

Entrega una tarea (estudiante).

**Request Body:**
```json
{
  "studentId": "student-123",
  "content": "Respuesta a la tarea",
  "attachments": ["file.pdf"]
}
```

**Response:**
```json
{
  "submissionId": "sub-123",
  "status": "submitted",
  "submittedAt": "2024-01-10T00:00:00Z"
}
```

## Endpoints de Eventos

### GET /events

Lista todos los eventos.

**Query Parameters:**
- `from` (string): Fecha inicio (ISO 8601)
- `to` (string): Fecha fin (ISO 8601)
- `type` (string): Tipo de evento

**Response:**
```json
{
  "events": [
    {
      "id": "event-123",
      "title": "Reunión de Padres",
      "description": "Reunión general",
      "startDate": "2024-01-20T10:00:00Z",
      "endDate": "2024-01-20T12:00:00Z",
      "type": "parent_meeting",
      "attendees": ["parent-1", "parent-2"],
      "location": "Aula Principal"
    }
  ]
}
```

### POST /events

Crea un nuevo evento.

**Request Body:**
```json
{
  "title": "Reunión de Padres",
  "description": "Reunión general",
  "startDate": "2024-01-20T10:00:00Z",
  "endDate": "2024-01-20T12:00:00Z",
  "type": "parent_meeting",
  "attendees": ["parent-1", "parent-2"],
  "location": "Aula Principal",
  "orgId": "org-123"
}
```

## Endpoints de Pagos

### POST /payments/invoices

Crea una nueva factura.

**Request Body:**
```json
{
  "studentId": "student-123",
  "items": [
    {
      "description": "Mensualidad Enero",
      "quantity": 1,
      "unitPrice": 50000,
      "total": 50000
    }
  ],
  "dueDate": "2024-01-31"
}
```

**Response:**
```json
{
  "invoiceId": "invoice-123",
  "amount": 50000,
  "paymentUrl": "https://api.iger.com/payments/invoice-123"
}
```

### POST /payments/create-order

Crea una orden de pago en PayPal.

**Request Body:**
```json
{
  "invoiceId": "invoice-123"
}
```

**Response:**
```json
{
  "orderId": "PAYPAL-ORDER-123",
  "approvalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=..."
}
```

### POST /payments/webhook

Webhook para recibir actualizaciones de PayPal.

**Request Body:**
```json
{
  "event_type": "PAYMENT.CAPTURE.COMPLETED",
  "resource": {
    "id": "PAYPAL-PAYMENT-123",
    "invoice_id": "invoice-123"
  }
}
```

### GET /payments/invoices/{invoiceId}

Obtiene una factura específica.

**Response:**
```json
{
  "invoice": {
    "id": "invoice-123",
    "studentId": "student-123",
    "amount": 50000,
    "status": "paid",
    "paypalOrderId": "PAYPAL-ORDER-123",
    "paidAt": "2024-01-05T14:30:00Z"
  }
}
```

## Endpoints de Sincronización

### POST /sync/pull

Obtiene cambios desde el servidor.

**Request Body:**
```json
{
  "lastSyncTimestamp": 1641024000000,
  "entities": ["students", "events", "tasks"]
}
```

**Response:**
```json
{
  "changes": {
    "students": [...],
    "events": [...],
    "tasks": [...]
  },
  "serverTimestamp": 1641024001000
}
```

### POST /sync/push

Envía cambios desde el cliente.

**Request Body:**
```json
{
  "operations": [
    {
      "id": "op-123",
      "type": "CREATE",
      "entity": "task",
      "data": {...},
      "timestamp": 1641024000000
    }
  ]
}
```

**Response:**
```json
{
  "applied": ["op-123"],
  "conflicts": [],
  "serverTimestamp": 1641024001000
}
```

## Endpoints de IA

### POST /ai/summarize

Genera un resumen del contenido.

**Request Body:**
```json
{
  "taskId": "task-123",
  "content": "Texto largo a resumir..."
}
```

**Response:**
```json
{
  "summary": "Resumen del contenido generado por IA"
}
```

### POST /ai/tutor

Chat de tutoría con IA.

**Request Body:**
```json
{
  "studentId": "student-123",
  "question": "¿Cómo se resuelve una ecuación cuadrática?",
  "context": "Estamos estudiando álgebra"
}
```

**Response:**
```json
{
  "answer": "Una ecuación cuadrática...",
  "references": ["referencia-1", "referencia-2"]
}
```

## Códigos de Estado HTTP

- `200 OK` - Operación exitosa
- `201 Created` - Recurso creado exitosamente
- `400 Bad Request` - Solicitud inválida
- `401 Unauthorized` - No autorizado
- `403 Forbidden` - Prohibido
- `404 Not Found` - Recurso no encontrado
- `500 Internal Server Error` - Error del servidor

## Autenticación

Todos los endpoints (excepto `/auth/*`) requieren un token JWT en el header:

```
Authorization: Bearer <accessToken>
```

## Rate Limiting

- 100 requests por minuto por IP
- 1000 requests por hora por usuario autenticado

## Paginación

Los endpoints de listado soportan paginación:

- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 20, max: 100)



