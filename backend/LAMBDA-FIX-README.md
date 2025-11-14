# 🔧 Solución al Error de Lambdas

## 📋 Problema Identificado

El error `Cannot find module 'login'` y luego `Cannot find module '../../shared/db'` ocurría porque:

1. **Handler incorrecto**: Las Lambdas fueron creadas con `Handler: 'index.handler'` pero el código compilado está en archivos como `login.js`, `get.js`, etc.

2. **Estructura de imports**: Los archivos TypeScript compilados tienen imports relativos como `require("../../shared/db")` que esperan una estructura de directorios específica.

## ✅ Solución Implementada

Se han creado/modificado los siguientes archivos:

### 1. `update-lambda-handlers.js` (NUEVO)
Actualiza la configuración del handler de cada Lambda en AWS para que apunte a la ruta correcta dentro del ZIP.

**Handlers configurados:**
- `uss-login` → `lambdas/auth/login.handler`
- `uss-get-notifications` → `lambdas/notifications/get.handler`
- `uss-create-notification` → `lambdas/notifications/create.handler`
- `uss-mark-read` → `lambdas/notifications/markRead.handler`

### 2. `deploy-lambdas.js` (MODIFICADO)
Ahora empaqueta **toda la estructura de directorios** para que coincida con los imports compilados:

```
ZIP estructura:
├── lambdas/
│   ├── auth/
│   │   └── login.js (require("../../shared/db"))
│   └── notifications/
│       ├── get.js
│       ├── create.js
│       └── markRead.js
├── shared/
│   ├── db.js
│   ├── secrets.js
│   └── types.js
└── node_modules/
    └── ... (todas las dependencias)
```

### 3. `verify-structure.js` (NUEVO)
Verifica que todos los archivos necesarios existan antes del deploy.

### 4. `deploy-complete.js` (NUEVO)
Script todo-en-uno que ejecuta el flujo completo de deploy.

## 🚀 Cómo Usar

### Opción A: Deploy Completo (Recomendado)

```bash
node deploy-complete.js
```

Este script ejecuta automáticamente:
1. ✅ Verificación de estructura
2. ✅ Actualización de handlers
3. ✅ Deploy del código

### Opción B: Paso a Paso

```bash
# 1. Verificar que todo está listo
node verify-structure.js

# 2. Actualizar configuración de handlers en AWS
node update-lambda-handlers.js

# 3. Desplegar el código
node deploy-lambdas.js
```

## 🔍 Verificación Post-Deploy

Después del deploy exitoso, puedes verificar en AWS Lambda Console:

1. **Configuración → General**
   - Runtime: Node.js 20.x
   - Handler: `lambdas/auth/login.handler` (para uss-login)

2. **Código → Explorar archivos**
   - Deberías ver la carpeta `lambdas/`
   - Deberías ver la carpeta `shared/`
   - Deberías ver la carpeta `node_modules/`

## 🧪 Probar el Login

```bash
curl -X POST https://tu-api-gateway-url/login \
  -H "Content-Type: application/json" \
  -d '{"rut": "12345678-9"}'
```

Respuesta esperada:
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "student": {
    "rut": "12345678-9",
    "name": "Juan Pérez",
    "email": "juan.perez@uss.cl"
  }
}
```

## ⚠️ Notas Importantes

1. **No modificar la estructura del ZIP manualmente** - el script `deploy-lambdas.js` ya lo hace correctamente.

2. **Recompilar antes de deploy** - Si modificas los archivos `.ts`, ejecuta primero:
   ```bash
   npm run build
   ```

3. **Todas las Lambdas usan el mismo ZIP** - esto es correcto, ya que comparten código (shared/) y dependencias.

4. **El handler debe coincidir con la estructura** - por eso actualizamos los handlers con `update-lambda-handlers.js`.

## 📊 Resumen de Cambios

| Archivo | Acción | Propósito |
|---------|--------|-----------|
| `update-lambda-handlers.js` | NUEVO | Actualiza configuración handler en AWS |
| `deploy-lambdas.js` | MODIFICADO | Empaqueta con estructura completa |
| `verify-structure.js` | NUEVO | Verifica archivos pre-deploy |
| `deploy-complete.js` | NUEVO | Script todo-en-uno |

## 🐛 Troubleshooting

### Error: "Cannot find module X"
- Verificar que `npm install` esté ejecutado
- Verificar que `npm run build` compiló correctamente
- Ejecutar `node verify-structure.js`

### Error: "Lambda no existe"
- Crear las Lambdas primero con `node create-lambdas.js`
- Verificar en AWS Console que existen

### Error: "No such file or directory"
- Verificar que estés en el directorio `/backend`
- Verificar que exista la carpeta `dist/`

## 💡 Para Futuras Modificaciones

Si agregas nuevas Lambdas:

1. Agregar a `LAMBDA_HANDLERS` en `update-lambda-handlers.js`
2. Agregar a `LAMBDA_FUNCTIONS` en `deploy-lambdas.js`
3. Agregar verificación en `verify-structure.js`
4. Ejecutar `node deploy-complete.js`

---

**Autor:** Johan Escobar Acosta  
**Fecha:** 2024-11-14  
**Proyecto:** USS Student Hub
