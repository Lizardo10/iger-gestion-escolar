# 🌐 URLs de la Aplicación Iger

## Frontend (Producción)
### URL Principal
🔗 **https://dev.d2umdnu9x2m9qg.amplifyapp.com**

Esta es la URL pública de tu aplicación. Puedes compartirla con otros usuarios.

## Backend API
### API Gateway
🔗 **https://unfepih103.execute-api.us-east-1.amazonaws.com/dev**

### Endpoints Disponibles

#### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar usuario

#### Estudiantes
- `GET /students` - Listar estudiantes
- `GET /students/{studentId}` - Obtener estudiante
- `POST /students` - Crear estudiante
- `PUT /students/{studentId}` - Actualizar estudiante
- `DELETE /students/{studentId}` - Eliminar estudiante

#### Tareas
- `GET /tasks` - Listar tareas
- `GET /classes/{classId}/tasks/{taskId}` - Obtener tarea
- `POST /tasks` - Crear tarea
- `PUT /classes/{classId}/tasks/{taskId}` - Actualizar tarea
- `DELETE /classes/{classId}/tasks/{taskId}` - Eliminar tarea
- `POST /tasks/{taskId}/submissions` - Crear entrega
- `GET /tasks/{taskId}/submissions` - Listar entregas

#### Eventos
- `GET /events` - Listar eventos
- `GET /events/{eventId}` - Obtener evento
- `POST /events` - Crear evento
- `PUT /events/{eventId}` - Actualizar evento
- `DELETE /events/{eventId}` - Eliminar evento

#### Pagos
- `POST /payments/invoices` - Crear factura
- `POST /payments/create-order` - Crear orden PayPal
- `POST /payments/webhook` - Webhook PayPal
- `GET /payments/invoices/{invoiceId}` - Obtener factura

#### Asistencia
- `POST /attendance` - Registrar asistencia
- `GET /attendance` - Obtener asistencia
- `GET /attendance/reports` - Reportes de asistencia

#### Sincronización
- `POST /sync/pull` - Sincronizar datos remotos
- `POST /sync/push` - Enviar datos locales

#### IA
- `POST /ai/summarize` - Resumir contenido
- `POST /ai/tutor` - Tutor virtual
- `POST /ai/generate-content` - Generar contenido educativo

## Cómo Abrir la Aplicación

### Opción 1: Navegador
Abre tu navegador y ve a:
```
https://dev.d2umdnu9x2m9qg.amplifyapp.com
```

### Opción 2: Desde el Terminal
```bash
# En Windows
start https://dev.d2umdnu9x2m9qg.amplifyapp.com

# En Mac
open https://dev.d2umdnu9x2m9qg.amplifyapp.com

# En Linux
xdg-open https://dev.d2umdnu9x2m9qg.amplifyapp.com
```

## Funcionalidades Disponibles

✅ **Dashboard** - Vista general del sistema
✅ **Gestión de Estudiantes** - CRUD completo
✅ **Tareas** - Asignación y seguimiento
✅ **Eventos** - Calendario escolar
✅ **Pagos** - Gestión de facturas
✅ **Asistencia** - Control de asistencia
✅ **Visualizaciones 3D** - Interactividad
✅ **Offline** - Funcionalidad sin conexión

## Notas

- La aplicación está en **modo desarrollo** (`dev`)
- Para producción, crear un ambiente `prod` en Amplify
- Todos los endpoints tienen **CORS habilitado**
- La autenticación actualmente usa **mock** (configurar Cognito real para producción)

## Próximos Pasos

1. Configurar autenticación real con Cognito
2. Agregar tests E2E
3. Optimizar performance
4. Configurar CI/CD automático
5. Agregar monitoreo con CloudWatch

## Soporte

Si encuentras problemas:
- Ver CloudWatch Logs en AWS Console
- Revisar DynamoDB para datos
- Verificar permisos IAM
- Consultar documentación en `/docs`


