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
        "sns:ListSubscriptionsByTopic",
        "sns:TagResource"
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

Una vez desplegado el SNS Topic, configura suscripciones para recibir alertas:

### Suscripción por Email (recomendado para pruebas)

1. Ve a **SNS Console** → **Topics** → `iger-backend-dev-alerts`
2. Click en **Create subscription**
3. **Protocol**: Email
4. **Endpoint**: tu email
5. Click **Create subscription**
6. **Confirma tu email** (revisa tu bandeja de entrada y spam)
7. Una vez confirmado, recibirás un email cada vez que se active una alarma

### Suscripción por SMS

1. Mismo proceso, pero selecciona **Protocol**: SMS
2. **Endpoint**: tu número de teléfono (formato: +521234567890)
3. Nota: SMS tiene costo adicional en AWS

### Verificar que funciona

Para probar que las alertas funcionan, puedes:
- Esperar a que ocurra un error real
- O desactivar temporalmente una función Lambda para generar un error de prueba


