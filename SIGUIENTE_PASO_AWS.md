# 🎯 Siguiente Paso: Configurar AWS

## ✅ Lo que ya tienes configurado

- ✅ Amplify CLI instalado
- ✅ AWS CLI configurado
- ✅ Perfil IgerApp creado con credenciales válidas
- ✅ Region: us-east-1

## 🚀 Próximos Pasos

### 1. Configurar Amplify en tu proyecto

Desde la raíz del proyecto (no desde `frontend/`):

```bash
cd ..  # Ir a la raíz del proyecto
amplify init --profile IgerApp
```

**Configuración sugerida:**
- **Enter a name for the project**: `iger-management`
- **Initialize the project with the above configuration?**: `Yes`
- **Enter a name for the environment**: `dev`
- **Choose your default editor**: `VS Code` (o el que uses)
- **Choose the type of app you are building**: `javascript`
- **What javascript framework are you using**: `react`
- **Source Directory Path**: `frontend/src`
- **Distribution Directory Path**: `frontend/dist`
- **Build Command**: `cd frontend && npm run build`
- **Start Command**: `cd frontend && npm run dev`
- **Do you want to use an AWS profile?**: `Yes`
- **Please choose the profile you want to use**: `IgerApp`

### 2. Agregar autenticación con Cognito

```bash
amplify add auth --profile IgerApp
```

**Configuración:**
- **Do you want to use the default authentication and security configuration?**: `Default configuration`
- **How do you want users to be able to sign in**: `Email`
- **Do you want to configure advanced settings?**: `No, I am done`

### 3. Agregar hosting (para desplegar frontend)

```bash
amplify add hosting --profile IgerApp
```

**Configuración:**
- **Select the plugin module to execute**: `Hosting with Amplify Console`
- **Choose a type**: `Manual deployment`

### 4. Publicar cambios

```bash
amplify push --profile IgerApp
```

Esto desplegará:
- ✅ Cognito User Pool
- ✅ Configuración de hosting

### 5. Configurar variables de entorno

Después de `amplify push`, copia los valores y actualiza `frontend/.env.local`:

```env
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXX
VITE_API_URL=http://localhost:3000/dev
```

### 6. Desplegar Backend (Lambda Functions)

```bash
cd backend
npm install serverless -g
serverless deploy --aws-profile IgerApp
```

Esto creará:
- ✅ Lambda functions
- ✅ API Gateway
- ✅ DynamoDB table
- ✅ S3 bucket

**Nota:** El comando te dará la URL de la API al finalizar. Copia esa URL y actualiza `VITE_API_URL` en `.env.local`

### 7. Actualizar código para usar valores reales

Una vez que tengas los IDs de Cognito y la URL de la API:

1. Actualiza `frontend/src/lib/cognito.ts` para quitar el código mock
2. Actualiza `frontend/src/lib/api.ts` con la URL real de la API

### 8. Desplegar Frontend

```bash
cd frontend
npm run build
amplify publish --profile IgerApp
```

Esto desplegará tu aplicación en AWS Amplify Hosting.

## 📊 Verificando que todo funciona

1. **Ver Cognito User Pool:**
   - Ve a https://console.aws.amazon.com/cognito/
   - Deberías ver tu pool `iger-management`

2. **Ver Lambda Functions:**
   - Ve a https://console.aws.amazon.com/lambda/
   - Deberías ver tus funciones

3. **Ver API Gateway:**
   - Ve a https://console.aws.amazon.com/apigateway/
   - Deberías ver tu API

4. **Ver DynamoDB:**
   - Ve a https://console.aws.amazon.com/dynamodb/
   - Deberías ver tu tabla `iger-table`

## 🆘 Si encuentras problemas

### Error de permisos
Si ves errores de permisos, necesitas darle más permisos a tu usuario IAM:

1. Ve a https://console.aws.amazon.com/iam/
2. Busca el usuario `igeruser`
3. Agrega las siguientes políticas:
   - AWSAmplifyFullAccess
   - IAMFullAccess (temporalmente para deployment)
   - CognitoPowerUser
   - LambdaFullAccess
   - DynamoDBFullAccess
   - APIGatewayAdministrator
   - S3FullAccess

### Error: "Region not configured"
```bash
export AWS_PROFILE=IgerApp
aws configure set region us-east-1 --profile IgerApp
```

### Reiniciar terminal
En Windows, a veces necesitas reiniciar Git Bash o la terminal para que los cambios tomen efecto.

## 🎉 ¡Listo!

Una vez completados estos pasos, tu aplicación estará desplegada en AWS y funcionando con:
- ✅ Autenticación real con Cognito
- ✅ Backend con Lambda + DynamoDB
- ✅ Frontend en AWS Amplify Hosting
- ✅ Todo integrado y funcionando

## 📝 Notas

- El primer deployment puede tardar 5-10 minutos
- Los deployments subsiguientes son más rápidos
- Todo está en la región `us-east-1`
- Todos los recursos usan el perfil `IgerApp`

