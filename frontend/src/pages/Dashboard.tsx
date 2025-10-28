import { useState, useEffect } from 'react';

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
    <div>
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
    </div>
  );
}


