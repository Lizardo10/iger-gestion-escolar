import { LambdaEvent, LambdaResponse } from '../types';
import { successResponse, errorResponse, parseJsonBody } from '../lib/utils';

export async function pull(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const body = parseJsonBody(event.body) as {
      lastSyncTimestamp: number;
      entities: string[];
    };
    
    console.log('Sync pull:', body);
    
    return successResponse({
      changes: {},
      serverTimestamp: Date.now(),
    });
  } catch (error) {
    return errorResponse('Error en sync pull: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function push(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const body = parseJsonBody(event.body) as {
      operations: unknown[];
    };
    
    console.log('Sync push:', body);
    
    return successResponse({
      applied: [],
      conflicts: [],
      serverTimestamp: Date.now(),
    });
  } catch (error) {
    return errorResponse('Error en sync push: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}



