import { useState, useEffect } from 'react';
import { tasksService } from '../services/tasks';
import type { Task } from '../types';

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Mock classId para pruebas - en producción vendría del contexto de autenticación
  const classId = 'default-class';
  const orgId = 'default-org';

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await tasksService.list({ classId });
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Error cargando tareas:', error);
      // Por ahora, si hay error, mostramos array vacío
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Cargando tareas...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tareas</h1>
        <button onClick={() => setIsCreating(true)} className="btn btn-primary">
          + Nueva Tarea
        </button>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{task.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                <div className="mt-3 flex gap-4 text-sm text-gray-500">
                  <span>📅 Fecha límite: {task.dueDate}</span>
                  <span>📊 Puntos: {task.maxScore}</span>
                  {task.attachments && task.attachments.length > 0 && (
                    <span>📎 {task.attachments.length} archivo(s)</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="text-primary-600 hover:text-primary-800 text-sm">Ver</button>
                <button className="text-gray-600 hover:text-gray-800 text-sm">Entregar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && !loading && (
        <div className="card text-center py-12">
          <p className="text-gray-600">No hay tareas asignadas. ¡Crea tu primera tarea!</p>
        </div>
      )}

      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Nueva Tarea (Próximamente)</h2>
            <p className="text-gray-600 mb-4">La funcionalidad de crear tareas estará disponible pronto.</p>
            <button onClick={() => setIsCreating(false)} className="btn btn-secondary w-full">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
