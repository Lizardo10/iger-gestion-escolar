# Configuración Completa de Cognito para Iger

Esta guía te ayudará a configurar todos los aspectos de Cognito necesarios para el sistema Iger.

## 1. Configurar Atributos Personalizados

### Paso 1: Acceder al User Pool

1. Ve a **AWS Console** → **Cognito** → **User Pools**
2. Selecciona tu User Pool: `us-east-1_gY5JpRMyV`
3. En el menú lateral, ve a **Attributes**

### Paso 2: Agregar Atributos Personalizados

Click en **Add custom attribute** para cada uno:

#### Atributo `role`
- **Name**: `role`
- **Type**: String
- **Min length**: 1
- **Max length**: 50
- **Mutable**: ✅ Yes (puede cambiar)

#### Atributo `orgId`
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

## 2. Configurar Email y Recuperación de Contraseña

### Habilitar Verificación de Email

1. Ve a **User Pool** → **Policies**
2. En **Password policy**, configura:
   - ✅ Require at least 8 characters
   - ✅ Require numbers
   - ✅ Require symbols
3. En **Account recovery**, habilita:
   - ✅ Email (para recuperación de contraseña)

### Configurar Email (Opcional - si quieres personalizar)

1. Ve a **User Pool** → **Messaging**
2. Configura el **Email** provider:
   - Opción 1: **Cognito default** (usa SES con límites)
   - Opción 2: **AWS SES** (más control, requiere verificar dominio)

Para usar SES:
```bash
# Verificar dominio en SES
aws ses verify-domain-identity --domain example.com --profile IgerApp
```

## 3. Configurar MFA (Multi-Factor Authentication)

### Habilitar MFA en el User Pool

1. Ve a **User Pool** → **Sign-in experience** → **Multi-factor authentication**
2. Selecciona:
   - ✅ **Optional** (el usuario puede habilitarlo)
   - O **Required** (obligatorio para todos)
3. En **MFA methods**, habilita:
   - ✅ **TOTP** (Time-based One-Time Password)
   - ✅ **SMS** (opcional)

### Configurar MFA para App Client

1. Ve a **User Pool** → **App integration** → **App clients**
2. Selecciona `iger-backend-client` (ID: `55hal9q6ogn0orhutff3tbohsv`)
3. En **Authentication flows**, asegúrate de tener:
   - ✅ ALLOW_USER_PASSWORD_AUTH
   - ✅ ALLOW_REFRESH_TOKEN_AUTH
   - ✅ ALLOW_USER_SRP_AUTH (recomendado)
4. En **Advanced settings** → **Token expiration**:
   - Access token: 1 hora (3600 segundos)
   - ID token: 1 hora
   - Refresh token: 30 días (2592000 segundos)

## 4. Roles y Permisos

### Roles Disponibles

- **superadmin**: Acceso total, puede crear usuarios
- **admin**: Acceso administrativo, puede crear usuarios
- **teacher**: Puede crear tareas, ver estudiantes
- **student**: Puede ver tareas, subir tareas

### Asignar Rol a Usuario

Los roles se asignan automáticamente cuando:
1. **Admin crea usuario**: Se asigna el rol especificado
2. **Auto-registro**: Por defecto es `student`

Para cambiar el rol de un usuario existente:
```bash
aws cognito-idp admin-update-user-attributes \
  --user-pool-id us-east-1_gY5JpRMyV \
  --username usuario@example.com \
  --user-attributes Name=custom:role,Value=teacher \
  --profile IgerApp
```

## 5. Flujos de Autenticación Completos

### Flujo 1: Registro de Usuario (Auto-registro)

```bash
# 1. Usuario se registra
POST /auth/register
{
  "email": "student@example.com",
  "password": "Password123!",
  "firstName": "Juan",
  "lastName": "Pérez"
}

# 2. Usuario recibe código por email
# 3. Usuario confirma email
POST /auth/confirm-email
{
  "email": "student@example.com",
  "confirmationCode": "123456"
}

# 4. Usuario puede iniciar sesión
POST /auth/login
{
  "email": "student@example.com",
  "password": "Password123!"
}
```

### Flujo 2: Admin Crea Usuario

