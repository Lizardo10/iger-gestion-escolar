import type { LambdaEvent, LambdaResponse, Teacher } from '../types';
import {
  successResponse,
  errorResponse,
  parseJsonBody,
  generateId,
  getCurrentTimestamp,
  validateString,
  validateEmail,
  encodeNextToken,
  decodeNextToken,
} from '../lib/utils';
import { DynamoDBService } from '../lib/dynamodb';
import { requirePermission, unauthorizedResponse, forbiddenResponse } from '../lib/authorization';
import { adminCreateUser, adminDisableUser, adminEnableUser, adminResetUserPassword } from '../lib/cognito';

interface TeacherPayload {
  orgId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  subjects?: string[];
  status?: Teacher['status'];
}

const DEFAULT_STATUS: Teacher['status'] = 'active';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function mapTeacherResponse(item: any): Teacher {
  const data = (item.Data || {}) as Partial<Teacher>;
  const teacherId = item.SK?.replace('TEACHER#', '') || data.id;
  return {
    id: teacherId,
    orgId: data.orgId || item.PK?.replace('ORG#', '') || '',
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    phone: data.phone,
    specialization: data.specialization,
    subjects: data.subjects || [],
    cognitoId: data.cognitoId,
    status: data.status || 'inactive',
    classes: data.classes || [],
    createdAt: data.createdAt || item.CreatedAt || 0,
    updatedAt: data.updatedAt || item.UpdatedAt || 0,
  };
}

function resolveOrgId(userOrgId: string | undefined, userRole: string, requestedOrgId?: string | null): { orgId: string | null; error?: LambdaResponse } {
  if (userRole === 'superadmin') {
    const orgId = requestedOrgId?.trim() || userOrgId || 'default-org';
    return { orgId };
  }

  if (!userOrgId) {
    return {
      orgId: null,
      error: errorResponse('No tienes una organización asignada', 400),
    };
  }

  if (requestedOrgId && requestedOrgId !== userOrgId) {
    return {
      orgId: null,
      error: forbiddenResponse('No puedes operar en otra organización'),
    };
  }

  return { orgId: userOrgId };
}

