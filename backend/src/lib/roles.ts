/**
 * Sistema de Roles y Permisos
 * 
 * Roles disponibles:
 * - superadmin: Acceso total, puede crear usuarios
 * - admin: Acceso administrativo, puede crear usuarios
 * - teacher: Puede crear tareas, ver estudiantes
 * - student: Puede ver tareas, subir tareas, ver aulas
 */

export type UserRole = 'superadmin' | 'admin' | 'teacher' | 'student';

export interface Permission {
  resource: string;
  actions: string[];
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  superadmin: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'students', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'tasks', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'events', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'invoices', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'payments', actions: ['read', 'list'] },
    { resource: 'attendance', actions: ['create', 'read', 'update', 'delete', 'list'] },
  ],
  admin: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'students', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'tasks', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'events', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'invoices', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'payments', actions: ['read', 'list'] },
    { resource: 'attendance', actions: ['create', 'read', 'update', 'delete', 'list'] },
  ],
  teacher: [
    { resource: 'students', actions: ['read', 'list'] },
    { resource: 'tasks', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'events', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'attendance', actions: ['create', 'read', 'update', 'list'] },
    { resource: 'tasks/submissions', actions: ['read', 'update', 'list'] },
  ],
  student: [
    { resource: 'tasks', actions: ['read', 'list'] },
    { resource: 'tasks/submissions', actions: ['create', 'read', 'update'] },
    { resource: 'events', actions: ['read', 'list'] },
  ],
};

/**
 * Verifica si un rol tiene permiso para realizar una acción en un recurso
 */
export function hasPermission(
  role: UserRole | string,
  resource: string,
  action: string
): boolean {
  const userRole = role as UserRole;
  
  if (!ROLE_PERMISSIONS[userRole]) {
    return false;
  }

  const permission = ROLE_PERMISSIONS[userRole].find((p) => p.resource === resource);
  
  if (!permission) {
    return false;
  }

  return permission.actions.includes(action) || permission.actions.includes('*');
}

/**
 * Verifica si un rol puede crear usuarios
 */
export function canCreateUsers(role: UserRole | string): boolean {
  return role === 'superadmin' || role === 'admin';
}

/**
 * Verifica si un rol puede ver facturas/pagos
 */
export function canViewInvoices(role: UserRole | string): boolean {
  return role === 'superadmin' || role === 'admin';
}

/**
 * Verifica si un rol puede crear tareas
 */
export function canCreateTasks(role: UserRole | string): boolean {
  return role === 'superadmin' || role === 'admin' || role === 'teacher';
}

/**
 * Verifica si un rol puede subir tareas
 */
export function canSubmitTasks(role: UserRole | string): boolean {
  return role === 'student';
}

/**
 * Obtiene todos los permisos de un rol
 */
export function getRolePermissions(role: UserRole | string): Permission[] {
  const userRole = role as UserRole;
  return ROLE_PERMISSIONS[userRole] || [];
}

