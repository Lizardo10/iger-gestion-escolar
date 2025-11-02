import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthService } from '../lib/auth';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Validar formato de email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validaciones del frontend
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      setError('El correo electrónico es requerido');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    if (!trimmedPassword) {
      setError('La contraseña es requerida');
      return;
    }

    if (trimmedPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Iniciando login...');
      await login(trimmedEmail, trimmedPassword);
      console.log('✅ Login exitoso, verificando estado...');
      
      // Esperar un momento para asegurar que el estado se guardó y propagó
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verificar que realmente está autenticado antes de navegar
      // Esperar un poco más para asegurar propagación completa
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar usando AuthService directamente
      if (!AuthService.isAuthenticated()) {
        console.error('❌ Error: Login exitoso pero no está autenticado');
        setError('Error al guardar la sesión. Por favor intenta nuevamente.');
        return;
      }
      
      console.log('✅ Estado verificado, navegando a dashboard...');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('❌ Error completo en Login:', err);
      
      let errorMessage = 'Error al iniciar sesión';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Mensajes más amigables para errores comunes
        if (err.message.includes('CORS')) {
          errorMessage = 'Error de conexión con el servidor. Por favor verifica la configuración.';
        } else if (err.message.includes('timeout') || err.message.includes('ECONNABORTED')) {
          errorMessage = 'El servidor no responde. Por favor verifica tu conexión.';
        } else if (err.message.includes('ERR_NETWORK')) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        } else if (err.message.includes('401') || err.message.includes('incorrectos')) {
          errorMessage = 'Email o contraseña incorrectos.';
        } else if (err.message.includes('confirmado')) {
          errorMessage = 'Por favor confirma tu email antes de iniciar sesión.';
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      console.error('❌ Error final mostrado al usuario:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Iniciar Sesión
        </h2>
        <p className="text-center text-gray-600 mb-8">Sistema de Gestión Escolar Iger</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/forgot-password"
            className="text-primary-600 hover:text-primary-800 text-sm"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
}

