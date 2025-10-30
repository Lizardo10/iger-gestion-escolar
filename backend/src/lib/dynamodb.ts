import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export const docClient = DynamoDBDocumentClient.from(client);

export const TABLE_NAME = process.env.DYNAMODB_TABLE || 'IgerData';

export interface DynamoDBParams {
  Key: {
    PK: string;
    SK: string;
  };
  UpdateExpression?: string;
  ExpressionAttributeValues?: Record<string, unknown>;
  ExpressionAttributeNames?: Record<string, string>;
  ReturnValues?: string;
}

export class DynamoDBService {
  static async getItem(pk: string, sk: string) {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
    });
    const result = await docClient.send(command);
    return result.Item;
  }

  static async putItem(item: Record<string, unknown>) {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    });
    await docClient.send(command);
    return item;
  }

  static async updateItem(params: DynamoDBParams) {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      ...params,
    });
    const result = await docClient.send(command);
    return result.Attributes;
  }

  static async deleteItem(pk: string, sk: string) {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
    });
    await docClient.send(command);
  }

  static async query(
    indexName: string | undefined,
    keyConditionExpression: string,
    expressionAttributeValues: Record<string, unknown>
  ) {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: indexName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });
    const result = await docClient.send(command);
    return result.Items || [];
  }

  static async queryPaginated(
    indexName: string | undefined,
    keyConditionExpression: string,
    expressionAttributeValues: Record<string, unknown>,
    limit?: number,
    exclusiveStartKey?: Record<string, unknown>
  ) {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: indexName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: limit,
      ExclusiveStartKey: exclusiveStartKey as any,
    });
    const result = await docClient.send(command);
    return {
      items: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  }

  static async scan(filterExpression?: string, expressionAttributeValues?: Record<string, unknown>) {
    const params: Record<string, unknown> = {
      TableName: TABLE_NAME,
    };
    if (filterExpression && expressionAttributeValues) {
      params.FilterExpression = filterExpression;
      params.ExpressionAttributeValues = expressionAttributeValues;
    }
    const command = new ScanCommand(params);
    const result = await docClient.send(command);
    return result.Items || [];
  }
}



