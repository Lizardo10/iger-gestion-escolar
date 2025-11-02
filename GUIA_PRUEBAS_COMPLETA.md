# 🧪 Guía Completa de Pruebas - Sistema Iger

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Pruebas de Autenticación](#pruebas-de-autenticación)
3. [Pruebas de Pagos](#pruebas-de-pagos)
4. [Pruebas de Estudiantes](#pruebas-de-estudiantes)
5. [Pruebas de Tareas](#pruebas-de-tareas)
6. [Pruebas de Eventos](#pruebas-de-eventos)
7. [Pruebas de Asistencia](#pruebas-de-asistencia)
8. [Datos de Prueba](#datos-de-prueba)

---

## Requisitos Previos

### 1. Acceso a la Aplicación

**URLs:**
- Frontend: `https://dev.d2umdnu9x2m9qg.amplifyapp.com`
- Backend API: `https://unfepih103.execute-api.us-east-1.amazonaws.com/dev`

### 2. Credenciales de Prueba

Necesitas crear usuarios en Cognito con diferentes roles:

**Roles disponibles:**
- `superadmin` - Acceso completo
- `admin` - Gestión completa (sin algunos permisos especiales)
- `teacher` - Gestión de clases, tareas, asistencia
- `student` - Vista de sus propios datos

**Crear usuarios de prueba:**
```bash
# Opción 1: Desde la consola AWS
# Ve a Cognito → User Pools → Tu Pool → Users → Create User

# Opción 2: Desde terminal (si tienes AWS CLI configurado)
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_gY5JpRMyV \
  --username admin@test.com \
  --user-attributes Name=email,Value=admin@test.com Name=custom:role,Value=admin \
  --temporary-password TempPass123! \
  --message-action SUPPRESS
```

---

## Pruebas de Autenticación

### ✅ Test 1: Login Exitoso

**Pasos:**
1. Ve a `/login`
2. Ingresa email válido
3. Ingresa contraseña válida
4. Click en "Iniciar Sesión"

**Resultado Esperado:**
- ✅ Redirige a `/dashboard`
- ✅ No muestra errores
- ✅ Sidebar muestra opciones según rol

### ✅ Test 2: Login Fallido

**Pasos:**
1. Ve a `/login`
2. Ingresa email inválido o contraseña incorrecta
3. Click en "Iniciar Sesión"

**Resultado Esperado:**
- ✅ Muestra mensaje de error
- ✅ NO redirige al dashboard
- ✅ Permanece en página de login

### ✅ Test 3: Sesión Persistente

**Pasos:**
1. Haz login exitoso
2. Cierra el navegador
3. Abre el navegador nuevamente
4. Ve a la URL de la app

**Resultado Esperado:**
- ✅ Debe mantener la sesión (si el token es válido)
- ✅ O redirigir a `/login` si el token expiró

### ✅ Test 4: Protección de Rutas

**Pasos:**
1. Sin estar logueado, intenta acceder a `/dashboard`
2. Intenta acceder a `/students`
3. Intenta acceder a `/payments`

**Resultado Esperado:**
- ✅ Todas deben redirigir a `/login`
- ✅ NO permite acceso sin autenticación

---

## Pruebas de Pagos 💳

### ✅ Test 1: Crear Factura (Solo Admin/Superadmin)

**Requisitos:**
- Usuario con rol `admin` o `superadmin`
- Estudiante creado previamente

**Pasos:**
1. Haz login como admin
2. Ve a `/payments`
3. Click en "Nueva Factura" (si existe el botón)
4. O usa la API directamente:

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/payments/invoices \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "org-1",
    "studentId": "student-123",
    "items": [
      {
        "description": "Mensualidad Enero 2025",
        "quantity": 1,
        "unitPrice": 500000,
        "total": 500000
      },
      {
        "description": "Materiales escolares",
        "quantity": 2,
        "unitPrice": 50000,
        "total": 100000
      }
    ],
    "dueDate": "2025-02-15"
  }'
```

**Resultado Esperado:**
- ✅ Factura creada exitosamente
- ✅ Status: `pending`
- ✅ ID de factura retornado
- ✅ Aparece en la lista de facturas

### ✅ Test 2: Listar Facturas

**Pasos:**
1. Haz login como admin
2. Ve a `/payments`
3. Revisa la lista de facturas

**O con API:**
```bash
curl -X GET "https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/payments/invoices?orgId=org-1" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**Resultado Esperado:**
- ✅ Lista todas las facturas
- ✅ Muestra: ID, estudiante, monto, estado, fecha vencimiento
- ✅ Filtros funcionan (si existen)

### ✅ Test 3: Ver Detalle de Factura

**Pasos:**
1. Haz login como admin
2. Ve a `/payments`
3. Click en una factura

**O con API:**
```bash
curl -X GET "https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/payments/invoices/FACTURA_ID?orgId=org-1" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**Resultado Esperado:**
- ✅ Muestra detalles completos de la factura
- ✅ Items desglosados
- ✅ Estado actual
- ✅ Fecha de vencimiento

### ✅ Test 4: Crear Orden de Pago PayPal

**Importante:** Actualmente retorna URL mock. En producción, conectaría con PayPal real.

**Pasos:**
1. Haz login (cualquier usuario autenticado)
2. Ve a `/payments`
3. Click en "Pagar" en una factura con estado `pending`

**O con API:**
```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/payments/create-order \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "org-1",
    "invoiceId": "FACTURA_ID_AQUI"
  }'
```

**Resultado Esperado:**
- ✅ Retorna `orderId` y `approvalUrl`
- ✅ Factura se actualiza con `paypalOrderId`
- ✅ URL de aprobación (actualmente mock: `https://api.sandbox.paypal.com/checkout/?token=mock-token-...`)

**Nota:** En producción con PayPal real:
- La URL abriría el checkout de PayPal
- Después del pago, PayPal enviaría un webhook
- El webhook actualizaría el estado de la factura a `paid`

### ✅ Test 5: Webhook de PayPal (Simulación)

**Para probar el webhook:**

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "PAYMENT.CAPTURE.COMPLETED",
    "resource": {
      "id": "PAYPAL-PAYMENT-123",
      "custom_id": "FACTURA_ID_AQUI",
      "invoice_id": "FACTURA_ID_AQUI"
    }
  }'
```

**Resultado Esperado:**
- ✅ Factura actualizada a status `paid`
- ✅ Campo `paidAt` establecido
- ✅ `paypalOrderId` guardado

### ✅ Test 6: Filtros y Búsqueda

**Pasos:**
1. Ve a `/payments`
2. Filtra por estado: `pending`, `paid`, `cancelled`
3. Filtra por estudiante (si existe)

**Resultado Esperado:**
- ✅ Filtros funcionan correctamente
- ✅ Lista se actualiza según filtros
- ✅ Paginación funciona (si hay muchas facturas)

---

## Pruebas de Estudiantes 👥

### ✅ Test 1: Listar Estudiantes

**Pasos:**
1. Haz login
2. Ve a `/students`
3. Revisa la lista

**Resultado Esperado:**
- ✅ Lista todos los estudiantes
- ✅ Muestra: nombre, grado, etc.

### ✅ Test 2: Crear Estudiante

**Pasos:**
1. Ve a `/students`
2. Click en "Nuevo Estudiante"
3. Llena el formulario
4. Guarda

**Datos de Prueba:**
```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "birthDate": "2010-05-15",
  "grade": "5° Primaria",
  "orgId": "org-1"
}
```

### ✅ Test 3: Editar Estudiante

**Pasos:**
1. Ve a `/students`
2. Click en un estudiante
3. Edita campos
4. Guarda

**Resultado Esperado:**
- ✅ Cambios guardados
- ✅ Datos actualizados en la lista

---

## Pruebas de Tareas 📝

### ✅ Test 1: Crear Tarea

**Pasos:**
1. Haz login como teacher/admin
2. Ve a `/tasks`
3. Click en "Nueva Tarea"
4. Llena el formulario

**Datos de Prueba:**
```json
{
  "classId": "class-1",
  "title": "Tarea de Matemáticas - Ecuaciones",
  "description": "Resolver las ecuaciones de la página 45",
  "dueDate": "2025-02-20",
  "maxScore": 100
}
```

### ✅ Test 2: Listar Tareas

**Pasos:**
1. Ve a `/tasks`
2. Revisa la lista

**Resultado Esperado:**
- ✅ Muestra tareas del usuario/clase
- ✅ Filtros funcionan

---

## Pruebas de Eventos 📅

### ✅ Test 1: Crear Evento

**Pasos:**
1. Haz login (no student)
2. Ve a `/events`
3. Click en "Nuevo Evento"
4. Llena el formulario

**Datos de Prueba:**
```json
{
  "title": "Reunión de Padres",
  "description": "Reunión trimestral",
  "startDate": "2025-02-15T10:00:00Z",
  "endDate": "2025-02-15T12:00:00Z",
  "type": "meeting",
  "location": "Aula Principal",
  "orgId": "org-1",
  "attendees": []
}
```

### ✅ Test 2: Ver Calendario

**Pasos:**
1. Ve a `/events`
2. Cambia a vista "Calendario"
3. Navega entre meses/semanas

**Resultado Esperado:**
- ✅ Calendario se muestra
- ✅ Eventos aparecen en fechas correctas
- ✅ Navegación funciona

---

## Pruebas de Asistencia ✅

### ✅ Test 1: Registrar Asistencia

**Requisitos:**
- Rol: `teacher`, `admin`, o `superadmin`
- Clase creada previamente

**Pasos:**
1. Haz login como teacher
2. Ve a `/attendance`
3. Selecciona clase y fecha
4. Marca asistencia de estudiantes
5. Guarda

**Datos de Prueba:**
```json
{
  "classId": "class-1",
  "date": "2025-01-20",
  "records": [
    {
      "studentId": "student-1",
      "status": "present"
    },
    {
      "studentId": "student-2",
      "status": "late"
    },
    {
      "studentId": "student-3",
      "status": "absent"
    }
  ]
}
```

### ✅ Test 2: Ver Reportes

**Pasos:**
1. Ve a `/attendance`
2. Genera reporte por clase
3. Revisa estadísticas

**Resultado Esperado:**
- ✅ Muestra porcentajes de asistencia
- ✅ Desglose por estudiante
- ✅ Estadísticas correctas

---

## Datos de Prueba

### Usuarios de Prueba Recomendados

```javascript
// Admin
{
  email: "admin@test.com",
  password: "Admin123!",
  role: "admin",
  firstName: "Admin",
  lastName: "Test"
}

// Teacher
{
  email: "teacher@test.com",
  password: "Teacher123!",
  role: "teacher",
  firstName: "Profesor",
  lastName: "Test"
}

// Student
{
  email: "student@test.com",
  password: "Student123!",
  role: "student",
  firstName: "Estudiante",
  lastName: "Test"
}
```

### IDs de Prueba

```javascript
{
  orgId: "org-1",
  classId: "class-1",
  studentId: "student-123"
}
```

---

## Herramientas de Prueba

### 1. Postman/Insomnia

Crea una colección con:
- Autenticación (login para obtener token)
- Endpoints de pagos
- Endpoints de estudiantes
- Etc.

### 2. DevTools del Navegador

- **Console**: Ver logs y errores
- **Network**: Ver requests/responses
- **Application → Local Storage**: Ver tokens guardados

### 3. AWS CloudWatch

Para ver logs del backend:
```bash
# Ver logs de Lambda
serverless logs -f paymentsCreateInvoice --tail
```

---

## Checklist de Pruebas Completas

### Autenticación
- [ ] Login exitoso
- [ ] Login fallido
- [ ] Sesión persistente
- [ ] Protección de rutas
- [ ] Logout

### Pagos
- [ ] Crear factura (admin)
- [ ] Listar facturas
- [ ] Ver detalle factura
- [ ] Crear orden PayPal
- [ ] Webhook PayPal (simulado)
- [ ] Filtros y búsqueda

### Estudiantes
- [ ] Listar estudiantes
- [ ] Crear estudiante
- [ ] Editar estudiante
- [ ] Eliminar estudiante

### Tareas
- [ ] Crear tarea
- [ ] Listar tareas
- [ ] Editar tarea
- [ ] Eliminar tarea

### Eventos
- [ ] Crear evento
- [ ] Listar eventos
- [ ] Ver calendario
- [ ] Editar evento
- [ ] Eliminar evento

### Asistencia
- [ ] Registrar asistencia
- [ ] Ver reportes
- [ ] Estadísticas por estudiante

---

## Notas Importantes

⚠️ **PayPal está en modo MOCK:**
- Las URLs de PayPal son simuladas
- En producción, necesitas configurar credenciales reales de PayPal
- El webhook también es simulado

⚠️ **Datos Mock:**
- El sistema ahora rechaza automáticamente tokens mock
- Usa solo credenciales reales de Cognito

⚠️ **Permisos:**
- Algunas funciones solo están disponibles para ciertos roles
- Revisa los permisos antes de probar cada función

---

## Solución de Problemas

### Error: "No tienes permisos"
- Verifica que tu usuario tenga el rol correcto
- Revisa `custom:role` en Cognito

### Error: "Token inválido"
- Haz logout y login nuevamente
- Verifica que el token no sea mock

### Error: "Factura no encontrada"
- Verifica que el `invoiceId` sea correcto
- Verifica que pertenezca a tu `orgId`

---

## Próximos Pasos

1. ✅ Probar todas las funcionalidades básicas
2. ✅ Configurar PayPal real (si se necesita)
3. ✅ Crear datos de prueba completos
4. ✅ Documentar casos de uso específicos

