import { useEffect, useState } from 'react';
import { classesService } from '../../services/classes';
import type { Class, Teacher } from '../../types';
import { ThreeDButton } from '../ui/ThreeDButton';

interface TeacherAssignmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  orgId: string;
}

export function TeacherAssignmentsModal({ isOpen, onClose, teacher, orgId }: TeacherAssignmentsModalProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !teacher) {
      setClasses([]);
      setError('');
      return;
    }

    let isMounted = true;

    const fetchClasses = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await classesService.list({
          orgId,
          teacherId: teacher.id,
          status: 'active',
          limit: 50,
        });
        if (isMounted) {
          setClasses(response.classes);
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Error al cargar las clases';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchClasses();

    return () => {
      isMounted = false;
    };
  }, [isOpen, teacher, orgId]);

  if (!isOpen || !teacher) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">Clases asignadas</h2>
          <p className="text-sm text-gray-500">
            {teacher.firstName} {teacher.lastName} • {teacher.email}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              Cargando clases asignadas...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
              {error}
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay clases asignadas actualmente para este profesor.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((classItem) => (
                <div
                  key={classItem.id}
                  className="border border-gray-200 rounded-xl p-4 shadow-sm bg-gradient-to-br from-gray-50 to-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{classItem.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        classItem.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {classItem.status === 'active' ? 'Activa' : 'Archivada'}
                    </span>
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>
                      <strong>Grado:</strong> {classItem.grade}
                      {classItem.section ? ` • Sección ${classItem.section}` : ''}
                    </li>
                    <li>
                      <strong>Ciclo escolar:</strong> {classItem.schoolYear}
                      {classItem.cycle && classItem.cycle !== classItem.schoolYear
                        ? ` • ${classItem.cycle}`
                        : ''}
                    </li>
                    {typeof classItem.capacity === 'number' && (
                      <li>
                        <strong>Cupo:</strong> {classItem.capacity} alumnos
                      </li>
                    )}
                    <li>
                      <strong>Creada:</strong>{' '}
                      {new Date(classItem.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <ThreeDButton
            variant="secondary"
            onClick={onClose}
            showOrb
            orbColor={{ primary: '#94a3b8', accent: '#cbd5f5' }}
          >
            Cerrar
          </ThreeDButton>
        </div>
      </div>
    </div>
  );
}





