import { useEffect, useState } from 'react';
import type { Class } from '../../types';
import { ThreeDButton } from '../ui/ThreeDButton';

const gradeOptions = [
  '1ro Primaria',
  '2do Primaria',
  '3ro Primaria',
  '4to Primaria',
  '5to Primaria',
  '6to Primaria',
  '1ro Básico',
  '2do Básico',
  '3ro Básico',
];

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    grade: string;
    schoolYear: string;
    section?: string;
    cycle?: string;
    capacity?: number;
  }) => Promise<void>;
  initialClass?: Class | null;
}

export function ClassModal({ isOpen, onClose, onSubmit, initialClass }: ClassModalProps) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [cycle, setCycle] = useState('');
  const [capacity, setCapacity] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialClass) {
      setName(initialClass.name ?? '');
      setGrade(initialClass.grade ?? '');
      setSection(initialClass.section ?? '');
      setSchoolYear(initialClass.schoolYear ?? '');
      setCycle(initialClass.cycle ?? '');
      setCapacity(
        typeof initialClass.capacity === 'number' ? String(initialClass.capacity) : ''
      );
    } else {
      setName('');
      setGrade('');
      setSection('');
      setSchoolYear(new Date().getFullYear().toString());
      setCycle('');
      setCapacity('');
    }
    setError('');
    setIsSubmitting(false);
  }, [isOpen, initialClass]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!name.trim()) {
        throw new Error('El nombre de la clase es obligatorio');
      }
      if (!grade.trim()) {
        throw new Error('Selecciona el grado');
      }
      if (!schoolYear.trim()) {
        throw new Error('El ciclo escolar es obligatorio');
      }

      const capacityNumber =
        capacity.trim() !== '' ? Number.parseInt(capacity.trim(), 10) : undefined;

      if (capacityNumber !== undefined && (Number.isNaN(capacityNumber) || capacityNumber <= 0)) {
        throw new Error('El cupo debe ser un número positivo');
      }

      await onSubmit({
        name: name.trim(),
        grade: grade.trim(),
        section: section.trim() ? section.trim() : undefined,
        schoolYear: schoolYear.trim(),
        cycle: cycle.trim() ? cycle.trim() : undefined,
        capacity: capacityNumber,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar la clase';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialClass ? 'Editar clase' : 'Nueva clase'}
          </h2>
          <p className="text-sm text-gray-500">
            Define los datos de la clase de nivel básico y mantén la coherencia con el ciclo
            escolar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">Nombre de la clase *</label>
              <input
                className="input"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Matemática Básica A"
                required
              />
            </div>

            <div>
              <label className="label">Grado *</label>
              <select
                className="input"
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
                required
              >
                <option value="">Selecciona un grado</option>
                {gradeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Sección</label>
              <input
                className="input"
                type="text"
                value={section}
                onChange={(event) => setSection(event.target.value)}
                placeholder="Ej. A, B..."
                maxLength={10}
              />
            </div>

            <div>
              <label className="label">Ciclo escolar *</label>
              <input
                className="input"
                type="text"
                value={schoolYear}
                onChange={(event) => setSchoolYear(event.target.value)}
                placeholder="2025"
                required
              />
            </div>

            <div>
              <label className="label">Ciclo (opcional)</label>
              <input
                className="input"
                type="text"
                value={cycle}
                onChange={(event) => setCycle(event.target.value)}
                placeholder="Ciclo básico matutino"
              />
            </div>

            <div>
              <label className="label">Cupo máximo</label>
              <input
                className="input"
                type="number"
                min={1}
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                placeholder="Ej. 25"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4">
            <ThreeDButton
              type="button"
              variant="secondary"
              showOrb
              orbColor={{ primary: '#94a3b8', accent: '#cbd5f5' }}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </ThreeDButton>
            <ThreeDButton type="submit" loading={isSubmitting} disabled={isSubmitting} showOrb>
              {initialClass ? 'Guardar cambios' : 'Crear clase'}
            </ThreeDButton>
          </div>
        </form>
      </div>
    </div>
  );
}




