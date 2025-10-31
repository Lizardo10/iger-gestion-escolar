# Configuración de Cognito para Auth

## Obtener COGNITO_CLIENT_ID

Para que la autenticación funcione, necesitas obtener el **App Client ID** de tu User Pool de Cognito.

### Opción 1: Desde AWS Console

1. Ve a **AWS Console** → **Cognito** → **User Pools**
2. Selecciona tu User Pool: `us-east-1_gY5JpRMyV`
3. En el menú lateral, click en **App integration** → **App clients**
4. Si ya existe un App Client, copia el **Client ID**
5. Si no existe, crea uno:
   - Click en **Create app client**
   - Nombre: `iger-backend-client`
   - **IMPORTANTE**: Habilita estas opciones:
     - ✅ Enable username-password (ALLOW_USER_PASSWORD_AUTH)
     - ✅ Enable refresh token auth (ALLOW_REFRESH_TOKEN_AUTH)
   - Click **Create app client**

### Opción 2: Desde AWS CLI

```bash
aws cognito-idp list-user-pool-clients \
  --user-pool-id us-east-1_gY5JpRMyV \
  --profile IgerApp
```

Esto mostrará todos los App Clients. Copia el `ClientId` del que quieras usar.

### Configurar como variable de entorno

**Para desarrollo local:**
```bash
export COGNITO_CLIENT_ID="tu-client-id-aqui"
```

**Para deployment:**
Agrega la variable antes de hacer deploy:
```bash
export COGNITO_CLIENT_ID="tu-client-id-aqui"
serverless deploy --aws-profile IgerApp
```

O puedes agregarla directamente en `serverless.yml` (menos seguro, pero funcional):

```yaml
environment:
  COGNITO_CLIENT_ID: tu-client-id-aqui
```

## Configuración del App Client

Para que el login con email/password funcione, el App Client debe tener habilitado:

- ✅ **ALLOW_USER_PASSWORD_AUTH** - Autenticación con usuario/password
- ✅ **ALLOW_REFRESH_TOKEN_AUTH** - Refrescar tokens

### Verificar configuración

```bash
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-east-1_gY5JpRMyV \
  --client-id tu-client-id \
  --profile IgerApp
```

Busca en la salida:
```json
{
  "ExplicitAuthFlows": [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
}
```

Si no están habilitados, puedes habilitarlos desde la consola o con AWS CLI.

## Flujo de Autenticación

1. **Register**: Usuario se registra → recibe email de confirmación
2. **Confirm** (futuro): Usuario confirma su email con código
3. **Login**: Usuario inicia sesión → recibe tokens (access, refresh, id)
4. **Refresh**: Usuario refresca su access token usando refresh token
5. **Logout**: Usuario cierra sesión → tokens invalidados

## Pruebas

### 1. Registrar usuario

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 2. Confirmar email (manual por ahora)

El usuario debe confirmar su email desde el enlace que recibe.

### 3. Login

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'
```

Respuesta esperada:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "idToken": "...",
  "expiresIn": 3600,
  "user": {
    "id": "...",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User"
  }
}
```

### 4. Refresh Token

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "tu-refresh-token"
  }'
```

### 5. Logout

```bash
curl -X POST https://unfepih103.execute-api.us-east-1.amazonaws.com/dev/auth/logout \
  -H "Authorization: Bearer tu-access-token"
```

## Troubleshooting

### Error: "CLIENT_ID no configurado"

Solución: Obtén el CLIENT_ID y configúralo como variable de entorno antes del deploy.

### Error: "NotAuthorizedException" al hacer login

Posibles causas:
1. El usuario no ha confirmado su email
2. Las credenciales son incorrectas
3. El App Client no tiene habilitado ALLOW_USER_PASSWORD_AUTH

### Error: "InvalidParameterException" en refresh

Posibles causas:
1. El refresh token expiró
2. El App Client no tiene habilitado ALLOW_REFRESH_TOKEN_AUTH
3. El refresh token fue invalidado (logout)

## Seguridad

⚠️ **IMPORTANTE**: No comites el `COGNITO_CLIENT_ID` al repositorio si es sensible. Usa variables de entorno o AWS Systems Manager Parameter Store.

Para producción, considera usar:
```yaml
environment:
  COGNITO_CLIENT_ID: ${ssm:/iger/cognito-client-id}
```

Y crear el parámetro en SSM:
```bash
aws ssm put-parameter \
  --name /iger/cognito-client-id \
  --value "tu-client-id" \
  --type SecureString \
  --profile IgerApp
```

