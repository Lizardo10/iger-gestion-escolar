import { api } from '../lib/api';
import type { Teacher } from '../types';

export interface ListTeachersParams {
  orgId: string;
  status?: 'active' | 'inactive' | 'pending_credentials';
  limit?: number;
  nextToken?: string;
}

export interface CreateTeacherParams {
  orgId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization?: string;
  subjects?: string[];
}

export interface UpdateTeacherParams {
  orgId: string;
  teacherId: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  specialization?: string | null;
  subjects?: string[];
  status?: 'active' | 'inactive' | 'pending_credentials';
}

class TeachersService {
  async list(params: ListTeachersParams) {
    const searchParams = new URLSearchParams({
      orgId: params.orgId,
      limit: String(params.limit ?? 20),
    });

    if (params.status) {
      searchParams.append('status', params.status);
    }
    if (params.nextToken) {
      searchParams.append('nextToken', params.nextToken);
    }

    const response = await api.get<{
      teachers: Teacher[];
      nextToken?: string;
      limit: number;
    }>(`/teachers?${searchParams.toString()}`);

    return response.data;
  }

  async create(params: CreateTeacherParams) {
    const response = await api.post<{
      teacher: Teacher;
      temporaryPassword?: string;
    }>('/teachers', params);

    return response.data;
  }

  async update(params: UpdateTeacherParams) {
    const { orgId, teacherId, ...updateData } = params;
    const sanitizedUpdate = { ...updateData };

    if (sanitizedUpdate.phone === null) {
      sanitizedUpdate.phone = '';
    }
    if (sanitizedUpdate.specialization === null) {
      sanitizedUpdate.specialization = '';
    }

    const response = await api.put<{
      teacher: Teacher;
    }>(`/teachers/${teacherId}?orgId=${orgId}`, sanitizedUpdate);

    return response.data;
  }

  async remove(orgId: string, teacherId: string) {
    const response = await api.delete<{ message: string }>(`/teachers/${teacherId}?orgId=${orgId}`);
    return response.data;
  }

  async resetPassword(orgId: string, teacherId: string) {
    const response = await api.post<{
      message: string;
      temporaryPassword?: string;
    }>(`/teachers/${teacherId}/reset-password?orgId=${orgId}`);

    return response.data;
  }

  async get(orgId: string, teacherId: string) {
    const response = await api.get<{ teacher: Teacher }>(`/teachers/${teacherId}?orgId=${orgId}`);
    return response.data;
  }
}

export const teachersService = new TeachersService();





