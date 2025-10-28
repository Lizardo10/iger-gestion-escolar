# 🧪 Guía de Prueba - Aplicación Iger

## 📍 URL de la Aplicación
**https://dev.d2umdnu9x2m9qg.amplifyapp.com**

## 🎯 Qué Probar

### 1. Dashboard (Página Principal)
✅ **Qué hace:** Muestra estadísticas generales
✅ **Qué esperar:** Ver tarjetas con números de estudiantes, tareas, eventos y pagos
❌ **Estado actual:** Datos mock (no conectado al backend real)

### 2. Estudiantes ⭐ **PRUEBA ESTO**
✅ **Qué hace:** Gestiona lista de estudiantes
✅ **Qué esperar:** Lista vacía inicialmente
✅ **Pasos:**
1. Click en "Estudiantes" en el menú lateral
2. Verás "No hay estudiantes registrados"
3. Click en "+ Nuevo Estudiante"
4. Llenar formulario:
   - Nombre: Juan
   - Apellido: Pérez
   - Fecha de nacimiento: 2010-05-15
   - Grado: 5to
5. Click en "Guardar"
6. **¡El estudiante debería aparecer en la lista!** ✨

### 3. Tareas
❌ **Estado:** Datos mock (no conectado)
✅ **Qué hacer:** Por ahora solo muestra datos de ejemplo

### 4. Eventos
❌ **Estado:** Datos mock (no conectado)
✅ **Qué hacer:** Por ahora solo muestra datos de ejemplo

### 5. Pagos
❌ **Estado:** Datos mock (no conectado)
✅ **Qué hacer:** Por ahora solo muestra datos de ejemplo

## 🐛 Solución de Problemas

### Si no aparece el estudiante después de guardar:

1. **Abrir DevTools (F12)**
2. **Ir a pestaña "Network"**
3. **Buscar request a `/students`**
4. **Verificar:**
   - Si status es 200 ✅
   - Si hay error, copiar el mensaje
   - Verificar que la URL es correcta

### Errores Comunes:

**Error: "Network Error"**
- Backend no responde
- Verificar que Lambda está desplegado
- Ver CloudWatch Logs

**Error: 404**
- Endpoint no existe
- Verificar serverless.yml

**Error: 500**
- Error en el código del handler
- Ver CloudWatch Logs en AWS Console

## 📊 Monitoreo

### Ver logs en tiempo real:
```bash
# AWS CLI (si lo tienes instalado)
aws logs tail /aws/lambda/iger-backend-dev-createStudent --follow --profile IgerApp
```

### CloudWatch Console:
https://console.aws.amazon.com/cloudwatch/

## ✅ Checklist de Prueba

- [ ] Abrir la aplicación
- [ ] Ver dashboard (debería cargar)
- [ ] Navegar a Estudiantes
- [ ] Crear un estudiante
- [ ] Ver estudiante en la lista
- [ ] Editar estudiante
- [ ] Eliminar estudiante
- [ ] Ver logs en CloudWatch (opcional)

## 🎉 Si Funciona

¡Felicidades! El frontend está conectado al backend y guardando datos reales en DynamoDB.

**Próximos pasos:**
1. Conectar Tareas con backend
2. Conectar Eventos con backend
3. Conectar Pagos con backend
4. Implementar autenticación real

## 📝 Notas

- La autenticación actualmente es mock
- Los datos se guardan en DynamoDB
- Puedes ver los datos en AWS Console > DynamoDB
- Los logs están en CloudWatch


