# Guía de Configuración AWS - Iger

Esta guía te ayudará a configurar todos los servicios AWS necesarios para el proyecto Iger.

## Prerrequisitos

1. Cuenta AWS activa
2. AWS CLI instalado y configurado
3. Amplify CLI instalado
4. Serverless Framework instalado
5. Permisos de administrador o IAM con permisos necesarios

## Configuración Paso a Paso

### 1. Configurar AWS CLI

```bash
# Configurar credenciales
aws configure

# Configurar perfil específico (opcional)
aws configure --profile iger
export AWS_PROFILE=iger

# Verificar configuración
aws sts get-caller-identity
```

### 2. Instalar Herramientas

```bash
# Amplify CLI
npm install -g @aws-amplify/cli

# Serverless Framework
npm install -g serverless

# Verificar instalaciones
amplify --version
serverless --version
```

### 3. Amplify - Configuración Inicial

```bash
cd frontend

# Configurar Amplify
amplify configure
# Sigue el asistente y completa:
# - Selecciona región (us-east-1 recomendado)
# - Crea nuevo usuario IAM con políticas adecuadas
# - Configura editor (VSCode)

# Inicializar proyecto
amplify init
# Nombre: IgerFrontend
# Environment: dev
# Editor: VSCode
# App type: javascript
# Framework: react
# Source directory: src
# Distribution directory: dist
# Build command: npm run build
# Start command: npm run dev
```

### 4. Cognito - Configurar Autenticación

```bash
cd frontend

# Agregar autenticación
amplify add auth

# Selecciones recomendadas:
# - ¿Usar configuración por defecto? SÍ
# - ¿Cómo quieres que los usuarios inicien sesión? Email
# - ¿Configurar ajustes avanzados? SÍ
# - ¿Quieres habilitar MFA? OPCIONAL (recomendado para admins)
# - ¿Elegir contexto de usuario? SÍ
# - ¿Configurar grupos de usuarios? SÍ
#   Grupos: admin, teacher, student, parent
```

**Nota:** Después de esto, guardar el `User Pool ID` y `Client ID` que se muestran.

### 5. DynamoDB - Crear Tabla

```bash
# La tabla se crea automáticamente con serverless.yml, pero puedes verificar con:
cd backend
npm install
```

La tabla `IgerData` se creará automáticamente al desplegar el backend con:

```yaml
# Atributos principales
- PK (Partition Key)
- SK (Sort Key)
- GSI1PK, GSI1SK (Global Secondary Index 1)
- GSI2PK, GSI2SK (Global Secondary Index 2 - si se necesita)
```

### 6. S3 - Crear Bucket para Assets

```bash
# Crear bucket
aws s3 mb s3://iger-assets --region us-east-1

# Configurar política pública para lectura (opcional)
cat > bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::iger-assets/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket iger-assets \
  --policy file://bucket-policy.json

# Configurar CORS para subida de archivos
cat > cors-config.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket iger-assets \
  --cors-configuration file://cors-config.json

# Habilitar versionado (opcional)
aws s3api put-bucket-versioning \
  --bucket iger-assets \
  --versioning-configuration Status=Enabled
```

### 7. Configurar Secretos en Parameter Store

```bash
# OpenAI API Key
aws ssm put-parameter \
  --name "/iger/openai-key" \
  --value "sk-YOUR_KEY_HERE" \
  --type "SecureString" \
  --description "OpenAI API key for Iger" \
  --region us-east-1

# PayPal Client ID (Sandbox para pruebas)
aws ssm put-parameter \
  --name "/iger/paypal-client-id" \
  --value "YOUR_CLIENT_ID" \
  --type "SecureString" \
  --description "PayPal Client ID for Iger" \
  --region us-east-1

# PayPal Secret
aws ssm put-parameter \
  --name "/iger/paypal-secret" \
  --value "YOUR_SECRET" \
  --type "SecureString" \
  --description "PayPal Secret for Iger" \
  --region us-east-1

# Verificar parámetros
aws ssm get-parameters \
  --names "/iger/openai-key" "/iger/paypal-client-id" "/iger/paypal-secret" \
  --region us-east-1
```

**Nota:** Obtener estos valores de:
- OpenAI: https://platform.openai.com/api-keys
- PayPal: https://developer.paypal.com/dashboard/applications

### 8. Configurar Cognito en serverless.yml

```bash
cd backend

# Obtener User Pool ID
# Esto se puede obtener de:
# 1. Consola de Amplify después de amplify push
# 2. De la consola de AWS: Cognito -> User Pools -> IgerFrontend-dev

# Actualizar serverless.yml con el User Pool ID
# Abrir el archivo y actualizar la línea:
# cognitoUserPoolId: us-east-1_XXXXXXXXX
```

