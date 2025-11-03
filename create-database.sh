#!/bin/bash

# Script para crear la tabla DynamoDB del sistema IGER
# Uso: ./create-database.sh

set -e

TABLE_NAME="IgerData"
REGION="us-east-1"

echo "🚀 Creando tabla DynamoDB: $TABLE_NAME"
echo "📍 Región: $REGION"
echo ""

# Verificar si la tabla ya existe
if aws dynamodb describe-table --table-name $TABLE_NAME --region $REGION 2>/dev/null; then
    echo "⚠️  La tabla $TABLE_NAME ya existe."
    read -p "¿Deseas eliminarla y crearla de nuevo? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Eliminando tabla existente..."
        aws dynamodb delete-table --table-name $TABLE_NAME --region $REGION
        echo "⏳ Esperando a que la tabla se elimine..."
        aws dynamodb wait table-not-exists --table-name $TABLE_NAME --region $REGION
        echo "✅ Tabla eliminada"
    else
        echo "❌ Operación cancelada"
        exit 0
    fi
fi

echo "📦 Creando tabla..."

aws dynamodb create-table \
  --table-name $TABLE_NAME \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
    AttributeName=GSI2PK,AttributeType=S \
    AttributeName=GSI2SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" \
    "IndexName=GSI2,KeySchema=[{AttributeName=GSI2PK,KeyType=HASH},{AttributeName=GSI2SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" \
  --billing-mode PROVISIONED \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region $REGION

if [ $? -eq 0 ]; then
    echo "✅ Tabla $TABLE_NAME creada exitosamente"
    echo "⏳ Esperando a que la tabla esté activa..."
    aws dynamodb wait table-exists --table-name $TABLE_NAME --region $REGION
    echo ""
    echo "🎉 ¡Tabla $TABLE_NAME está activa y lista para usar!"
    echo ""
    echo "📊 Información de la tabla:"
    aws dynamodb describe-table --table-name $TABLE_NAME --region $REGION --query 'Table.{TableName:TableName,Status:TableStatus,CreationDate:CreationDateTime}' --output table
else
    echo "❌ Error al crear la tabla"
    exit 1
fi

