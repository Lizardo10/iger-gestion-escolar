import { successResponse, errorResponse } from '../src/lib/utils';

describe('utils responses', () => {
  test('successResponse returns 200 and body', () => {
    const res = successResponse({ ok: true });
    expect(res.statusCode).toBe(200);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(JSON.parse(res.body)).toEqual({ ok: true });
  });

  test('errorResponse returns status and error json', () => {
    const res = errorResponse('fail', 400);
    expect(res.statusCode).toBe(400);
    const parsed = JSON.parse(res.body);
    expect(parsed.error).toBe('fail');
  });
});


