export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'superadmin' | 'admin' | 'teacher' | 'student';
  orgId?: string;
  teacherId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  grade: string;
  parentIds: string[];
  enrollmentDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  orgId: string;
  name: string;
  grade: string;
  section?: string;
  schoolYear: string;
  cycle?: string;
  capacity?: number;
  teacherId?: string;
  previousTeacherIds?: string[];
  status: 'active' | 'archived';
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface ClassStudent {
  classId: string;
  studentId: string;
  orgId: string;
  assignedAt: number;
  assignedBy: string;
}

export interface Task {
  id: string;
  classId: string;
  title: string;
  description: string;
  dueDate: string;
  attachments: string[];
  maxScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  studentId: string;
  content: string;
  attachments: string[];
  score?: number;
  feedback?: string;
  status: 'pending' | 'submitted' | 'graded';
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  type: 'meeting' | 'activity' | 'holiday';
  attendees: string[];
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  items: PaymentItem[];
  status: 'pending' | 'paid' | 'cancelled';
  dueDate: string;
  paymentUrl?: string;
  paypalOrderId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice extends Payment {
  createdAt: string;
}

export interface Teacher {
  id: string;
  orgId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization?: string;
  subjects: string[];
  status: 'active' | 'inactive' | 'pending_credentials';
  classes?: string[];
  cognitoId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Attendance {
  id: string;
  classId: string;
  date: string;
  records: AttendanceRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface OfflineOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  operation: string;
  data: Record<string, unknown>;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
  retries?: number;
  lastError?: string;
}

export interface SyncResponse {
  applied: string[];
  conflicts: unknown[];
  serverTimestamp: number;
}



