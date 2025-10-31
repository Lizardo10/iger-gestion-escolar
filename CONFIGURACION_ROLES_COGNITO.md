# Configuración de Roles y Atributos Personalizados en Cognito

Para que el sistema de roles funcione correctamente, necesitas configurar atributos personalizados en el User Pool de Cognito.

## Configurar Atributos Personalizados

### Paso 1: Ir al User Pool

1. Ve a **AWS Console** → **Cognito** → **User Pools**
2. Selecciona tu User Pool: `us-east-1_gY5JpRMyV`
3. En el menú lateral, ve a **Attributes**

### Paso 2: Agregar Atributos Personalizados

Click en **Add custom attribute** y agrega:

#### 1. Atributo `role`
- **Name**: `role`
- **Type**: String
- **Min length**: 1
- **Max length**: 50
- **Mutable**: ✅ Yes (puede cambiar)

#### 2. Atributo `orgId`
- **Name**: `orgId`
- **Type**: String
- **Min length**: 1
- **Max length**: 100
- **Mutable**: ✅ Yes (puede cambiar)

### Paso 3: Verificar desde CLI

```bash
aws cognito-idp describe-user-pool \
  --user-pool-id us-east-1_gY5JpRMyV \
  --profile IgerApp \
  --query 'UserPool.SchemaAttributes[?Name==`custom:role` || Name==`custom:orgId`]'
```

## Roles Disponibles

- `superadmin`: Acceso total, puede crear usuarios
- `admin`: Acceso administrativo, puede crear usuarios
- `teacher`: Puede crear tareas, ver estudiantes
- `student`: Puede ver tareas, subir tareas

## Flujo de Creación de Usuarios

### 1. Admin/Superadmin crea usuario

```bash
POST /auth/admin/create-user
Authorization: Bearer <admin-token>

{
  "email": "teacher@example.com",
  "firstName": "Juan",
  "lastName": "Pérez",
  "role": "teacher",
  "orgId": "org-1"
}
```

**Respuesta:**
```json
{
  "userId": "...",
  "email": "teacher@example.com",
  "temporaryPassword": "TempPass123!",
  "role": "teacher",
  "note": "El usuario deberá cambiar su contraseña después del primer login."
}
```

### 2. Usuario hace login con contraseña temporal

```bash
POST /auth/login

{
  "email": "teacher@example.com",
  "password": "TempPass123!"
}
```

### 3. Usuario cambia su contraseña

```bash
POST /auth/change-password
Authorization: Bearer <user-token>

{
  "oldPassword": "TempPass123!",
  "newPassword": "MiNuevaPassword123!"
}
```

## Permisos por Rol

### Superadmin y Admin
- ✅ Crear usuarios
- ✅ Ver/crear/editar/eliminar estudiantes
- ✅ Ver/crear/editar/eliminar tareas
- ✅ Ver/crear/editar/eliminar eventos
- ✅ Ver facturas y pagos
- ✅ Gestionar asistencia

### Teacher
- ❌ Crear usuarios
- ✅ Ver estudiantes
- ✅ Crear/editar/eliminar tareas
- ✅ Crear/editar/eliminar eventos
- ❌ Ver facturas
- ✅ Registrar asistencia

### Student
- ❌ Crear usuarios
- ❌ Ver estudiantes (solo los propios o asignados)
- ✅ Ver tareas
- ✅ Subir tareas (submissions)
- ✅ Ver eventos
- ❌ Ver facturas
- ❌ Gestionar asistencia

## Notas Importantes

1. **Contraseñas Temporales**: Cuando un admin crea un usuario, se genera una contraseña temporal segura. El usuario debe cambiarla en su primer login.

2. **Atributos Personalizados**: Los atributos deben empezar con `custom:` en el código, pero en la consola de AWS solo se configura el nombre sin el prefijo.

3. **Email Verificado**: Los usuarios creados por admin tienen `email_verified: true` para que puedan iniciar sesión inmediatamente.

4. **Validación de Roles**: Cada endpoint verifica los permisos del usuario antes de permitir la operación.

