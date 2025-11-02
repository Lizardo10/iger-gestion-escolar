# Configuración Completa de Cognito para Iger

Esta guía te ayudará a configurar todos los aspectos de Cognito necesarios para el sistema Iger.

## 📋 Guía Rápida: Dónde Está Cada Configuración

**Estructura del menú en Cognito User Pool:**

```
Cognito → User Pools → us-east-1_gY5JpRMyV
│
├── Sign-in experience
│   ├── Policies (Password policy, Account recovery)
│   └── Multi-factor authentication (MFA)
│
├── Messaging
│   └── Email (Email provider)
│
├── App integration
│   └── App clients (Authentication flows, Token expiration)
│
├── Attributes (atributos personalizados)
│
└── Users (asignar roles a usuarios)
```

**Pasos esenciales en orden:**
1. ✅ **Atributos personalizados** (custom:role, custom:orgId)
2. ✅ **Password policy** y **Account recovery** (en Sign-in experience → Policies)
3. ✅ **Email provider** (en Messaging)
4. ✅ **MFA** (en Sign-in experience → Multi-factor authentication)
5. ✅ **App Client** (en App integration → App clients)

---

## 1. Configurar Atributos Personalizados

### Paso 1: Acceder al User Pool

1. Abre tu navegador y ve a [AWS Console](https://console.aws.amazon.com/)
2. Busca **Cognito** en la barra de búsqueda superior o ve a **Services** → **Security, Identity & Compliance** → **Cognito**
3. Click en **User Pools** (en el menú lateral izquierdo)
4. Busca y selecciona tu User Pool: `us-east-1_gY5JpRMyV`
5. En el menú lateral izquierdo dentro del User Pool, busca y click en **Attributes**

**Nota**: Si no ves "Attributes" en el menú, puede estar bajo **Sign-in experience** → **Attributes**. La interfaz puede variar según la versión.

### Paso 2: Agregar Atributos Personalizados

**En la página de Attributes:**
1. Scroll hacia abajo hasta encontrar la sección **Custom attributes**
2. Click en el botón **Add custom attribute** (o **Create custom attribute**)
3. Se abrirá un formulario para agregar cada atributo

**Agregar el primer atributo (`role`):**

1. En el formulario, completa:
   - **Name**: `role` (solo el nombre, sin "custom:")
   - **Type**: Selecciona **String**
   - **Min length**: `1`
   - **Max length**: `50`
   - **Mutable**: ✅ Marca **Yes** (para que pueda cambiar después)
2. Click en **Save changes** (o **Create attribute**)

**Agregar el segundo atributo (`orgId`):**

1. Click nuevamente en **Add custom attribute**
2. Completa el formulario:
   - **Name**: `orgId` (solo el nombre, sin "custom:")
   - **Type**: Selecciona **String**
   - **Min length**: `1`
   - **Max length**: `100`
   - **Mutable**: ✅ Marca **Yes**
3. Click en **Save changes**

**⚠️ Importante**: Cognito automáticamente añade el prefijo `custom:` a estos atributos. Por eso cuando los uses en el código, se llamarán `custom:role` y `custom:orgId`, pero al crearlos solo pones `role` y `orgId`.

### Paso 3: Verificar desde CLI

```bash
aws cognito-idp describe-user-pool \
  --user-pool-id us-east-1_gY5JpRMyV \
  --profile IgerApp \
  --query 'UserPool.SchemaAttributes[?Name==`custom:role` || Name==`custom:orgId`]'
```

## 2. Configurar Email y Recuperación de Contraseña

### Habilitar Verificación de Email

**Ubicación en la consola:**
1. Ve a **AWS Console** → **Cognito** → **User Pools**
2. Selecciona tu User Pool: `us-east-1_gY5JpRMyV`
3. En el menú lateral izquierdo, busca **Sign-in experience**
4. Dentro de **Sign-in experience**, ve a **Policies**
5. En la sección **Password policy**, configura:
   - ✅ **Minimum length**: 8 (o más)
   - ✅ **Require numbers**: ✅ Enabled
   - ✅ **Require symbols**: ✅ Enabled
   - ✅ **Require uppercase letters**: ✅ Enabled (recomendado)
   - ✅ **Require lowercase letters**: ✅ Enabled (recomendado)
6. En la sección **Account recovery**, habilita:
   - ✅ **Email** (para recuperación de contraseña)
   - Opcional: **Phone** (si quieres recuperación por SMS)

### Configurar Email Provider

**Ubicación en la consola:**
1. En el mismo User Pool (`us-east-1_gY5JpRMyV`)
2. En el menú lateral izquierdo, ve a **Messaging**
3. En la sección **Email**, verás dos opciones:

#### Opción 1: Cognito Default (Más fácil - Recomendado para empezar)
- ✅ Selecciona **Cognito default**
- Cognito enviará emails usando SES en modo "sandbox" (limitado)
- **Límites**: Solo puedes enviar a emails verificados en SES sandbox
- **Ventaja**: No requiere configuración adicional

#### Opción 2: AWS SES (Más control - Para producción)
- ✅ Selecciona **AWS SES**
- Necesitas:
  1. Verificar tu dominio o email en SES
  2. Salir del modo "sandbox" de SES (requiere solicitud a AWS)

**Pasos para configurar SES:**

```bash
# 1. Verificar dominio en SES (si tienes dominio)
aws ses verify-domain-identity \
  --domain example.com \
  --profile IgerApp

# 2. O verificar email individual (más fácil para pruebas)
aws ses verify-email-identity \
  --email-address noreply@example.com \
  --profile IgerApp

# 3. Verificar estado de verificación
aws ses get-identity-verification-attributes \
  --identities example.com \
  --profile IgerApp

# 4. Solicitar salir de sandbox (para producción)
# Ve a SES Console → Account dashboard → Request production access
```

**Luego en la consola:**
1. En **Messaging** → **Email**
2. Selecciona **AWS SES**
3. Elige tu **From email address** (debe estar verificado en SES)
4. Elige tu **From sender name** (opcional)
5. Guarda los cambios

## 3. Configurar MFA (Multi-Factor Authentication)

### Habilitar MFA en el User Pool

**Ubicación en la consola:**
1. Ve a **AWS Console** → **Cognito** → **User Pools**
2. Selecciona tu User Pool: `us-east-1_gY5JpRMyV`
3. En el menú lateral izquierdo, ve a **Sign-in experience**
4. Dentro de **Sign-in experience**, busca **Multi-factor authentication**
5. Click en **Edit**
6. En **MFA enforcement**, selecciona:
   - ✅ **Optional** (el usuario puede habilitarlo) - **RECOMENDADO para desarrollo**
   - ⚠️ **Required** (obligatorio para todos) - Requiere que TODOS los usuarios configuren MFA antes de poder iniciar sesión
   
   **⚠️ IMPORTANTE**: Si seleccionas "Required", los usuarios nuevos NO podrán iniciar sesión hasta que configuren MFA primero. Esto puede causar problemas en desarrollo. Para producción, considera "Optional" y luego puedes hacer MFA requerido para roles específicos.
7. En **MFA methods**, habilita:
   - ✅ **Software token MFA (TOTP)** - REQUERIDO para nuestro sistema
   - Opcional: **SMS MFA** - Requiere configuración de SNS (más complejo)
8. Click en **Save changes**

**Nota**: Para usar TOTP, los usuarios necesitarán una app como:
- Google Authenticator
- Authy
- Microsoft Authenticator

### Configurar MFA para App Client

**Ubicación en la consola:**
1. En el mismo User Pool
2. En el menú lateral izquierdo, ve a **App integration**
3. Dentro de **App integration**, busca **App clients**
4. Selecciona `iger-backend-client` (ID: `55hal9q6ogn0orhutff3tbohsv`)
5. Si no existe, click en **Create app client**
6. Click en **Edit** o en el nombre del app client
7. En **Authentication flows**, asegúrate de tener habilitado:
   - ✅ **ALLOW_USER_PASSWORD_AUTH** - REQUERIDO
   - ✅ **ALLOW_REFRESH_TOKEN_AUTH** - REQUERIDO
   - ✅ **ALLOW_USER_SRP_AUTH** - Recomendado (más seguro que password auth)
8. Scroll hacia abajo a **Advanced settings**
9. En **Token expiration**, configura:
   - **Access token**: 1 hora (3600 segundos) - Default suele estar bien
   - **ID token**: 1 hora (3600 segundos) - Default suele estar bien
   - **Refresh token**: 30 días (2592000 segundos) - Default suele estar bien
10. Click en **Save changes**

**Nota**: Si no ves estas opciones, asegúrate de que estás editando el App Client correcto.

## 4. Roles y Permisos

### Roles Disponibles

- **superadmin**: Acceso total, puede crear usuarios
- **admin**: Acceso administrativo, puede crear usuarios
- **teacher**: Puede crear tareas, ver estudiantes
- **student**: Puede ver tareas, subir tareas

### Asignar Rol a Usuario

**Los roles se asignan automáticamente cuando:**
1. **Admin crea usuario**: Se asigna el rol especificado en el request
2. **Auto-registro**: Por defecto es `student` (puedes cambiar esto en el código)

**Para asignar/cambiar rol desde la consola:**
1. Ve a **AWS Console** → **Cognito** → **User Pools**
2. Selecciona tu User Pool: `us-east-1_gY5JpRMyV`
3. En el menú lateral, ve a **Users**
4. Busca el usuario por email
5. Click en el email del usuario
6. Click en **Edit** (arriba a la derecha)
7. En **Attributes**, busca `custom:role`
8. Si no aparece, click en **Add custom attribute**
9. Asigna el valor: `superadmin`, `admin`, `teacher`, o `student`
10. Click en **Save changes**

**Para asignar/cambiar rol desde CLI:**
```bash
# Cambiar rol de un usuario
aws cognito-idp admin-update-user-attributes \
  --user-pool-id us-east-1_gY5JpRMyV \
  --username usuario@example.com \
  --user-attributes Name=custom:role,Value=teacher \
  --profile IgerApp

# Asignar orgId también
aws cognito-idp admin-update-user-attributes \
  --user-pool-id us-east-1_gY5JpRMyV \
  --username usuario@example.com \
  --user-attributes \
    Name=custom:role,Value=teacher \
    Name=custom:orgId,Value=org-1 \
  --profile IgerApp

# Ver atributos actuales de un usuario
aws cognito-idp admin-get-user \
  --user-pool-id us-east-1_gY5JpRMyV \
  --username usuario@example.com \
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


