import { api } from '../lib/api';
import type { Task } from '../types';

export interface ListTasksParams {
  classId: string;
  page?: number;
  limit?: number;
}

export interface CreateTaskParams {
  classId: string;
  title: string;
  description: string;
  dueDate: string;
  attachments?: string[];
  maxScore?: number;
}

export interface UpdateTaskParams {
  classId: string;
  taskId: string;
  title?: string;
  description?: string;
  dueDate?: string;
  attachments?: string[];
  maxScore?: number;
}

class TasksService {
  async list(params: ListTasksParams) {
    const queryParams = new URLSearchParams({
      classId: params.classId,
      page: (params.page || 1).toString(),
      limit: (params.limit || 20).toString(),
    });

    const response = await api.get<{
      tasks: Task[];
      total: number;
      page: number;
      limit: number;
    }>(`/tasks?${queryParams.toString()}`);

    return response.data;
  }

  async get(classId: string, taskId: string) {
    const response = await api.get<{ task: Task }>(`/tasks/${classId}/${taskId}`);
    return response.data;
  }

  async create(params: CreateTaskParams) {
    const response = await api.post<Task>('/tasks', params);
    return response.data;
  }

  async update(params: UpdateTaskParams) {
    const response = await api.put<Task>(`/tasks/${params.classId}/${params.taskId}`, params);
    return response.data;
  }

  async delete(classId: string, taskId: string) {
    const response = await api.delete(`/tasks/${classId}/${taskId}`);
    return response.data;
  }
}

export const tasksService = new TasksService();

