import { useEffect, useMemo, useState } from 'react';
import { classesService } from '../services/classes';
import { studentsService } from '../services/students';
import { useAuth } from '../hooks/useAuth';
import type { Class, ClassStudent, Student } from '../types';
import { ThreeDButton } from '../components/ui/ThreeDButton';
import { ClassModal } from '../components/classes/ClassModal';
import { AssignStudentModal } from '../components/classes/AssignStudentModal';
import { DashboardScene } from '../components/3d/DashboardScene';

type StudentMap = Record<string, Student>;

const FALLBACK_ORG_ID = 'org-1';

export function TeacherClasses() {
  const { user } = useAuth();
  const orgId = user?.orgId || FALLBACK_ORG_ID;
  const teacherId = user?.teacherId || user?.id;

  const [classes, setClasses] = useState<Class[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [nextToken, setNextToken] = useState<string | undefined>();

  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [studentsMap, setStudentsMap] = useState<StudentMap>({});

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    void loadClasses(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, teacherId]);

  const assignedStudentsDetailed = useMemo(() => {
    return classStudents.map((assignment) => {
      const student = studentsMap[assignment.studentId];
      return {
        assignment,
        student,
      };
    });
  }, [classStudents, studentsMap]);

  const loadClasses = async (reset = false) => {
    if (!orgId) return;
    setListLoading(true);
    setListError('');

    try {
      const response = await classesService.list({
        orgId,
        limit: 20,
        teacherId: user?.role === 'teacher' ? teacherId : undefined,
        nextToken: reset ? undefined : nextToken,
      });
      setClasses((prev) => (reset ? response.classes : [...prev, ...response.classes]));
      setNextToken(response.nextToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar tus clases';
      setListError(message);
    } finally {
      setListLoading(false);
    }
  };

  const refreshDetail = async (classId: string) => {
    setDetailLoading(true);
    setDetailError('');
    try {
      const response = await classesService.get(orgId, classId);
      setSelectedClass(response.class);
      setClassStudents(response.students);

      const missingIds = response.students
        .map((s) => s.studentId)
        .filter((id) => !studentsMap[id]);

      if (missingIds.length > 0) {
        const students = await Promise.all(
          missingIds.map(async (id) => {
            try {
              const data = await studentsService.get(orgId, id);
              return data.student;
            } catch (error) {
              console.error('No se pudo obtener estudiante', id, error);
              return null;
            }
          })
        );
        setStudentsMap((prev) => {
          const copy = { ...prev };
          students.forEach((student) => {
            if (student) {
              copy[student.id] = student;
            }
          });
          return copy;
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo cargar la clase';
      setDetailError(message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenDetail = (classItem: Class) => {
    setSelectedClass(classItem);
    setClassStudents([]);
    void refreshDetail(classItem.id);
  };

  const handleCreateClass = () => {
    setEditingClass(null);
    setIsClassModalOpen(true);
  };

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    setIsClassModalOpen(true);
  };

  const handleSubmitClass = async (data: {
    name: string;
    grade: string;
    section?: string;
    schoolYear: string;
    cycle?: string;
    capacity?: number;
  }) => {
    if (!orgId) {
      throw new Error('No se encontró una organización válida');
    }

    if (editingClass) {
      await classesService.update({
        orgId,
        classId: editingClass.id,
        name: data.name,
        grade: data.grade,
        section: data.section ?? null,
        schoolYear: data.schoolYear,
        cycle: data.cycle ?? null,
        capacity: data.capacity ?? null,
      });
      setFeedbackMessage('La clase se actualizó correctamente.');
      await loadClasses(true);
      if (selectedClass?.id === editingClass.id) {
        await refreshDetail(editingClass.id);
      }
    } else {
      await classesService.create({
        orgId,
        name: data.name,
        grade: data.grade,
        schoolYear: data.schoolYear,
        section: data.section,
        cycle: data.cycle,
        capacity: data.capacity,
      });
      setFeedbackMessage('Clase creada correctamente.');
      await loadClasses(true);
    }
  };

  const handleAssignStudent = async (studentId: string) => {
    if (!selectedClass) return;
    await classesService.assignStudent({
      orgId,
      classId: selectedClass.id,
      studentId,
    });
    setFeedbackMessage('Estudiante asignado a la clase.');
    await refreshDetail(selectedClass.id);
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClass) return;
    const confirmed = window.confirm('¿Remover a este estudiante de la clase?');
    if (!confirmed) return;
    try {
      await classesService.removeStudent({
        orgId,
        classId: selectedClass.id,
        studentId,
      });
      setFeedbackMessage('El estudiante fue removido.');
      await refreshDetail(selectedClass.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo remover al estudiante';
      alert(message);
    }
  };

  const handleClearFeedback = () => setFeedbackMessage('');

  const isTeacher = user?.role === 'teacher';

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-600 p-6 text-white shadow-xl">
        <div className="absolute inset-0 opacity-50">
          <DashboardScene className="pointer-events-none absolute inset-0" />
        </div>
        <div className="relative z-10 flex flex-col gap-3">
          <h1 className="text-3xl font-bold">Mis Clases</h1>
          <p className="max-w-2xl text-sm md:text-base text-white/80">
            Gestiona tus cursos, asigna estudiantes y mantén la información del salón al día.
            Todos los botones cuentan con animaciones 3D para mantener la estética del campus
            digital.
          </p>
          <div className="flex flex-wrap gap-3">
            <ThreeDButton onClick={handleCreateClass} showOrb orbColor={{ primary: '#ffffff', accent: '#dbeafe' }}>
              + Nueva clase
            </ThreeDButton>
            {isTeacher && (
              <ThreeDButton
                variant="ghost"
                showOrb
                orbColor={{ primary: '#ffffff', accent: '#dbeafe' }}
                onClick={() => void loadClasses(true)}
              >
                Actualizar listado
              </ThreeDButton>
            )}
          </div>
        </div>
      </div>

      {feedbackMessage && (
        <div className="relative rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
          <button
            type="button"
            className="absolute right-3 top-3 text-emerald-600 hover:text-emerald-800"
            onClick={handleClearFeedback}
          >
            ×
          </button>
          {feedbackMessage}
        </div>
      )}

      {listError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          {listError}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {classes.map((classItem) => (
          <div
            key={classItem.id}
            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-md transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary-100 opacity-40 blur-3xl transition group-hover:opacity-70" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{classItem.name}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    classItem.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {classItem.status === 'active' ? 'Activa' : 'Archivada'}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Grado: {classItem.grade}
                {classItem.section ? ` • Sección ${classItem.section}` : ''}
              </p>
              <p className="text-sm text-gray-500">
                Ciclo escolar: {classItem.schoolYear}
                {classItem.cycle && classItem.cycle !== classItem.schoolYear
                  ? ` • ${classItem.cycle}`
                  : ''}
              </p>
              {typeof classItem.capacity === 'number' && (
                <p className="text-sm text-gray-500">Cupo máximo: {classItem.capacity}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <ThreeDButton
                  size="sm"
                  showOrb
                  onClick={() => handleOpenDetail(classItem)}
                  orbColor={{ primary: '#2563eb', accent: '#60a5fa' }}
                >
                  Ver detalles
                </ThreeDButton>
                <ThreeDButton
                  size="sm"
                  variant="ghost"
                  showOrb
                  orbColor={{ primary: '#0f766e', accent: '#34d399' }}
                  onClick={() => handleEditClass(classItem)}
                >
                  Editar
                </ThreeDButton>
              </div>
            </div>
          </div>
        ))}
      </div>

      {classes.length === 0 && !listLoading && !listError && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-gray-500 shadow-sm">
          Aún no tienes clases asignadas. Crea una nueva o espera a que el administrador te
          asigne grupos.
        </div>
      )}

      {nextToken && (
        <div className="flex justify-center">
          <ThreeDButton
            variant="secondary"
            onClick={() => loadClasses(false)}
            loading={listLoading}
            disabled={listLoading}
            showOrb
            orbColor={{ primary: '#94a3b8', accent: '#cbd5f5' }}
          >
            Cargar más
          </ThreeDButton>
        </div>
      )}

      {selectedClass && (
        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {selectedClass.name}{' '}
                <span className="text-sm font-normal text-gray-500">
                  {selectedClass.grade}
                  {selectedClass.section ? ` • Sección ${selectedClass.section}` : ''}
                </span>
              </h2>
              <p className="text-sm text-gray-500">
                Ciclo escolar: {selectedClass.schoolYear}
                {selectedClass.cycle && selectedClass.cycle !== selectedClass.schoolYear
                  ? ` • ${selectedClass.cycle}`
                  : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ThreeDButton
                size="sm"
                showOrb
                orbColor={{ primary: '#2563eb', accent: '#60a5fa' }}
                onClick={() => refreshDetail(selectedClass.id)}
                loading={detailLoading}
                disabled={detailLoading}
              >
                Actualizar detalle
              </ThreeDButton>
              <ThreeDButton
                size="sm"
                showOrb
                orbColor={{ primary: '#22c55e', accent: '#bbf7d0' }}
                onClick={() => setIsAssignModalOpen(true)}
                disabled={detailLoading}
              >
                Asignar estudiante
              </ThreeDButton>
            </div>
          </div>

          {detailError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {detailError}
            </div>
          )}

          {detailLoading && classStudents.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              Cargando estudiantes de la clase...
            </div>
          ) : (
            <div className="mt-6">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Estudiantes asignados</h3>
              {assignedStudentsDetailed.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-gray-500">
                  Todavía no has asignado estudiantes a esta clase.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                          Estudiante
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                          Grado
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                          Asignado el
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {assignedStudentsDetailed.map(({ assignment, student }) => (
                        <tr key={assignment.studentId}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {student
                              ? `${student.firstName} ${student.lastName}`
                              : assignment.studentId}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {student ? student.grade : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(assignment.assignedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <ThreeDButton
                              size="sm"
                              variant="ghost"
                              showOrb
                              orbColor={{ primary: '#dc2626', accent: '#f87171' }}
                              onClick={() => handleRemoveStudent(assignment.studentId)}
                            >
                              Quitar
                            </ThreeDButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        onSubmit={handleSubmitClass}
        initialClass={editingClass ?? undefined}
      />

      {selectedClass && (
        <AssignStudentModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          orgId={orgId}
          excludedStudentIds={classStudents.map((student) => student.studentId)}
          onAssign={handleAssignStudent}
        />
      )}
    </div>
  );
}

