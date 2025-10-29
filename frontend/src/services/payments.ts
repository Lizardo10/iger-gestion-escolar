import { api } from '../lib/api';
import type { Payment, PaymentItem } from '../types';

export interface CreateInvoiceParams {
  orgId: string;
  studentId: string;
  items: PaymentItem[];
  dueDate: string;
}

export interface ListInvoicesParams {
  orgId: string;
  studentId?: string;
  status?: 'pending' | 'paid' | 'cancelled';
  page?: number;
  limit?: number;
}

class PaymentsService {
  async list(params: ListInvoicesParams) {
    const queryParams = new URLSearchParams({
      orgId: params.orgId,
      page: (params.page || 1).toString(),
      limit: (params.limit || 20).toString(),
    });

    if (params.studentId) {
      queryParams.append('studentId', params.studentId);
    }
    if (params.status) {
      queryParams.append('status', params.status);
    }

    const response = await api.get<{
      invoices: Payment[];
      total: number;
      page: number;
      limit: number;
    }>(`/payments/invoices?${queryParams.toString()}`);

    return response.data;
  }

  async get(orgId: string, invoiceId: string) {
    const response = await api.get<{ invoice: Payment }>(`/payments/invoices/${invoiceId}?orgId=${orgId}`);
    return response.data;
  }

  async create(params: CreateInvoiceParams) {
    const response = await api.post<Payment>('/payments/invoices', params);
    return response.data;
  }

  async createPayPalOrder(orgId: string, invoiceId: string) {
    const response = await api.post<{ orderId: string; approvalUrl: string }>('/payments/paypal/orders', {
      orgId,
      invoiceId,
    });
    return response.data;
  }
}

export const paymentsService = new PaymentsService();

