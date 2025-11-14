# Student Hub - Sistema de Notificaciones Académicas

[![AWS Serverless](https://img.shields.io/badge/AWS-Serverless-orange?logo=amazon-aws)](https://aws.amazon.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-green?logo=github-actions)](https://github.com/features/actions)

> Sistema completo de notificaciones académicas desarrollado con arquitectura serverless en AWS. Permite a estudiantes recibir notificaciones en tiempo real sobre calificaciones, documentos y eventos académicos.

**🌐 Demo en vivo:**
- Frontend: http://uss-student-hub-frontend.s3-website-us-east-1.amazonaws.com
- API Backend: https://fqttaemgp7.execute-api.us-east-1.amazonaws.com/prod

---

## 📋 Tabla de Contenidos

- [¿Qué hace este proyecto?](#-qué-hace-este-proyecto)
- [Características principales](#-características-principales)
- [Arquitectura](#️-arquitectura)
- [Tecnologías utilizadas](#-tecnologías-utilizadas)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Instalación y configuración](#-instalación-y-configuración)
- [Uso](#-uso)
- [Scripts disponibles](#-scripts-disponibles)
- [Deployment](#-deployment)
- [CI/CD](#-cicd)
- [API Endpoints](#-api-endpoints)
- [Costos AWS](#-costos-aws)
- [Roadmap](#-roadmap)
- [Autor](#-autor)

---

## 🎯 ¿Qué hace este proyecto?

**USS Student Hub** es un portal web de notificaciones académicas diseñado para estudiantes universitarios. El sistema permite:

### Para estudiantes:
1. **Recibir notificaciones en tiempo real** sobre:
   - 📊 Calificaciones publicadas
   - 📄 Documentos aprobados/rechazados
   - 📅 Eventos académicos importantes
   - 💰 Pagos y finanzas

2. **Gestionar notificaciones** con:
   - Visualización de notificaciones leídas/no leídas
   - Filtrado por tipo (notas, documentos, etc.)
   - Búsqueda en texto completo
   - Marcado individual o masivo como leídas
   - Estadísticas en tiempo real

3. **Interfaz moderna** con:
   - Modo oscuro/claro
   - Notificaciones sonoras
   - Diseño responsivo
   - Animaciones fluidas

### Para la universidad:
- **Integración simulada con Banner/Oracle** para publicar notificaciones automáticamente cuando se publican notas
- **Escalabilidad automática** sin necesidad de gestionar servidores
- **Costos muy bajos** comparado con infraestructura tradicional
- **Alta disponibilidad** garantizada por AWS

---

## ✨ Características principales

### 🔐 Autenticación y seguridad
- Login con RUT chileno y contraseña
- Tokens JWT con expiración de 24 horas
- Secretos almacenados en AWS Secrets Manager
- CORS configurado correctamente
- Validación de permisos por estudiante

### 📬 Sistema de notificaciones
- **Tipos de notificaciones:**
  - `GRADE`: Notas publicadas con detalles del curso y calificación
  - `DOCUMENT`: Documentos académicos (certificados, solicitudes)
  - `ANNOUNCEMENT`: Comunicados generales

- **Características:**
  - Estado leído/no leído
  - Timestamp con formato chileno
  - Metadata personalizada por tipo
  - Contador de notificaciones no leídas
  - Promedio de calificaciones automático

### 🎨 Interfaz de usuario
- **Dashboard interactivo** con:
  - 4 tarjetas de estadísticas (Total, No leídas, Notas, Promedio)
  - Perfil del estudiante con información académica
  - Buscador en tiempo real
  - 3 filtros: Todas, No leídas, Solo notas
  - Botón "Marcar todas como leídas"

- **Notificaciones visuales:**
  - Íconos según tipo de notificación
  - Badge "Nueva" animado para no leídas
  - Ring azul en la notificación más reciente
  - Animación de entrada suave
  - Metadata visible (calificación, origen)

- **Botones flotantes:**
  - 🌙/☀️ Toggle de modo oscuro
  - 🔊/🔇 Toggle de sonido
  - 🎯 Simulador de publicación desde Banner

### 🔔 Simulador Banner/Oracle
- **Simula integración real** con sistema Banner universitario
- Genera notificaciones aleatorias de notas
- 7 cursos predefinidos con notas aleatorias (4.0 - 7.0)
- Sonido de notificación
- Toast de confirmación animado
- Metadata completa (código curso, nombre, nota, origen)

---

## 🏗️ Arquitectura

### Diagrama de componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                           USUARIO                                │
│                    (Estudiante navegador web)                    │
└──────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────────────┐
│                    FRONTEND (Next.js 15)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • /login page - Autenticación                           │  │
│  │  • /dashboard page - Panel principal                     │  │
│  │  • Estado global con localStorage                        │  │
│  │  • Axios para llamadas HTTP                              │  │
│  │  • Tailwind CSS para estilos                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│           Hosting: S3 Static Website (HTTP)                      │
│           Futuro: CloudFront (HTTPS) cuando cuenta se verifique  │
└──────────────────────────┬───────────────────────────────────────┘
                          │ REST API calls
┌─────────────────────────▼───────────────────────────────────────┐
│                    AWS API GATEWAY (REST)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Endpoints:                                              │  │
│  │  • POST   /login                                         │  │
│  │  • GET    /notifications?studentId={rut}                 │  │
│  │  • POST   /notifications                                 │  │
│  │  • PUT    /notifications/read                            │  │
│  │  • OPTIONS /* (CORS preflight)                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│           ID: fqttaemgp7 | Stage: prod | Region: us-east-1       │
└──────────────────────────┬───────────────────────────────────────┘
                          │ Lambda integration
┌─────────────────────────▼───────────────────────────────────────┐
│                   AWS LAMBDA FUNCTIONS                           │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │ uss-login     │  │ uss-get-      │  │ uss-create-   │      │
│  │               │  │ notifications │  │ notification  │  ... │
│  │ - Valida RUT  │  │ - Query by    │  │ - Crea nueva  │      │
│  │ - Genera JWT  │  │   studentId   │  │ - UUID gen    │      │
│  │ - Secrets Mgr │  │ - Limit: 20   │  │ - Timestamp   │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│           Runtime: Node.js 20 | TypeScript compilado             │
└──────────────────────────┬─────────┬─────────────────────────────┘
                          │         │
          ┌───────────────┘         └──────────────┐
          │                                        │
┌─────────▼──────────────┐          ┌──────────────▼──────────────┐
│   DYNAMODB TABLES      │          │  SECRETS MANAGER            │
│  ┌──────────────────┐  │          │  ┌───────────────────────┐ │
│  │ USS_Students     │  │          │  │ uss-student-hub/      │ │
│  │ ────────────────│  │          │  │ jwt-secret            │ │
│  │ PK: rut (HASH)   │  │          │  │ ───────────────────── │ │
│  │ Attrs:           │  │          │  │ {                     │ │
│  │  - name          │  │          │  │   jwtSecret: "..."    │ │
│  │  - email         │  │          │  │ }                     │ │
│  │  - career        │  │          │  └───────────────────────┘ │
│  │  - password      │  │          │                             │
│  │ GSI: EmailIndex  │  │          │  ┌───────────────────────┐ │
│  └──────────────────┘  │          │  │ uss-student-hub/      │ │
│                        │          │  │ oracle-credentials    │ │
│  ┌──────────────────┐  │          │  │ (Mock para Banner)    │ │
│  │ USS_Notifications│  │          │  └───────────────────────┘ │
│  │ ────────────────│  │          └─────────────────────────────┘
│  │ PK: studentId    │  │
│  │ SK: timestamp    │  │
│  │ Attrs:           │  │          ┌─────────────────────────────┐
│  │  - notificationId│  │          │   CLOUDWATCH LOGS           │
│  │  - type          │  │          │  ┌───────────────────────┐ │
│  │  - title         │  │          │  │ Lambda execution logs │ │
│  │  - message       │  │──────────┼─▶│ API Gateway logs      │ │
│  │  - isRead        │  │          │  │ Error tracking        │ │
│  │  - metadata      │  │          │  └───────────────────────┘ │
│  │ GSI: UnreadIndex │  │          └─────────────────────────────┘
│  └──────────────────┘  │
│                        │
│  Billing: PAY_PER_REQUEST (On-Demand)                           │
└─────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      GITHUB ACTIONS CI/CD                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Workflow on push to main:                               │  │
│  │  1. Build & test backend                                 │  │
│  │  2. Build frontend                                       │  │
│  │  3. Security scan (npm audit)                            │  │
│  │  4. Deploy Lambdas (update code)                         │  │
│  │  5. Deploy Frontend to S3                                │  │
│  │  6. CloudFront cache invalidation (optional)             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de datos: Login

```
1. Usuario ingresa RUT y password en /login
2. Frontend POST /login → API Gateway → Lambda uss-login
3. Lambda consulta DynamoDB tabla USS_Students
4. Si RUT existe, Lambda obtiene JWT secret desde Secrets Manager
5. Lambda genera token JWT válido por 24h
6. Lambda retorna: {success: true, token, student: {...}}
7. Frontend guarda token en localStorage
8. Frontend redirige a /dashboard
```

### Flujo de datos: Ver notificaciones

```
1. Dashboard carga, lee user de localStorage
2. Frontend GET /notifications?studentId=12345678-9 → API Gateway → Lambda uss-get-notifications
3. Lambda query DynamoDB tabla USS_Notifications
   - Partition key: studentId
   - Sort key: timestamp (descendente)
   - Limit: 20
4. Lambda retorna: {success: true, notifications: [...]}
5. Frontend muestra notificaciones con filtros y búsqueda
```

### Flujo de datos: Simulador Banner

```
1. Usuario click botón "🎯 Simular Banner"
2. Frontend genera nota aleatoria (curso + calificación)
3. Frontend POST /notifications → Lambda uss-create-notification
4. Lambda crea notificación en DynamoDB con:
   - notificationId: UUID
   - timestamp: Date.now()
   - type: "GRADE"
   - metadata: {courseCode, courseName, grade, source: "Banner Oracle PL/SQL"}
5. Lambda retorna: {success: true, notification: {...}}
6. Frontend reproduce sonido
7. Frontend recarga notificaciones
8. Frontend muestra toast de éxito
9. Nueva notificación aparece con ring azul y badge "Nueva"
```

---

## 🛠 Tecnologías utilizadas

### Backend (AWS Serverless)

| Servicio/Tecnología | Versión | Uso |
|---------------------|---------|-----|
| **AWS Lambda** | Node.js 20 | 4 funciones serverless para lógica de negocio |
| **AWS API Gateway** | REST API | Endpoints HTTP + CORS habilitado |
| **AWS DynamoDB** | - | Base de datos NoSQL (2 tablas con GSI) |
| **AWS Secrets Manager** | - | Almacenamiento seguro de JWT secret |
| **AWS CloudWatch** | - | Logs y monitoreo de errores |
| **TypeScript** | 5.7 | Type safety en código Lambda |
| **AWS SDK v3** | 3.930+ | Clientes modernos de AWS |
| **jsonwebtoken** | 9.0 | Generación y validación de tokens |
| **uuid** | 11.0 | Generación de IDs únicos |
| **adm-zip** | 0.5 | Empaquetado de Lambdas para deployment |

### Frontend (Next.js)

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Next.js** | 15 | Framework React con App Router |
| **React** | 19 | Librería UI con hooks y contexts |
| **TypeScript** | 5.7 | Type safety en componentes |
| **Tailwind CSS** | 3.4 | Estilos utility-first responsivos |
| **Axios** | 1.7 | Cliente HTTP para API calls |

### DevOps y Tooling

| Herramienta | Uso |
|-------------|-----|
| **GitHub Actions** | CI/CD pipeline automatizado |
| **AWS CLI** | Gestión de recursos AWS desde scripts |
| **ESLint** | Linting de código TypeScript/JavaScript |
| **Prettier** | Formateo automático de código |
| **Jest** | Testing unitario (configurado, tests pendientes) |
| **npm** | Gestión de dependencias |

---

## 📁 Estructura del proyecto

```
uss-student-hub/
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml                  # Pipeline CI/CD automatizado
│
├── backend/
│   │
│   ├── lambdas/                       # Funciones Lambda
│   │   ├── auth/
│   │   │   └── login.ts               # POST /login - Autenticación JWT
│   │   ├── notifications/
│   │   │   ├── get.ts                 # GET /notifications - Listar
│   │   │   ├── create.ts              # POST /notifications - Crear
│   │   │   └── markRead.ts            # PUT /notifications/read - Marcar leída
│   │   └── graphql/                   # (Vacío - futuro GraphQL endpoint)
│   │
│   ├── shared/                        # Código compartido
│   │   ├── db.ts                      # Cliente DynamoDB con queries
│   │   ├── secrets.ts                 # Cliente Secrets Manager
│   │   └── types.ts                   # Interfaces TypeScript compartidas
│   │
│   ├── __tests__/                     # Tests unitarios (pendientes)
│   │
│   ├── Scripts de infraestructura:
│   ├── create-dynamodb.js             # Crea tablas USS_Students + USS_Notifications
│   ├── create-secrets.js              # Crea secretos en Secrets Manager
│   ├── create-iam-role.js             # Crea rol IAM para Lambdas
│   ├── seed-data.js                   # Inserta datos de prueba (2 estudiantes + notifs)
│   ├── setup-frontend-aws.js          # Configura bucket S3 para frontend
│   ├── setup-cloudfront.js            # Configura CloudFront con HTTPS
│   │
│   ├── Scripts de deployment:
│   ├── deploy-lambdas.js              # Despliega las 4 funciones Lambda
│   ├── deploy-graphql.js              # Deploy GraphQL (futuro)
│   ├── update-all-lambdas.js          # Actualiza código de todas las Lambdas
│   ├── enable-cors.js                 # Habilita CORS en API Gateway
│   ├── fix-lambda.js                  # Utilidad para corregir Lambdas
│   ├── check-logs.js                  # Ver logs de CloudWatch
│   ├── copy-files.js                  # Copia archivos TypeScript al build
│   │
│   ├── dist/                          # Código JavaScript compilado
│   ├── package.json                   # Dependencias y scripts npm
│   ├── tsconfig.json                  # Configuración TypeScript
│   ├── jest.config.js                 # Configuración Jest
│   ├── .eslintrc.js                   # Configuración ESLint
│   └── .gitignore                     # Archivos ignorados por git
│
├── frontend/
│   ├── app/                           # Next.js App Router
│   │   ├── login/
│   │   │   └── page.tsx               # Página de login
│   │   ├── dashboard/
│   │   │   └── page.tsx               # Dashboard principal (540 líneas)
│   │   ├── layout.tsx                 # Layout global
│   │   ├── page.tsx                   # Home page (redirige a login)
│   │   └── globals.css                # Estilos globales + Tailwind
│   │
│   ├── public/                        # Assets estáticos
│   ├── next.config.js                 # Configuración Next.js
│   ├── tailwind.config.ts             # Configuración Tailwind
│   ├── postcss.config.js              # Configuración PostCSS
│   ├── tsconfig.json                  # Configuración TypeScript
│   ├── package.json                   # Dependencias frontend
│   └── .env.local                     # Variables de entorno (NEXT_PUBLIC_API_URL)
│
└── README.md                          # Este archivo
```

### Archivos clave

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `backend/lambdas/auth/login.ts` | 106 | Autenticación con validación de RUT y generación JWT |
| `backend/lambdas/notifications/get.ts` | 70 | Query a DynamoDB con paginación |
| `backend/lambdas/notifications/create.ts` | 120+ | Creación de notificaciones con validación |
| `backend/lambdas/notifications/markRead.ts` | 80+ | Actualización de estado isRead |
| `backend/shared/db.ts` | 60+ | Funciones helper para DynamoDB |
| `backend/shared/types.ts` | 70 | Interfaces TypeScript compartidas |
| `backend/deploy-lambdas.js` | 273 | Script completo de deployment |
| `backend/create-dynamodb.js` | 88 | Creación de tablas con GSI |
| `frontend/app/dashboard/page.tsx` | **556** | Dashboard completo con todas las features |
| `frontend/app/login/page.tsx` | 111 | Formulario de login con validación |
| `.github/workflows/ci-cd.yml` | 251 | Pipeline CI/CD completo |

---

## 🚀 Instalación y configuración

### Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- ✅ **Node.js 20+** - [Descargar](https://nodejs.org/)
- ✅ **npm** (incluido con Node.js)
- ✅ **AWS CLI** configurado - [Guía de instalación](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)
- ✅ **Cuenta de AWS** con permisos de administrador
- ✅ **Git** instalado

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/uss-student-hub.git
cd uss-student-hub
```

### Paso 2: Configurar AWS CLI

```bash
aws configure
```

Ingresa tus credenciales:
```
AWS Access Key ID: TU_ACCESS_KEY
AWS Secret Access Key: TU_SECRET_KEY
Default region name: us-east-1
Default output format: json
```

### Paso 3: Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Paso 4: Configurar infraestructura AWS

Ejecuta los scripts en orden:

```bash
cd backend

# 1. Crear tablas DynamoDB (USS_Students, USS_Notifications)
node create-dynamodb.js

# 2. Crear secretos en Secrets Manager (JWT secret)
node create-secrets.js

# 3. Poblar datos de prueba (2 estudiantes, varias notificaciones)
node seed-data.js

# 4. Crear rol IAM para Lambdas (permisos DynamoDB, Secrets Manager, CloudWatch)
node create-iam-role.js

# 5. Configurar bucket S3 para frontend
node setup-frontend-aws.js
```

### Paso 5: Compilar y desplegar backend

```bash
# Compilar TypeScript a JavaScript
npm run build

# Desplegar las 4 funciones Lambda
node deploy-lambdas.js
```

Verás output similar a:
```
═══════════════════════════════════════════════════════
🚀 USS STUDENT HUB - LAMBDA DEPLOYMENT
═══════════════════════════════════════════════════════

📍 Región: us-east-1
📊 Funciones: 4

──────────────────────────────────────────────────────
📌 uss-login
   Autenticación de estudiantes con JWT

📦 Empaquetando uss-login...
   ✓ login.ts
   ✓ shared/
   ✓ node_modules/ (esto puede tardar...)
   ✅ Paquete: 45.32 MB

🚀 Desplegando uss-login a AWS...
✅ uss-login desplegado
   Versión: 23
   Tamaño: 46512.45 KB
   Actualizado: 2024-11-14T00:46:12.000Z
```

### Paso 6: Habilitar CORS en API Gateway

```bash
node enable-cors.js
```

### Paso 7: (Opcional) Configurar CloudFront

⚠️ **Nota:** Requiere cuenta AWS verificada

```bash
node setup-cloudfront.js
```

Si tu cuenta no está verificada, recibirás un error. Puedes:
- **Opción A:** Usar solo S3 HTTP (funcional para desarrollo)
- **Opción B:** Contactar AWS Support para verificar tu cuenta (24-48h)

### Paso 8: Configurar frontend

```bash
cd ../frontend

# Crear archivo de variables de entorno
echo "NEXT_PUBLIC_API_URL=https://fqttaemgp7.execute-api.us-east-1.amazonaws.com/prod" > .env.local
```

⚠️ **Importante:** Reemplaza `fqttaemgp7` con tu ID de API Gateway real.

### Paso 9: Build y deploy frontend

```bash
# Build de Next.js
npm run build

# Deploy a S3
aws s3 sync out/ s3://uss-student-hub-frontend --delete
```

### Paso 10: ¡Listo! Accede a la aplicación

Abre en tu navegador:
```
http://uss-student-hub-frontend.s3-website-us-east-1.amazonaws.com
```

**Credenciales de prueba:**
- RUT: `12345678-9`
- Password: `password123`

---

## 💻 Uso

### Login

1. Accede a la aplicación
2. Ingresa RUT: `12345678-9`
3. Ingresa Password: `password123`
4. Click "Iniciar Sesión"
5. Serás redirigido al dashboard

### Dashboard

#### Estadísticas
En la parte superior verás 4 tarjetas:
- **Total**: Número total de notificaciones
- **No Leídas**: Notificaciones sin leer (contador azul)
- **Notas**: Número de notificaciones tipo GRADE
- **Promedio**: Promedio de todas las calificaciones

#### Perfil
Muestra información del estudiante:
- Nombre completo
- RUT
- Carrera

#### Filtros y búsqueda
- **Buscador**: Busca en títulos y mensajes
- **Filtro "Todas"**: Muestra todas las notificaciones
- **Filtro "No leídas"**: Solo muestra notificaciones sin leer
- **Filtro "Notas"**: Solo muestra notificaciones tipo GRADE
- **Botón "Marcar todas como leídas"**: Marca todas las no leídas

#### Notificaciones
Cada notificación muestra:
- Ícono según tipo (📊 notas, 📄 documentos, etc.)
- Título y mensaje
- Fecha y hora en formato chileno
- Badge "Nueva" si no está leída (animado)
- Botón "✓ Marcar leída" para notificaciones no leídas
- Calificación si es tipo GRADE
- Origen de la notificación (ej: "Banner Oracle PL/SQL")

#### Botones flotantes (esquina inferior derecha)

1. **🌙/☀️ Modo oscuro**
   - Alterna entre tema claro y oscuro
   - Se guarda en localStorage

2. **🔊/🔇 Sonido**
   - Activa/desactiva sonidos de notificación
   - Se guarda en localStorage

3. **🎯 Simulador Banner**
   - Simula publicación de nota desde Banner
   - Genera curso aleatorio con nota aleatoria (4.0-7.0)
   - Reproduce sonido (si está activado)
   - Muestra toast de confirmación
   - Nueva notificación aparece instantáneamente

### Marcar notificaciones como leídas

**Opción 1: Individual**
- Click botón "✓ Marcar leída" en la notificación
- Badge "Nueva" desaparece
- Fondo cambia de azul claro a blanco/gris

**Opción 2: Masiva**
- Click botón "Marcar todas como leídas (X)" arriba de las notificaciones
- Todas las no leídas se marcan automáticamente

### Cerrar sesión

Click "Cerrar Sesión" en la esquina superior derecha

---

## 📜 Scripts disponibles

### Backend

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compila TypeScript a JavaScript en carpeta `dist/` |
| `npm run deploy` | Alias para `deploy-lambdas.js` |
| `npm test` | Ejecuta tests con Jest (configurado, sin tests aún) |
| `npm run lint` | Verifica código con ESLint |
| `npm run lint:fix` | Corrige automáticamente errores de linting |
| `npm run format` | Formatea código con Prettier |
| `npm run typecheck` | Verifica tipos TypeScript sin compilar |

### Frontend

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo en http://localhost:3000 |
| `npm run build` | Build de producción (genera carpeta `out/`) |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint en código frontend |

### Scripts de infraestructura

| Script | Descripción | Cuándo ejecutar |
|--------|-------------|-----------------|
| `create-dynamodb.js` | Crea tablas DynamoDB | Primera vez / Reset |
| `create-secrets.js` | Crea secretos en Secrets Manager | Primera vez |
| `create-iam-role.js` | Crea rol IAM para Lambdas | Primera vez |
| `seed-data.js` | Inserta datos de prueba | Primera vez / Reset |
| `setup-frontend-aws.js` | Configura bucket S3 | Primera vez |
| `setup-cloudfront.js` | Crea CloudFront distribution | Primera vez (requiere verificación) |
| `deploy-lambdas.js` | Despliega funciones Lambda | Cada vez que cambies código |
| `enable-cors.js` | Habilita CORS en API Gateway | Primera vez / Si hay errores CORS |
| `update-all-lambdas.js` | Actualiza todas las Lambdas | Similar a deploy-lambdas |
| `check-logs.js` | Ver logs de CloudWatch | Debugging |
| `fix-lambda.js` | Corregir configuración Lambda | Troubleshooting |

---

## 🚢 Deployment

### Deployment manual

#### Backend

```bash
cd backend

# 1. Compilar TypeScript
npm run build

# 2. Desplegar Lambdas
node deploy-lambdas.js

# 3. Habilitar CORS (si es necesario)
node enable-cors.js
```

#### Frontend

```bash
cd frontend

# 1. Build Next.js
npm run build

# 2. Deploy a S3
aws s3 sync out/ s3://uss-student-hub-frontend --delete --exact-timestamps
```

### Deployment automático (CI/CD)

El proyecto incluye GitHub Actions configurado. **Cada push a `main` ejecuta:**

1. ✅ Build backend (TypeScript)
2. ✅ Lint backend (ESLint)
3. ✅ Test backend (Jest)
4. ✅ Build frontend (Next.js)
5. ✅ Lint frontend (ESLint)
6. ✅ Security scan (npm audit)
7. ✅ Deploy funciones Lambda
8. ✅ Deploy frontend a S3
9. ✅ Setup CloudFront (si no existe)
10. ✅ Invalidar cache CloudFront (si existe)

**Ver workflow:** `.github/workflows/ci-cd.yml`

---

## 🔄 CI/CD

### Configuración de GitHub Actions

#### 1. Secrets necesarios

Agrega estos secrets en tu repositorio de GitHub:

**GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Valor |
|-------------|-------|
| `AWS_ACCESS_KEY_ID_PROD` | Tu Access Key de AWS |
| `AWS_SECRET_ACCESS_KEY_PROD` | Tu Secret Key de AWS |

#### 2. Permisos IAM necesarios

El usuario de AWS debe tener estos permisos:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionCode",
        "lambda:GetFunction",
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "cloudfront:CreateDistribution",
        "cloudfront:ListDistributions",
        "cloudfront:GetDistribution",
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

#### 3. Workflow jobs

El pipeline incluye 7 jobs:

| Job | Duración | Descripción |
|-----|----------|-------------|
| `backend-build` | ~1 min | Compila TypeScript, sube artifact |
| `backend-lint` | ~30 seg | ESLint en código backend |
| `backend-test` | ~30 seg | Jest tests (pasa con --passWithNoTests) |
| `frontend-build` | ~2 min | Next.js build, sube artifact |
| `frontend-lint` | ~30 seg | ESLint en código frontend |
| `security-scan` | ~1 min | npm audit en ambos proyectos |
| `deploy-prod` | ~3 min | Deploy a AWS (solo en branch main) |

**Total:** ~8-10 minutos por deployment

#### 4. Triggers

El workflow se ejecuta en:
- ✅ Push a `main`, `develop`, `staging`
- ✅ Pull requests a `main`, `develop`
- ✅ Tags `v*`
- ✅ Manual (workflow_dispatch)

---

## 🔌 API Endpoints

### Base URL

```
https://fqttaemgp7.execute-api.us-east-1.amazonaws.com/prod
```

### Endpoints

#### `POST /login`

Autenticación de estudiante con RUT.

**Request:**
```json
{
  "rut": "12345678-9",
  "password": "password123"
}
```

**Response 200 (Success):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "student": {
    "rut": "12345678-9",
    "name": "Juan Pérez",
    "email": "juan.perez@uss.cl"
  }
}
```

**Response 401 (Student not found):**
```json
{
  "success": false,
  "error": "Student not found"
}
```

**Response 400 (Missing RUT):**
```json
{
  "success": false,
  "error": "RUT is required"
}
```

---

#### `GET /notifications?studentId={rut}&limit={number}`

Obtener notificaciones de un estudiante.

**Query Parameters:**
- `studentId` (requerido): RUT del estudiante
- `limit` (opcional): Número máximo de notificaciones (default: 20)

**Request:**
```
GET /notifications?studentId=12345678-9&limit=10
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "notificationId": "notif-1",
      "studentId": "12345678-9",
      "timestamp": 1731468000000,
      "type": "GRADE",
      "title": "Nueva nota publicada",
      "message": "Se ha publicado la nota de Cálculo I: 6.5",
      "isRead": "false",
      "metadata": {
        "courseCode": "MAT101",
        "courseName": "Cálculo I",
        "grade": 6.5
      }
    },
    {
      "notificationId": "notif-2",
      "studentId": "12345678-9",
      "timestamp": 1731381600000,
      "type": "DOCUMENT",
      "title": "Documento aprobado",
      "message": "Tu certificado de alumno regular ha sido aprobado",
      "isRead": "true",
      "metadata": {
        "documentType": "Certificado",
        "documentName": "Certificado de Alumno Regular"
      }
    }
  ]
}
```

**Response 400 (Missing studentId):**
```json
{
  "success": false,
  "error": {
    "code": "MISSING_STUDENT_ID",
    "message": "studentId query parameter is required"
  }
}
```

---

#### `POST /notifications`

Crear nueva notificación.

**Request:**
```json
{
  "studentId": "12345678-9",
  "type": "GRADE",
  "title": "Nueva nota publicada desde Banner",
  "message": "Se ha publicado la nota de Física II: 6.8",
  "metadata": {
    "courseCode": "FIS201",
    "courseName": "Física II",
    "grade": 6.8,
    "source": "Banner Oracle PL/SQL"
  }
}
```

**Response 201:**
```json
{
  "success": true,
  "notification": {
    "notificationId": "550e8400-e29b-41d4-a716-446655440000",
    "studentId": "12345678-9",
    "timestamp": 1731554400000,
    "type": "GRADE",
    "title": "Nueva nota publicada desde Banner",
    "message": "Se ha publicado la nota de Física II: 6.8",
    "isRead": "false",
    "metadata": {
      "courseCode": "FIS201",
      "courseName": "Física II",
      "grade": 6.8,
      "source": "Banner Oracle PL/SQL"
    }
  }
}
```

---

#### `PUT /notifications/read`

Marcar notificación como leída.

**Request:**
```json
{
  "studentId": "12345678-9",
  "timestamp": 1731468000000
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### Tipos de notificaciones

| Tipo | Ícono | Uso |
|------|-------|-----|
| `GRADE` | 📊 | Calificaciones publicadas |
| `DOCUMENT` | 📄 | Documentos académicos |
| `ANNOUNCEMENT` | 🔔 | Comunicados generales |

### Headers CORS

Todos los endpoints incluyen:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 💰 Costos AWS

### Free Tier (primeros 12 meses)

Si tu cuenta es nueva, todo es **GRATIS**:

| Servicio | Free Tier | Consumo estimado | Costo |
|----------|-----------|------------------|-------|
| Lambda | 1M requests/mes | ~50K requests | $0.00 |
| DynamoDB | 25 GB + 25 RCU/WCU | 5 GB + 10 RCU/WCU | $0.00 |
| API Gateway | 1M requests/mes | ~50K requests | $0.00 |
| S3 | 5 GB storage + 20K GET | 1 GB + 10K GET | $0.00 |
| CloudWatch Logs | 5 GB ingestion | 2 GB | $0.00 |
| Secrets Manager | N/A | 2 secretos | $0.80 |
| **TOTAL** | | | **$0.80/mes** |

### Después del Free Tier (1000 estudiantes activos)

| Servicio | Uso mensual | Costo unitario | Costo total |
|----------|-------------|----------------|-------------|
| Lambda | 100K requests | $0.20/1M | $0.02 |
| Lambda compute | 200K GB-segundos | $0.0000166667/GB-s | $3.33 |
| DynamoDB | 10 GB storage | $0.25/GB | $2.50 |
| DynamoDB | 100K RCU | $0.25/1M | $0.03 |
| DynamoDB | 100K WCU | $1.25/1M | $0.13 |
| API Gateway | 100K requests | $3.50/1M | $0.35 |
| S3 storage | 10 GB | $0.023/GB | $0.23 |
| S3 requests | 50K GET | $0.0004/1K | $0.02 |
| CloudFront | 100 GB transfer | $0.085/GB | $8.50 |
| CloudWatch Logs | 5 GB | $0.50/GB | $2.50 |
| Secrets Manager | 2 secretos | $0.40/secret | $0.80 |
| **TOTAL** | | | **$18.41/mes** |

### Comparación con servidor tradicional

| Opción | Costo mensual | Escalabilidad | Mantenimiento |
|--------|---------------|---------------|---------------|
| **Serverless AWS** | $18.41 | Automática | Cero |
| EC2 t3.small | $15.00 | Manual | Alto |
| EC2 t3.medium | $30.00 | Manual | Alto |
| Servidor dedicado | $50+ | Manual | Muy alto |

**Ventajas serverless:**
- ✅ Paga solo por uso real
- ✅ Escala automáticamente a 0 o 1 millón de usuarios
- ✅ Alta disponibilidad (99.99% SLA)
- ✅ Sin mantenimiento de servidores
- ✅ Sin necesidad de DevOps dedicado

---

## 🗺 Roadmap

### ✅ Completado (v1.0)

- [x] Backend serverless con 4 funciones Lambda
- [x] DynamoDB con 2 tablas y GSI
- [x] Autenticación JWT con Secrets Manager
- [x] API REST con CORS habilitado
- [x] Frontend Next.js 15 con App Router
- [x] Dashboard interactivo completo
- [x] Filtrado y búsqueda de notificaciones
- [x] Modo oscuro/claro
- [x] Simulador de publicación Banner
- [x] Scripts completos de infraestructura
- [x] CI/CD con GitHub Actions
- [x] Deployment automatizado
- [x] Documentación completa

### 🔨 En progreso (v1.1)

- [ ] Tests unitarios con Jest (>80% coverage)
- [ ] Verificación de cuenta AWS para CloudFront
- [ ] Documentación de API con Swagger/OpenAPI

### 📅 Próximas versiones

#### v1.2 - Testing y calidad
- [ ] Tests E2E con Cypress
- [ ] Tests de integración Lambda
- [ ] Cobertura >90%
- [ ] Lighthouse score >90

#### v1.3 - Monitoreo y observabilidad
- [ ] Dashboard CloudWatch personalizado
- [ ] Alarmas automáticas (errores, latencia)
- [ ] Logs estructurados con Winston
- [ ] Tracing con X-Ray

#### v2.0 - Features avanzadas
- [ ] GraphQL endpoint con Apollo Server
- [ ] Subscriptions con AppSync
- [ ] WebSockets para notificaciones real-time
- [ ] Notificaciones push en navegador
- [ ] Exportar notificaciones a PDF/Excel
- [ ] Modo offline (Service Workers)

#### v2.1 - Integración real
- [ ] Integración con Banner/Oracle real
- [ ] Stored procedures PL/SQL
- [ ] Sincronización automática de notas
- [ ] Webhook para eventos Banner

#### v3.0 - Multi-tenancy
- [ ] Soporte multi-universidad
- [ ] Panel de administración
- [ ] Configuración por institución
- [ ] White-label branding

#### v4.0 - Móvil
- [ ] App móvil React Native
- [ ] Notificaciones push nativas
- [ ] Biometría (Face ID / Touch ID)
- [ ] Offline-first architecture

---

## 👨‍💻 Autor

**Johan Escobar Acosta**

Ingeniero Informático | Technical Lead | Especialista en AWS Serverless

### 📬 Contacto

- 📧 Email: [jescobar.infoupla@gmail.com](mailto:jescobar.infoupla@gmail.com)
- 💼 LinkedIn: [linkedin.com/in/johansescobar](https://linkedin.com/in/johansescobar)
- 🐙 GitHub: [github.com/johansescobar](https://github.com/johansescobar)
- 📍 Ubicación: Santiago, Chile

### 🎯 Experiencia destacada

- 7+ años en desarrollo full stack
- Technical Lead en proyectos serverless AWS
- Experto en Node.js, TypeScript, React, Next.js
- Arquitectura cloud-native y microservicios
- CI/CD con GitHub Actions y AWS CodePipeline
- Sistemas financieros, ERP y plataformas SaaS

### 🏆 Skills técnicos

**Backend:** Node.js, TypeScript, Python, Java, GraphQL, REST APIs
**Frontend:** React, Next.js, Vue.js, Tailwind CSS
**AWS:** Lambda, DynamoDB, API Gateway, S3, CloudFront, Cognito, EventBridge
**DevOps:** GitHub Actions, Docker, Terraform, AWS CDK
**Bases de datos:** DynamoDB, PostgreSQL, MySQL, MongoDB, Oracle
**Testing:** Jest, Cypress, Playwright

---

## 📄 Licencia

MIT License

Copyright (c) 2024 Johan Escobar Acosta

Se concede permiso, de forma gratuita, a cualquier persona que obtenga una copia de este software y archivos de documentación asociados (el "Software"), para usar el Software sin restricciones, incluyendo sin limitación los derechos de usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar y/o vender copias del Software, y permitir a las personas a las que se les proporcione el Software hacer lo mismo, sujeto a las siguientes condiciones:

El aviso de copyright anterior y este aviso de permiso se incluirán en todas las copias o partes sustanciales del Software.

EL SOFTWARE SE PROPORCIONA "TAL CUAL", SIN GARANTÍA DE NINGÚN TIPO, EXPRESA O IMPLÍCITA, INCLUYENDO PERO NO LIMITADO A LAS GARANTÍAS DE COMERCIABILIDAD, IDONEIDAD PARA UN PROPÓSITO PARTICULAR Y NO INFRACCIÓN. EN NINGÚN CASO LOS AUTORES O TITULARES DEL COPYRIGHT SERÁN RESPONSABLES DE CUALQUIER RECLAMO, DAÑOS U OTRAS RESPONSABILIDADES, YA SEA EN UNA ACCIÓN DE CONTRATO, AGRAVIO O DE OTRA MANERA, DERIVADAS DE, FUERA DE O EN CONEXIÓN CON EL SOFTWARE O EL USO U OTROS TRATOS EN EL SOFTWARE.

---

## 🙏 Agradecimientos

- **AWS** por la infraestructura serverless
- **Next.js team** por el excelente framework
- **Vercel** por las herramientas de desarrollo
- **TypeScript team** por mejorar JavaScript
- **Comunidad open source** por las librerías utilizadas

---

## 📞 Soporte y contribuciones

### ¿Encontraste un bug?

Abre un issue en GitHub: [Issues](https://github.com/johansescobar/uss-student-hub/issues)

### ¿Quieres contribuir?

1. Fork el proyecto
2. Crea una branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### ¿Tienes preguntas?

- 📧 Email: [jescobar.infoupla@gmail.com](mailto:jescobar.infoupla@gmail.com)
- 💬 LinkedIn: Envíame un mensaje
- 🐦 Twitter: Próximamente

---

<div align="center">

**⭐ Si te gustó este proyecto, dale una estrella en GitHub ⭐**

Desarrollado con ❤️ en Santiago, Chile

[Johan Escobar Acosta](https://github.com/johansescobar) © 2024

</div>
