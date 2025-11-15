import { useEffect, useMemo, useState } from 'react';
import type { Student } from '../../types';
import { studentsService } from '../../services/students';
import { ThreeDButton } from '../ui/ThreeDButton';

interface AssignStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  excludedStudentIds: string[];
  onAssign: (studentId: string) => Promise<void>;
}

interface StudentListState {
  items: Student[];
  nextToken?: string;
  isLoading: boolean;
  error: string;
}

export function AssignStudentModal({
  isOpen,
  onClose,
  orgId,
  excludedStudentIds,
  onAssign,
}: AssignStudentModalProps) {
  const [state, setState] = useState<StudentListState>({
    items: [],
    nextToken: undefined,
    isLoading: false,
    error: '',
  });
  const [search, setSearch] = useState('');
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setState((prev) => ({
      ...prev,
      items: [],
      nextToken: undefined,
      error: '',
    }));
    setSearch('');
    void loadStudents(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const filteredStudents = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return state.items;
    }
    return state.items.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      return (
        fullName.includes(normalized) ||
        student.grade.toLowerCase().includes(normalized) ||
        student.id.toLowerCase().includes(normalized)
      );
    });
  }, [state.items, search]);

  if (!isOpen) {
    return null;
  }

  const loadStudents = async (reset = false) => {
    if (!orgId) return;
    setState((prev) => ({ ...prev, isLoading: true, error: '' }));

    try {
      const response = await studentsService.list({
        orgId,
        limit: 25,
        nextToken: reset ? undefined : state.nextToken,
      });
      setState((prev) => ({
        items: reset ? response.students : [...prev.items, ...response.students],
        nextToken: response.nextToken,
        isLoading: false,
        error: '',
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar los estudiantes';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  };

  const handleAssign = async (studentId: string) => {
    setAssigningId(studentId);
    try {
      await onAssign(studentId);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo asignar al estudiante';
      setState((prev) => ({
        ...prev,
        error: message,
      }));
    } finally {
      setAssigningId(null);
    }
  };

  const isExcluded = (studentId: string) => excludedStudentIds.includes(studentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">Asignar estudiante</h2>
          <p className="text-sm text-gray-500">
            Selecciona un estudiante registrado en la organización para agregarlo a la clase.
          </p>
        </div>

        <div className="px-6 py-4">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, grado o ID..."
            className="input"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {state.error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          {state.isLoading && state.items.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              Cargando estudiantes...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              {search
                ? 'No encontramos estudiantes que coincidan con tu búsqueda.'
                : 'No hay estudiantes registrados aún.'}
            </div>
          ) : (
            <ul className="space-y-3 pb-6">
              {filteredStudents.map((student) => {
                const disabled = isExcluded(student.id);
                const fullName = `${student.firstName} ${student.lastName}`;
                return (
                  <li
                    key={student.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm md:flex-row md:items-center"
                  >
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{fullName}</h3>
                      <p className="text-sm text-gray-500">
                        Grado: {student.grade} • ID: {student.id}
                      </p>
                    </div>
                    <ThreeDButton
                      size="sm"
                      showOrb
                      onClick={() => handleAssign(student.id)}
                      disabled={disabled || assigningId === student.id}
                      loading={assigningId === student.id}
                      orbColor={{ primary: '#2563eb', accent: '#60a5fa' }}
                    >
                      {disabled ? 'Ya asignado' : 'Agregar'}
                    </ThreeDButton>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
          {state.nextToken && (
            <ThreeDButton
              variant="secondary"
              size="sm"
              onClick={() => loadStudents(false)}
              disabled={state.isLoading}
              loading={state.isLoading}
              showOrb
              orbColor={{ primary: '#94a3b8', accent: '#cbd5f5' }}
            >
              Cargar más
            </ThreeDButton>
          )}
          <ThreeDButton
            variant="ghost"
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




