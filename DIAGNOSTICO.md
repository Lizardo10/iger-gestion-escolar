PROBLEMA: Usuario puede acceder al dashboard sin login

POSIBLES CAUSAS:
1. localStorage tiene datos corruptos que pasan la validación
2. AuthProvider no está bloqueando el renderizado correctamente
3. ProtectedRoute se ejecuta antes de que AuthService.init() termine
4. isAuthenticated() retorna true incorrectamente

SOLUCIÓN DEFINITIVA NECESARIA:
- Forzar limpieza de localStorage al iniciar
- Bloquear TODO el renderizado hasta que init() complete
- NO permitir acceso bajo NINGUNA circunstancia hasta validar
