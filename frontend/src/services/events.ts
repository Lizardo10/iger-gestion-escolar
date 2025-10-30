import { api } from '../lib/api';
import type { Event } from '../types';

export interface ListEventsParams {
  orgId: string;
  limit?: number;
  nextToken?: string;
  from?: string;
  to?: string;
}

export interface CreateEventParams {
  orgId: string;
  title: string;
  description: string;
  type: 'meeting' | 'activity' | 'holiday';
  // Permitir ambos formatos
  date?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
}

export interface UpdateEventParams {
  orgId: string;
  eventId: string;
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  type?: 'meeting' | 'activity' | 'holiday';
}

class EventsService {
  async list(params: ListEventsParams) {
    const queryParams = new URLSearchParams({
      orgId: params.orgId,
      limit: (params.limit || 20).toString(),
    });

    if (params.nextToken) {
      queryParams.append('nextToken', params.nextToken);
    }
    if (params.from) {
      queryParams.append('from', params.from);
    }
    if (params.to) {
      queryParams.append('to', params.to);
    }

    const response = await api.get<{
      events: Event[];
      nextToken?: string;
      limit: number;
    }>(`/events?${queryParams.toString()}`);

    return response.data;
  }

  async get(orgId: string, eventId: string) {
    const response = await api.get<{ event: Event }>(`/events/${eventId}?orgId=${orgId}`);
    return response.data;
  }

  async create(params: CreateEventParams) {
    const payload: any = { ...params };
    if (params.startDate && params.endDate) {
      delete payload.date;
    } else if (params.date) {
      delete payload.startDate;
      delete payload.endDate;
    }
    if (payload.location === '') delete payload.location;
    const response = await api.post<Event>('/events', payload);
    return response.data;
  }

  async update(params: UpdateEventParams) {
    const response = await api.put<Event>(
      `/events/${params.eventId}?orgId=${params.orgId}`,
      params
    );
    return response.data;
  }

  async delete(orgId: string, eventId: string) {
    const response = await api.delete(`/events/${eventId}?orgId=${orgId}`);
    return response.data;
  }
}

export const eventsService = new EventsService();

