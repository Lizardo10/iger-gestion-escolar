import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function PaymentsCancel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [countdown, setCountdown] = useState(5);

  const enrollmentId = searchParams.get('enrollmentId');
  const invoiceId = searchParams.get('invoiceId');

  useEffect(() => {
    // Si el usuario no está autenticado, redirigir a login
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    // Contador para redirigir automáticamente
    if (isAuthenticated) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Redirigir según el tipo de pago
            if (enrollmentId) {
              navigate('/enrollment');
            } else {
              navigate('/payments');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isLoading, navigate, enrollmentId, invoiceId]);

  // Mostrar loading mientras verifica autenticación
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-12 h-12 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pago Cancelado</h1>
          <p className="text-gray-600">
            El pago fue cancelado. No se realizó ningún cobro.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Redirigiendo en {countdown} segundo{countdown !== 1 ? 's' : ''}...
          </p>
          <div className="flex gap-3">
            {enrollmentId ? (
              <button
                onClick={() => navigate('/enrollment')}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Volver a Inscripciones
              </button>
            ) : (
              <button
                onClick={() => navigate('/payments')}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Volver a Pagos
              </button>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


