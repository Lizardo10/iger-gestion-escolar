import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ThreeDButton } from '../components/ui/ThreeDButton';

export function Profile() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar actualización de perfil
    alert('Actualización de perfil próximamente disponible');
    setIsEditing(false);
  };

  const handleLogout = async () => {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
      await logout();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Información del Usuario */}
        <div className="md:col-span-2">
          <div className="card">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center text-white text-3xl font-semibold">
                {user?.firstName?.[0]?.toUpperCase() || user?.email[0].toUpperCase()}
                {user?.lastName?.[0]?.toUpperCase() || ''}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-gray-600">{user?.email}</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800">
                  {user?.role === 'superadmin' ? 'Super Administrador' :
                   user?.role === 'admin' ? 'Administrador' :
                   user?.role === 'teacher' ? 'Maestro' :
                   'Estudiante'}
                </span>
              </div>
            </div>

            {!isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Nombre</label>
                  <p className="text-gray-900">{user?.firstName || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Apellido</label>
                  <p className="text-gray-900">{user?.lastName || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Email</label>
                  <p className="text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">ID de Usuario</label>
                  <p className="text-gray-900 font-mono text-sm">{user?.id}</p>
                </div>
                {user?.orgId && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Organización</label>
                    <p className="text-gray-900">{user.orgId}</p>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <ThreeDButton onClick={() => setIsEditing(true)} showOrb>
                    Editar Perfil
                  </ThreeDButton>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nombre</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Apellido</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    disabled
                    title="El email no se puede cambiar"
                  />
                  <p className="text-xs text-gray-500 mt-1">El email no se puede modificar</p>
                </div>
                <div className="pt-4 border-t flex flex-wrap gap-3">
                  <ThreeDButton type="submit" showOrb loading={false}>
                    Guardar Cambios
                  </ThreeDButton>
                  <ThreeDButton
                    type="button"
                    variant="secondary"
                    showOrb
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        firstName: user?.firstName || '',
                        lastName: user?.lastName || '',
                        email: user?.email || '',
                      });
                    }}
                  >
                    Cancelar
                  </ThreeDButton>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-4">Acciones</h3>
            <div className="space-y-2">
              <ThreeDButton
                onClick={handleLogout}
                className="w-full justify-start"
                variant="secondary"
                showOrb
                orbColor={{ primary: '#f97316', accent: '#fbbf24' }}
              >
                🚪 Cerrar Sesión
              </ThreeDButton>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Información del Sistema</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Rol:</span>
                <span className="ml-2 font-semibold capitalize">{user?.role}</span>
              </div>
              {user?.orgId && (
                <div>
                  <span className="text-gray-600">Organización:</span>
                  <span className="ml-2 font-semibold">{user.orgId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