### 9. Desplegar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar secretos de entorno local (para desarrollo)
cp .env.example .env.local
# Editar .env.local con tus valores

# Desplegar a dev
npm run deploy:dev

# Esto creará:
# - Tabla DynamoDB (IgerData)
# - Funciones Lambda
# - API Gateway endpoints
# - Permisos IAM necesarios

# Ver logs
serverless logs -f authLogin -t --stage dev
```

### 10. Desplegar Frontend

```bash
cd frontend

# Push todo a Amplify
amplify push

# Esto desplegará:
# - Cognito User Pool con grupos
# - Hosting en Amplify
# - Variables de entorno

# Después del push, obtener URLs:
amplify status

# Guardar estos valores en .env.production:
# - VITE_COGNITO_USER_POOL_ID
# - VITE_COGNITO_CLIENT_ID
# - VITE_API_URL (obtenida del backend)
```

### 11. Configurar Variables de Entorno

**Frontend (.env.production):**
```env
VITE_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/dev
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_REGION=us-east-1
VITE_S3_ASSETS_URL=https://iger-assets.s3.amazonaws.com
VITE_CLOUDFRONT_URL=https://d1234567890.cloudfront.net  # Opcional
```

**Backend (.env.local):**
```env
AWS_REGION=us-east-1
AWS_PROFILE=iger
DYNAMODB_TABLE=IgerData
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
OPENAI_API_KEY=sk-...
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
PAYPAL_MODE=sandbox
STAGE=dev
LOG_LEVEL=info
```

### 12. Configurar IAM Roles y Permisos

```bash
# Verificar que las políticas estén configuradas correctamente
aws iam list-attached-user-policies --user-name amplify-user

# Si necesitas agregar permisos adicionales:
aws iam attach-user-policy \
  --user-name amplify-user \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess-AWSElasticBeanstalk

# Para Serverless, verificar políticas del rol
aws iam list-role-policies --role-name iger-backend-dev-us-east-1-lambdaRole
```

### 13. Verificar Despliegue

```bash
# Verificar tabla DynamoDB
aws dynamodb describe-table \
  --table-name IgerData \
  --region us-east-1

# Verificar funciones Lambda
aws lambda list-functions \
  --region us-east-1 \
  | grep iger-backend

# Verificar API Gateway
aws apigateway get-rest-apis \
  --region us-east-1

# Verificar Cognito
aws cognito-idp list-user-pools \
  --max-results 10 \
  --region us-east-1

# Verificar S3 bucket
aws s3 ls s3://iger-assets
```

### 14. Configurar CloudWatch (Opcional)

```bash
# Crear grupo de logs
aws logs create-log-group --log-group-name /aws/lambda/iger-backend

# Configurar retención (opcional)
aws logs put-retention-policy \
  --log-group-name /aws/lambda/iger-backend \
  --retention-in-days 7

# Ver métricas básicas
aws cloudwatch list-metrics \
  --namespace AWS/Lambda \
  --region us-east-1
```

### 15. Troubleshooting

**Error: "No credentials"**
```bash
aws configure
aws sts get-caller-identity
```

**Error: "Lambda timeout"**
```yaml
# Aumentar timeout en serverless.yml
functions:
  authLogin:
    timeout: 30  # segundos
```

**Error: "DynamoDB table already exists"**
```bash
# Eliminar tabla existente
aws dynamodb delete-table --table-name IgerData --region us-east-1

# O usar --force en serverless deploy
serverless deploy --force
```

**Error: "Cognito User Pool not found"**
```bash
# Verificar User Pool ID
aws cognito-idp list-user-pools --max-results 10

# Actualizar serverless.yml con el ID correcto
```

## Comandos Útiles

```bash
# Ver estado de Amplify
cd frontend && amplify status

# Ver recursos desplegados por Serverless
cd backend && serverless info --stage dev

# Ver logs en tiempo real
serverless logs -f authLogin -t --stage dev

# Eliminar todo (¡CUIDADO!)
cd backend && serverless remove --stage dev
cd frontend && amplify delete
```

## Checklist de Verificación

- [ ] AWS CLI configurado
- [ ] Amplify CLI instalado y configurado
- [ ] Serverless Framework instalado
- [ ] Cognito User Pool creado con grupos
- [ ] Tabla DynamoDB creada (IgerData)
- [ ] Bucket S3 creado (iger-assets)
- [ ] Secretos en Parameter Store
- [ ] Backend desplegado (Lambda + API Gateway)
- [ ] Frontend desplegado (Amplify Hosting)
- [ ] Variables de entorno configuradas
- [ ] IAM roles y permisos configurados
- [ ] CloudWatch logs funcionando
- [ ] Acceso a API desde frontend verificado

## Siguiente Paso

Una vez completada esta configuración, continuar con el siguiente TODO:
- Implementar sistema de autenticación completo



