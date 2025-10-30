import { useState, useEffect } from 'react';
import type { Event } from '../../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<Event>) => Promise<void>;
  event?: Event | null;
}

export function EventModal({ isOpen, onClose, onSave, event }: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState<'meeting' | 'activity' | 'holiday'>('meeting');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description);
      setStartDate(event.startDate);
      setEndDate(event.endDate);
      setType(event.type);
    } else {
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setType('meeting');
      setLocation('');
    }
  }, [event, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validaciones del lado del cliente
      if (!title.trim()) throw new Error('El título es requerido');
      if (!description.trim()) throw new Error('La descripción es requerida');
      if (!startDate) throw new Error('La fecha inicio es requerida');
      if (!endDate) throw new Error('La fecha fin es requerida');
      const d1 = new Date(startDate);
      const d2 = new Date(endDate);
      if (isNaN(d1.getTime())) throw new Error('Fecha inicio inválida');
      if (isNaN(d2.getTime())) throw new Error('Fecha fin inválida');
      if (d2 < d1) throw new Error('La fecha fin no puede ser anterior a inicio');

      await onSave({
        title,
        description,
        startDate,
        endDate,
        type,
        location,
      });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar evento';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{event ? 'Editar Evento' : 'Nuevo Evento'}</h2>

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
            <label className="label">Fecha Inicio *</label>
            <input
              type="datetime-local"
              className="input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Fecha Fin *</label>
            <input
              type="datetime-local"
              className="input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Tipo *</label>
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              required
            >
              <option value="meeting">Reunión</option>
              <option value="activity">Actividad</option>
              <option value="holiday">Feriado</option>
            </select>
          </div>

          <div>
            <label className="label">Ubicación</label>
            <input
              type="text"
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

