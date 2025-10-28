import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export interface LambdaEvent extends APIGatewayProxyEvent {
  requestContext: {
    requestId: string;
    stage: string;
    httpMethod: string;
    path: string;
    identity: {
      sourceIp: string;
      userAgent: string;
    };
  };
}

export interface LambdaResponse extends APIGatewayProxyResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface DynamoDBItem {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  Type: string;
  Data: Record<string, unknown>;
  CreatedAt: number;
  UpdatedAt: number;
  TTL?: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  orgId: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  grade: string;
  parentIds: string[];
  orgId: string;
}

export interface Task {
  id: string;
  classId: string;
  title: string;
  description: string;
  dueDate: string;
  attachments: string[];
  maxScore: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  type: 'academic' | 'social' | 'parent_meeting' | 'other';
  attendees: string[];
  location?: string;
  orgId: string;
}

export interface Invoice {
  id: string;
  studentId: string;
  amount: number;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  status: 'pending' | 'paid' | 'cancelled';
  dueDate: string;
  paymentUrl?: string;
  paypalOrderId?: string;
  orgId: string;
}

export interface OfflineOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  operation: string;
  data: Record<string, unknown>;
  timestamp: number;
  userId: string;
}

export interface SyncRequest {
  lastSyncTimestamp: number;
  entities: string[];
}

export interface SyncResponse {
  changes: Record<string, DynamoDBItem[]>;
  serverTimestamp: number;
}



