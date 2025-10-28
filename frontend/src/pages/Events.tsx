import { useState, useEffect } from 'react';
import { eventsService } from '../services/events';
import type { Event } from '../types';

export function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'list' | 'calendar'>('list');

  const orgId = 'default-org';

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsService.list({ orgId });
      setEvents(response.events || []);
    } catch (error) {
      console.error('Error cargando eventos:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'parent_meeting':
        return 'bg-blue-100 text-blue-800';
      case 'academic':
        return 'bg-green-100 text-green-800';
      case 'social':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Cargando eventos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Eventos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedView('list')}
            className={`btn ${selectedView === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Lista
          </button>
          <button
            onClick={() => setSelectedView('calendar')}
            className={`btn ${selectedView === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Calendario
          </button>
          <button className="btn btn-primary">+ Nuevo Evento</button>
        </div>
      </div>

      {selectedView === 'list' && (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{event.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${getEventTypeColor(event.type)}`}>
                      {event.type}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>📅 {formatDate(event.startDate)}</span>
                    {event.location && <span>📍 {event.location}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-primary-600 hover:text-primary-800 text-sm">Ver</button>
                  <button className="text-gray-600 hover:text-gray-800 text-sm">Editar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedView === 'calendar' && (
        <div className="card">
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">📅 Vista de Calendario</p>
            <p className="text-sm text-gray-500">Vista de calendario próximamente (integración con librería de calendario)</p>
          </div>
        </div>
      )}

      {events.length === 0 && !loading && (
        <div className="card text-center py-12">
          <p className="text-gray-600">No hay eventos programados. ¡Crea tu primer evento!</p>
        </div>
      )}
    </div>
  );
}
