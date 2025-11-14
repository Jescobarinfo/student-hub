/**
 * Deploy AWS Lambda Functions - Proyecto USS Student Hub
 * Autor: Johan Escobar Acosta
 * 
 * Empaqueta desde dist/ (JS compilado) + node_modules + shared
 */

import { LambdaClient, UpdateFunctionCodeCommand, GetFunctionCommand } from '@aws-sdk/client-lambda';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cliente AWS Lambda
const lambdaClient = new LambdaClient({ region: 'us-east-1' });

// Configuración de Lambdas
const LAMBDA_FUNCTIONS = [
  {
    name: 'uss-login',
    description: 'Autenticación de estudiantes',
  },
  {
    name: 'uss-get-notifications',
    description: 'Obtener notificaciones de un estudiante',
  },
  {
    name: 'uss-create-notification',
    description: 'Crear nueva notificación',
  },
  {
    name: 'uss-mark-read',
    description: 'Marcar notificación como leída',
  },
];

// Verificar existencia de Lambda
async function lambdaExists(functionName) {
  try {
    await lambdaClient.send(new GetFunctionCommand({ FunctionName: functionName }));
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') return false;
    throw error;
  }
}

// Agregar carpeta al ZIP manteniendo estructura
function addFolderToZip(zip, folderPath, zipRootPath = '') {
  if (!fs.existsSync(folderPath)) return;
  const items = fs.readdirSync(folderPath);
  for (const item of items) {
    const fullPath = path.join(folderPath, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      addFolderToZip(zip, fullPath, path.join(zipRootPath, item));
    } else {
      const zipPath = path.join(zipRootPath, item).replace(/\\/g, '/');
      zip.addFile(zipPath, fs.readFileSync(fullPath));
    }
  }
}

// Crear ZIP de deployment (mismo para todas las Lambdas)
function createDeploymentPackage(functionName) {
  console.log(`📦 Empaquetando ${functionName}...`);
  const zip = new AdmZip();

  // Mantener estructura completa de dist/lambdas
  const lambdasDir = path.join(__dirname, 'dist/lambdas');
  if (fs.existsSync(lambdasDir)) {
    addFolderToZip(zip, lambdasDir, 'lambdas');
    console.log(`   ✓ lambdas/ (con estructura completa)`);
  } else {
    console.warn(`⚠️ Directorio no encontrado: ${lambdasDir}`);
    return null;
  }

  // Carpeta shared/ desde dist/
  const sharedDir = path.join(__dirname, 'dist/shared');
  if (fs.existsSync(sharedDir)) {
    addFolderToZip(zip, sharedDir, 'shared');
    console.log(`   ✓ shared/`);
  }

  // node_modules/
  const nodeModules = path.join(__dirname, 'node_modules');
  if (fs.existsSync(nodeModules)) {
    console.log(`   ✓ node_modules/ (puede tardar...)`);
    addFolderToZip(zip, nodeModules, 'node_modules');
  }

  const zipBuffer = zip.toBuffer();
  console.log(`   ✅ Paquete listo: ${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB\n`);
  return zipBuffer;
}

// Actualizar Lambda
async function updateLambdaCode(functionName, zipBuffer) {
  try {
    console.log(`🚀 Desplegando ${functionName}...`);
    const resp = await lambdaClient.send(new UpdateFunctionCodeCommand({
      FunctionName: functionName,
      ZipFile: zipBuffer,
      Publish: true,
    }));
    console.log(`✅ ${functionName} desplegado, versión ${resp.Version}\n`);
  } catch (error) {
    console.error(`❌ Error desplegando ${functionName}: ${error.message}`);
    throw error;
  }
}

// Deploy de todas las Lambdas
async function deployAllLambdas() {
  console.log('══════════════════════════════');
  console.log('🚀 Deployment de Lambdas (dist/)');
  console.log('══════════════════════════════\n');

  const results = { success: [], failed: [], skipped: [] };

  // Crear un solo paquete ZIP para todas las Lambdas
  console.log('📦 Creando paquete de deployment...');
  const zipBuffer = createDeploymentPackage('todas las Lambdas');
  
  if (!zipBuffer) {
    console.error('❌ No se pudo crear el paquete ZIP');
    return;
  }

  for (const fn of LAMBDA_FUNCTIONS) {
    console.log(`📌 ${fn.name}`);
    try {
      if (!(await lambdaExists(fn.name))) {
        console.warn(`⚠️ Función no existe, omitiendo\n`);
        results.skipped.push(fn.name);
        continue;
      }
      await updateLambdaCode(fn.name, zipBuffer);
      results.success.push(fn.name);
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
      results.failed.push(fn.name);
    }
  }

  console.log('\n══════════════════════════════');
  console.log('📊 Resumen del deployment');
  console.log('══════════════════════════════\n');
  console.log(`✅ Exitosas: ${results.success.length}`);
  console.log(`⚠️ Omitidas: ${results.skipped.length}`);
  console.log(`❌ Fallidas: ${results.failed.length}\n`);
}

// Ejecutar si se corre directamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  deployAllLambdas().catch(err => {
    console.error('❌ Error fatal:', err.message);
    process.exit(1);
  });
}

export { deployAllLambdas };
