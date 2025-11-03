@echo off
REM Script para crear la tabla DynamoDB del sistema IGER (Windows)
REM Uso: create-database.bat

set TABLE_NAME=IgerData
set REGION=us-east-1

echo 🚀 Creando tabla DynamoDB: %TABLE_NAME%
echo 📍 Región: %REGION%
echo.

REM Verificar si la tabla ya existe
aws dynamodb describe-table --table-name %TABLE_NAME% --region %REGION% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  La tabla %TABLE_NAME% ya existe.
    echo Por favor elimínala manualmente desde la consola de AWS o con:
    echo aws dynamodb delete-table --table-name %TABLE_NAME% --region %REGION%
    pause
    exit /b 1
)

echo 📦 Creando tabla...

aws dynamodb create-table ^
  --table-name %TABLE_NAME% ^
  --attribute-definitions ^
    AttributeName=PK,AttributeType=S ^
    AttributeName=SK,AttributeType=S ^
    AttributeName=GSI1PK,AttributeType=S ^
    AttributeName=GSI1SK,AttributeType=S ^
    AttributeName=GSI2PK,AttributeType=S ^
    AttributeName=GSI2SK,AttributeType=S ^
  --key-schema ^
    AttributeName=PK,KeyType=HASH ^
    AttributeName=SK,KeyType=RANGE ^
  --global-secondary-indexes ^
    "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" ^
    "IndexName=GSI2,KeySchema=[{AttributeName=GSI2PK,KeyType=HASH},{AttributeName=GSI2SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" ^
  --billing-mode PROVISIONED ^
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 ^
  --region %REGION%

if %ERRORLEVEL% EQU 0 (
    echo ✅ Tabla %TABLE_NAME% creada exitosamente
    echo ⏳ Esperando a que la tabla esté activa...
    aws dynamodb wait table-exists --table-name %TABLE_NAME% --region %REGION%
    echo.
    echo 🎉 ¡Tabla %TABLE_NAME% está activa y lista para usar!
) else (
    echo ❌ Error al crear la tabla
    exit /b 1
)

pause

