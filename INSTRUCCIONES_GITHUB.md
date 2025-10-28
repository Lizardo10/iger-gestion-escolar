# 📤 Instrucciones para Subir a GitHub

## ✅ Paso 1: Commit Ya Creado

Ya creé el commit inicial con todos los archivos.

## 📤 Paso 2: Crear Repositorio en GitHub

1. Ve a: **https://github.com/new**

2. Completa el formulario:
   - **Repository name**: `iger-gestion-escolar`
   - **Description**: Sistema de gestión escolar con React, TypeScript, AWS Amplify, Lambda, DynamoDB
   - **Visibility**: Público (o Privado si prefieres)
   - **NO marques** "Add a README file" (ya tienes uno)
   - **NO marques** "Add .gitignore" (ya tienes uno)

3. Haz clic en "**Create repository**"

## 📤 Paso 3: Copiar URL del Repositorio

GitHub te mostrará instrucciones. Copia la URL que aparece, será algo como:

```
https://github.com/TU_USUARIO/iger-gestion-escolar.git
```

## 📤 Paso 4: Conectar y Subir

Ejecuta estos comandos en tu terminal (dentro del proyecto):

```bash
# Reemplaza TU_URL con la URL que copiaste
git remote add origin TU_URL

# Subir el código
git push -u origin master
```

## ✅ Resultado

Después de hacer push, tendrás todo tu proyecto en GitHub.

## 🎯 Nota de Seguridad

⚠️ **IMPORTANTE**: Antes de subir, revisa que no haya credenciales en:
- `amplify/team-provider-info.json` (ya está en .gitignore ✅)
- `backend/.env` (si existe)
- `frontend/.env.local` (ya está en .gitignore ✅)

Los archivos sensibles ya están en `.gitignore`, así que no se subirán.

