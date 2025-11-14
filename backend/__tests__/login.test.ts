/**
 * Login Lambda - Unit Tests
 * Autor: Johan Escobar Acosta
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Mock de las funciones externas
jest.mock('../../shared/db', () => ({
  getStudent: jest.fn(),
}));

jest.mock('../../shared/secrets', () => ({
  getJWTSecret: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

import { handler } from '../../lambdas/auth/login';
import { getStudent } from '../../shared/db';
import { getJWTSecret } from '../../shared/secrets';
import jwt from 'jsonwebtoken';

describe('Login Lambda Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validación de entrada', () => {
    it('debe retornar 400 si no hay body en el request', async () => {
      const event = {
        body: null,
      } as APIGatewayProxyEvent;

      const result: APIGatewayProxyResult = await handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).success).toBe(false);
      expect(JSON.parse(result.body).error).toBe('Request body is required');
    });

    it('debe retornar 400 si el RUT está vacío', async () => {
      const event = {
        body: JSON.stringify({ rut: '' }),
      } as APIGatewayProxyEvent;

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('RUT is required');
    });

    it('debe retornar 400 si el RUT no está presente', async () => {
      const event = {
        body: JSON.stringify({ password: 'test123' }),
      } as APIGatewayProxyEvent;

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('RUT is required');
    });
  });

  describe('Autenticación', () => {
    it('debe retornar 401 si el estudiante no existe', async () => {
      (getStudent as jest.Mock).mockResolvedValue(null);

      const event = {
        body: JSON.stringify({ rut: '12345678-9', password: 'test123' }),
      } as APIGatewayProxyEvent;

      const result = await handler(event);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body).error).toBe('Student not found');
      expect(getStudent).toHaveBeenCalledWith('12345678-9');
    });

    it('debe retornar 200 y un token si las credenciales son válidas', async () => {
      const mockStudent = {
        rut: '12345678-9',
        name: 'Juan Pérez',
        email: 'juan.perez@uss.cl',
        career: 'Ingeniería Informática',
      };

      const mockToken = 'mock-jwt-token-xyz123';
      const mockSecret = 'test-secret';

      (getStudent as jest.Mock).mockResolvedValue(mockStudent);
      (getJWTSecret as jest.Mock).mockResolvedValue(mockSecret);
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const event = {
        body: JSON.stringify({ rut: '12345678-9', password: 'test123' }),
      } as APIGatewayProxyEvent;

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.token).toBe(mockToken);
      expect(responseBody.student.rut).toBe('12345678-9');
      expect(responseBody.student.name).toBe('Juan Pérez');
      
      // Verificar que se llamó a getJWTSecret
      expect(getJWTSecret).toHaveBeenCalled();
      
      // Verificar que se generó el token con los datos correctos
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          rut: mockStudent.rut,
          name: mockStudent.name,
          email: mockStudent.email,
        },
        mockSecret,
        { expiresIn: '24h' }
      );
    });
  });

  describe('Headers CORS', () => {
    it('debe incluir headers CORS en respuestas exitosas', async () => {
      const mockStudent = {
        rut: '12345678-9',
        name: 'Juan Pérez',
        email: 'juan.perez@uss.cl',
      };

      (getStudent as jest.Mock).mockResolvedValue(mockStudent);
      (getJWTSecret as jest.Mock).mockResolvedValue('secret');
      (jwt.sign as jest.Mock).mockReturnValue('token');

      const event = {
        body: JSON.stringify({ rut: '12345678-9', password: 'test123' }),
      } as APIGatewayProxyEvent;

      const result = await handler(event);

      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(result.headers).toHaveProperty('Content-Type', 'application/json');
    });
  });

  describe('Manejo de errores', () => {
    it('debe retornar 500 si ocurre un error inesperado', async () => {
      (getStudent as jest.Mock).mockRejectedValue(new Error('Database error'));

      const event = {
        body: JSON.stringify({ rut: '12345678-9', password: 'test123' }),
      } as APIGatewayProxyEvent;

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).success).toBe(false);
      expect(JSON.parse(result.body).error).toBe('Internal server error');
    });
  });
});
