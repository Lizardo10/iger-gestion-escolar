import { useState, useEffect } from 'react';
import { DashboardScene } from '../components/3d/DashboardScene';

interface DashboardStats {
  students: number;
  pendingTasks: number;
  upcomingEvents: number;
  pendingPayments: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    students: 0,
    pendingTasks: 0,
    upcomingEvents: 0,
    pendingPayments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos desde la API
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // TODO: Conectar con el backend cuando esté disponible
        // const response = await fetch(`${API_URL}/dashboard/stats`);
        // const data = await response.json();
        // setStats(data);

        // Simulamos datos por ahora
        setTimeout(() => {
          setStats({
            students: 150,
            pendingTasks: 23,
            upcomingEvents: 5,
            pendingPayments: 12,
          });
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700">Estudiantes</h3>
          <p className="text-3xl font-bold text-primary-600 mt-2">{stats.students}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700">Tareas Pendientes</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingTasks}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700">Eventos Próximos</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.upcomingEvents}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700">Pagos Pendientes</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.pendingPayments}</p>
        </div>
      </div>
      <div className="card overflow-hidden shadow-xl shadow-primary-900/10 border border-primary-900/10">
        <div className="grid md:grid-cols-2">
          <div className="p-6 flex flex-col justify-center gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
                Experiencia inmersiva
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Visualización 3D en tiempo real
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Explora un escenario dinámico que representa tus indicadores clave como si fueran
              objetos vivos. Es ideal para kioscos, pantallas de recepción o para dar impacto a tus
              presentaciones mientras revisas métricas.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Iluminación dinámica y partículas para resaltar los KPIs.</li>
              <li>• Animaciones suaves optimizadas para navegadores de escritorio y móvil.</li>
              <li>• Se integra con tus datos reales a medida que se conecte el backend.</li>
            </ul>
          </div>
          <div className="relative h-72 md:h-[340px] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
            <DashboardScene className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}


