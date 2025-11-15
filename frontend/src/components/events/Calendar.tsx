import { useState } from 'react';
import type { Event } from '../../types';
import { ThreeDButton } from '../ui/ThreeDButton';

interface CalendarProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
}

export function Calendar({ events, onEventClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Obtener el primer día del mes/semana
  const getStartOfPeriod = () => {
    const date = new Date(currentDate);
    if (viewMode === 'month') {
      date.setDate(1);
      const day = date.getDay();
      date.setDate(date.getDate() - day); // Retroceder al domingo
    } else if (viewMode === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() - day);
    } else {
      // day view - no cambio
    }
    return date;
  };

  // Obtener días del periodo
  const getDaysInPeriod = () => {
    const start = getStartOfPeriod();
    const days: Date[] = [];
    const count = viewMode === 'month' ? 42 : viewMode === 'week' ? 7 : 1;

    for (let i = 0; i < count; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Obtener eventos para una fecha específica
  const getEventsForDate = (date: Date): Event[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((event) => {
      const eventStart = new Date(event.startDate).toISOString().split('T')[0];
      const eventEnd = new Date(event.endDate).toISOString().split('T')[0];
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  };

  // Formatear fecha para mostrar
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Navegar al mes/semana anterior
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  // Navegar al mes/semana siguiente
  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  // Ir a hoy
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Obtener color según tipo de evento
  const getEventColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-500';
      case 'activity':
        return 'bg-green-500';
      case 'holiday':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const days = getDaysInPeriod();
  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="card">
      {/* Controles */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b">
        <div className="flex items-center gap-2">
          <ThreeDButton
            onClick={goToPrevious}
            size="sm"
            variant="secondary"
            showOrb
            className="px-3"
            aria-label="Anterior"
          >
            ←
          </ThreeDButton>
          <ThreeDButton
            onClick={goToToday}
            size="sm"
            variant="secondary"
            showOrb
            className="px-4"
          >
            Hoy
          </ThreeDButton>
          <ThreeDButton
            onClick={goToNext}
            size="sm"
            variant="secondary"
            showOrb
            className="px-3"
            aria-label="Siguiente"
          >
            →
          </ThreeDButton>
          <h2 className="text-xl font-bold ml-4 capitalize">{monthName}</h2>
        </div>
        <div className="flex gap-2">
          <ThreeDButton
            onClick={() => setViewMode('month')}
            size="sm"
            variant={viewMode === 'month' ? 'primary' : 'secondary'}
            showOrb
            orbColor={
              viewMode === 'month'
                ? { primary: '#2563eb', accent: '#38bdf8' }
                : { primary: '#94a3b8', accent: '#cbd5f5' }
            }
          >
            Mes
          </ThreeDButton>
          <ThreeDButton
            onClick={() => setViewMode('week')}
            size="sm"
            variant={viewMode === 'week' ? 'primary' : 'secondary'}
            showOrb
            orbColor={
              viewMode === 'week'
                ? { primary: '#2563eb', accent: '#38bdf8' }
                : { primary: '#94a3b8', accent: '#cbd5f5' }
            }
          >
            Semana
          </ThreeDButton>
          <ThreeDButton
            onClick={() => setViewMode('day')}
            size="sm"
            variant={viewMode === 'day' ? 'primary' : 'secondary'}
            showOrb
            orbColor={
              viewMode === 'day'
                ? { primary: '#2563eb', accent: '#38bdf8' }
                : { primary: '#94a3b8', accent: '#cbd5f5' }
            }
          >
            Día
          </ThreeDButton>
        </div>
      </div>

      {/* Vista de calendario */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-7 gap-1">
          {/* Días de la semana */}
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <div key={day} className="p-2 text-center font-semibold text-gray-600 text-sm">
              {day}
            </div>
          ))}
          {/* Días del mes */}
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const dayEvents = getEventsForDate(day);

            return (
              <div
                key={index}
                className={`
                  min-h-[80px] p-1 border border-gray-200 rounded
                  ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                  ${isToday ? 'ring-2 ring-primary-500' : ''}
                `}
              >
                <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-primary-600' : ''}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className={`
                        text-xs p-1 rounded truncate cursor-pointer hover:opacity-80
                        ${getEventColor(event.type)} text-white
                      `}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">+{dayEvents.length - 3} más</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'week' && (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const dayEvents = getEventsForDate(day);

            return (
              <div
                key={index}
                className={`
                  border rounded-lg p-2
                  ${isToday ? 'ring-2 ring-primary-500 bg-primary-50' : 'bg-white border-gray-200'}
                `}
              >
                <div className={`font-semibold mb-2 ${isToday ? 'text-primary-600' : ''}`}>
                  {formatDate(day)}
                </div>
                <div className="space-y-1">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className={`
                        text-xs p-2 rounded cursor-pointer hover:opacity-80
                        ${getEventColor(event.type)} text-white
                      `}
                      title={event.title}
                    >
                      <div className="font-semibold">{event.title}</div>
                      <div className="text-xs opacity-90">
                        {new Date(event.startDate).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'day' && (
        <div>
          <div className="font-semibold text-lg mb-4">
            {currentDate.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          <div className="space-y-2">
            {getEventsForDate(currentDate).map((event) => (
              <div
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className={`
                  p-4 rounded-lg cursor-pointer hover:opacity-90 transition-opacity
                  ${getEventColor(event.type)} text-white
                `}
              >
                <div className="font-semibold text-lg mb-2">{event.title}</div>
                <div className="text-sm opacity-90 mb-2">{event.description}</div>
                <div className="text-xs opacity-80">
                  {new Date(event.startDate).toLocaleString('es-ES')} -{' '}
                  {new Date(event.endDate).toLocaleString('es-ES')}
                </div>
                {event.location && (
                  <div className="text-xs opacity-80 mt-1">📍 {event.location}</div>
                )}
              </div>
            ))}
            {getEventsForDate(currentDate).length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No hay eventos para este día
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="mt-6 pt-4 border-t flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Reunión</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Actividad</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span>Feriado</span>
        </div>
      </div>
    </div>
  );
}

