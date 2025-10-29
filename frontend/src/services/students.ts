import { api } from '../lib/api';
import type { Student } from '../types';

export interface ListStudentsParams {
  orgId: string;
  page?: number;
  limit?: number;
  grade?: string;
  active?: boolean;
}

export interface CreateStudentParams {
  orgId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  grade: string;
  parentIds?: string[];
}

export interface UpdateStudentParams {
  orgId: string;
  studentId: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  grade?: string;
  parentIds?: string[];
  active?: boolean;
}

class StudentsService {
  async list(params: ListStudentsParams) {
    const queryParams = new URLSearchParams({
      orgId: params.orgId,
      page: (params.page || 1).toString(),
      limit: (params.limit || 20).toString(),
    });

    if (params.grade) {
      queryParams.append('grade', params.grade);
    }
    if (params.active !== undefined) {
      queryParams.append('active', params.active.toString());
    }

    const response = await api.get<{
      students: Student[];
      total: number;
      page: number;
      limit: number;
    }>(`/students?${queryParams.toString()}`);

    return response.data;
  }

  async get(orgId: string, studentId: string) {
    const response = await api.get<{ student: Student }>(`/students/${studentId}?orgId=${orgId}`);
    return response.data;
  }

  async create(params: CreateStudentParams) {
    const response = await api.post<Student>('/students', params);
    return response.data;
  }

  async update(params: UpdateStudentParams) {
    // Extract orgId and studentId from params
    const { orgId, studentId, ...updateData } = params;
    const response = await api.put<Student>(
      `/students/${studentId}?orgId=${orgId}`,
      updateData
    );
    return response.data;
  }

  async delete(orgId: string, studentId: string) {
    const response = await api.delete(`/students/${studentId}?orgId=${orgId}`);
    return response.data;
  }
}

export const studentsService = new StudentsService();



