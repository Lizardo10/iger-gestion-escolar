import { useState, useEffect } from 'react';
import { tasksService } from '../services/tasks';
import { TaskModal } from '../components/tasks/TaskModal';
import type { Task } from '../types';
import { ThreeDButton } from '../components/ui/ThreeDButton';
import { useAuth } from '../hooks/useAuth';

export function Tasks() {
  const { hasAnyRole } = useAuth();
  const canManageTasks = hasAnyRole('superadmin', 'admin', 'teacher');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const classId = 'default-class';

  useEffect(() => {
    loadTasks(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTasks = async (reset = false) => {
    try {
      setLoading(true);
      const response = await tasksService.list({ classId, nextToken: reset ? undefined : nextToken });
      setTasks((prev) => (reset ? (response.tasks || []) : [...prev, ...(response.tasks || [])]));
      setNextToken(response.nextToken);
    } catch (error) {
      console.error('Error cargando tareas:', error);
      
      // Si es un error de autenticación, NO hacer logout aquí
      // El interceptor de API lo manejará
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('No authentication token') || errorMessage.includes('401')) {
        console.warn('Error de autenticación al cargar tareas - el interceptor lo manejará');
      }
      
      if (reset) setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!canManageTasks) return;
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    if (!canManageTasks) return;
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSave = async (taskData: Partial<Task>) => {
    if (!canManageTasks) {
      throw new Error('No tienes permisos para administrar tareas');
    }
    try {
      if (selectedTask) {
        await tasksService.update({
          classId,
          taskId: selectedTask.id,
          ...taskData,
        });
      } else {
        await tasksService.create({
          classId,
          title: taskData.title!,
          description: taskData.description!,
          dueDate: taskData.dueDate!,
          maxScore: taskData.maxScore || 100,
          attachments: taskData.attachments || [],
        });
      }
      setIsModalOpen(false);
      loadTasks();
    } catch (err) {
      console.error('Error saving task:', err);
      throw err;
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!canManageTasks) return;
    if (!confirm('¿Está seguro de eliminar esta tarea?')) return;

    try {
      await tasksService.delete(classId, taskId);
      loadTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Error al eliminar tarea');
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
        {canManageTasks && (
          <ThreeDButton onClick={handleCreate} showOrb>
            + Nueva Tarea
          </ThreeDButton>
        )}
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
              {canManageTasks ? (
                <div className="flex gap-2">
                  <ThreeDButton
                    size="sm"
                    variant="ghost"
                    showOrb
                    orbColor={{ primary: '#2563eb', accent: '#60a5fa' }}
                    onClick={() => handleEdit(task)}
                  >
                    Editar
                  </ThreeDButton>
                  <ThreeDButton
                    size="sm"
                    variant="ghost"
                    showOrb
                    orbColor={{ primary: '#dc2626', accent: '#f87171' }}
                    onClick={() => handleDelete(task.id)}
                  >
                    Eliminar
                  </ThreeDButton>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Solo lectura</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {nextToken && !loading && (
        <div className="flex justify-center mt-4">
          <ThreeDButton
            onClick={() => loadTasks(false)}
            variant="secondary"
            showOrb
            orbColor={{ primary: '#94a3b8', accent: '#cbd5f5' }}
          >
            Cargar más
          </ThreeDButton>
        </div>
      )}

      {tasks.length === 0 && !loading && (
        <div className="card text-center py-12">
          <p className="text-gray-600">
            {canManageTasks
              ? 'No hay tareas asignadas. ¡Crea tu primera tarea!'
              : 'Aún no hay tareas disponibles para ti.'}
          </p>
        </div>
      )}

      {canManageTasks && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          task={selectedTask}
        />
      )}
    </div>
  );
}
