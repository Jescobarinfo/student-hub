// Lambda: Crear notificación (simula publicación de nota desde Banner)
// Este Lambda simula un stored procedure PL/SQL de Oracle/Banner

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from '../../shared/db';
import { Notification, APIResponse } from '../../shared/types';
import { getOracleConfig } from '../../shared/secrets';

// Simula cursos de Banner (en producción vendría de Oracle)
const MOCK_COURSES = [
  { code: 'MAT101', name: 'Cálculo I' },
  { code: 'FIS201', name: 'Física II' },
  { code: 'PRG301', name: 'Programación Avanzada' },
  { code: 'BD401', name: 'Bases de Datos' },
  { code: 'WEB501', name: 'Desarrollo Web' },
];

// Simula un stored procedure de Oracle Banner
async function simulateBannerProcedure(studentId: string, courseCode: string, grade: number) {
  console.log('Simulating Banner PL/SQL procedure...');
  console.log(`EXEC sp_publish_grade(:studentId => '${studentId}', :courseCode => '${courseCode}', :grade => ${grade})`);

  // En producción, aquí iría la conexión real a Oracle:
  // const oracleConfig = await getOracleConfig();
  // const connection = await oracledb.getConnection(oracleConfig);
  // const result = await connection.execute(
  //   `BEGIN sp_publish_grade(:studentId, :courseCode, :grade); END;`,
  //   { studentId, courseCode, grade }
  // );

  // Por ahora, solo simulamos delay de red
  await new Promise((resolve) => setTimeout(resolve, 100));

  const course = MOCK_COURSES.find((c) => c.code === courseCode);

  return {
    success: true,
    courseName: course?.name || 'Unknown Course',
    publishedAt: new Date().toISOString(),
  };
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Create notification request:', event);

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
    const { studentId, courseCode, grade } = body;

    // Validaciones
    if (!studentId || !courseCode || grade === undefined) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'studentId, courseCode, and grade are required',
          },
        }),
      };
    }

    // Simular llamada a Banner Oracle
    console.log('Calling Banner stored procedure...');
    const bannerResult = await simulateBannerProcedure(studentId, courseCode, grade);

    // Crear notificación en DynamoDB
    const timestamp = new Date().toISOString();
    const notification: Notification = {
      notificationId: uuidv4(),
      studentId,
      type: 'GRADE',
      title: 'Nueva nota publicada',
      message: `Se ha publicado tu nota en ${bannerResult.courseName}: ${grade}`,
      read: false,
      timestamp,
      metadata: {
        courseCode,
        courseName: bannerResult.courseName,
        grade,
      },
    };

    console.log('Creating notification in DynamoDB:', notification);
    await createNotification(notification);

    console.log('Notification created successfully');

    // Response exitoso
    const response: APIResponse<Notification> = {
      success: true,
      data: notification,
    };

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (error: any) {
    console.error('Error creating notification:', error);

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
