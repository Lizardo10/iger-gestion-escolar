# Fase 2 - Diseño Backend Profesores y Clases

## Objetivo
Definir el modelo de datos y endpoints necesarios para gestionar profesores y clases de nivel básico, cumpliendo con los requerimientos:
- Admin/Superadmin crean y administran profesores.
- Profesores se registran en Cognito y DynamoDB (fallback si Cognito falla).
- Un profesor pertenece a una sola organización.
- Clases obligatorias con información de grado/sección, ciclo y cupo.
- Las clases pueden crearlas maestros (asignación automática) o administradores (docente opcional).
- Solo un docente activo por clase, aunque se puede reasignar al finalizar el ciclo.
- Permitir asignaciones manuales de estudiantes (carga masiva en fase posterior).

---

## Esquema DynamoDB
Tabla existente `IgerData` (PK/SK + GSI1 y GSI2). Nuevos ítems:

### Profesor
```
PK: ORG#{orgId}
SK: TEACHER#{teacherId}
Type: Teacher
GSI1PK: TEACHEREMAIL#{lowercaseEmail}
GSI1SK: TEACHER#{teacherId}
GSI2PK: STATUS#{status}   // active | inactive
GSI2SK: TEACHER#{createdAt}
Data: {
  id, orgId,
  firstName, lastName,
  email, phone,
  specialization, subjects: string[],
  cognitoId?: string,
  status: 'active' | 'inactive',
  classes?: string[],          // IDs de clases asignadas
  createdAt, updatedAt
}
```

### Clase
```
PK: ORG#{orgId}
SK: CLASS#{classId}
Type: Class
GSI1PK: TEACHER#{teacherId | 'UNASSIGNED'}
GSI1SK: CLASS#{classId}
GSI2PK: LEVEL#{grade}           // ej LEVEL#1ro#A
GSI2SK: YEAR#{schoolYear}#CLASS#{classId}
Data: {
  id, orgId,
  name, grade, section,
  schoolYear, cycle (ej: 2025-A),
  capacity,
  teacherId?: string,
  status: 'active' | 'archived',
  createdBy: userId,
  createdAt, updatedAt
}
```

### Relación Clase-Estudiante
*(reutilizaremos existing pattern de enrollments, pero se anota para endpoints siguientes)*
```
PK: CLASS#{classId}
SK: STUDENT#{studentId}
Type: ClassStudent
GSI1PK: STUDENT#{studentId}
GSI1SK: CLASS#{classId}
Data: { orgId, assignedAt, assignedBy }
```

---

## Cognito
- Grupo `teacher` ya existente (verificar).
- Al crear profesor:
  1. Crear usuario Cognito (`ADMIN_CREATE_USER`) con grupo `teacher`.
  2. Guardar `cognitoId` y `status='active'`.
  3. Si Cognito falla, registrar igualmente en DynamoDB y marcar `status='pending_credentials'` para reprocesar.
- Al desactivar profesor: enviar `AdminDisableUser` y actualizar `status='inactive'`.

---

## Endpoints (API Gateway + Lambda)

### Profesores
| Método | Ruta | Roles | Descripción |
| ------ | ---- | ----- | ----------- |
| GET | `/teachers` | admin, superadmin | Lista paginada por organización. |
| GET | `/teachers/{teacherId}` | admin, superadmin, (teacher se ve a sí mismo) | Detalle del profesor. |
| POST | `/teachers` | admin, superadmin | Crea profesor (Cognito + DynamoDB). |
| PUT | `/teachers/{teacherId}` | admin, superadmin | Actualiza datos (contacto, especialidad, estado). |
| DELETE | `/teachers/{teacherId}` | admin, superadmin | Desactiva profesor (no borrado físico). |
| POST | `/teachers/{teacherId}/reset-password` | admin, superadmin | Reenvía invitación/reset Cognito. |

DTO creación:
```json
{
  "firstName": "...",
  "lastName": "...",
  "email": "...",
  "phone": "...",
  "specialization": "Matemáticas",
  "subjects": ["Matemáticas básica", "Geometría"],
  "orgId": "opcional, se infiere del admin"
}
```

### Clases
| Método | Ruta | Roles | Descripción |
| ------ | ---- | ----- | ----------- |
| GET | `/classes` | admin, superadmin, teacher | Lista de clases (filtro por docente y estado). |
| GET | `/classes/{classId}` | admin, superadmin, teacher asignado | Detalle de clase y alumnos. |
| POST | `/classes` | teacher, admin, superadmin | Crear clase (si maestro la crea, `teacherId` = usuario actual). |
| PUT | `/classes/{classId}` | teacher asignado, admin, superadmin | Editar datos (nombre, grado, ciclo, cupo, reasignar docente). |
| DELETE | `/classes/{classId}` | admin, superadmin | Archivar clase (`status='archived'`). |
| POST | `/classes/{classId}/assign` | teacher asignado, admin, superadmin | Añadir estudiante (body: `studentId`). |
| POST | `/classes/{classId}/remove` | teacher asignado, admin, superadmin | Quitar estudiante. |

### Reglas de autorización
- `requireRole` existente: ampliar con recursos `teachers` y `classes`.
- Validar `orgId` del usuario para que no interactúe con otra organización.
- Teacher solo puede consultar/editar clases donde `teacherId == user.id`.
- Admin puede crear clase sin `teacherId` y asignarlo luego con `PUT`.

---

## Flujos críticos

### Crear Profesor (Admin)
1. Validar email no exista (GSI `TEACHEREMAIL`).
2. Crear usuario Cognito (password temporal y envío de invitación).
3. Persistir en DynamoDB con `status='active'` y `cognitoId`.
4. Retornar `teacher` + credenciales temporales opcionales.

Si paso 2 falla → persistir con `status='pending_credentials'` y exponer endpoint/manual para reintentar.

### Crear Clase (Teacher)
1. Validar `teacherId` = usuario.
2. Validar combinación `grade+section+schoolYear` única dentro de la org.
3. Guardar clase con `status='active'` y `capacity`.

### Reasignar Docente
1. `PUT /classes/{id}` con `teacherId` nuevo.
2. Actualizar clase y notificar (futuro).
3. Mantener histórico? Guardar `previousTeachers` array si se requiere.

---

## Próximos pasos
1. Implementar handlers `classes.*` y asignación de alumnos (Fase 2.2).
2. Ajustar seeds/tests para nuevos modelos.
3. Conectar frontend módulos (Fases 2.3 y 2.4).


