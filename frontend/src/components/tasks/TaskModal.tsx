import { useState, useEffect } from 'react';
import type { Task } from '../../types';
import { ThreeDButton } from '../ui/ThreeDButton';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => Promise<void>;
  task?: Task | null;
}

export function TaskModal({ isOpen, onClose, onSave, task }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setDueDate(task.dueDate);
      setMaxScore(task.maxScore);
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
      setMaxScore(100);
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validaciones del lado del cliente
      if (!title.trim()) throw new Error('El título es requerido');
      if (!description.trim()) throw new Error('La descripción es requerida');
      if (!dueDate) throw new Error('La fecha límite es requerida');
      const d = new Date(dueDate);
      if (isNaN(d.getTime())) throw new Error('Fecha límite inválida');

      await onSave({
        title,
        description,
        dueDate,
        maxScore,
      });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar tarea';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{task ? 'Editar Tarea' : 'Nueva Tarea'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}
          <div>
            <label className="label">Título *</label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Descripción *</label>
            <textarea
              className="input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Fecha Límite *</label>
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Puntos Máximos</label>
            <input
              type="number"
              className="input"
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value))}
              min="0"
              max="1000"
            />
          </div>

          <div className="flex flex-wrap gap-3 justify-end">
            <ThreeDButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              showOrb
            >
              Cancelar
            </ThreeDButton>
            <ThreeDButton type="submit" disabled={isLoading} loading={isLoading} showOrb>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </ThreeDButton>
          </div>
        </form>
      </div>
    </div>
  );
}

