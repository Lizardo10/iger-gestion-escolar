# Inicio Rápido - Configurar AWS para Iger

## Estado Actual

✅ **Código creado:** Todo el código está listo (frontend + backend)  
❌ **AWS NO configurado:** Necesitas ejecutar estos pasos manualmente

## Pasos Rápidos para Configurar AWS

### 1. Verificar que tienes instalado:

```bash
# Verificar Node.js
node --version  # Debe ser 18 o superior

# Verificar AWS CLI
aws --version

# Si no tienes AWS CLI, instalar:
# Windows: descargar de aws.amazon.com/cli
# Mac: brew install awscli
# Linux: apt-get install awscli
```

### 2. Configurar credenciales AWS (SOLO UNA VEZ)

```bash
# Configurar AWS CLI con tus credenciales
aws configure

# Te pedirá:
# - AWS Access Key ID: (tu clave de acceso)
# - AWS Secret Access Key: (tu clave secreta)
# - Default region: us-east-1
# - Default output format: json
```

**¿Dónde obtener las credenciales?**
- Ingresa a https://aws.amazon.com/
- Ve a IAM → Users → Tu usuario → Security credentials
- Crear access key nuevo

### 3. Instalar herramientas necesarias

```bash
# Instalar Amplify CLI (para frontend)
npm install -g @aws-amplify/cli

# Instalar Serverless Framework (para backend)
npm install -g serverless

# Verificar instalaciones
amplify --version
serverless --version
```

### 4. Configurar el Frontend (Amplify)

```bash
cd frontend

# Inicializar Amplify (solo una vez)
amplify init

# Esto te pedirá:
# - Nombre del proyecto: IgerFrontend
# - Environment: dev
# - Framework: react
# - Build command: npm run build
# - Start command: npm run dev
```

### 5. Configurar el Backend (Serverless)

```bash
cd backend

# Configurar secretos en AWS (OBLIGATORIO)
aws ssm put-parameter \
  --name "/iger/openai-key" \
  --value "sk-tu-clave-openai" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/iger/paypal-client-id" \
  --value "tu-client-id" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/iger/paypal-secret" \
  --value "tu-secret" \
  --type "SecureString"
```

**¿Dónde obtener estas claves?**
- OpenAI: https://platform.openai.com/api-keys
- PayPal: https://developer.paypal.com/ (modo sandbox para pruebas)

### 6. Desplegar Backend

```bash
cd backend
npm install  # Instalar dependencias
npm run deploy:dev  # Desplegar a AWS
```

### 7. Desplegar Frontend

```bash
cd frontend
amplify push  # Desplegar a Amplify
```

## Resumen de lo que se creará en AWS

Cuando ejecutes los comandos anteriores, se crearán automáticamente:

1. **Amplify (Frontend):**
   - Hosting para React app
   - Cognito User Pool (autenticación)
   - Variables de entorno

2. **Serverless (Backend):**
   - Tabla DynamoDB (base de datos)
   - Funciones Lambda (lógica backend)
   - API Gateway (endpoints REST)

## Costos Estimados

Usando la **capa gratuita de AWS**, los primeros meses deberían ser **gratis o casi gratis**:
- DynamoDB: 25GB gratis
- Lambda: 1M requests gratis/mes
- Amplify: 15GB transferencia gratis/mes
- Cognito: 50,000 usuarios activos gratis

Después del primer año, costos estimados:
- **Desarrollo:** $5-20/mes
- **Producción pequeña:** $20-50/mes

## Problemas Comunes

**Error: "No credentials"**
```bash
aws configure  # Ejecutar nuevamente
```

**Error: "Permission denied"**
- Verificar que tu usuario IAM tiene permisos de administrador
- O agregar permisos necesarios en IAM

**Error: "Region not supported"**
- Cambiar región a us-east-1 en serverless.yml

## ¿Qué hacer ahora?

1. **Para desarrollo local:** Puedes ejecutar el proyecto sin AWS
   ```bash
   cd frontend && npm run dev
   ```

2. **Para desplegar a producción:** Seguir los pasos de configuración arriba

3. **Para probar sin configurar AWS:** El código ya está listo, pero necesitas AWS para funcionalidad completa

## Siguiente Paso

Si ya configuraste todo, ir a [DEPLOYMENT.md](DEPLOYMENT.md) para instrucciones detalladas.



