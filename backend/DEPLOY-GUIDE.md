# 🚀 Guía Rápida de Deploy - USS Student Hub

## ⚡ TL;DR - Solución Inmediata

Si tienes el error `Cannot find module 'login'` o `Cannot find module '../../shared/db'`:

```bash
cd backend
npm run deploy
```

Esto ejecutará automáticamente todo el proceso de corrección y deploy.

---

## 📋 ¿Qué hace `npm run deploy`?

El script ejecuta estos 3 pasos automáticamente:

1. **Verificación** ✅
   - Verifica que todos los archivos compilados existan
   - Verifica la estructura de directorios
   - Valida que los imports sean correctos

2. **Actualización de Handlers** 🔧
   - Actualiza la configuración de cada Lambda en AWS
   - Configura los handlers para que apunten a las rutas correctas
   - Ejemplo: `lambdas/auth/login.handler`

3. **Deploy del Código** 📦
   - Empaqueta todo el código con la estructura correcta
   - Sube el ZIP a todas las Lambdas
   - Publica la nueva versión

---

## 🎯 Scripts Disponibles

### Deploy Completo (Recomendado)
```bash
npm run deploy              # Deploy completo con verificación
npm run deploy:prod         # Deploy completo en modo producción
```

### Deploy Manual (Paso a Paso)
```bash
npm run deploy:verify       # Solo verificar estructura
npm run deploy:handlers     # Solo actualizar handlers
npm run deploy:quick        # Solo subir código (sin verificación)
```

### Desarrollo
```bash
npm run build              # Compilar TypeScript a JavaScript
npm run test               # Ejecutar tests
npm run lint               # Verificar código
```

---

## 🔍 Verificar el Deploy

### 1. En la Consola de AWS Lambda

Ve a AWS Lambda Console y verifica:

**uss-login:**
- Runtime: Node.js 20.x
- Handler: `lambdas/auth/login.handler` ✅
- Código: Debería tener carpetas `lambdas/`, `shared/`, `node_modules/`

**uss-get-notifications:**
- Handler: `lambdas/notifications/get.handler` ✅

**uss-create-notification:**
- Handler: `lambdas/notifications/create.handler` ✅

**uss-mark-read:**
- Handler: `lambdas/notifications/markRead.handler` ✅

### 2. Probar el Endpoint

```bash
# Obtener el URL de tu API Gateway
aws apigateway get-rest-apis --query 'items[?name==`USS-Student-Hub-API`].[id,name]' --output table

# Probar login
curl -X POST https://TU-API-ID.execute-api.us-east-1.amazonaws.com/prod/login \
  -H "Content-Type: application/json" \
  -d '{"rut": "12345678-9"}'
```

### 3. Ver Logs en CloudWatch

```bash
# Ver logs de la Lambda de login
aws logs tail /aws/lambda/uss-login --follow
```

---

## 🐛 Solución de Problemas

### Error: "Cannot find module 'X'"

**Causa:** La estructura del ZIP no coincide con los imports

**Solución:**
```bash
npm run build              # Recompilar
npm run deploy             # Deploy completo
```

### Error: "Lambda no existe"

**Causa:** Las Lambdas no están creadas en AWS

**Solución:**
```bash
node create-lambdas.js     # Crear Lambdas
npm run deploy             # Desplegar código
```

### Error: "Handler already correct"

**Causa:** Los handlers ya están configurados (¡esto es bueno!)

**Solución:**
```bash
npm run deploy:quick       # Solo actualizar código
```

### Deploy tarda mucho

**Causa:** El ZIP incluye todos los node_modules (~50MB)

**Normal:** Primera vez puede tardar 2-3 minutos
**Mejora:** Deploys posteriores son más rápidos (AWS cachea)

---

## 📊 Estructura del ZIP Desplegado

Cuando ejecutas `npm run deploy`, se crea un ZIP con esta estructura:

```
deployment.zip
├── lambdas/
│   ├── auth/
│   │   ├── login.js          ← Handler: lambdas/auth/login.handler
│   │   └── shared/           ← Copia local (legacy)
│   └── notifications/
│       ├── get.js            ← Handler: lambdas/notifications/get.handler
│       ├── create.js         ← Handler: lambdas/notifications/create.handler
│       ├── markRead.js       ← Handler: lambdas/notifications/markRead.handler
│       └── shared/           ← Copia local (legacy)
├── shared/                   ← Shared principal
│   ├── db.js
│   ├── secrets.js
│   └── types.js
└── node_modules/
    ├── @aws-sdk/
    ├── jsonwebtoken/
    └── ... (todas las dependencias)
```

**Por qué funciona:**
- `login.js` tiene: `require("../../shared/db")`
- Desde `lambdas/auth/login.js` → `../../shared/db.js` ✅
- El handler `lambdas/auth/login.handler` encuentra el archivo ✅

---

## 🎯 Flujo de Trabajo Recomendado

### Desarrollo Normal
```bash
# 1. Hacer cambios en archivos .ts
vim lambdas/auth/login.ts

# 2. Compilar y desplegar
npm run build
npm run deploy
```

### Fix Rápido
```bash
# Si solo cambias código (no estructura):
npm run build
npm run deploy:quick
```

### Verificar Antes de Deploy
```bash
npm run deploy:verify        # Solo verifica
# Si todo OK, entonces:
npm run deploy:quick
```

---

## ✅ Checklist Post-Deploy

- [ ] Los 4 scripts ejecutaron sin errores
- [ ] Logs de CloudWatch no muestran errores de imports
- [ ] Endpoint de login responde correctamente
- [ ] API Gateway retorna 200 (no 502)
- [ ] Token JWT es generado correctamente

---

## 🔗 Recursos Útiles

- **Logs detallados:** `LAMBDA-FIX-README.md`
- **Código de scripts:** Ver archivos `.js` en `/backend`
- **AWS Lambda Docs:** https://docs.aws.amazon.com/lambda/

---

## 📞 Contacto

**Autor:** Johan Escobar Acosta  
**Email:** jescobar.acosta@outlook.com  
**Proyecto:** USS Student Hub  
**Fecha:** Noviembre 2024

---

## 🎉 ¡Todo Listo!

Si `npm run deploy` ejecutó sin errores, tus Lambdas están funcionando correctamente.

**Próximo paso:** Integrar el frontend con el endpoint de login.

```bash
# Obtener URL del API Gateway
node -e "console.log('API URL guardada en: backend/api-url.txt')"
```
