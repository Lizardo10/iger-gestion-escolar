import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';

interface Enrollment {
  id: string;
  studentName: string;
  studentEmail: string;
  grade: string;
  section?: string;
  amount: number;
  status: 'pending' | 'active' | 'cancelled';
  paymentUrl?: string;
  paypalOrderId?: string;
  createdAt: string;
}

export function Enrollment() {
  const { user, hasAnyRole } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    grade: '',
    section: '',
    amount: 0,
  });
  const [verifyingPayment, setVerifyingPayment] = useState<string | null>(null);

  // Determinar orgId basado en el usuario
  const orgId = user?.orgId || 'default-org';

  // Debug: Log del usuario y orgId
  useEffect(() => {
    console.log('📋 Enrollment - Usuario:', user);
    console.log('📋 Enrollment - orgId:', orgId);
  }, [user, orgId]);

  // Verificar permisos
  const canEnroll = hasAnyRole('superadmin', 'admin', 'teacher');

  useEffect(() => {
    if (canEnroll) {
      loadEnrollments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEnroll, orgId]); // Agregar orgId como dependencia

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      // Si el usuario tiene orgId, no enviarlo - el backend usará el del token
      // Solo enviar orgId si el usuario no lo tiene
      const url = user?.orgId 
        ? '/enrollment' 
        : `/enrollment?orgId=${orgId}`;
      const response = await api.get<{
        enrollments: Enrollment[];
        total?: number;
      }>(url);
      setEnrollments(response.data.enrollments || []);
    } catch (err) {
      console.error('Error cargando inscripciones:', err);
      setError('Error al cargar inscripciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.studentName || !formData.studentEmail || !formData.grade || !formData.amount) {
      setError('Todos los campos son requeridos');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post<{
        enrollment: Enrollment;
        invoice?: {
          id: string;
          amount: number;
        };
        paymentUrl?: string;
      }>('/enrollment', {
        ...formData,
        orgId, // Usar el orgId actualizado del usuario
      });
      
      // Debug: Verificar URLs de PayPal
      if (response.data.paymentUrl) {
        console.log('🔗 URL de PayPal generada:', response.data.paymentUrl);
        console.log('✅ Verificando URL de retorno...');
        
        // Extraer returnUrl de la URL de PayPal
        const urlObj = new URL(response.data.paymentUrl);
        const returnUrl = urlObj.searchParams.get('returnUrl') || urlObj.searchParams.get('redirect_uri');
        
        if (returnUrl) {
          console.log('📍 returnUrl encontrado:', returnUrl);
          if (returnUrl.includes('dev.d2umdnu9x2m9qg.amplifyapp.com')) {
            console.log('✅ ✅ ✅ URL CORRECTA: Contiene dev.d2umdnu9x2m9qg.amplifyapp.com');
          } else if (returnUrl.includes('iger.online')) {
            console.error('❌ ❌ ❌ URL INCORRECTA: Contiene iger.online');
          } else {
            console.warn('⚠️ URL no reconocida:', returnUrl);
          }
        } else {
          console.log('⚠️ No se encontró returnUrl en la URL de PayPal');
          console.log('URL completa:', response.data.paymentUrl);
        }
      }
      
      alert(`✅ Alumno inscrito exitosamente!\n${response.data.paymentUrl ? `Link de pago: ${response.data.paymentUrl}` : ''}`);
      
      setFormData({
        studentName: '',
        studentEmail: '',
        grade: '',
        section: '',
        amount: 0,
      });
      setShowForm(false);
      await loadEnrollments();
    } catch (err: unknown) {
      console.error('Error inscribiendo alumno:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al inscribir alumno';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'pending':
        return 'Pendiente de Pago';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const handleVerifyPayment = async (enrollment: Enrollment) => {
    if (!enrollment.paypalOrderId && !enrollment.id) {
      alert('No se puede verificar este pago. Falta información de PayPal.');
      return;
    }

    try {
      setVerifyingPayment(enrollment.id);
      console.log('🔍 Verificando pago para enrollment:', enrollment.id);

      const response = await api.post<{
        invoiceId?: string;
        enrollmentId?: string;
        orderId?: string;
        status: string;
        message?: string;
      }>('/payments/verify', {
        enrollmentId: enrollment.id,
        orderId: enrollment.paypalOrderId,
      });

      console.log('✅ Respuesta de verificación:', response.data);

      if (response.data.status === 'processed' || response.data.status === 'already_processed') {
        alert('✅ Pago verificado y procesado exitosamente. El estudiante ha sido activado.');
        // Recargar la lista de inscripciones
        await loadEnrollments();
      } else {
        alert(`ℹ️ ${response.data.message || 'El pago aún está pendiente de procesamiento'}`);
      }
    } catch (error: unknown) {
      console.error('❌ Error verificando pago:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || 
                          (error as { message?: string })?.message || 
                          'Error al verificar el pago';
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setVerifyingPayment(null);
    }
  };

  if (!canEnroll) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600">No tienes permisos para inscribir alumnos.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inscripción de Alumnos</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancelar' : '+ Nuevo Alumno'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Nueva Inscripción</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre del Alumno</label>
                <input
                  type="text"
                  className="input"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Email del Alumno/Padre</label>
                <input
                  type="email"
                  className="input"
                  value={formData.studentEmail}
                  onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Grado</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: 1ro, 2do, 3ro..."
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Sección (Opcional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: A, B, C..."
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Monto de Inscripción</label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Inscribiendo...' : 'Inscribir Alumno'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showForm ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Cargando inscripciones...</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Alumno</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Grado</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Monto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-semibold">{enrollment.studentName}</div>
                      <div className="text-sm text-gray-600">{enrollment.studentEmail}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {enrollment.grade}
                    {enrollment.section && ` - ${enrollment.section}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">${enrollment.amount.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(enrollment.status)}`}>
                      {getStatusText(enrollment.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      {enrollment.status === 'pending' && enrollment.paymentUrl && (
                        <a
                          href={enrollment.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          💳 Pagar
                        </a>
                      )}
                      {enrollment.status === 'pending' && (
                        <button
                          onClick={() => handleVerifyPayment(enrollment)}
                          disabled={verifyingPayment === enrollment.id}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Verificar si el pago ya fue completado"
                        >
                          {verifyingPayment === enrollment.id ? '⏳ Verificando...' : '✅ Verificar Pago'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {enrollments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No hay inscripciones. ¡Inscribe tu primer alumno!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

