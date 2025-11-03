import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';

export function PaymentsSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [countdown, setCountdown] = useState(5);
  const [verifying, setVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('verifying');

  const enrollmentId = searchParams.get('enrollmentId');
  const invoiceId = searchParams.get('invoiceId');
  const token = searchParams.get('token');
  const PayerID = searchParams.get('PayerID');
  const orderId = searchParams.get('token'); // PayPal envía el orderId como 'token' en la URL de retorno

  useEffect(() => {
    // Si el usuario no está autenticado después de cargar, intentar restaurar sesión
    if (!isLoading && !isAuthenticated) {
      console.log('⚠️ Usuario no autenticado en página de éxito. Redirigiendo a login...');
      // Guardar parámetros para restaurar después del login
      const redirectUrl = `/payments/success?${searchParams.toString()}`;
      localStorage.setItem('payment_redirect', redirectUrl);
      navigate('/login');
      return;
    }

    // Si está autenticado, verificar y procesar el pago
    if (isAuthenticated && verifying) {
      verifyAndProcessPayment();
    }
  }, [isAuthenticated, isLoading]);

  const verifyAndProcessPayment = async () => {
    try {
      console.log('🔍 Verificando pago...', { enrollmentId, invoiceId, token, PayerID });
      
      // Llamar al endpoint de verificación
      const response = await api.post<{
        invoiceId?: string;
        enrollmentId?: string;
        orderId?: string;
        status: string;
        message?: string;
      }>('/payments/verify', {
        orderId: token || orderId,
        token,
        PayerID,
        enrollmentId: enrollmentId || undefined,
        invoiceId: invoiceId || undefined,
      });

      console.log('✅ Respuesta de verificación:', response.data);

      if (response.data.status === 'processed' || response.data.status === 'already_processed') {
        setPaymentStatus('success');
        setVerifying(false);
        
        // Iniciar contador para redirigir
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              // Redirigir según el tipo de pago
              if (enrollmentId || response.data.enrollmentId) {
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
      } else {
        setPaymentStatus('pending');
        setVerifying(false);
        setVerificationError(response.data.message || 'El pago está pendiente de procesamiento');
      }
    } catch (error: any) {
      console.error('❌ Error verificando pago:', error);
      setVerifying(false);
      setPaymentStatus('error');
      
      const errorMessage = error?.response?.data?.error || error?.message || 'Error al verificar el pago';
      setVerificationError(errorMessage);

      // Aún así, iniciar contador para redirigir (el usuario puede verificar después)
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
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
  };

  // Mostrar loading mientras verifica autenticación o verifica el pago
  if (isLoading || !isAuthenticated || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando y procesando pago...</p>
          <p className="text-sm text-gray-500 mt-2">Por favor espera, esto puede tomar unos segundos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {paymentStatus === 'success' ? '¡Pago Exitoso!' : paymentStatus === 'error' ? 'Error al Procesar' : 'Pago Pendiente'}
          </h1>
          <p className="text-gray-600">
            {paymentStatus === 'success' 
              ? 'Tu pago ha sido procesado correctamente.'
              : paymentStatus === 'error'
              ? verificationError || 'Hubo un problema al procesar tu pago.'
              : verificationError || 'El pago está siendo procesado. Por favor espera un momento.'}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <div className="space-y-2 text-sm">
            {enrollmentId && (
              <div>
                <span className="font-semibold">ID de Inscripción:</span>{' '}
                <span className="text-gray-600">{enrollmentId}</span>
              </div>
            )}
            {invoiceId && (
              <div>
                <span className="font-semibold">ID de Factura:</span>{' '}
                <span className="text-gray-600">{invoiceId}</span>
              </div>
            )}
            {token && (
              <div>
                <span className="font-semibold">Token de Pago:</span>{' '}
                <span className="text-gray-600 font-mono text-xs">{token.substring(0, 20)}...</span>
              </div>
            )}
          </div>
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
                Ver Inscripciones
              </button>
            ) : (
              <button
                onClick={() => navigate('/payments')}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Ver Pagos
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

        <p className="mt-6 text-xs text-gray-400">
          Recibirás un correo de confirmación con los detalles de tu pago.
        </p>
      </div>
    </div>
  );
}


