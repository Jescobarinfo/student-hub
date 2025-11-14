// Lambda: Obtener notificaciones de un estudiante
// REST API: GET /notifications?studentId=xxx

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getNotifications } from '../../shared/db';
import { APIResponse, Notification } from '../../shared/types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Get notifications request:', event);

  try {
    // Obtener studentId desde query params
    const studentId = event.queryStringParameters?.studentId;

    if (!studentId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: {
            code: 'MISSING_STUDENT_ID',
            message: 'studentId query parameter is required',
          },
        }),
      };
    }

    // Obtener limit opcional (default 20)
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 20;

    // Consultar notificaciones desde DynamoDB
    console.log(`Fetching notifications for student: ${studentId}, limit: ${limit}`);
    const notifications = await getNotifications(studentId, limit);

    console.log(`Found ${notifications.length} notifications`);

    // Response exitoso
    const response: APIResponse<Notification[]> = {
      success: true,
      data: notifications as Notification[],
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
    console.error('Error fetching notifications:', error);

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
