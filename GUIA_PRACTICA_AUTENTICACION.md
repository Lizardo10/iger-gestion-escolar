# Guía Práctica de Autenticación - Iger

Esta guía te muestra cómo usar los endpoints de autenticación paso a paso con ejemplos reales.

## 🔧 Configuración Inicial

**URL Base del API:**
```
https://unfepih103.execute-api.us-east-1.amazonaws.com/dev
```

**Reemplaza `<admin-token>`, `<teacher-token>`, etc. con los tokens reales que recibas al hacer login.**

---

## 📋 Flujo 1: Registro de Usuario (Auto-registro)

Este flujo es para cuando un estudiante se registra por sí mismo.

### Paso 1: Registrar nuevo usuario

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@example.com",
    "password": "Password123!",
    "firstName": "Juan",
    "lastName": "Pérez"
  }'
```

**Respuesta esperada:**
```json
{
  "message": "Usuario registrado exitosamente. Revisa tu email para confirmar tu cuenta."
}
```

### Paso 2: Revisar email y obtener código

- El usuario recibirá un email de Cognito con un código de 6 dígitos
- Ejemplo: `123456`

### Paso 3: Confirmar email

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/confirm-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@example.com",
    "confirmationCode": "123456"
  }'
```

**Respuesta esperada:**
```json
{
  "message": "Correo electrónico confirmado exitosamente"
}
```

### Paso 4: Iniciar sesión

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@example.com",
    "password": "Password123!"
  }'
```

**Respuesta esperada:**
```json
{
  "accessToken": "eyJraWQiOiJcL0...",
  "refreshToken": "eyJjdHki...",
  "idToken": "eyJraWQiOiJ...",
  "expiresIn": 3600,
  "user": {
    "id": "us-east-1-xxx",
    "email": "juan.perez@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "role": "student",
    "orgId": null
  }
}
```

**⚠️ Guarda estos tokens para usar en otras peticiones.**

---

## 📋 Flujo 2: Admin Crea Usuario

Este flujo es para cuando un administrador crea usuarios (profesores o estudiantes).

### Paso 1: Admin crea usuario (requiere token de admin)

**Primero, el admin debe tener un token válido. Si no lo tienes, primero haz login como admin:**

```bash
# Login como admin (necesitas tener una cuenta admin creada)
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPass123!"
  }'
```

**Luego, con el token recibido, crea un usuario:**

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/admin/create-user \
  -H "Authorization: Bearer <ACCESS_TOKEN_AQUI>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria.gonzalez@example.com",
    "firstName": "María",
    "lastName": "González",
    "role": "teacher",
    "orgId": "org-1"
  }'
```

**Respuesta esperada:**
```json
{
  "email": "maria.gonzalez@example.com",
  "temporaryPassword": "Temp123!@#",
  "message": "Usuario creado exitosamente",
  "user": {
    "id": "us-east-1-xxx",
    "email": "maria.gonzalez@example.com",
    "role": "teacher",
    "orgId": "org-1"
  }
}
```

**⚠️ IMPORTANTE: Guarda la `temporaryPassword`. Debes compartirla con el profesor.**

### Paso 2: Profesor inicia sesión con contraseña temporal

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria.gonzalez@example.com",
    "password": "Temp123!@#"
  }'
```

**⚠️ Nota:** Si la contraseña temporal expiró, el admin debe crear un nuevo usuario o resetear la contraseña.

### Paso 3: Profesor cambia su contraseña (recomendado)

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/change-password \
  -H "Authorization: Bearer <TOKEN_DEL_PROFESOR>" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "Temp123!@#",
    "newPassword": "MiPasswordSegura123!"
  }'
```

**Respuesta esperada:**
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

---

## 📋 Flujo 3: Recuperación de Contraseña

Cuando un usuario olvida su contraseña.

### Paso 1: Solicitar recuperación

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com"
  }'
```

**Respuesta esperada:**
```json
{
  "message": "Si el email existe, se ha enviado un código de recuperación"
}
```

**⚠️ Por seguridad, siempre muestra este mensaje, aunque el email no exista.**

### Paso 2: Revisar email y obtener código

- El usuario recibirá un email con un código de 6 dígitos
- Ejemplo: `654321`

### Paso 3: Confirmar recuperación con código

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/confirm-forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "confirmationCode": "654321",
    "newPassword": "NuevaPassword123!"
  }'
```

**Respuesta esperada:**
```json
{
  "message": "Contraseña restablecida exitosamente"
}
```

**Ahora el usuario puede iniciar sesión con la nueva contraseña.**

---

## 📋 Flujo 4: Configuración de MFA (Multi-Factor Authentication)

Para aumentar la seguridad, un usuario puede configurar MFA.

### Paso 1: Usuario inicia sesión

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "Password123!"
  }'
```

**Guarda el `accessToken` de la respuesta.**

### Paso 2: Configurar MFA (generar código QR)

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/mfa/setup \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json"
```

**Respuesta esperada:**
```json
{
  "secretCode": "JBSWY3DPEHPK3PXP",
  "session": "session-token-abc123",
  "message": "Escanea el código QR con tu app de autenticación",
  "instructions": "Usa el código de 6 dígitos de tu app para verificar"
}
```

### Paso 3: Escanear QR con app de autenticación

1. Abre una app de autenticación en tu teléfono:
   - **Google Authenticator**
   - **Authy**
   - **Microsoft Authenticator**
2. Escanea el código QR (o ingresa manualmente el `secretCode`)
3. La app generará un código de 6 dígitos que cambia cada 30 segundos

### Paso 4: Verificar código de la app

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/mfa/verify \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "userCode": "123456",
    "friendlyDeviceName": "Mi Teléfono"
  }'
