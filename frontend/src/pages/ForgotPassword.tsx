import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ThreeDButton } from '../components/ui/ThreeDButton';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || 
                          (err as { message?: string })?.message || 
                          'Error al solicitar recuperación de contraseña';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Recuperar Contraseña
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Ingresa tu email y te enviaremos un código para recuperar tu contraseña
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
              ✅ Se ha enviado un código de verificación a tu email. Por favor revisa tu bandeja de entrada.
            </div>
            <Link to="/reset-password" className="block">
              <ThreeDButton showOrb className="w-full justify-center">
                Continuar con el código
              </ThreeDButton>
            </Link>
            <Link
              to="/login"
              className="text-center text-primary-600 hover:text-primary-800 text-sm block"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
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
            <ThreeDButton
              type="submit"
              loading={isLoading}
              disabled={isLoading}
              showOrb
              className="w-full justify-center"
            >
              {isLoading ? 'Enviando...' : 'Enviar Código'}
            </ThreeDButton>
            <Link
              to="/login"
              className="text-center text-primary-600 hover:text-primary-800 text-sm block"
            >
              Volver al inicio de sesión
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

