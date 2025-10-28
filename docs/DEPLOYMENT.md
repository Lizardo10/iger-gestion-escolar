# Guía de Despliegue - Iger

## Requisitos Previos

1. **AWS Account**: Cuenta activa en AWS
2. **Node.js 18+**: Instalado y configurado
3. **AWS CLI**: Configurado con credenciales
4. **Amplify CLI**: Para frontend
5. **Serverless Framework**: Para backend

## Instalación de Herramientas

```bash
# Instalar Amplify CLI globalmente
npm install -g @aws-amplify/cli

# Instalar Serverless Framework globalmente
npm install -g serverless

# Verificar instalación
amplify --version
serverless --version
aws --version
```

## Configuración AWS

```bash
# Configurar credenciales AWS
aws configure

# Opcional: Crear perfil específico para Iger
aws configure --profile iger
export AWS_PROFILE=iger
```

## Frontend - Despliegue con Amplify

### 1. Configurar Amplify

```bash
cd frontend
amplify configure
```

Seguir el asistente para:
- Configurar región AWS
- Crear usuario IAM con permisos adecuados
- Configurar editor (vscode)

### 2. Inicializar Proyecto

```bash
amplify init
# Nombre del proyecto: IgerFrontend
# Environment: dev
# Editor: VSCode
# App type: javascript
# Framework: react
# Source Directory: src
# Distribution Directory: dist
# Build Command: npm run build
# Start Command: npm run dev
```

### 3. Agregar Hosting

```bash
amplify add hosting

# Seleccionar: Hosting with Amplify Console
# Type: Manual deployment (o Continuous si conectas Git)
```

### 4. Configurar Autenticación (Cognito)

```bash
amplify add auth

# Seleccionar: Default configuration
# Sign in: Email
# Advanced settings: Yes
# Require attributes: email, name
# Enable MFA: Optional (recomendado para admins)
# Add User Groups: admin, teacher, student, parent
```

### 5. Desplegar Frontend

```bash
amplify push

# Esto desplegará:
# - Cognito User Pool
# - Hosting en Amplify
# - Variables de entorno configuradas
```

### 6. Obtener Variables de Entorno

Después del despliegue, Amplify mostrará las URLs y IDs. Actualizar `.env.production`:

```env
VITE_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/dev
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_REGION=us-east-1
VITE_S3_ASSETS_URL=https://iger-assets.s3.amazonaws.com
```

### 7. CI/CD con Git (Opcional)

```bash
# Conectar repositorio Git
amplify add hosting
# Seleccionar: Continuous deployment
# Proporcionar URL del repositorio

# Cada push a main desplegará automáticamente
```

## Backend - Despliegue con Serverless Framework

### 1. Configurar Secretos

```bash
# Crear secretos en Parameter Store
aws ssm put-parameter \
  --name "/iger/openai-key" \
  --value "sk-..." \
  --type "SecureString" \
  --region us-east-1

aws ssm put-parameter \
  --name "/iger/paypal-client-id" \
  --value "..." \
  --type "SecureString" \
  --region us-east-1

aws ssm put-parameter \
  --name "/iger/paypal-secret" \
  --value "..." \
  --type "SecureString" \
  --region us-east-1
```

### 2. Configurar serverless.yml

Actualizar `serverless.yml` con tu Cognito User Pool ID:

```yaml
custom:
  cognitoUserPoolId: us-east-1_XXXXXXXXX  # Obtenido de Amplify
```

### 3. Desplegar Backend

```bash
cd backend
npm install

# Desplegar a dev
npm run deploy:dev

# Desplegar a producción
npm run deploy:prod
```

### 4. Verificar Despliegue

```bash
# Ver funciones desplegadas
serverless info

# Ver logs en tiempo real
serverless logs -f authLogin -t

# Ver recursos creados en AWS
aws cloudformation list-stacks \
  --stack-name-filter "iger-backend*" \
  --region us-east-1
```

## S3 - Assets y Archivos

### 1. Crear Bucket S3

