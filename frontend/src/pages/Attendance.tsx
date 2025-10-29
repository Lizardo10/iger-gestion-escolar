import { useState } from 'react';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface StudentAttendance {
  id: string;
  name: string;
  status: AttendanceStatus;
}

const MOCK_STUDENTS: StudentAttendance[] = [
  { id: '1', name: 'Juan Pérez', status: 'present' },
  { id: '2', name: 'María García', status: 'present' },
  { id: '3', name: 'Carlos López', status: 'absent' },
  { id: '4', name: 'Ana Martínez', status: 'late' },
];

export function Attendance() {
  const [students, setStudents] = useState<StudentAttendance[]>(MOCK_STUDENTS);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(students.map((s) => (s.id === studentId ? { ...s, status } : s)));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implementar envío al backend
    setTimeout(() => {
      alert('Asistencia guardada correctamente');
      setIsSaving(false);
    }, 1000);
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'excused':
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'Presente';
      case 'absent':
        return 'Ausente';
      case 'late':
        return 'Tarde';
      case 'excused':
        return 'Justificado';
    }
  };

  const stats = {
    present: students.filter((s) => s.status === 'present').length,
    absent: students.filter((s) => s.status === 'absent').length,
    late: students.filter((s) => s.status === 'late').length,
    total: students.length,
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Asistencia</h1>
        <button onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar Asistencia'}
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <label className="label">Fecha:</label>
          <input
            type="date"
            className="input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-2">Presentes</h3>
          <p className="text-2xl font-bold text-green-600">{stats.present}</p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-2">Ausentes</h3>
          <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-2">Tarde</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-2">Total</h3>
          <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
        </div>
      </div>

      <div className="card">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estudiante</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Estado Actual</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="font-medium">{student.name}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(student.status)}`}>
                    {getStatusText(student.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleStatusChange(student.id, 'present')}
                      className={`px-3 py-1 rounded text-sm ${
                        student.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, 'absent')}
                      className={`px-3 py-1 rounded text-sm ${
                        student.status === 'absent' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      ✗
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, 'late')}
                      className={`px-3 py-1 rounded text-sm ${
                        student.status === 'late' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      ⊗
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, 'excused')}
                      className={`px-3 py-1 rounded text-sm ${
                        student.status === 'excused' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      ⊙
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

