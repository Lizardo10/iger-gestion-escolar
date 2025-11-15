import { useEffect, useMemo, useState } from 'react';
import { teachersService } from '../services/teachers';
import { useAuth } from '../hooks/useAuth';
import type { Teacher } from '../types';
import { ThreeDButton } from '../components/ui/ThreeDButton';
import { TeacherModal } from '../components/teachers/TeacherModal';
import { TeacherAssignmentsModal } from '../components/teachers/TeacherAssignmentsModal';

type StatusFilter = 'all' | 'active' | 'inactive' | 'pending_credentials';

const statusLabels: Record<StatusFilter, string> = {
  all: 'Todos',
  active: 'Activos',
  inactive: 'Inactivos',
  pending_credentials: 'Pendiente de credenciales',
};

const statusBadgeStyles: Record<'active' | 'inactive' | 'pending_credentials', string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-200 text-gray-700',
  pending_credentials: 'bg-amber-100 text-amber-700',
};

export function Teachers() {
  const { user, isLoading: authLoading } = useAuth();
  const orgId = user?.orgId ?? 'org-1';

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [nextToken, setNextToken] = useState<string | undefined>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const [assignmentsTeacher, setAssignmentsTeacher] = useState<Teacher | null>(null);
  const [isAssignmentsOpen, setIsAssignmentsOpen] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState('');

  const canLoad = useMemo(() => !!orgId && !authLoading, [orgId, authLoading]);

  useEffect(() => {
    if (!canLoad) return;
    loadTeachers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoad, statusFilter]);

  const loadTeachers = async (reset = false) => {
    if (!orgId) return;
    setIsLoading(true);
    setError('');

    try {
      const response = await teachersService.list({
        orgId,
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 20,
        nextToken: reset ? undefined : nextToken,
      });
      setTeachers((prev) => (reset ? response.teachers : [...prev, ...response.teachers]));
      setNextToken(response.nextToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar los profesores';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedTeacher(null);
    setIsModalOpen(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleAssignments = (teacher: Teacher) => {
    setAssignmentsTeacher(teacher);
    setIsAssignmentsOpen(true);
  };

  const handleSave = async (data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    specialization?: string;
    subjects: string[];
    status?: 'active' | 'inactive' | 'pending_credentials';
  }) => {
    if (!orgId) return;

    try {
      if (selectedTeacher) {
        await teachersService.update({
          orgId,
          teacherId: selectedTeacher.id,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone ?? null,
          specialization: data.specialization ?? null,
          subjects: data.subjects,
          status: data.status,
        });
        setFeedbackMessage('El profesor se actualizó correctamente.');
      } else {
        const result = await teachersService.create({
          orgId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email!,
          phone: data.phone,
          specialization: data.specialization,
          subjects: data.subjects,
        });
        if (result.temporaryPassword) {
          setFeedbackMessage(
            `Profesor creado. Contraseña temporal enviada: ${result.temporaryPassword}`
          );
        } else {
          setFeedbackMessage('Profesor creado correctamente.');
        }
      }
      setIsModalOpen(false);
      await loadTeachers(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar el profesor';
      throw new Error(message);
    }
  };

  const handleDelete = async (teacher: Teacher) => {
    if (!orgId) return;
    const confirmed = window.confirm(
      `¿Eliminar al profesor ${teacher.firstName} ${teacher.lastName}? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    try {
      await teachersService.remove(orgId, teacher.id);
      setFeedbackMessage('Profesor eliminado correctamente.');
      await loadTeachers(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar el profesor';
      alert(message);
    }
  };

  const handleResetPassword = async (teacher: Teacher) => {
    if (!orgId) return;

    try {
      const result = await teachersService.resetPassword(orgId, teacher.id);
      if (result.temporaryPassword) {
        setFeedbackMessage(
          `Contraseña temporal para ${teacher.email}: ${result.temporaryPassword}`
        );
      } else {
        setFeedbackMessage('Se generó una nueva contraseña temporal.');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo generar la contraseña temporal';
      alert(message);
    }
  };

  const clearFeedback = () => setFeedbackMessage('');

  const hasTeachers = teachers.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profesores</h1>
          <p className="text-gray-500">
            Crea, edita y gestiona las clases asignadas a cada profesor del nivel básico.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <select
            className="input w-full sm:w-48"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
            }}
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ThreeDButton onClick={handleCreate} showOrb>
            + Nuevo Profesor
          </ThreeDButton>
        </div>
      </div>

      {feedbackMessage && (
        <div className="relative rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
          <button
            type="button"
            className="absolute right-3 top-3 text-emerald-600 hover:text-emerald-800"
            onClick={clearFeedback}
          >
            ×
          </button>
          {feedbackMessage}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        {!hasTeachers && isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            Cargando profesores...
          </div>
        ) : !hasTeachers ? (
          <div className="text-center py-12 text-gray-500">
            No hay profesores registrados todavía. Crea el primero con el botón &ldquo;Nuevo
            Profesor&rdquo;.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-sm font-semibold text-gray-600">
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Correo</th>
                    <th className="px-4 py-3">Especialidad</th>
                    <th className="px-4 py-3">Asignaturas</th>
                    <th className="px-4 py-3">Clases</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">
                          {teacher.firstName} {teacher.lastName}
                        </div>
                        {teacher.phone && (
                          <div className="text-xs text-gray-500 mt-0.5">{teacher.phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700 break-words">{teacher.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        {teacher.specialization ? (
                          <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">
                            {teacher.specialization}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Sin especificar</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {teacher.subjects?.length
                          ? teacher.subjects.join(', ')
                          : 'Sin asignaturas registradas'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {teacher.classes?.length ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            statusBadgeStyles[teacher.status ?? 'active']
                          }`}
                        >
                          {teacher.status === 'pending_credentials'
                            ? 'Pendiente'
                            : teacher.status === 'inactive'
                            ? 'Inactivo'
                            : 'Activo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2 justify-end">
                          <ThreeDButton
                            size="sm"
                            variant="ghost"
                            showOrb
                            orbColor={{ primary: '#2563eb', accent: '#60a5fa' }}
                            onClick={() => handleAssignments(teacher)}
                          >
                            Ver clases
                          </ThreeDButton>
                          <ThreeDButton
                            size="sm"
                            variant="ghost"
                            showOrb
                            orbColor={{ primary: '#7c3aed', accent: '#c4b5fd' }}
                            onClick={() => handleResetPassword(teacher)}
                          >
                            Resetear clave
                          </ThreeDButton>
                          <ThreeDButton
                            size="sm"
                            variant="ghost"
                            showOrb
                            orbColor={{ primary: '#0f766e', accent: '#34d399' }}
                            onClick={() => handleEdit(teacher)}
                          >
                            Editar
                          </ThreeDButton>
                          <ThreeDButton
                            size="sm"
                            variant="ghost"
                            showOrb
                            orbColor={{ primary: '#dc2626', accent: '#f87171' }}
                            onClick={() => handleDelete(teacher)}
                          >
                            Eliminar
                          </ThreeDButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {nextToken && (
              <div className="flex justify-center border-t border-gray-100 px-4 py-3">
                <ThreeDButton
                  variant="secondary"
                  size="sm"
                  onClick={() => loadTeachers(false)}
                  loading={isLoading}
                  disabled={isLoading}
                  showOrb
                  orbColor={{ primary: '#94a3b8', accent: '#cbd5f5' }}
                >
                  {isLoading ? 'Cargando...' : 'Cargar más'}
                </ThreeDButton>
              </div>
            )}
          </>
        )}
      </div>

      <TeacherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        teacher={selectedTeacher}
      />

      <TeacherAssignmentsModal
        isOpen={isAssignmentsOpen}
        onClose={() => setIsAssignmentsOpen(false)}
        teacher={assignmentsTeacher}
        orgId={orgId}
      />
    </div>
  );
}





