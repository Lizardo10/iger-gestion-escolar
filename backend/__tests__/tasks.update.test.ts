import { update as updateTask } from '../src/handlers/tasks';

// Mocks simples de DynamoDBService
jest.mock('../src/lib/dynamodb', () => ({
  DynamoDBService: {
    getItem: jest.fn(async () => ({
      PK: 'CLASS#default-class',
      SK: 'TASK#abc',
      Type: 'Task',
      Data: { id: 'abc', classId: 'default-class', title: 'Old', description: 'Old', dueDate: '2025-12-12' },
      CreatedAt: 1,
    })),
    putItem: jest.fn(async () => ({})),
  },
}));

describe('tasks.update', () => {
  test('reemplaza Data completo con putItem y responde 200', async () => {
    const event: any = {
      pathParameters: { classId: 'default-class', taskId: 'abc' },
      body: JSON.stringify({ title: 'Nuevo título' }),
    };

    const res = await updateTask(event);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.message).toMatch(/actualizada/);
  });
});