```bash
aws s3 mb s3://iger-assets --region us-east-1

# Habilitar versionado (opcional)
aws s3api put-bucket-versioning \
  --bucket iger-assets \
  --versioning-configuration Status=Enabled

# Configurar CORS
aws s3api put-bucket-cors \
  --bucket iger-assets \
  --cors-configuration file://cors-config.json
```

### 2. Subir Assets 3D

```bash
# Subir modelos 3D
aws s3 cp models/classroom.glb s3://iger-assets/models/ --region us-east-1

# Subir bibliotecas Draco
aws s3 sync draco/ s3://iger-assets/draco/ --region us-east-1
```

### 3. Configurar Política del Bucket

```json
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
```

## CloudFront - CDN (Opcional)

### 1. Crear Distribución CloudFront

```bash
# Configurar desde consola AWS o usar CloudFormation
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

### 2. Actualizar Variable de Entorno

```env
VITE_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
```

## DynamoDB - Tabla Principal

La tabla `IgerData` se crea automáticamente con el despliegue del backend.

Verificar:

```bash
aws dynamodb describe-table \
  --table-name IgerData \
  --region us-east-1

# Ver índices
aws dynamodb describe-table \
  --table-name IgerData \
  --query 'Table.GlobalSecondaryIndexes' \
  --region us-east-1
```

## Monitoreo y Logs

### CloudWatch

```bash
# Ver logs de una función específica
aws logs tail /aws/lambda/iger-backend-dev-authLogin --follow

# Ver métricas
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=iger-backend-dev-authLogin \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum

# Configurar alarmas
aws cloudwatch put-metric-alarm \
  --alarm-name iger-backend-errors \
  --alarm-description "Errores en funciones Lambda" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

### CloudWatch Dashboard

```bash
# Crear dashboard personalizado desde la consola AWS
# o usar:
aws cloudwatch put-dashboard \
  --dashboard-name iger-monitoring \
  --dashboard-body file://dashboard.json
```

## Rollback

### Frontend

```bash
amplify env checkout <previous-env>
amplify push
```

### Backend

```bash
serverless rollback --timestamp <timestamp>
```

## Costos y Optimización

### Verificar Uso

```bash
# Verificar uso de Lambda
aws lambda get-function \
  --function-name iger-backend-dev-authLogin \
  --query 'Configuration.Environment'

# Verificar uso de DynamoDB
aws dynamodb describe-limits

# Verificar uso de API Gateway
aws apigateway get-rest-apis
```

### Optimizar Costos

1. Habilitar compression en API Gateway
2. Configurar cache en responses
3. Usar DynamoDB PAY_PER_REQUEST (gratis hasta 25 RCU/WCU)
4. Limitar logs en CloudWatch
5. Configurar TTL en DynamoDB para datos temporales

## Troubleshooting

### Problemas Comunes

**Error: No se puede encontrar el módulo**
```bash
npm install
npm run build
```

**Error: Permisos IAM insuficientes**
```bash
# Actualizar política IAM del usuario
aws iam update-user-policy \
  --user-name amplify-user \
  --policy-name AdministratorAccess-AWSElasticBeanstalk
```

**Error: Límite de recursos alcanzado**
```bash
# Ver límites de cuenta
aws service-quotas list-service-quotas \
  --service-code lambda
```

### Logs y Debugging

```bash
# Ver logs en tiempo real
serverless logs -f authLogin -t --stage dev

# Ver logs de Amplify
amplify logs

# Ver logs de CloudWatch
aws logs tail /aws/lambda/iger-backend-dev-authLogin --follow
```

## Actualizaciones y Mantenimiento

### Actualizar Frontend

```bash
cd frontend
npm install
npm run build
amplify push
```

### Actualizar Backend

```bash
cd backend
npm install
npm run deploy:dev
```

### Actualizar Dependencias

```bash
# Frontend
cd frontend
npm update
npm audit fix

# Backend
cd backend
npm update
npm audit fix
```

## Seguridad Post-Despliegue

1. Activar MFA en Cognito para administradores
2. Configurar WAF en API Gateway
3. Habilitar encryption en DynamoDB y S3
4. Configurar políticas de backup
5. Implementar alertas de seguridad en CloudWatch
6. Auditar logs regularmente
7. Actualizar secretos periódicamente
8. Revisar permisos IAM (menor privilegio)