export async function list(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const user = await requirePermission(event, 'teachers', 'list');
    if (!user) {
      return unauthorizedResponse();
    }

    const { orgId: requestedOrgId, limit: limitParam, nextToken: nextTokenParam } = event.queryStringParameters || {};
    const { orgId, error } = resolveOrgId(user.orgId, user.role, requestedOrgId);
    if (!orgId) {
      return error || errorResponse('orgId inválido', 400);
    }

    const limit = Math.min(parseInt(limitParam || '20', 10), 100);
    const nextToken = decodeNextToken(nextTokenParam);

    const { items, lastEvaluatedKey } = await DynamoDBService.queryPaginated(
      undefined,
      'PK = :pk AND begins_with(SK, :prefix)',
      {
        ':pk': `ORG#${orgId}`,
        ':prefix': 'TEACHER#',
      },
      limit,
      nextToken
    );

    const teachers = items
      .filter((item) => item.Type === 'Teacher')
      .map((item) => mapTeacherResponse(item));

    return successResponse({
      teachers,
      nextToken: encodeNextToken(lastEvaluatedKey),
      limit,
    });
  } catch (error) {
    console.error('Error al listar profesores:', error);
    return errorResponse(
      'Error al listar profesores: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function get(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const user = await requirePermission(event, 'teachers', 'read');
    if (!user) {
      return unauthorizedResponse();
    }

    const { teacherId } = event.pathParameters || {};
    const requestedOrgId = event.queryStringParameters?.orgId;

    if (!teacherId) {
      return errorResponse('teacherId es requerido', 400);
    }

    const { orgId, error } = resolveOrgId(user.orgId, user.role, requestedOrgId);
    if (!orgId) {
      return error || errorResponse('orgId inválido', 400);
    }

    const item = await DynamoDBService.getItem(`ORG#${orgId}`, `TEACHER#${teacherId}`);

    if (!item || item.Type !== 'Teacher') {
      return errorResponse('Profesor no encontrado', 404);
    }

    return successResponse({
      teacher: mapTeacherResponse(item),
    });
  } catch (error) {
    console.error('Error al obtener profesor:', error);
    return errorResponse(
      'Error al obtener profesor: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function create(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const user = await requirePermission(event, 'teachers', 'create');
    if (!user) {
      return unauthorizedResponse('Solo administradores pueden crear profesores');
    }

    const body = parseJsonBody(event.body) as TeacherPayload;
    const { orgId: requestedOrgId } = body;
    const { orgId, error } = resolveOrgId(user.orgId, user.role, requestedOrgId || null);
    if (!orgId) {
      return error || errorResponse('orgId inválido', 400);
    }

    const requiredError = validateRequiredFields(body);
    if (requiredError) {
      return errorResponse(requiredError, 400);
    }

    const emailValidation = validateEmail(body.email, 'email');
    if (emailValidation) {
      return errorResponse(emailValidation, 400);
    }

    const firstNameError = validateString(body.firstName, 'firstName', 1, 80);
    if (firstNameError) return errorResponse(firstNameError, 400);
    const lastNameError = validateString(body.lastName, 'lastName', 1, 120);
    if (lastNameError) return errorResponse(lastNameError, 400);
    if (body.phone) {
      const phoneError = validateString(body.phone, 'phone', 5, 30);
      if (phoneError) return errorResponse(phoneError, 400);
    }
    if (body.specialization) {
      const specializationError = validateString(body.specialization, 'specialization', 2, 120);
      if (specializationError) return errorResponse(specializationError, 400);
    }

    const normalizedEmail = normalizeEmail(body.email!);

    // Verificar email duplicado
    const existing = await DynamoDBService.query('GSI1', 'GSI1PK = :pk', {
      ':pk': `TEACHEREMAIL#${normalizedEmail}`,
    });

    if (existing.length > 0) {
      return errorResponse('El email ya está registrado como profesor', 409);
    }

    const teacherId = generateId();
    const timestamp = getCurrentTimestamp();

    let status: Teacher['status'] = DEFAULT_STATUS;
    let cognitoId: string | undefined;
    let temporaryPassword: string | undefined;

    let emailSent = false;

    try {
      const createUser = await adminCreateUser({
        email: normalizedEmail,
        firstName: body.firstName!,
        lastName: body.lastName!,
        role: 'teacher',
        orgId,
      });
      cognitoId = createUser.userId;
      temporaryPassword = createUser.temporaryPassword;
    } catch (cognitoError) {
      console.error('❌ Error creando usuario Cognito para profesor:', cognitoError);
      status = 'pending_credentials';
    }

    const teacherData: Teacher = {
      id: teacherId,
      orgId,
      firstName: body.firstName!,
      lastName: body.lastName!,
      email: normalizedEmail,
      phone: body.phone?.trim(),
      specialization: body.specialization?.trim(),
      subjects: Array.isArray(body.subjects) ? body.subjects.map((s) => String(s)) : [],
      cognitoId,
      status,
      classes: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await DynamoDBService.putItem({
      PK: `ORG#${orgId}`,
      SK: `TEACHER#${teacherId}`,
      GSI1PK: `TEACHEREMAIL#${normalizedEmail}`,
      GSI1SK: `TEACHER#${teacherId}`,
      GSI2PK: `STATUS#${status}`,
      GSI2SK: `TEACHER#${timestamp}`,
      Type: 'Teacher',
      Data: teacherData,
      CreatedAt: timestamp,
      UpdatedAt: timestamp,
    });

    if (temporaryPassword) {
      try {
        const { sendTeacherCredentialsEmail } = await import('../lib/email');
        await sendTeacherCredentialsEmail({
          to: normalizedEmail,
          firstName: body.firstName,
          temporaryPassword,
          loginUrl: process.env.FRONTEND_URL,
          orgName: process.env.ORG_DISPLAY_NAME,
        });
        emailSent = true;
      } catch (emailError) {
        console.error('⚠️ No se pudo enviar el correo de credenciales al profesor:', emailError);
      }
    }

    return successResponse(
      {
        teacher: teacherData,
        temporaryPassword,
        emailSent,
      },
      201
    );
  } catch (error) {
    console.error('Error al crear profesor:', error);
    return errorResponse(
      'Error al crear profesor: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function update(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const user = await requirePermission(event, 'teachers', 'update');
    if (!user) {
      return unauthorizedResponse('No tienes permisos para actualizar profesores');
    }

    const { teacherId } = event.pathParameters || {};
    const requestedOrgId = event.queryStringParameters?.orgId;

    if (!teacherId) {
      return errorResponse('teacherId es requerido', 400);
    }

    const { orgId, error } = resolveOrgId(user.orgId, user.role, requestedOrgId);
    if (!orgId) {
      return error || errorResponse('orgId inválido', 400);
    }

    const body = parseJsonBody(event.body) as TeacherPayload;
    const item = await DynamoDBService.getItem(`ORG#${orgId}`, `TEACHER#${teacherId}`);

    if (!item || item.Type !== 'Teacher') {
      return errorResponse('Profesor no encontrado', 404);
    }

    const currentData = mapTeacherResponse(item);

    const updates: Partial<Teacher> = {};

    if (body.firstName) {
      const err = validateString(body.firstName, 'firstName', 1, 80);
      if (err) return errorResponse(err, 400);
      updates.firstName = body.firstName.trim();
    }

    if (body.lastName) {
      const err = validateString(body.lastName, 'lastName', 1, 120);
      if (err) return errorResponse(err, 400);
      updates.lastName = body.lastName.trim();
    }

    if (body.phone !== undefined) {
      if (body.phone) {
        const err = validateString(body.phone, 'phone', 5, 30);
        if (err) return errorResponse(err, 400);
        updates.phone = body.phone.trim();
      } else {
        updates.phone = undefined;
      }
    }

    if (body.specialization !== undefined) {
      if (body.specialization) {
        const err = validateString(body.specialization, 'specialization', 2, 120);
        if (err) return errorResponse(err, 400);
        updates.specialization = body.specialization.trim();
      } else {
        updates.specialization = undefined;
      }
    }

    if (body.subjects !== undefined) {
      if (!Array.isArray(body.subjects)) {
        return errorResponse('subjects debe ser un arreglo de strings', 400);
      }
      updates.subjects = body.subjects.map((s) => String(s));
    }

    let newStatus = currentData.status;
    if (body.status) {
      if (!['active', 'inactive', 'pending_credentials'].includes(body.status)) {
        return errorResponse('status inválido', 400);
      }
      newStatus = body.status;
    }

    const timestamp = getCurrentTimestamp();

    const updatedTeacher: Teacher = {
      ...currentData,
      ...updates,
      status: newStatus,
      updatedAt: timestamp,
    };

    // Actualizar estado en Cognito si aplica
    if (currentData.cognitoId) {
      if (currentData.status !== newStatus) {
        if (newStatus === 'inactive') {
          await adminDisableUser(currentData.email);
        } else if (newStatus === 'active') {
          await adminEnableUser(currentData.email);
        }
      }
    }

    await DynamoDBService.putItem({
      PK: `ORG#${orgId}`,
      SK: `TEACHER#${teacherId}`,
      GSI1PK: `TEACHEREMAIL#${currentData.email}`,
      GSI1SK: `TEACHER#${teacherId}`,
      GSI2PK: `STATUS#${newStatus}`,
      GSI2SK: item.GSI2SK || `TEACHER#${currentData.createdAt}`,
      Type: 'Teacher',
      Data: updatedTeacher,
      CreatedAt: item.CreatedAt || currentData.createdAt,
      UpdatedAt: timestamp,
    });

    return successResponse({
      teacher: updatedTeacher,
    });
  } catch (error) {
    console.error('Error al actualizar profesor:', error);
    return errorResponse(
      'Error al actualizar profesor: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function remove(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const user = await requirePermission(event, 'teachers', 'delete');
    if (!user) {
      return unauthorizedResponse('No tienes permisos para eliminar profesores');
    }

    const { teacherId } = event.pathParameters || {};
    const requestedOrgId = event.queryStringParameters?.orgId;

    if (!teacherId) {
      return errorResponse('teacherId es requerido', 400);
    }

    const { orgId, error } = resolveOrgId(user.orgId, user.role, requestedOrgId);
    if (!orgId) {
      return error || errorResponse('orgId inválido', 400);
    }

    const item = await DynamoDBService.getItem(`ORG#${orgId}`, `TEACHER#${teacherId}`);

    if (!item || item.Type !== 'Teacher') {
      return errorResponse('Profesor no encontrado', 404);
    }

    const teacher = mapTeacherResponse(item);

    if (teacher.cognitoId) {
      await adminDisableUser(teacher.email);
    }

    const timestamp = getCurrentTimestamp();

    const updatedTeacher: Teacher = {
      ...teacher,
      status: 'inactive',
      updatedAt: timestamp,
    };

    await DynamoDBService.putItem({
      PK: `ORG#${orgId}`,
      SK: `TEACHER#${teacherId}`,
      GSI1PK: `TEACHEREMAIL#${teacher.email}`,
      GSI1SK: `TEACHER#${teacherId}`,
      GSI2PK: 'STATUS#inactive',
      GSI2SK: item.GSI2SK || `TEACHER#${teacher.createdAt}`,
      Type: 'Teacher',
      Data: updatedTeacher,
      CreatedAt: item.CreatedAt || teacher.createdAt,
      UpdatedAt: timestamp,
    });

    return successResponse({
      message: 'Profesor desactivado correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar profesor:', error);
    return errorResponse(
      'Error al eliminar profesor: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function resetPassword(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const user = await requirePermission(event, 'teachers', 'update');
    if (!user) {
      return unauthorizedResponse('No tienes permisos para resetear contraseñas');
    }

    const { teacherId } = event.pathParameters || {};
    const requestedOrgId = event.queryStringParameters?.orgId;

    if (!teacherId) {
      return errorResponse('teacherId es requerido', 400);
    }

    const { orgId, error } = resolveOrgId(user.orgId, user.role, requestedOrgId);
    if (!orgId) {
      return error || errorResponse('orgId inválido', 400);
    }

    const item = await DynamoDBService.getItem(`ORG#${orgId}`, `TEACHER#${teacherId}`);

    if (!item || item.Type !== 'Teacher') {
      return errorResponse('Profesor no encontrado', 404);
    }

    const teacher = mapTeacherResponse(item);

    const temporaryPassword = await adminResetUserPassword(teacher.email);

    // Asegurar que el estado vuelva a active
    await adminEnableUser(teacher.email);

    const timestamp = getCurrentTimestamp();

    const updatedTeacher: Teacher = {
      ...teacher,
      status: 'active',
      updatedAt: timestamp,
    };

    await DynamoDBService.putItem({
      PK: `ORG#${orgId}`,
      SK: `TEACHER#${teacherId}`,
      GSI1PK: `TEACHEREMAIL#${teacher.email}`,
      GSI1SK: `TEACHER#${teacherId}`,
      GSI2PK: 'STATUS#active',
      GSI2SK: item.GSI2SK || `TEACHER#${teacher.createdAt}`,
      Type: 'Teacher',
      Data: updatedTeacher,
      CreatedAt: item.CreatedAt || teacher.createdAt,
      UpdatedAt: timestamp,
    });

    let emailSent = false;

    if (temporaryPassword) {
      try {
        const { sendTeacherCredentialsEmail } = await import('../lib/email');
        await sendTeacherCredentialsEmail({
          to: teacher.email,
          firstName: teacher.firstName,
          temporaryPassword,
          loginUrl: process.env.FRONTEND_URL,
          orgName: process.env.ORG_DISPLAY_NAME,
        });
        emailSent = true;
      } catch (emailError) {
        console.error('⚠️ No se pudo enviar el correo de reset de contraseña:', emailError);
      }
    }

    return successResponse({
      message: 'Contraseña temporal generada',
      temporaryPassword,
      emailSent,
    });
  } catch (error) {
    console.error('Error al resetear contraseña del profesor:', error);
    return errorResponse(
      'Error al resetear contraseña: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

function validateRequiredFields(body: TeacherPayload): string | null {
  const requiredFields = ['firstName', 'lastName', 'email'];
  for (const field of requiredFields) {
    if (!body[field as keyof TeacherPayload]) {
      return `Campo requerido: ${field}`;
    }
  }
  return null;
}


