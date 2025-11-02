import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // CRÍTICO: Esperar a que termine de cargar
  // Mientras carga, bloquear acceso
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  // CRÍTICO: Si NO está autenticado DESPUÉS de cargar, redirigir a login
  // NO permitir acceso bajo ninguna circunstancia
  if (!isAuthenticated) {
    console.log('🚫 ProtectedRoute: Usuario no autenticado, redirigiendo a /login');
    // Forzar redirección incluso si hay datos en localStorage
    return <Navigate to="/login" replace />;
  }

  // Solo mostrar children si está autenticado Y terminó de cargar
  console.log('✅ ProtectedRoute: Usuario autenticado, permitiendo acceso');
  return <>{children}</>;
}



