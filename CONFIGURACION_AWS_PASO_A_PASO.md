# 🚀 Configuración AWS para Proyecto Iger

## Paso 1: Instalar AWS CLI

Si aún no tienes AWS CLI instalado:

**Windows:**
1. Descarga el instalador desde: https://awscli.amazonaws.com/AWSCLIV2.msi
2. Ejecuta el instalador
3. Sigue las instrucciones

**O con Chocolatey (si lo tienes):**
```bash
choco install awscli
```

## Paso 2: Configurar AWS CLI

Ejecuta en la terminal:

```bash
aws configure
```

Te pedirá:
- **AWS Access Key ID**: Tu clave de acceso
- **AWS Secret Access Key**: Tu clave secreta
- **Default region**: `us-east-1` (o la que prefieras)
- **Default output format**: `json`

### 🆓 Obtener credenciales AWS (Free Tier)

1. Ve a https://console.aws.amazon.com/
2. Si no tienes cuenta, crea una (tarjeta de crédito necesaria, pero hay 12 meses de free tier)
3. Una vez dentro, ve a **IAM** → **Users**
4. Crea un nuevo usuario o usa el root
5. Ve a **Security credentials** → **Create access key**
6. Descarga las claves (se guardan una sola vez)

## Paso 3: Verificar configuración

```bash
aws sts get-caller-identity
```

Si ves tu información de AWS, ¡está bien configurado!

## Paso 4: Configurar Amplify

Una vez que tengas AWS CLI configurado, puedes usar Amplify:

```bash
# Desde la raíz del proyecto
amplify init

# Te pedirá:
# - Name: iger-management
# - Environment: dev
# - AWS Profile: default
```

## Paso 5: Desplegar Backend con Serverless Framework

```bash
# Instalar Serverless CLI
npm install -g serverless

# Desde backend/
cd backend
serverless deploy
```

Esto creará en AWS:
- ✅ Lambda functions
- ✅ API Gateway
- ✅ DynamoDB table
- ✅ S3 bucket
- ✅ CloudWatch logs

## Paso 6: Crear Usuario Pool en Cognito

**Opción A - Desde la Consola AWS:**

1. Ve a https://console.aws.amazon.com/cognito/
2. Create user pool
3. Nombre: `iger-user-pool`
4. Márcalo como público
5. Copia el **User Pool ID** y **App Client ID**

**Opción B - Con Amplify:**

```bash
amplify add auth
# Selecciona: Default configuration
# Selecciona: Email
# Selecciona: No, I am done
```

## Paso 7: Configurar Variables de Entorno

Crea `frontend/.env.local`:

```env
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXX
VITE_API_URL=https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/dev
```

Reemplaza `XXXXXX` con los valores reales de tu configuración.

## Paso 8: Configurar PayPal (Opcional)

1. Ve a https://developer.paypal.com/
2. Crea una cuenta de developer
3. Crea una aplicación
4. Copia **Client ID** y **Client Secret**
5. Actualiza en AWS Parameter Store:

```bash
aws ssm put-parameter \
  --name "/iger/paypal/client-id" \
  --value "TU_CLIENT_ID" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/iger/paypal/client-secret" \
  --value "TU_CLIENT_SECRET" \
  --type "SecureString"
```

## Paso 9: Configurar OpenAI (Opcional)

1. Ve a https://platform.openai.com/api-keys
2. Crea una nueva API key
3. Copia la key
4. Actualiza en AWS Parameter Store:

```bash
aws ssm put-parameter \
  --name "/iger/openai/api-key" \
  --value "sk-TU_API_KEY" \
  --type "SecureString"
```

## 🎯 Verificar que todo funciona

```bash
# Desde frontend/
cd frontend
npm run dev

# Deberías ver: http://localhost:3000
```

## 📊 Costos estimados (Free Tier)

**Lo que está incluido en Free Tier:**
- ✅ 1M requests/mes en Lambda (gratis por 12 meses)
- ✅ 25 GB almacenamiento DynamoDB
- ✅ 5 GB storage S3
- ✅ 750 horas/mes EC2
- ✅ 15 GB transfer out
- ✅ Cognito: 50,000 MAUs

**Después del Free Tier:**
- ~$5-10/mes para un proyecto de desarrollo pequeño

## ⚠️ Importante

1. **No pongas API keys en el código** - Usa AWS Parameter Store
2. **Habilita CloudWatch** para monitorear
3. **Configura alertas de costos** en AWS Budgets
4. **Revisa la factura** mensualmente

## 🆘 Problemas comunes

### "aws: command not found"
- Instala AWS CLI (ver Paso 1)
- Reinicia la terminal

### "amplify: command not found"
```bash
npm install -g @aws-amplify/cli
```

### "Region not configured"
```bash
aws configure
# Ingresa tu región (ej: us-east-1)
```

### Error de permisos
- Verifica que tu usuario IAM tenga permisos:
  - LambdaFullAccess
  - DynamoDBFullAccess
  - APIGatewayAdministrator
  - S3FullAccess
  - CognitoFullAccess

## 📞 ¿Necesitas ayuda?

Si algo no funciona:
1. Verifica los logs en CloudWatch
2. Revisa los permisos IAM
3. Consulta la documentación en `/docs`


