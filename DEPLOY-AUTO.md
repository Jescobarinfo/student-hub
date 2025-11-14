# 🚀 Deployment Automático - Backend + Frontend

## 📋 Descripción

Este proyecto está configurado para deployment automático con GitHub Actions:

- **Backend** → AWS Lambda (4 funciones serverless)
- **Frontend** → AWS S3 (static website hosting)

Un simple `git push origin main` despliega todo automáticamente.

---

## ⚙️ Configuración Inicial (Una Sola Vez)

### 1. Configurar S3 Bucket

```bash
cd backend
node setup-frontend-aws.js
```

Este script crea automáticamente:
- ✅ Bucket S3: `uss-student-hub-frontend`
- ✅ Configuración de website hosting
- ✅ Políticas de acceso público
- ✅ Todo listo para recibir el frontend

### 2. Verificar Secrets en GitHub

Ve a: https://github.com/Jescobarinfo/uss-student-hub/settings/secrets/actions

Verifica que existan estos secrets:
- ✅ `AWS_ACCESS_KEY_ID_PROD`
- ✅ `AWS_SECRET_ACCESS_KEY_PROD`

### 3. Agregar Permisos S3 a tu Usuario AWS

Tu usuario AWS necesita estos permisos:
- ✅ **AWSLambdaFullAccess** (para backend)
- ✅ **AmazonS3FullAccess** (para frontend)
- ✅ **CloudFrontFullAccess** (opcional)

**Agregar permisos:**

```bash
# Opción A: AWS Console
# 1. Ve a IAM → Users → Tu usuario
# 2. Attach policies → Busca "AmazonS3FullAccess"
# 3. Add permissions

# Opción B: AWS CLI
aws iam attach-user-policy \
  --user-name TU_USUARIO \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

---

## 🚀 Uso Diario - Deployment Automático

### Desplegar a Producción

```bash
# 1. Hacer cambios en el código
# ... editar archivos ...

# 2. Commit
git add .
git commit -m "feat: nueva funcionalidad"

# 3. Push a main - esto despliega automáticamente
git push origin main

# 4. Ver el deployment en GitHub Actions
# https://github.com/Jescobarinfo/uss-student-hub/actions
```

### ¿Qué Sucede Automáticamente?

Cuando haces `git push origin main`, GitHub Actions:

1. **Build Backend** (30s)
   - Instala dependencias
   - Compila TypeScript
   - Ejecuta tests

2. **Build Frontend** (1-2min)
   - Instala dependencias
   - Build Next.js static export
   - Genera carpeta `out/`

3. **Security Scan** (30s)
   - npm audit en backend y frontend
   - Busca vulnerabilidades

4. **Deploy Backend** (1min)
   - Actualiza 4 funciones Lambda
   - Verifica API Gateway
   - Hace smoke test

5. **Deploy Frontend** (30s)
   - Sube archivos a S3
   - Sincroniza con `--delete`
   - Invalida cache CloudFront (si existe)

**Total: ~4-5 minutos** ⏱️

---

## 🌐 URLs del Proyecto

### Producción

**Backend API:**
```
https://fqttaemgp7.execute-api.us-east-1.amazonaws.com/prod
```

**Frontend:**
```
http://uss-student-hub-frontend.s3-website-us-east-1.amazonaws.com
```

**GitHub Actions:**
```
https://github.com/Jescobarinfo/uss-student-hub/actions
```

---

## 🧪 Probar el Deployment

### Test Backend API

```bash
# Obtener notificaciones
curl "https://fqttaemgp7.execute-api.us-east-1.amazonaws.com/prod/notifications?studentId=12345678-9"

# Login
curl -X POST https://fqttaemgp7.execute-api.us-east-1.amazonaws.com/prod/login \
  -H "Content-Type: application/json" \
  -d '{"rut":"12345678-9","password":"password123"}'
```

### Test Frontend

Abre en tu navegador:
```
http://uss-student-hub-frontend.s3-website-us-east-1.amazonaws.com
```

---

## 🔧 Troubleshooting

### Problema: "Bucket already exists"

Si el bucket ya existe con otro nombre:

1. Edita `.github/workflows/ci-cd.yml`
2. Cambia la variable `S3_BUCKET` por otro nombre
3. Ejecuta `node setup-frontend-aws.js` de nuevo

### Problema: "Access Denied" en S3

Tu usuario AWS necesita permisos S3:

```bash
aws iam attach-user-policy \
  --user-name TU_USUARIO \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

### Problema: "Frontend build failed"

Verifica que `next.config.js` tenga:

```javascript
output: 'export',
images: { unoptimized: true },
```

### Problema: "Lambda deployment failed"

Verifica que las credenciales AWS estén correctas en GitHub Secrets.

---

## 📊 Flujo Completo

```
Developer hace commit
        ↓
   git push origin main
        ↓
GitHub Actions se activa
        ↓
   ┌────────────────┐
   │ Build Backend  │ → Compila TypeScript
   └────────────────┘
        ↓
   ┌────────────────┐
   │ Build Frontend │ → Next.js static export
   └────────────────┘
        ↓
   ┌────────────────┐
   │ Run Tests      │ → Jest + ESLint
   └────────────────┘
        ↓
   ┌────────────────┐
   │ Security Scan  │ → npm audit
   └────────────────┘
        ↓
   ┌───────────────────────────┐
   │ Deploy Backend → Lambda   │
   │ Deploy Frontend → S3      │
   └───────────────────────────┘
        ↓
   ✅ Deployment Complete!
   🔗 Backend: API Gateway
   🔗 Frontend: S3 Website
```

---

## 💡 Mejoras Futuras

### Agregar CloudFront (CDN Global + HTTPS)

CloudFront provee:
- ✅ HTTPS con certificado SSL
- ✅ CDN global (cache en edge locations)
- ✅ Mejor performance
- ✅ Custom domain

**Setup:**

```bash
cd backend
# Crear script setup-cloudfront.js (próximamente)
node setup-cloudfront.js
```

### Agregar Dominio Custom

1. Comprar dominio en Route 53
2. Crear certificado SSL en ACM
3. Configurar CloudFront con dominio
4. Actualizar DNS

---

## 📚 Archivos Relevantes

```
.github/workflows/ci-cd.yml    ← Workflow principal
backend/setup-frontend-aws.js  ← Setup S3 automático
backend/deploy-lambdas.js      ← Deploy backend
frontend/next.config.js        ← Config static export
```

---

## ✅ Checklist de Deployment

Antes de hacer push a main:

- [ ] Tests pasan localmente (`npm test`)
- [ ] Build funciona localmente (`npm run build`)
- [ ] S3 bucket está creado
- [ ] Secrets AWS configurados en GitHub
- [ ] Permisos AWS correctos

---

## 🎯 Para la Entrevista

Puedes explicar:

> "Implementé CI/CD completo con GitHub Actions que despliega automáticamente:
>
> - **Backend**: 4 funciones Lambda serverless
> - **Frontend**: Static site en S3 con Next.js
>
> Un simple git push ejecuta el pipeline completo en 4-5 minutos: build, tests, security scan, y deployment a AWS. El frontend se genera con Next.js static export y se sube a S3 configurado como website. Las Lambda functions se actualizan automáticamente con sus dependencias empaquetadas.
>
> Todo el código está versionado, los secrets están seguros en GitHub, y cada deployment tiene rollback disponible."

---

**Autor:** Johan Escobar Acosta  
**Proyecto:** USS Student Hub  
**GitHub:** https://github.com/Jescobarinfo/uss-student-hub
