# 🚀 Guía de Deploy - Iger

## Requisitos Previos

1. **AWS CLI configurado**:
   ```bash
   aws configure
   # Ingresa tus credenciales AWS
   ```

2. **Herramientas instaladas**:
   ```bash
   npm install -g @aws-amplify/cli serverless
   ```

3. **Verificar instalación**:
   ```bash
   amplify --version
   serverless --version
   aws --version
   ```

## Opción 1: Deploy Completo (Recomendado)

```bash
./deploy-all.sh
```

Este script:
- ✅ Compila el backend
- ✅ Ejecuta tests
- ✅ Despliega backend a Lambda
- ✅ Construye el frontend
- ✅ Despliega frontend a Amplify

## Opción 2: Deploy Individual

### Deploy del Backend

```bash
./deploy-backend.sh
```

O manualmente:
```bash
cd backend
npm run build
npm test
serverless deploy
```

### Deploy del Frontend

```bash
./deploy-frontend.sh
```

O manualmente:
```bash
cd frontend
npm run build
amplify publish
```

## Opción 3: Deploy Manual

### Backend (Serverless)

```bash
cd backend
npm install
npm run build
npm test
serverless deploy
```

**Importante**: Después del deploy, copia la URL de la API que se muestra al final y actualízala en:
- `amplify.yml` (variable `VITE_API_URL`)
- Amplify Console → App settings → Environment variables

### Frontend (Amplify)

#### Si Amplify ya está configurado:

```bash
cd frontend
npm run build
amplify publish
```

#### Si es la primera vez:

```bash
amplify init
# Seguir las instrucciones

amplify add hosting
# Seleccionar: Hosting with Amplify Console

amplify publish
```

## Variables de Entorno

Después del deploy del backend, actualiza en Amplify Console:

1. Ve a: **Amplify Console** → **Tu App** → **App settings** → **Environment variables**
2. Agrega/actualiza:
   - `VITE_API_URL`: URL de tu API Gateway (ej: `https://xxxx.execute-api.us-east-1.amazonaws.com/dev`)
   - `VITE_COGNITO_USER_POOL_ID`: ID de tu User Pool
   - `VITE_COGNITO_CLIENT_ID`: ID de tu App Client

## Verificar Deploy

### Backend:
```bash
# Ver logs de Lambda
serverless logs -f authLogin --tail

# Ver información del deploy
serverless info
```

### Frontend:
- Ve a **Amplify Console** → **Tu App**
- Revisa la URL de producción
- Verifica que el build sea exitoso

## Solución de Problemas

### Error: "AWS credentials not configured"
```bash
aws configure
# Ingresa tus credenciales
```

### Error: "Amplify not initialized"
```bash
amplify init
```

### Error: "Serverless not found"
```bash
npm install -g serverless
```

### Build falla
```bash
# Limpiar e instalar dependencias
cd frontend  # o backend
rm -rf node_modules package-lock.json
npm install
```

## Comandos Útiles

```bash
# Ver información del backend
cd backend && serverless info

# Ver logs en tiempo real
cd backend && serverless logs -f authLogin --tail

# Remover todo (CUIDADO)
cd backend && serverless remove

# Ver estado de Amplify
amplify status
```

