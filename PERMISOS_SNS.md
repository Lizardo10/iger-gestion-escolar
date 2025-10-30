# Permisos IAM para SNS (CloudWatch Alarms)

Para que las alarmas CloudWatch puedan publicar en SNS, tu usuario de deployment (`igeruser`) necesita permisos adicionales.

## Permisos necesarios

Agrega esta política a tu usuario IAM `igeruser` en AWS Console:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sns:CreateTopic",
        "sns:DeleteTopic",
        "sns:GetTopicAttributes",
        "sns:SetTopicAttributes",
        "sns:Subscribe",
        "sns:Unsubscribe",
        "sns:Publish",
        "sns:SetTopicAttributes",
        "sns:GetTopicAttributes",
        "sns:ListTopics",
        "sns:ListSubscriptionsByTopic"
      ],
      "Resource": "arn:aws:sns:us-east-1:087770004833:*"
    }
  ]
}
```

## Pasos

1. Ve a IAM Console → Users → `igeruser`
2. Agrega una política inline o attach una managed policy con los permisos arriba
3. Vuelve a ejecutar: `serverless deploy --aws-profile IgerApp`

## Alternativa: Admin temporal

Si prefieres, puedes usar permisos más amplios temporalmente:
- Agregar `sns:*` para `arn:aws:sns:us-east-1:087770004833:*`

## Después del deploy

Una vez desplegado el SNS Topic, puedes:
1. Ir a SNS Console → Topics → `iger-backend-dev-alerts`
2. Crear una suscripción (Email, SMS, Lambda, etc.) para recibir alertas

