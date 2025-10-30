import { api } from '../lib/api';
import type { Task } from '../types';

export interface ListTasksParams {
  classId: string;
  limit?: number;
  nextToken?: string;
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
      limit: (params.limit || 20).toString(),
    });

    if (params.nextToken) {
      queryParams.append('nextToken', params.nextToken);
    }

    const response = await api.get<{
      tasks: Task[];
      nextToken?: string;
      limit: number;
    }>(`/tasks?${queryParams.toString()}`);

    return response.data;
  }

  async get(classId: string, taskId: string) {
    const response = await api.get<{ task: Task }>(`/classes/${classId}/tasks/${taskId}`);
    return response.data;
  }

  async create(params: CreateTaskParams) {
    const response = await api.post<Task>('/tasks', params);
    return response.data;
  }

  async update(params: UpdateTaskParams) {
    const response = await api.put<Task>(`/classes/${params.classId}/tasks/${params.taskId}`, params);
    return response.data;
  }

  async delete(classId: string, taskId: string) {
    const response = await api.delete(`/classes/${classId}/tasks/${taskId}`);
    return response.data;
  }
}

export const tasksService = new TasksService();

// Force rebuild - 2025-10-29

