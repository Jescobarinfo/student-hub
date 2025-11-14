// Lambda: Login de estudiante
// Valida RUT contra DynamoDB y genera JWT token

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { getStudent } from '../../shared/db';
import { getJWTSecret } from '../../shared/secrets';
import { LoginRequest, LoginResponse, JWTPayload } from '../../shared/types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Login request received:', event);

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

    const body: LoginRequest = JSON.parse(event.body);
    const { rut } = body;

    // Validar RUT
    if (!rut || rut.trim() === '') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'RUT is required',
        }),
      };
    }

    // Buscar estudiante en DynamoDB
    console.log('Looking up student:', rut);
    const student = await getStudent(rut);

    if (!student) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Student not found',
        }),
      };
    }

    // Obtener JWT secret desde Secrets Manager
    const jwtSecret = await getJWTSecret();

    // Crear payload del token
    const payload: JWTPayload = {
      rut: student.rut,
      name: student.name,
      email: student.email,
    };

    // Generar token (válido por 24 horas)
    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: '24h',
    });

    console.log('Login successful for:', rut);

    // Response exitoso
    const response: LoginResponse = {
      success: true,
      token,
      student: {
        rut: student.rut,
        name: student.name,
        email: student.email,
      },
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // CORS
      },
      body: JSON.stringify(response),
    };
  } catch (error: any) {
    console.error('Login error:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