```bash
# 1. Admin crea usuario con contraseña temporal
POST /auth/admin/create-user
Authorization: Bearer <admin-token>
{
  "email": "teacher@example.com",
  "firstName": "María",
  "lastName": "González",
  "role": "teacher",
  "orgId": "org-1"
}

# Respuesta incluye contraseña temporal
{
  "temporaryPassword": "Temp123!@#",
  "email": "teacher@example.com"
}

# 2. Admin comparte contraseña con el profesor
# 3. Profesor inicia sesión con contraseña temporal
POST /auth/login
{
  "email": "teacher@example.com",
  "password": "Temp123!@#"
}

# 4. Profesor cambia su contraseña (opcional pero recomendado)
POST /auth/change-password
Authorization: Bearer <teacher-token>
{
  "oldPassword": "Temp123!@#",
  "newPassword": "MiPasswordSegura123!"
}
```

### Flujo 3: Recuperación de Contraseña

```bash
# 1. Usuario solicita recuperación
POST /auth/forgot-password
{
  "email": "user@example.com"
}

# 2. Usuario recibe código por email
# 3. Usuario confirma con código y nueva contraseña
POST /auth/confirm-forgot-password
{
  "email": "user@example.com",
  "confirmationCode": "123456",
  "newPassword": "NuevaPassword123!"
}
```

### Flujo 4: Configuración de MFA

```bash
# 1. Usuario inicia sesión
POST /auth/login
{
  "email": "user@example.com",
  "password": "Password123!"
}

# 2. Usuario configura MFA
POST /auth/mfa/setup
Authorization: Bearer <access-token>

# Respuesta incluye código secreto QR
{
  "secretCode": "JBSWY3DPEHPK3PXP",
  "session": "session-token"
}

# 3. Usuario escanea QR con app (Google Authenticator, Authy, etc.)
# 4. Usuario verifica con código de 6 dígitos
POST /auth/mfa/verify
Authorization: Bearer <access-token>
{
  "userCode": "123456",
  "friendlyDeviceName": "Mi Teléfono"
}

# 5. Usuario habilita MFA
POST /auth/mfa/enable
Authorization: Bearer <access-token>
```

### Flujo 5: Login con MFA

```bash
# 1. Usuario inicia sesión
POST /auth/login
{
  "email": "user@example.com",
  "password": "Password123!"
}

# Si MFA está habilitado, la respuesta incluye:
{
  "session": "mfa-session-token",
  "challengeName": "SOFTWARE_TOKEN_MFA",
  "message": "MFA requerido"
}

# 2. Usuario responde con código MFA
POST /auth/mfa/respond
{
  "session": "mfa-session-token",
  "userCode": "123456"
}

# 3. Usuario recibe tokens completos
{
  "accessToken": "...",
  "refreshToken": "...",
  "idToken": "..."
}
```

## 6. Permisos IAM Necesarios

Ya están configurados en `serverless.yml`, pero aquí está la lista:

```yaml
cognito-idp:
  - AdminCreateUser
  - AdminGetUser
  - AdminUpdateUserAttributes
  - AdminDeleteUser
  - AdminSetUserPassword
  - AdminInitiateAuth
  - AdminRespondToAuthChallenge
  - ListUsers
  - DescribeUserPool
  - DescribeUserPoolClient
```

## 7. Testing

### Pruebas Básicas

```bash
# 1. Crear usuario como admin
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/admin/create-user \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "student"
  }'

# 2. Login
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TempPass123!"
  }'

# 3. Cambiar contraseña
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/change-password \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "TempPass123!",
    "newPassword": "NewPass123!"
  }'
```

## 8. Troubleshooting

### Error: "custom:role attribute does not exist"
**Solución**: Agrega el atributo personalizado `role` en Cognito User Pool.

### Error: "MFA not enabled"
**Solución**: Habilita MFA (TOTP) en el User Pool → Sign-in experience → Multi-factor authentication.

### Error: "Email not verified"
**Solución**: 
- Si es auto-registro, el usuario debe confirmar email
- Si es admin-created, el email ya viene verificado

### Error: "Invalid password"
**Solución**: La contraseña debe cumplir:
- Mínimo 8 caracteres
- Al menos un número
- Al menos un símbolo

## 9. Seguridad Recomendada

1. ✅ **Habilita MFA** para usuarios administrativos
2. ✅ **Usa SES** para emails personalizados
3. ✅ **Configura rate limiting** en API Gateway (ya configurado)
4. ✅ **Monitorea** intentos de login fallidos
5. ✅ **Rotación de tokens** con refresh tokens
6. ✅ **Logs de CloudWatch** para auditoría

## 10. Próximos Pasos

Una vez configurado todo:
1. ✅ Prueba el registro de usuarios
2. ✅ Prueba la recuperación de contraseña
3. ✅ Configura MFA para un usuario de prueba
4. ✅ Verifica que los roles funcionen correctamente
5. ✅ Prueba los permisos en diferentes endpoints

