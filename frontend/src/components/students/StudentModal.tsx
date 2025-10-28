import { useState, useEffect } from 'react';
import type { Student } from '../../types';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Partial<Student>) => Promise<void>;
  student?: Student | null;
}

export function StudentModal({ isOpen, onClose, onSave, student }: StudentModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [grade, setGrade] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (student) {
      setFirstName(student.firstName);
      setLastName(student.lastName);
      setBirthDate(student.birthDate);
      setGrade(student.grade);
    } else {
      setFirstName('');
      setLastName('');
      setBirthDate('');
      setGrade('');
    }
  }, [student, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSave({
        firstName,
        lastName,
        birthDate,
        grade,
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
        <h2 className="text-2xl font-bold mb-4">
          {student ? 'Editar Estudiante' : 'Nuevo Estudiante'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input
              type="text"
              className="input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Apellido *</label>
            <input
              type="text"
              className="input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Fecha de Nacimiento *</label>
            <input
              type="date"
              className="input"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Grado *</label>
            <select
              className="input"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              required
            >
              <option value="">Seleccione un grado</option>
              <option value="1ro">1ro Primaria</option>
              <option value="2do">2do Primaria</option>
              <option value="3ro">3ro Primaria</option>
              <option value="4to">4to Primaria</option>
              <option value="5to">5to Primaria</option>
              <option value="6to">6to Primaria</option>
              <option value="1ro Sec">1ro Secundaria</option>
              <option value="2do Sec">2do Secundaria</option>
              <option value="3ro Sec">3ro Secundaria</option>
              <option value="4to Sec">4to Secundaria</option>
              <option value="5to Sec">5to Secundaria</option>
            </select>
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



