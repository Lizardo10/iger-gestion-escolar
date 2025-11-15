import { useEffect, useState } from 'react';
import type { Teacher } from '../../types';
import { ThreeDButton } from '../ui/ThreeDButton';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    specialization?: string;
    subjects: string[];
    status?: 'active' | 'inactive' | 'pending_credentials';
  }) => Promise<void>;
  teacher?: Teacher | null;
}

export function TeacherModal({ isOpen, onClose, onSave, teacher }: TeacherModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [subjectsText, setSubjectsText] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'pending_credentials'>('active');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (teacher) {
      setFirstName(teacher.firstName ?? '');
      setLastName(teacher.lastName ?? '');
      setEmail(teacher.email ?? '');
      setPhone(teacher.phone ?? '');
      setSpecialization(teacher.specialization ?? '');
      setSubjectsText((teacher.subjects || []).join(', '));
      setStatus(teacher.status ?? 'active');
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setSpecialization('');
      setSubjectsText('');
      setStatus('active');
    }
    setError('');
  }, [teacher, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!firstName.trim()) {
        throw new Error('El nombre es obligatorio');
      }
      if (!lastName.trim()) {
        throw new Error('El apellido es obligatorio');
      }
      if (!teacher && !email.trim()) {
        throw new Error('El correo es obligatorio');
      }
      if (!teacher && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())) {
        throw new Error('El correo no tiene un formato válido');
      }

      const subjects = subjectsText
        .split(',')
        .map((subject) => subject.trim())
        .filter(Boolean);

      await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: teacher ? undefined : email.trim().toLowerCase(),
        phone: phone.trim() ? phone.trim() : undefined,
        specialization: specialization.trim() ? specialization.trim() : undefined,
        subjects,
        status,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar el profesor';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">
            {teacher ? 'Editar Profesor' : 'Nuevo Profesor'}
          </h2>
          <p className="text-sm text-gray-500">
            Gestiona los datos básicos y las áreas de especialización
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre *</label>
              <input
                type="text"
                className="input"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Apellido *</label>
              <input
                type="text"
                className="input"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Correo electrónico *</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required={!teacher}
                disabled={!!teacher}
              />
            </div>

            <div>
              <label className="label">Teléfono</label>
              <input
                type="tel"
                className="input"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="(+502) 5555-5555"
              />
            </div>

            <div>
              <label className="label">Especialidad</label>
              <input
                type="text"
                className="input"
                value={specialization}
                onChange={(event) => setSpecialization(event.target.value)}
                placeholder="Ej. Matemática, Ciencias"
              />
            </div>

            <div>
              <label className="label">Estado</label>
              <select
                className="input"
                value={status}
                onChange={(event) => setStatus(event.target.value as typeof status)}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="pending_credentials">Pendiente de credenciales</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label">Asignaturas (separadas por coma)</label>
              <textarea
                className="input min-h-[90px]"
                value={subjectsText}
                onChange={(event) => setSubjectsText(event.target.value)}
                placeholder="Matemática, Física, Química"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-end border-t border-gray-100 pt-4">
            <ThreeDButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              showOrb
              orbColor={{ primary: '#94a3b8', accent: '#cbd5f5' }}
            >
              Cancelar
            </ThreeDButton>
            <ThreeDButton type="submit" loading={isLoading} disabled={isLoading} showOrb>
              {teacher ? 'Guardar Cambios' : 'Crear Profesor'}
            </ThreeDButton>
          </div>
        </form>
      </div>
    </div>
  );
}





