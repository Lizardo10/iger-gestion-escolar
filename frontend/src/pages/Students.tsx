import { useState, useEffect } from 'react';
import { studentsService, type CreateStudentParams } from '../services/students';
import { StudentModal } from '../components/students/StudentModal';
import type { Student } from '../types';

const MOCK_ORG_ID = 'org-1'; // TODO: Obtener del contexto de autenticación

export function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadStudents();
  }, [page]);

  const loadStudents = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await studentsService.list({
        orgId: MOCK_ORG_ID,
        page,
        limit,
      });
      setStudents(data.students);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estudiantes');
      console.error('Error loading students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleSave = async (studentData: Partial<Student>) => {
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
        <button onClick={handleCreate} className="btn btn-primary">
          + Nuevo Estudiante
        </button>
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
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(student)}
                            className="text-primary-600 hover:text-primary-800"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {total > limit && (
              <div className="flex justify-between items-center px-4 py-3 border-t">
                <div className="text-sm text-gray-600">
                  Mostrando {students.length} de {total} estudiantes
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="btn btn-secondary text-sm"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page * limit >= total}
                    className="btn btn-secondary text-sm"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        student={selectedStudent}
      />
    </div>
  );
}
