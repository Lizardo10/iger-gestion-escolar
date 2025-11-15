import type { LambdaEvent, LambdaResponse, Class as ClassEntity, ClassStudent, Teacher } from '../types';
import {
  successResponse,
  errorResponse,
  parseJsonBody,
  generateId,
  getCurrentTimestamp,
  validateString,
  validateRequired,
  encodeNextToken,
  decodeNextToken,
} from '../lib/utils';
import { DynamoDBService } from '../lib/dynamodb';
import { requirePermission, unauthorizedResponse, forbiddenResponse } from '../lib/authorization';

interface ClassPayload {
  orgId?: string;
  name?: string;
  grade?: string;
  section?: string;
  schoolYear?: string;
  cycle?: string;
  capacity?: number;
  teacherId?: string | null;
  status?: ClassEntity['status'];
}

interface AssignPayload {
  studentId?: string;
}

const CLASS_STATUS: ClassEntity['status'][] = ['active', 'archived'];

function normalize(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function makeTeacherIndexKey(teacherId?: string | null): string {
  return `TEACHER#${teacherId ? teacherId : 'UNASSIGNED'}`;
}

function makeLevelIndexKey(grade: string, section: string | undefined, schoolYear: string): string {
  const normalizedGrade = grade.trim().toUpperCase();
  const normalizedSection = section ? section.trim().toUpperCase() : '';
  const normalizedYear = schoolYear.trim();
  return `LEVEL#${normalizedGrade}${normalizedSection ? `#${normalizedSection}` : ''}#${normalizedYear}`;
}

function mapClass(item: any): ClassEntity {
  const data = (item.Data || {}) as Partial<ClassEntity>;
  const classId = item.SK?.replace('CLASS#', '') || data.id;
  return {
    id: classId,
    orgId: data.orgId || item.PK?.replace('ORG#', '') || '',
    name: data.name || '',
    grade: data.grade || '',
    section: data.section,
    schoolYear: data.schoolYear || '',
    cycle: data.cycle,
    capacity: data.capacity,
    teacherId: data.teacherId,
    previousTeacherIds: data.previousTeacherIds || [],
    status: data.status || 'active',
    createdBy: data.createdBy || '',
    createdAt: data.createdAt || item.CreatedAt || 0,
    updatedAt: data.updatedAt || item.UpdatedAt || 0,
  };
}

function mapAssignment(item: any): ClassStudent {
  const data = (item.Data || {}) as Partial<ClassStudent>;
  const studentId = item.SK?.replace('STUDENT#', '') || data.studentId;
  const classId = item.PK?.replace('CLASS#', '') || data.classId;
  return {
    classId: classId || '',
    studentId: studentId || '',
    orgId: data.orgId || '',
    assignedAt: data.assignedAt || item.CreatedAt || 0,
    assignedBy: data.assignedBy || '',
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

async function getTeacher(orgId: string, teacherId: string): Promise<{ teacher: Teacher; item: any }> {
  const item = await DynamoDBService.getItem(`ORG#${orgId}`, `TEACHER#${teacherId}`);
  if (!item || item.Type !== 'Teacher') {
    throw new Error('Profesor no encontrado');
  }
  const teacherData = item.Data as Teacher;
  return {
    teacher: {
      ...teacherData,
      id: teacherId,
      orgId,
    },
    item,
  };
}

async function updateTeacherClasses(orgId: string, teacherId: string, updater: (classes: string[]) => string[]): Promise<void> {
  const { teacher, item } = await getTeacher(orgId, teacherId);
  const currentClasses = Array.isArray(teacher.classes) ? [...teacher.classes] : [];
  const updatedClasses = updater(currentClasses);
  const timestamp = getCurrentTimestamp();

  const updatedTeacher: Teacher = {
    ...teacher,
    classes: updatedClasses,
    updatedAt: timestamp,
  };

  await DynamoDBService.putItem({
    PK: `ORG#${orgId}`,
    SK: `TEACHER#${teacherId}`,
    GSI1PK: `TEACHEREMAIL#${teacher.email.toLowerCase()}`,
    GSI1SK: `TEACHER#${teacherId}`,
    GSI2PK: `STATUS#${teacher.status}`,
    GSI2SK: item.GSI2SK || `TEACHER#${teacher.createdAt || item.CreatedAt || timestamp}`,
    Type: 'Teacher',
    Data: updatedTeacher,
    CreatedAt: item.CreatedAt || teacher.createdAt || timestamp,
    UpdatedAt: timestamp,
  });
}

async function ensureClassAccess(user: any, classData: ClassEntity): Promise<boolean> {
  if (user.role === 'superadmin' || user.role === 'admin') {
    return true;
  }
  if (user.role === 'teacher') {
    return classData.teacherId === user.teacherId;
  }
  return false;
}

export async function list(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const user = await requirePermission(event, 'classes', 'list');
    if (!user) {
      return unauthorizedResponse();
    }

    const { status: statusFilter, teacherId: teacherFilter, orgId: requestedOrgId, limit: limitParam, nextToken: nextTokenParam } = event.queryStringParameters || {};
    const { orgId, error } = resolveOrgId(user.orgId, user.role, requestedOrgId);
    if (!orgId) {
      return error || errorResponse('orgId inválido', 400);
    }

    let teacherId: string | undefined;
    if (user.role === 'teacher') {
      teacherId = user.teacherId;
    } else if (teacherFilter) {
      teacherId = teacherFilter.trim();
    }

    const limit = Math.min(parseInt(limitParam || '20', 10), 100);
    const nextToken = decodeNextToken(nextTokenParam);

    let items: any[] = [];
    let lastEvaluatedKey: Record<string, unknown> | undefined;

    if (teacherId) {
      const result = await DynamoDBService.queryPaginated(
        'GSI1',
        'GSI1PK = :pk',
        {
          ':pk': makeTeacherIndexKey(teacherId),
        },
        limit,
        nextToken
      );
      items = result.items;
      lastEvaluatedKey = result.lastEvaluatedKey;
    } else {
      const result = await DynamoDBService.queryPaginated(
        undefined,
        'PK = :pk AND begins_with(SK, :prefix)',
        {
          ':pk': `ORG#${orgId}`,
          ':prefix': 'CLASS#',
        },
        limit,
        nextToken
      );
      items = result.items;
      lastEvaluatedKey = result.lastEvaluatedKey;
    }

    const classes = items
      .filter((item) => item.Type === 'Class')
      .map((item) => mapClass(item))
      .filter((cls) => {
        if (statusFilter) {
          return cls.status === statusFilter;
        }
        return true;
      });

    return successResponse({
      classes,
      nextToken: encodeNextToken(lastEvaluatedKey),
      limit,
    });
  } catch (error) {
    console.error('Error al listar clases:', error);
    return errorResponse(
      'Error al listar clases: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function get(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const user = await requirePermission(event, 'classes', 'read');
    if (!user) {
      return unauthorizedResponse();
    }

    const { classId } = event.pathParameters || {};
    const requestedOrgId = event.queryStringParameters?.orgId;

    if (!classId) {
      return errorResponse('classId es requerido', 400);
    }

    const { orgId, error } = resolveOrgId(user.orgId, user.role, requestedOrgId);
    if (!orgId) {
      return error || errorResponse('orgId inválido', 400);
    }

    const item = await DynamoDBService.getItem(`ORG#${orgId}`, `CLASS#${classId}`);

    if (!item || item.Type !== 'Class') {
      return errorResponse('Clase no encontrada', 404);
    }

    const classData = mapClass(item);

    if (!(await ensureClassAccess(user, classData))) {
      return forbiddenResponse();
    }

    const assignments = await DynamoDBService.query(
      undefined,
      'PK = :pk AND begins_with(SK, :prefix)',
      {
        ':pk': `CLASS#${classId}`,
        ':prefix': 'STUDENT#',
      }
    );

    const students = assignments.map((assignment) => mapAssignment(assignment));

    return successResponse({
      class: classData,
      students,
    });
  } catch (error) {
    console.error('Error al obtener clase:', error);
    return errorResponse(
      'Error al obtener clase: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function create(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const user = await requirePermission(event, 'classes', 'create');
    if (!user) {
      return unauthorizedResponse('No tienes permisos para crear clases');
    }

    const body = parseJsonBody(event.body) as ClassPayload;
    const { orgId: requestedOrgId } = body;
    const { orgId, error } = resolveOrgId(user.orgId, user.role, requestedOrgId || null);
    if (!orgId) {
      return error || errorResponse('orgId inválido', 400);
    }

    const requiredError = validateRequired(body as Record<string, unknown>, ['name', 'grade', 'schoolYear']);
    if (requiredError) {
      return errorResponse(requiredError, 400);
    }

    const nameError = validateString(body.name, 'name', 2, 120);
    if (nameError) return errorResponse(nameError, 400);

    const gradeError = validateString(body.grade, 'grade', 1, 50);
    if (gradeError) return errorResponse(gradeError, 400);

    const schoolYearError = validateString(body.schoolYear, 'schoolYear', 4, 20);
    if (schoolYearError) return errorResponse(schoolYearError, 400);

    if (body.section) {
      const sectionError = validateString(body.section, 'section', 1, 10);
      if (sectionError) return errorResponse(sectionError, 400);
    }

    if (body.cycle) {
      const cycleError = validateString(body.cycle, 'cycle', 1, 30);
      if (cycleError) return errorResponse(cycleError, 400);
    }

    if (body.capacity !== undefined) {
      if (typeof body.capacity !== 'number' || body.capacity <= 0) {
        return errorResponse('capacity debe ser un número positivo', 400);
      }
    }

    let teacherId: string | undefined | null = null;
    if (user.role === 'teacher') {
      teacherId = user.teacherId || user.id;
    } else if (body.teacherId !== undefined) {
      teacherId = body.teacherId;
    }

    if (teacherId) {
      await getTeacher(orgId, teacherId);
    }

    const grade = body.grade!.trim();
    const section = normalize(body.section);
    const schoolYear = body.schoolYear!.trim();
    const cycle = normalize(body.cycle) || schoolYear;
    const levelKey = makeLevelIndexKey(grade, section, schoolYear);

    const duplicates = await DynamoDBService.query('GSI2', 'GSI2PK = :pk', {
      ':pk': levelKey,
    });

    const existingActive = duplicates.find((dup) => dup.Type === 'Class' && (dup.Data?.status || 'active') === 'active');
    if (existingActive) {
      return errorResponse('Ya existe una clase activa con el mismo grado, sección y ciclo escolar', 409);
    }

    const classId = generateId();
    const timestamp = getCurrentTimestamp();

    const classData: ClassEntity = {
      id: classId,
      orgId,
      name: body.name!.trim(),
      grade,
      schoolYear,
      cycle,
      previousTeacherIds: [],
      status: 'active',
      createdBy: user.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (section) {
      classData.section = section;
    }

    if (body.capacity !== undefined) {
      classData.capacity = body.capacity;
    }

    if (teacherId) {
      classData.teacherId = teacherId;
    }

    await DynamoDBService.putItem({
      PK: `ORG#${orgId}`,
      SK: `CLASS#${classId}`,
      GSI1PK: makeTeacherIndexKey(teacherId || undefined),
      GSI1SK: `CLASS#${classId}`,
      GSI2PK: levelKey,
      GSI2SK: `CLASS#${classId}`,
      Type: 'Class',
      Data: classData,
      CreatedAt: timestamp,
      UpdatedAt: timestamp,
    });

    if (teacherId) {
      await updateTeacherClasses(orgId, teacherId, (classes) => {
        const set = new Set(classes);
        set.add(classId);
        return Array.from(set);
      });
    }

    return successResponse(classData, 201);
  } catch (error) {
    console.error('Error al crear clase:', error);
    return errorResponse(
      'Error al crear clase: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function update(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const user = await requirePermission(event, 'classes', 'update');
    if (!user) {
      return unauthorizedResponse('No tienes permisos para actualizar clases');
    }

    const { classId } = event.pathParameters || {};
    const requestedOrgId = event.queryStringParameters?.orgId;

    if (!classId) {
      return errorResponse('classId es requerido', 400);
    }

    const { orgId, error } = resolveOrgId(user.orgId, user.role, requestedOrgId);
    if (!orgId) {
      return error || errorResponse('orgId inválido', 400);
    }

    const body = parseJsonBody(event.body) as ClassPayload;
    const item = await DynamoDBService.getItem(`ORG#${orgId}`, `CLASS#${classId}`);

    if (!item || item.Type !== 'Class') {
      return errorResponse('Clase no encontrada', 404);
    }

    const currentClass = mapClass(item);

    if (!(await ensureClassAccess(user, currentClass))) {
      return forbiddenResponse();
    }

    const updates: Partial<ClassEntity> = {};

    if (body.name !== undefined) {
      if (!body.name) return errorResponse('name no puede estar vacío', 400);
      const err = validateString(body.name, 'name', 2, 120);
      if (err) return errorResponse(err, 400);
      updates.name = body.name.trim();
    }

    if (body.grade !== undefined) {
      if (!body.grade) return errorResponse('grade no puede estar vacío', 400);
      const err = validateString(body.grade, 'grade', 1, 50);
      if (err) return errorResponse(err, 400);
      updates.grade = body.grade.trim();
    }

    if (body.section !== undefined) {
      if (body.section) {
        const err = validateString(body.section, 'section', 1, 10);
        if (err) return errorResponse(err, 400);
        updates.section = body.section.trim();
      } else {
        updates.section = undefined;
      }
    }

    if (body.schoolYear !== undefined) {
      if (!body.schoolYear) return errorResponse('schoolYear no puede estar vacío', 400);
      const err = validateString(body.schoolYear, 'schoolYear', 4, 20);
      if (err) return errorResponse(err, 400);
      updates.schoolYear = body.schoolYear.trim();
    }

    if (body.cycle !== undefined) {
      if (body.cycle) {
        const err = validateString(body.cycle, 'cycle', 1, 30);
        if (err) return errorResponse(err, 400);
        updates.cycle = body.cycle.trim();
      } else {
        updates.cycle = undefined;
      }
    }

    if (body.capacity !== undefined) {
      if (body.capacity !== null) {
        if (typeof body.capacity !== 'number' || body.capacity <= 0) {
          return errorResponse('capacity debe ser un número positivo', 400);
        }
        updates.capacity = body.capacity;
      } else {
        updates.capacity = undefined;
      }
    }

    let newTeacherId = currentClass.teacherId;
    const teacherIdProvided = body.teacherId !== undefined;

    if (user.role === 'teacher') {
      newTeacherId = currentClass.teacherId;
    } else if (teacherIdProvided) {
      newTeacherId = body.teacherId || undefined;
    }

    if (newTeacherId) {
      await getTeacher(orgId, newTeacherId);
    }

    if (body.status !== undefined) {
      if (!CLASS_STATUS.includes(body.status)) {
        return errorResponse('status inválido', 400);
      }
      updates.status = body.status;
    }

    const finalGrade = updates.grade ?? currentClass.grade;
    const finalSection = updates.section !== undefined ? updates.section : currentClass.section;
    const finalSchoolYear = updates.schoolYear ?? currentClass.schoolYear;

    if (
      finalGrade !== currentClass.grade ||
      finalSection !== currentClass.section ||
      finalSchoolYear !== currentClass.schoolYear
    ) {
      const levelKey = makeLevelIndexKey(finalGrade, finalSection, finalSchoolYear);
      const duplicates = await DynamoDBService.query('GSI2', 'GSI2PK = :pk', {
        ':pk': levelKey,
      });

      const existingActive = duplicates.find(
        (dup) =>
          dup.Type === 'Class' &&
          dup.SK !== `CLASS#${currentClass.id}` &&
          (dup.Data?.status || 'active') === 'active'
      );

      if (existingActive) {
        return errorResponse('Ya existe una clase activa con el mismo grado, sección y ciclo escolar', 409);
      }
    }

    const timestamp = getCurrentTimestamp();
    const newLevelKey = makeLevelIndexKey(finalGrade, finalSection, finalSchoolYear);
    const previousTeacherId = currentClass.teacherId;

    const newClass: ClassEntity = {
      ...currentClass,
      ...updates,
      grade: finalGrade,
      section: finalSection,
      schoolYear: finalSchoolYear,
      teacherId: newTeacherId,
      updatedAt: timestamp,
    };

    if (previousTeacherId && previousTeacherId !== newTeacherId) {
      await updateTeacherClasses(orgId, previousTeacherId, (classes) =>
        classes.filter((id) => id !== currentClass.id)
      );
      newClass.previousTeacherIds = Array.from(new Set([...(currentClass.previousTeacherIds || []), previousTeacherId]));
    }

    if (newTeacherId && previousTeacherId !== newTeacherId) {
      await updateTeacherClasses(orgId, newTeacherId, (classes) => {
        const set = new Set(classes);
        set.add(currentClass.id);
        return Array.from(set);
      });
    }

    await DynamoDBService.putItem({
      PK: `ORG#${orgId}`,
      SK: `CLASS#${currentClass.id}`,
      GSI1PK: makeTeacherIndexKey(newTeacherId),
      GSI1SK: `CLASS#${currentClass.id}`,
      GSI2PK: newLevelKey,
      GSI2SK: `CLASS#${currentClass.id}`,
      Type: 'Class',
      Data: newClass,
      CreatedAt: item.CreatedAt || currentClass.createdAt,
      UpdatedAt: timestamp,
    });

    return successResponse(newClass);
  } catch (error) {
    console.error('Error al actualizar clase:', error);
    return errorResponse(
      'Error al actualizar clase: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function remove(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const user = await requirePermission(event, 'classes', 'delete');
    if (!user) {
      return unauthorizedResponse('No tienes permisos para eliminar clases');
    }

    const { classId } = event.pathParameters || {};
    const requestedOrgId = event.queryStringParameters?.orgId;

    if (!classId) {
      return errorResponse('classId es requerido', 400);
    }

    const { orgId, error } = resolveOrgId(user.orgId, user.role, requestedOrgId);
    if (!orgId) {
      return error || errorResponse('orgId inválido', 400);
    }

    const item = await DynamoDBService.getItem(`ORG#${orgId}`, `CLASS#${classId}`);

    if (!item || item.Type !== 'Class') {
      return errorResponse('Clase no encontrada', 404);
    }

    const classData = mapClass(item);

    if (!(await ensureClassAccess(user, classData))) {
      return forbiddenResponse();
    }

    if (classData.teacherId) {
      await updateTeacherClasses(orgId, classData.teacherId, (classes) =>
        classes.filter((id) => id !== classId)
      );
    }

    const timestamp = getCurrentTimestamp();
    const archivedClass: ClassEntity = {
      ...classData,
      status: 'archived',
      updatedAt: timestamp,
    };

    await DynamoDBService.putItem({
      PK: `ORG#${orgId}`,
      SK: `CLASS#${classId}`,
      GSI1PK: makeTeacherIndexKey(null),
      GSI1SK: `CLASS#${classId}`,
      GSI2PK: makeLevelIndexKey(classData.grade, classData.section, classData.schoolYear),
      GSI2SK: `CLASS#${classId}`,
      Type: 'Class',
      Data: archivedClass,
      CreatedAt: item.CreatedAt || classData.createdAt,
      UpdatedAt: timestamp,
    });

    return successResponse({
      message: 'Clase archivada correctamente',
    });
  } catch (error) {
    console.error('Error al archivar clase:', error);
    return errorResponse(
      'Error al archivar clase: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function assignStudent(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const user = await requirePermission(event, 'classes', 'update');
    if (!user) {
      return unauthorizedResponse('No tienes permisos para asignar estudiantes');
    }

    const { classId } = event.pathParameters || {};
    const requestedOrgId = event.queryStringParameters?.orgId;

    if (!classId) {
      return errorResponse('classId es requerido', 400);
    }

    const { orgId, error } = resolveOrgId(user.orgId, user.role, requestedOrgId);
    if (!orgId) {
      return error || errorResponse('orgId inválido', 400);
    }

    const body = parseJsonBody(event.body) as AssignPayload;
    if (!body.studentId) {
      return errorResponse('studentId es requerido', 400);
    }

    const classItem = await DynamoDBService.getItem(`ORG#${orgId}`, `CLASS#${classId}`);
    if (!classItem || classItem.Type !== 'Class') {
      return errorResponse('Clase no encontrada', 404);
    }

    const classData = mapClass(classItem);

    if (!(await ensureClassAccess(user, classData))) {
      return forbiddenResponse();
    }

    if (classData.status !== 'active') {
      return errorResponse('No se pueden asignar estudiantes a una clase archivada', 400);
    }

    const studentItem = await DynamoDBService.getItem(`ORG#${orgId}`, `STUDENT#${body.studentId}`);
    if (!studentItem || studentItem.Type !== 'Student') {
      return errorResponse('Estudiante no encontrado', 404);
    }

    const existingAssignment = await DynamoDBService.getItem(`CLASS#${classId}`, `STUDENT#${body.studentId}`);
    if (existingAssignment) {
      return successResponse({
        message: 'El estudiante ya está asignado a la clase',
      });
    }

    if (classData.capacity) {
      const currentAssignments = await DynamoDBService.query(
        undefined,
        'PK = :pk AND begins_with(SK, :prefix)',
        {
          ':pk': `CLASS#${classId}`,
          ':prefix': 'STUDENT#',
        }
      );
      if (currentAssignments.length >= classData.capacity) {
        return errorResponse('La clase ha alcanzado su cupo máximo', 400);
      }
    }

    const timestamp = getCurrentTimestamp();

    await DynamoDBService.putItem({
      PK: `CLASS#${classId}`,
      SK: `STUDENT#${body.studentId}`,
      GSI1PK: `STUDENT#${body.studentId}`,
      GSI1SK: `CLASS#${classId}`,
      Type: 'ClassStudent',
      Data: {
        classId,
        studentId: body.studentId,
        orgId,
        assignedAt: timestamp,
        assignedBy: user.id,
      },
      CreatedAt: timestamp,
      UpdatedAt: timestamp,
    });

    return successResponse({
      message: 'Estudiante asignado correctamente',
    });
  } catch (error) {
    console.error('Error al asignar estudiante a clase:', error);
    return errorResponse(
      'Error al asignar estudiante: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function removeStudent(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const user = await requirePermission(event, 'classes', 'update');
    if (!user) {
      return unauthorizedResponse('No tienes permisos para remover estudiantes');
    }

    const { classId, studentId } = event.pathParameters || {};
    const requestedOrgId = event.queryStringParameters?.orgId;

    if (!classId || !studentId) {
      return errorResponse('classId y studentId son requeridos', 400);
    }

    const { orgId, error } = resolveOrgId(user.orgId, user.role, requestedOrgId);
    if (!orgId) {
      return error || errorResponse('orgId inválido', 400);
    }

    const classItem = await DynamoDBService.getItem(`ORG#${orgId}`, `CLASS#${classId}`);
    if (!classItem || classItem.Type !== 'Class') {
      return errorResponse('Clase no encontrada', 404);
    }

    const classData = mapClass(classItem);

    if (!(await ensureClassAccess(user, classData))) {
      return forbiddenResponse();
    }

    await DynamoDBService.deleteItem(`CLASS#${classId}`, `STUDENT#${studentId}`);

    return successResponse({
      message: 'Estudiante removido de la clase',
    });
  } catch (error) {
    console.error('Error al remover estudiante de clase:', error);
    return errorResponse(
      'Error al remover estudiante: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}






