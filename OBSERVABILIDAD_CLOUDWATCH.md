Pasos para observabilidad y alarmas (propuesta aplicada parcialmente):

1) Logs estructurados
- Los handlers ya registran errores con `console.error`. Se recomienda un wrapper de logger con nivel y contexto.

2) Alarmas CloudWatch (pendiente de aprobar variables)
- Crear Alarmas: 5XX en API Gateway, Latencia p95 > 1s, Errores de Lambda > 0.
- Se pueden definir en `backend/serverless.yml` (Resources) con `AWS::CloudWatch::Alarm` apuntando al API por `RestApiId` y `Stage`.

3) Métricas útiles
- API Gateway: `5XXError`, `4XXError`, `Latency` (estadísticos p95/p99).
- Lambda: `Errors`, `Duration`, `Throttles`.

4) Notificación
- Conectar las alarmas a un SNS Topic y suscribirse con email.

5) Próximo paso
- Confirmar emails/notificaciones y crear los recursos en `serverless.yml`.


