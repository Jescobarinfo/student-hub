// Lambda: Marcar notificación como leída
// REST API: PUT /notifications/read

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { markNotificationAsRead } from '../../shared/db';
import { APIResponse } from '../../shared/types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Mark as read request:', event);

  try {
    // Parse body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Request body is required',
        }),
      };
    }

    const body = JSON.parse(event.body);
    const { studentId, notificationId } = body;

    // Validaciones
    if (!studentId || !notificationId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'studentId and notificationId are required',
          },
        }),
      };
    }

    // Actualizar en DynamoDB
    console.log(`Marking notification as read: ${notificationId} for student: ${studentId}`);
    const updatedNotification = await markNotificationAsRead(studentId, notificationId);

    if (!updatedNotification) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Notification not found',
          },
        }),
      };
    }

    console.log('Notification marked as read successfully');

    // Response exitoso
    const response: APIResponse<any> = {
      success: true,
      data: updatedNotification,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      }),
    };
  }
};
