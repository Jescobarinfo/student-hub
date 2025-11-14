// Interfaces TypeScript compartidas en todo el backend

export interface Student {
  rut: string;
  name: string;
  email: string;
  career: string;
  semester: number;
  createdAt: string;
}

export interface Notification {
  notificationId: string;
  studentId: string;
  type: 'GRADE' | 'DOCUMENT' | 'ANNOUNCEMENT';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  metadata?: {
    courseCode?: string;
    courseName?: string;
    grade?: number;
    documentType?: string;
  };
}

export interface LoginRequest {
  rut: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  student?: {
    rut: string;
    name: string;
    email: string;
  };
  error?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface JWTPayload {
  rut: string;
  name: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface SecretConfig {
  jwtSecret: string;
  oracleConfig: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
}
