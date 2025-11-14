# 🚀 CI/CD Pipeline - Guía de Uso

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Configuración Inicial](#configuración-inicial)
- [Bitbucket Pipelines](#bitbucket-pipelines)
- [GitHub Actions](#github-actions)
- [Flujos de Trabajo](#flujos-de-trabajo)
- [Variables de Entorno](#variables-de-entorno)
- [Troubleshooting](#troubleshooting)

---

## 📖 Descripción General

Este proyecto cuenta con **pipelines de CI/CD completos** para automatizar:

- ✅ **Build**: Compilación de TypeScript
- ✅ **Lint**: Validación de código con ESLint
- ✅ **Test**: Ejecución de tests unitarios con Jest
- ✅ **Security Scan**: Auditoría de vulnerabilidades con npm audit
- ✅ **Deploy**: Despliegue automático a AWS Lambda

### Plataformas Soportadas

| Plataforma | Archivo | Estado |
|------------|---------|--------|
| **Bitbucket** | `bitbucket-pipelines.yml` | ✅ Configurado |
| **GitHub** | `.github/workflows/ci-cd.yml` | ✅ Configurado |

---

## ⚙️ Configuración Inicial

### 1. Instalar Dependencias de Desarrollo

```bash
cd backend
npm install
```

Esto instalará:
- Jest (testing)
- ESLint (linting)
- Prettier (formateo)
- TypeScript (compilación)
- ts-jest (TypeScript para Jest)

### 2. Verificar Configuración Local

```bash
# Ejecutar tests
npm test

# Ejecutar linter
npm run lint

# Compilar TypeScript
npm run build

# Validar todo
npm run validate
```

---

## 🔵 Bitbucket Pipelines

### Configuración en Bitbucket

1. **Habilitar Pipelines:**
   - Ve a `Repository Settings` → `Pipelines` → `Settings`
   - Activa `Enable Pipelines`

2. **Configurar Variables de Entorno:**
   - Ve a `Repository Settings` → `Pipelines` → `Repository variables`
   - Agrega las siguientes variables (marca como **Secured**):

```
# Development
AWS_ACCESS_KEY_ID = AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION = us-east-1

# Staging (opcional)
AWS_ACCESS_KEY_ID_STAGING = AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY_STAGING = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Production
AWS_ACCESS_KEY_ID_PROD = AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY_PROD = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION_PROD = us-east-1
```

### Flujos Configurados

#### 1. **Push a `develop`** → Deploy Automático a Development
```bash
git checkout develop
git add .
git commit -m "feat: nueva funcionalidad"
git push origin develop
```

**Pipeline ejecuta:**
1. Install dependencies
2. Run tests
3. Build backend
4. Build frontend
5. Deploy to AWS Development

#### 2. **Push a `staging`** → Deploy Automático a Staging
```bash
git checkout staging
git merge develop
git push origin staging
```

#### 3. **Push a `main`** → Deploy MANUAL a Production
```bash
git checkout main
git merge staging
git push origin main
```

**⚠️ IMPORTANTE:** El deploy a producción requiere **aprobación manual** en Bitbucket.

#### 4. **Pull Request** → Solo Tests y Lint
```bash
git checkout -b feature/nueva-funcionalidad
# ... hacer cambios ...
git push origin feature/nueva-funcionalidad
# Crear Pull Request en Bitbucket
```

**Pipeline ejecuta:**
- Install dependencies
- Lint code
- Run tests
- Code quality checks

#### 5. **Git Tag** → Release y Deploy a Production
```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## 🟢 GitHub Actions

### Configuración en GitHub

1. **Habilitar Actions:**
   - Ve a `Settings` → `Actions` → `General`
   - Permite `Allow all actions`

2. **Configurar Secrets:**
   - Ve a `Settings` → `Secrets and variables` → `Actions`
   - Crea los siguientes **Repository secrets**:

```
# Development
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY

# Staging
AWS_ACCESS_KEY_ID_STAGING
AWS_SECRET_ACCESS_KEY_STAGING

# Production
AWS_ACCESS_KEY_ID_PROD
AWS_SECRET_ACCESS_KEY_PROD
API_URL (opcional)
```

3. **Configurar Environments (recomendado):**
   - Ve a `Settings` → `Environments`
   - Crea 3 environments: `development`, `staging`, `production`
   - Para `production`: activa `Required reviewers`

### Flujos Configurados

Los flujos son **idénticos** a Bitbucket Pipelines:
- Push a `develop` → Auto deploy a Development
- Push a `staging` → Auto deploy a Staging  
- Push a `main` → Auto deploy a Production (con aprobación)
- Pull Request → Solo tests/lint
- Git Tag `v*` → Create GitHub Release + Deploy

---

## 🔄 Flujos de Trabajo

### Desarrollo Día a Día

```bash
# 1. Crear rama de feature
git checkout develop
git pull origin develop
git checkout -b feature/nueva-funcionalidad

# 2. Hacer cambios
# ... editar código ...

# 3. Verificar localmente
npm run validate  # lint + typecheck + test

# 4. Commit y push
git add .
git commit -m "feat: descripción del cambio"
git push origin feature/nueva-funcionalidad

# 5. Crear Pull Request
# (En Bitbucket o GitHub UI)
# Pipeline automáticamente ejecuta tests

# 6. Merge a develop (después de aprobación)
# Pipeline automáticamente despliega a Development

# 7. Probar en Development
# URL: https://fqttaemgp7.execute-api.us-east-1.amazonaws.com/dev

# 8. Merge a staging cuando esté listo
git checkout staging
git merge develop
git push origin staging

# 9. Probar en Staging

# 10. Merge a main para producción
git checkout main
git merge staging
git push origin main
# Aprobar deployment manualmente en Bitbucket/GitHub
```

### Release con Versionado

```bash
# 1. Asegurarse que main está actualizado
git checkout main
git pull origin main

# 2. Crear tag
git tag -a v1.2.0 -m "Release version 1.2.0"

# 3. Push tag
git push origin v1.2.0

# 4. Pipeline automáticamente:
#    - Crea GitHub Release (si es GitHub)
#    - Despliega a Production
#    - Ejecuta smoke tests
```

---

## 🔐 Variables de Entorno

### AWS Credentials

**¿Cómo obtener tus AWS credentials?**

1. **AWS Console:**
   - Ve a IAM → Users → Tu usuario
   - Security credentials → Create access key
   - Descarga el CSV con `Access Key ID` y `Secret Access Key`

2. **AWS CLI:**
```bash
aws iam create-access-key --user-name tu-usuario
```

### Variables Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | Access Key para Development | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Secret Key para Development | `wJalrXUtnFEMI/K7MDENG...` |
| `AWS_REGION` | Región AWS | `us-east-1` |
| `AWS_ACCESS_KEY_ID_PROD` | Access Key para Production | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY_PROD` | Secret Key para Production | `wJalrXUtnFEMI/K7MDENG...` |

**⚠️ IMPORTANTE:**
- **NUNCA** commitear credenciales en el código
- Usar diferentes credenciales para cada ambiente
- Las credenciales deben tener permisos mínimos (IAM Roles)

---

## 🧪 Tests

### Ejecutar Tests Localmente

```bash
# Todos los tests
npm test

# Tests con cobertura
npm run test:ci

# Tests en modo watch
npm run test:watch

# Tests específicos
npm test -- login.test.ts
```

### Estructura de Tests

```
backend/
├── __tests__/
│   ├── login.test.ts          # Tests de autenticación
│   ├── db.test.ts             # Tests de base de datos
│   └── notifications.test.ts  # Tests de notificaciones
└── coverage/                   # Reportes de cobertura
```

### Cobertura Mínima

El pipeline requiere:
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

---

## 🔍 Linting

### Ejecutar Lint Localmente

```bash
# Ver errores
npm run lint

# Arreglar automáticamente
npm run lint:fix

# Formatear código
npm run format
```

### Reglas Configuradas

- ESLint con TypeScript
- Prettier para formateo
- Reglas recomendadas de TypeScript
- Configuración custom en `.eslintrc.js`

---

## 🛠️ Troubleshooting

### Pipeline Falla en Build

**Problema:** `TypeScript compilation failed`

**Solución:**
```bash
# Verificar errores de tipo localmente
npm run typecheck

# Revisar tsconfig.json
cat tsconfig.json
```

### Pipeline Falla en Tests

**Problema:** `Jest tests failed`

**Solución:**
```bash
# Ejecutar tests localmente con más detalle
npm test -- --verbose

# Ver cobertura
npm run test:ci
```

### Pipeline Falla en Deploy

**Problema:** `AWS credentials not valid`

**Solución:**
1. Verificar que las variables estén configuradas en Bitbucket/GitHub
2. Verificar que las credenciales no hayan expirado
3. Verificar permisos IAM:

```bash
# Test local con AWS CLI
aws lambda list-functions --region us-east-1
```

**Problema:** `Lambda function not found`

**Solución:**
```bash
# Verificar que las Lambdas existen
aws lambda get-function --function-name uss-login

# Re-deploy manual si es necesario
cd backend
node deploy-lambdas.js
```

### Ver Logs del Pipeline

**Bitbucket:**
- Ve a `Pipelines` en el sidebar
- Click en el pipeline fallido
- Expande el step con error

**GitHub:**
- Ve a `Actions` tab
- Click en el workflow run
- Click en el job con error

---

## 📊 Monitoreo Post-Deploy

### Verificar Deploy Exitoso

```bash
# Test de API después del deploy
curl https://fqttaemgp7.execute-api.us-east-1.amazonaws.com/prod/notifications?studentId=12345678-9

# Ver logs de Lambda
aws logs tail /aws/lambda/uss-login --follow

# Verificar funciones Lambda
aws lambda list-functions --region us-east-1
```

### Rollback en Caso de Problema

```bash
# Opción 1: Revertir commit
git revert HEAD
git push origin main

# Opción 2: Deploy versión anterior
git checkout v1.1.0
cd backend
node deploy-lambdas.js

# Opción 3: Restaurar desde backup (si existe)
aws lambda update-function-code \
  --function-name uss-login \
  --zip-file fileb://backup-20241113.zip
```

---

## 🎯 Mejores Prácticas

### Commits

✅ **HACER:**
```bash
git commit -m "feat: agregar endpoint de notificaciones"
git commit -m "fix: corregir validación de RUT"
git commit -m "docs: actualizar README"
```

❌ **NO HACER:**
```bash
git commit -m "cambios"
git commit -m "fix"
git commit -m "WIP"
```

### Branches

- `main` → Producción (protegida)
- `staging` → Staging/UAT
- `develop` → Desarrollo
- `feature/*` → Nuevas funcionalidades
- `bugfix/*` → Correcciones
- `hotfix/*` → Fixes urgentes en producción

### Testing

- Escribir tests ANTES de pushear
- Mantener cobertura > 50%
- Tests deben ser rápidos (< 10s total)
- Mockear llamadas a AWS

---

## 📚 Recursos

### Documentación Oficial

- [Bitbucket Pipelines](https://support.atlassian.com/bitbucket-cloud/docs/get-started-with-bitbucket-pipelines/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [ESLint](https://eslint.org/docs/latest/)
- [AWS Lambda](https://docs.aws.amazon.com/lambda/)

### Videos Recomendados

- [CI/CD con Bitbucket Pipelines](https://www.youtube.com/results?search_query=bitbucket+pipelines+tutorial)
- [GitHub Actions Tutorial](https://www.youtube.com/results?search_query=github+actions+tutorial)

---

## ✅ Checklist de Configuración

### Bitbucket

- [ ] Pipelines habilitado
- [ ] Variables AWS configuradas (Development)
- [ ] Variables AWS configuradas (Production)
- [ ] Branch `develop` existe
- [ ] Branch `main` protegida
- [ ] Pipeline ejecutó exitosamente

### GitHub

- [ ] Actions habilitado
- [ ] Secrets AWS configurados
- [ ] Environments creados (dev, staging, prod)
- [ ] Branch protection en `main`
- [ ] Workflow ejecutó exitosamente

### Local

- [ ] `npm install` ejecutado
- [ ] `npm test` pasa
- [ ] `npm run lint` pasa
- [ ] `npm run build` pasa
- [ ] Variables `.env` configuradas

---

## 🎉 ¡Listo!

Tu proyecto ahora tiene **CI/CD profesional completo**.

Cualquier push activará automáticamente:
- ✅ Build
- ✅ Tests
- ✅ Linting
- ✅ Security scan
- ✅ Deploy (según branch)

**¡A desarrollar con confianza!** 🚀

---

**Autor:** Johan Escobar Acosta  
**Proyecto:** USS Student Hub  
**Última actualización:** Noviembre 2024
