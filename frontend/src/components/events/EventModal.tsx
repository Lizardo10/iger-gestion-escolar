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

    try {
      await onSave({
        title,
        description,
        startDate,
        endDate,
        type,
        location,
      });
      onClose();
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

