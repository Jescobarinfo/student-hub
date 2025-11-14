// Cliente DynamoDB compartido

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
export const dynamoDB = DynamoDBDocumentClient.from(client);

// Nombres de tablas desde variables de entorno
export const TABLES = {
  STUDENTS: process.env.STUDENTS_TABLE || 'USS-Students',
  NOTIFICATIONS: process.env.NOTIFICATIONS_TABLE || 'USS-Notifications',
};

// Funciones helper para DynamoDB

export async function getStudent(rut: string) {
  const result = await dynamoDB.send(
    new GetCommand({
      TableName: TABLES.STUDENTS,
      Key: { rut },
    })
  );
  return result.Item;
}

export async function getNotifications(studentId: string, limit = 20) {
  const result = await dynamoDB.send(
    new QueryCommand({
      TableName: TABLES.NOTIFICATIONS,
      KeyConditionExpression: 'studentId = :studentId',
      ExpressionAttributeValues: {
        ':studentId': studentId,
      },
      ScanIndexForward: false, // Más recientes primero
      Limit: limit,
    })
  );
  return result.Items || [];
}

export async function createNotification(notification: any) {
  await dynamoDB.send(
    new PutCommand({
      TableName: TABLES.NOTIFICATIONS,
      Item: notification,
    })
  );
  return notification;
}

export async function markNotificationAsRead(studentId: string, notificationId: string) {
  const result = await dynamoDB.send(
    new UpdateCommand({
      TableName: TABLES.NOTIFICATIONS,
      Key: {
        studentId,
        timestamp: notificationId, // En DynamoDB usamos timestamp como sort key
      },
      UpdateExpression: 'SET #read = :true',
      ExpressionAttributeNames: {
        '#read': 'read',
      },
      ExpressionAttributeValues: {
        ':true': true,
      },
      ReturnValues: 'ALL_NEW',
    })
  );
  return result.Attributes;
}
