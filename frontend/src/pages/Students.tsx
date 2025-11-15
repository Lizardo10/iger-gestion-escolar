import { useState, useEffect } from 'react';
import { studentsService, type CreateStudentParams } from '../services/students';
import { StudentModal } from '../components/students/StudentModal';
import type { Student } from '../types';
import { ThreeDButton } from '../components/ui/ThreeDButton';
import { useAuth } from '../hooks/useAuth';

const MOCK_ORG_ID = 'org-1'; // TODO: Obtener del contexto de autenticación

export function Students() {
  const { hasAnyRole } = useAuth();
  const canManageStudents = hasAnyRole('superadmin', 'admin');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  const limit = 20;

  useEffect(() => {
    loadStudents(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStudents = async (reset = false) => {
    setIsLoading(true);
    setError('');

    try {
      const data = await studentsService.list({
        orgId: MOCK_ORG_ID,
        limit,
        nextToken: reset ? undefined : nextToken,
      });
      setStudents((prev) => (reset ? data.students : [...prev, ...data.students]));
      setNextToken(data.nextToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estudiantes');
      console.error('Error loading students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    if (!canManageStudents) return;
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (student: Student) => {
    if (!canManageStudents) return;
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleSave = async (studentData: Partial<Student>) => {
    if (!canManageStudents) {
      throw new Error('No tienes permisos para administrar estudiantes');
    }
    try {
      if (selectedStudent) {
        await studentsService.update({
          orgId: MOCK_ORG_ID,
          studentId: selectedStudent.id,
          ...studentData,
        });
      } else {
        const createParams: CreateStudentParams = {
          orgId: MOCK_ORG_ID,
          firstName: studentData.firstName!,
          lastName: studentData.lastName!,
          birthDate: studentData.birthDate!,
          grade: studentData.grade!,
        };
        await studentsService.create(createParams);
      }
      setIsModalOpen(false);
      loadStudents();
    } catch (err) {
      console.error('Error saving student:', err);
      throw err;
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!canManageStudents) return;
    if (!confirm('¿Está seguro de eliminar este estudiante?')) return;

    try {
      await studentsService.delete(MOCK_ORG_ID, studentId);
      loadStudents();
    } catch (err) {
      console.error('Error deleting student:', err);
      alert('Error al eliminar estudiante');
    }
  };

  if (isLoading && students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando estudiantes...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Estudiantes</h1>
        {canManageStudents && (
          <ThreeDButton onClick={handleCreate} showOrb>
            + Nuevo Estudiante
          </ThreeDButton>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        {students.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            No hay estudiantes registrados
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Fecha de Nacimiento
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Grado</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="px-4 py-3">{student.birthDate}</td>
                      <td className="px-4 py-3">{student.grade}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            student.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {student.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canManageStudents ? (
                          <div className="flex gap-2 justify-end">
                            <ThreeDButton
                              size="sm"
                              variant="ghost"
                              showOrb
                              onClick={() => handleEdit(student)}
                              orbColor={{ primary: '#2563eb', accent: '#60a5fa' }}
                            >
                              Editar
                            </ThreeDButton>
                            <ThreeDButton
                              size="sm"
                              variant="ghost"
                              showOrb
                              onClick={() => handleDelete(student.id)}
                              orbColor={{ primary: '#dc2626', accent: '#f87171' }}
                            >
                              Eliminar
                            </ThreeDButton>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Solo lectura</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {nextToken && (
              <div className="flex justify-center px-4 py-3 border-t">
                <ThreeDButton
                  onClick={() => loadStudents(false)}
                  variant="secondary"
                  size="sm"
                  showOrb
                  orbColor={{ primary: '#94a3b8', accent: '#cbd5f5' }}
                >
                  Cargar más
                </ThreeDButton>
              </div>
            )}
          </>
        )}
      </div>

      {canManageStudents && (
        <StudentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          student={selectedStudent}
        />
      )}
    </div>
  );
}
