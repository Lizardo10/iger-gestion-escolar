import type { LambdaEvent, LambdaResponse, Attendance } from '../types';
import { successResponse, errorResponse, parseJsonBody, generateId, getCurrentTimestamp } from '../lib/utils';
import { DynamoDBService } from '../lib/dynamodb';

export async function registerAttendance(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const body = parseJsonBody(event.body) as {
      classId: string;
      date: string;
      records: Array<{
        studentId: string;
        status: 'present' | 'absent' | 'late' | 'excused';
        notes?: string;
      }>;
    };

    const { classId, date, records } = body;

    if (!classId || !date || !records || records.length === 0) {
      return errorResponse('Campos requeridos: classId, date, records', 400);
    }

    const attendanceId = generateId();
    const timestamp = getCurrentTimestamp();

    const attendanceData: Attendance = {
      id: attendanceId,
      classId,
      date,
      records,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await DynamoDBService.putItem({
      PK: `CLASS#${classId}`,
      SK: `ATTENDANCE#${date}`,
      Type: 'Attendance',
      Data: attendanceData,
      CreatedAt: timestamp,
      UpdatedAt: timestamp,
    });

    return successResponse(
      {
        ...attendanceData,
        id: attendanceId,
      },
      201
    );
  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    return errorResponse(
      'Error al registrar asistencia: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function getAttendance(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const { classId, from, to } = event.queryStringParameters || {};

    if (!classId) {
      return errorResponse('classId es requerido', 400);
    }

    // Query attendance records
    const items = await DynamoDBService.query(
      undefined,
      'PK = :pk AND begins_with(SK, :skPrefix)',
      {
        ':pk': `CLASS#${classId}`,
        ':skPrefix': 'ATTENDANCE#',
      }
    );

    let attendanceRecords = items
      .filter((item) => item.Type === 'Attendance')
      .map((item) => ({
        ...item.Data,
        id: item.SK.split('#')[1],
      }));

    // Filtrar por rango de fechas si se especifica
    if (from && to) {
      attendanceRecords = attendanceRecords.filter((record) => {
        const recordDate = record.date;
        return recordDate >= from && recordDate <= to;
      });
    }

    return successResponse({
      records: attendanceRecords,
      total: attendanceRecords.length,
    });
  } catch (error) {
    console.error('Error al obtener asistencia:', error);
    return errorResponse(
      'Error al obtener asistencia: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function getAttendanceReports(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const { classId, studentId } = event.queryStringParameters || {};
    // Futuro: filtrar por rango de fechas
    // Variables reservadas para futura funcionalidad de filtrado por fecha
    void event.queryStringParameters?.from;
    void event.queryStringParameters?.to;

    if (!classId) {
      return errorResponse('classId es requerido', 400);
    }

    const items = await DynamoDBService.query(
      undefined,
      'PK = :pk AND begins_with(SK, :skPrefix)',
      {
        ':pk': `CLASS#${classId}`,
        ':skPrefix': 'ATTENDANCE#',
      }
    );

    const attendanceRecords = items
      .filter((item) => item.Type === 'Attendance')
      .map((item) => item.Data as Attendance);

    // Generar reportes
    const reports: Record<string, unknown> = {
      totalDays: attendanceRecords.length,
      students: {},
    };

    interface StudentStats {
      present: number;
      absent: number;
      late: number;
      excused: number;
      attendanceRate?: number;
    }

    const studentsStats: Record<string, StudentStats> = {};

    attendanceRecords.forEach((record) => {
      record.records.forEach((rec: { studentId: string; status: string }) => {
        const sid = rec.studentId;
        if (!studentsStats[sid]) {
          studentsStats[sid] = {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
          };
        }

        const studentStats = studentsStats[sid];

        switch (rec.status) {
          case 'present':
            studentStats.present++;
            break;
          case 'absent':
            studentStats.absent++;
            break;
          case 'late':
            studentStats.late++;
            break;
          case 'excused':
            studentStats.excused++;
            break;
        }
      });
    });

    // Calcular porcentaje de asistencia
    Object.entries(studentsStats).forEach(([_studentId, stats]) => {
      const total = stats.present + stats.absent + stats.late + stats.excused;
      stats.attendanceRate = total > 0 ? ((stats.present + stats.excused) / total) * 100 : 0;
    });

    // Filtrar por estudiante si se especifica
    const filteredStats = studentId && studentsStats[studentId]
      ? { [studentId]: studentsStats[studentId] }
      : studentsStats;

    reports.students = filteredStats;

    return successResponse(reports);
  } catch (error) {
    console.error('Error al generar reportes:', error);
    return errorResponse(
      'Error al generar reportes: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}



