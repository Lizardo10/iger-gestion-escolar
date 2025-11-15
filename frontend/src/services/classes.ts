import { api } from '../lib/api';
import type { Class, ClassStudent } from '../types';

export interface ListClassesParams {
  orgId: string;
  teacherId?: string;
  status?: 'active' | 'archived';
  limit?: number;
  nextToken?: string;
}

export interface CreateClassParams {
  orgId: string;
  name: string;
  grade: string;
  schoolYear: string;
  section?: string;
  cycle?: string;
  capacity?: number;
}

export interface UpdateClassParams {
  orgId: string;
  classId: string;
  name?: string;
  grade?: string;
  schoolYear?: string;
  section?: string | null;
  cycle?: string | null;
  capacity?: number | null;
}

export interface AssignStudentParams {
  orgId: string;
  classId: string;
  studentId: string;
}

export interface RemoveStudentParams {
  orgId: string;
  classId: string;
  studentId: string;
}

export interface GetClassResponse {
  class: Class;
  students: ClassStudent[];
}

class ClassesService {
  async list(params: ListClassesParams) {
    const searchParams = new URLSearchParams({
      orgId: params.orgId,
      limit: String(params.limit ?? 20),
    });

    if (params.teacherId) {
      searchParams.append('teacherId', params.teacherId);
    }

    if (params.status) {
      searchParams.append('status', params.status);
    }

    if (params.nextToken) {
      searchParams.append('nextToken', params.nextToken);
    }

    const response = await api.get<{
      classes: Class[];
      nextToken?: string;
      limit: number;
    }>(`/classes?${searchParams.toString()}`);

    return response.data;
  }

  async create(params: CreateClassParams) {
    const response = await api.post<Class>('/classes', params);
    return response.data;
  }

  async update(params: UpdateClassParams) {
    const { orgId, classId, ...payload } = params;
    const sanitizedPayload: Record<string, unknown> = { ...payload };

    if (sanitizedPayload.section === null) sanitizedPayload.section = '';
    if (sanitizedPayload.cycle === null) sanitizedPayload.cycle = '';
    if (sanitizedPayload.capacity === null) sanitizedPayload.capacity = null;

    const response = await api.put<Class>(`/classes/${classId}?orgId=${orgId}`, sanitizedPayload);
    return response.data;
  }

  async get(orgId: string, classId: string) {
    const response = await api.get<GetClassResponse>(`/classes/${classId}?orgId=${orgId}`);
    return response.data;
  }

  async assignStudent(params: AssignStudentParams) {
    const { orgId, classId, studentId } = params;
    const response = await api.post<{ message: string }>(
      `/classes/${classId}/students?orgId=${orgId}`,
      { studentId }
    );
    return response.data;
  }

  async removeStudent(params: RemoveStudentParams) {
    const { orgId, classId, studentId } = params;
    const response = await api.delete<{ message: string }>(
      `/classes/${classId}/students/${studentId}?orgId=${orgId}`
    );
    return response.data;
  }
}

export const classesService = new ClassesService();