```

**⚠️ Usa el código actual de 6 dígitos que muestra tu app (ejemplo: `123456`)**

**Respuesta esperada:**
```json
{
  "message": "MFA configurado exitosamente"
}
```

### Paso 5: Habilitar MFA

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/mfa/enable \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json"
```

**Respuesta esperada:**
```json
{
  "message": "MFA habilitado exitosamente",
  "mfaEnabled": true
}
```

**✅ Ahora el usuario tiene MFA habilitado. Cada vez que haga login, necesitará el código de la app.**

---

## 📋 Flujo 5: Login con MFA Habilitado

Cuando un usuario tiene MFA habilitado, el login tiene 2 pasos.

### Paso 1: Primer intento de login

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "Password123!"
  }'
```

**Respuesta esperada (si MFA está habilitado):**
```json
{
  "session": "mfa-session-token-xyz789",
  "challengeName": "SOFTWARE_TOKEN_MFA",
  "message": "MFA requerido"
}
```

**⚠️ Nota: NO recibes tokens todavía. Necesitas responder al desafío MFA.**

### Paso 2: Abrir app de autenticación

- Abre Google Authenticator (o tu app)
- Obtén el código de 6 dígitos actual
- Ejemplo: `789012`

### Paso 3: Responder al desafío MFA

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/mfa/respond \
  -H "Content-Type: application/json" \
  -d '{
    "session": "mfa-session-token-xyz789",
    "userCode": "789012"
  }'
```

**⚠️ Usa el `session` de la respuesta anterior y el código actual de tu app.**

**Respuesta esperada:**
```json
{
  "accessToken": "eyJraWQiOiJcL0...",
  "refreshToken": "eyJjdHki...",
  "idToken": "eyJraWQiOiJ...",
  "expiresIn": 3600,
  "user": {
    "id": "us-east-1-xxx",
    "email": "usuario@example.com",
    "role": "teacher",
    "orgId": "org-1"
  }
}
```

**✅ Ahora tienes los tokens completos y puedes usar la aplicación.**

---

## 📋 Flujo Adicional: Refresh Token

Cuando el `accessToken` expira (después de 1 hora), usa el `refreshToken` para obtener uno nuevo.

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<REFRESH_TOKEN_QUE_GUARDASTE>"
  }'
```

**Respuesta esperada:**
```json
{
  "accessToken": "eyJraWQiOiJcL0...",
  "idToken": "eyJraWQiOiJ...",
  "expiresIn": 3600
}
```

---

## 📋 Flujo Adicional: Logout

Para cerrar sesión:

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json"
```

**Respuesta esperada:**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

---

## 🧪 Ejemplo Completo: Crear y Probar un Usuario Admin

Si necesitas crear un usuario admin desde cero (primera vez):

### Opción 1: Desde AWS Console (Cognito)

1. Ve a Cognito → User Pools → Tu User Pool → Users
2. Click en "Crear usuario"
3. Completa:
   - Email: `admin@example.com`
   - Contraseña temporal: `TempAdmin123!`
4. Después, edita el usuario y agrega atributo:
   - `custom:role` = `admin`
   - `custom:orgId` = `org-1`

### Opción 2: Desde CLI

```bash
# Crear usuario
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_gY5JpRMyV \
  --username admin@example.com \
  --user-attributes \
    Name=email,Value=admin@example.com \
    Name=custom:role,Value=admin \
    Name=custom:orgId,Value=org-1 \
  --temporary-password TempAdmin123! \
  --message-action SUPPRESS \
  --profile IgerApp

# Establecer contraseña permanente (opcional)
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_gY5JpRMyV \
  --username admin@example.com \
  --password AdminPass123! \
  --permanent \
  --profile IgerApp
```

### Probar Login del Admin

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPass123!"
  }'
```

---

## 🔍 Troubleshooting

### Error: "User not found"
- El usuario no existe en Cognito
- Verifica el email

### Error: "Incorrect username or password"
- La contraseña es incorrecta
- Si es contraseña temporal, puede haber expirado (7 días por defecto)

### Error: "Code mismatch" en confirm-email
- El código de confirmación es incorrecto
- El código expira después de cierto tiempo
- Solicita un nuevo código (registrándote de nuevo o usando forgot-password)

### Error: "Not authorized" en admin/create-user
- El token no es de un usuario admin o superadmin
- Verifica que el usuario tenga `role: "admin"` o `role: "superadmin"`

### Error: "Invalid password"
- La contraseña no cumple los requisitos:
  - Mínimo 8 caracteres
  - Al menos 1 número
  - Al menos 1 símbolo
  - Al menos 1 mayúscula
  - Al menos 1 minúscula

### Error: "MFA code invalid"
- El código de 6 dígitos no es correcto
- Asegúrate de usar el código actual (cambia cada 30 segundos)
- Verifica que el reloj de tu teléfono esté sincronizado

---

## 📝 Notas Importantes

1. **Tokens expiran**: El `accessToken` expira en 1 hora. Usa `refreshToken` para obtener uno nuevo.
2. **Contraseñas temporales**: Expiran en 7 días por defecto.
3. **MFA es opcional**: Solo los usuarios que lo configuren tendrán que usarlo.
4. **Roles**: Los roles se asignan cuando el admin crea el usuario, o pueden ser `student` por defecto en auto-registro.

---

## 🚀 Próximos Pasos

Una vez que hayas probado estos flujos:
1. Integra estos endpoints en tu frontend
2. Implementa el manejo de tokens (guardar en localStorage o sessionStorage)
3. Agrega interceptores para refrescar tokens automáticamente
4. Implementa el manejo de MFA en la UI

