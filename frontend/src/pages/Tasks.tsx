import { useState, useEffect } from 'react';
import { tasksService } from '../services/tasks';
import { TaskModal } from '../components/tasks/TaskModal';
import type { Task } from '../types';

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const classId = 'default-class';

  useEffect(() => {
    loadTasks(true);
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
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSave = async (taskData: Partial<Task>) => {
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
        <button onClick={handleCreate} className="btn btn-primary">
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
                <button onClick={() => handleEdit(task)} className="text-primary-600 hover:text-primary-800 text-sm">
                  Editar
                </button>
                <button onClick={() => handleDelete(task.id)} className="text-red-600 hover:text-red-800 text-sm">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {nextToken && !loading && (
        <div className="flex justify-center mt-4">
          <button onClick={() => loadTasks(false)} className="btn btn-secondary">
            Cargar más
          </button>
        </div>
      )}

      {tasks.length === 0 && !loading && (
        <div className="card text-center py-12">
          <p className="text-gray-600">No hay tareas asignadas. ¡Crea tu primera tarea!</p>
        </div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        task={selectedTask}
      />
    </div>
  );
}
