/**
 * Deploy AWS Lambda Functions
 * Autor: Johan Escobar Acosta
 * 
 * Este script despliega todas las funciones Lambda del proyecto
 */

const { LambdaClient, UpdateFunctionCodeCommand, GetFunctionCommand } = require('@aws-sdk/client-lambda');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const lambdaClient = new LambdaClient({ region: 'us-east-1' });

// Configuración de las funciones Lambda
const LAMBDA_FUNCTIONS = [
  {
    name: 'uss-login',
    handler: 'login.handler',
    description: 'Autenticación de estudiantes con JWT',
    sourcePath: 'lambdas/auth',
    mainFile: 'login.ts',
  },
  {
    name: 'uss-get-notifications',
    handler: 'get.handler',
    description: 'Obtener notificaciones de un estudiante',
    sourcePath: 'lambdas/notifications',
    mainFile: 'get.ts',
  },
  {
    name: 'uss-create-notification',
    handler: 'create.handler',
    description: 'Crear nueva notificación',
    sourcePath: 'lambdas/notifications',
    mainFile: 'create.ts',
  },
  {
    name: 'uss-mark-read',
    handler: 'markRead.handler',
    description: 'Marcar notificación como leída',
    sourcePath: 'lambdas/notifications',
    mainFile: 'markRead.ts',
  },
];

/**
 * Verificar que una función Lambda existe
 */
async function lambdaExists(functionName) {
  try {
    await lambdaClient.send(
      new GetFunctionCommand({
        FunctionName: functionName,
      })
    );
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

/**
 * Copiar recursivamente una carpeta al ZIP
 */
function addFolderToZip(zip, folderPath, zipPath = '') {
  if (!fs.existsSync(folderPath)) {
    return;
  }

  const items = fs.readdirSync(folderPath);
  
  items.forEach((item) => {
    const itemPath = path.join(folderPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      addFolderToZip(zip, itemPath, path.join(zipPath, item));
    } else {
      const content = fs.readFileSync(itemPath);
      zip.addFile(path.join(zipPath, item), content);
    }
  });
}

/**
 * Crear archivo ZIP con el código de la Lambda
 */
function createDeploymentPackage(functionConfig) {
  console.log(`📦 Empaquetando ${functionConfig.name}...`);

  const zip = new AdmZip();

  // Agregar el archivo principal de la función
  const functionPath = path.join(__dirname, functionConfig.sourcePath, functionConfig.mainFile);
  if (fs.existsSync(functionPath)) {
    const content = fs.readFileSync(functionPath);
    zip.addFile(functionConfig.mainFile, content);
    console.log(`   ✓ ${functionConfig.mainFile}`);
  } else {
    console.warn(`   ⚠️  Archivo no encontrado: ${functionPath}`);
  }

  // Agregar todos los archivos del directorio de la función
  const functionDir = path.join(__dirname, functionConfig.sourcePath);
  if (fs.existsSync(functionDir)) {
    const files = fs.readdirSync(functionDir);
    files.forEach((file) => {
      if (file !== functionConfig.mainFile && file.endsWith('.ts')) {
        const filePath = path.join(functionDir, file);
        const content = fs.readFileSync(filePath);
        zip.addFile(file, content);
        console.log(`   ✓ ${file}`);
      }
    });
  }

  // Agregar archivos compartidos (shared/)
  const sharedDir = path.join(__dirname, 'shared');
  if (fs.existsSync(sharedDir)) {
    addFolderToZip(zip, sharedDir, 'shared');
    console.log(`   ✓ shared/`);
  }

  // Agregar node_modules completo (necesario para AWS SDK v3)
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.log(`   ✓ node_modules/ (esto puede tardar...)`);
    addFolderToZip(zip, nodeModulesPath, 'node_modules');
  }

  // Generar el buffer del ZIP
  const zipBuffer = zip.toBuffer();
  const sizeMB = (zipBuffer.length / 1024 / 1024).toFixed(2);
  console.log(`   ✅ Paquete: ${sizeMB} MB\n`);

  return zipBuffer;
}

/**
 * Actualizar código de una función Lambda
 */
async function updateLambdaCode(functionName, zipBuffer) {
  try {
    console.log(`🚀 Desplegando ${functionName} a AWS...`);

    const command = new UpdateFunctionCodeCommand({
      FunctionName: functionName,
      ZipFile: zipBuffer,
      Publish: true,
    });

    const response = await lambdaClient.send(command);

    console.log(`✅ ${functionName} desplegado`);
    console.log(`   Versión: ${response.Version}`);
    console.log(`   Tamaño: ${(response.CodeSize / 1024).toFixed(2)} KB`);
    console.log(`   Actualizado: ${response.LastModified}\n`);

    return response;
  } catch (error) {
    console.error(`❌ Error desplegando ${functionName}:`, error.message);
    throw error;
  }
}

/**
 * Desplegar todas las funciones Lambda
 */
async function deployAllLambdas() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 USS STUDENT HUB - LAMBDA DEPLOYMENT');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`📍 Región: us-east-1`);
  console.log(`📊 Funciones: ${LAMBDA_FUNCTIONS.length}\n`);

  const results = {
    success: [],
    failed: [],
    skipped: [],
  };

  for (const functionConfig of LAMBDA_FUNCTIONS) {
    console.log(`──────────────────────────────────────────────────────`);
    console.log(`📌 ${functionConfig.name}`);
    console.log(`   ${functionConfig.description}\n`);

    try {
      // Verificar si la función existe
      const exists = await lambdaExists(functionConfig.name);

      if (!exists) {
        console.log(`⚠️  Función no existe en AWS - Saltando`);
        console.log(`   Créala primero en AWS Console o con create-lambda.js\n`);
        results.skipped.push(functionConfig.name);
        continue;
      }

      // Crear paquete de deployment
      const zipBuffer = createDeploymentPackage(functionConfig);

      // Actualizar código
      await updateLambdaCode(functionConfig.name, zipBuffer);

      results.success.push(functionConfig.name);
    } catch (error) {
      console.error(`❌ Error: ${error.message}\n`);
      results.failed.push(functionConfig.name);
    }
  }

  // Resumen final
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 RESUMEN DEL DEPLOYMENT');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`✅ Exitosas:  ${results.success.length}`);
  console.log(`⚠️  Omitidas:  ${results.skipped.length}`);
  console.log(`❌ Fallidas:  ${results.failed.length}`);
  console.log(`📈 Total:     ${results.success.length}/${LAMBDA_FUNCTIONS.length}\n`);

  if (results.success.length > 0) {
    console.log('✅ Funciones desplegadas:');
    results.success.forEach((name) => console.log(`   - ${name}`));
    console.log('');
  }

  if (results.skipped.length > 0) {
    console.log('⚠️  Funciones omitidas:');
    results.skipped.forEach((name) => console.log(`   - ${name}`));
    console.log('');
  }

  if (results.failed.length > 0) {
    console.log('❌ Funciones fallidas:');
    results.failed.forEach((name) => console.log(`   - ${name}`));
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════\n');

  if (results.success.length > 0) {
    console.log('🎉 Deployment completado!');
    console.log('🔗 API Gateway: https://fqttaemgp7.execute-api.us-east-1.amazonaws.com/prod');
    console.log('🧪 Test: curl "https://fqttaemgp7.execute-api.us-east-1.amazonaws.com/prod/notifications?studentId=12345678-9"\n');
  }

  // Salir con código de error si hubo fallas críticas
  if (results.failed.length > 0 && results.success.length === 0) {
    console.error('❌ Deployment fallido - No se desplegó ninguna función');
    process.exit(1);
  }

  if (results.success.length === 0 && results.skipped.length > 0) {
    console.warn('⚠️  Todas las funciones fueron omitidas - Puede que no existan en AWS');
    console.warn('💡 Crea las funciones primero o verifica tus credenciales AWS\n');
  }
}

// Ejecutar deployment
if (require.main === module) {
  deployAllLambdas().catch((error) => {
    console.error('\n❌ Error fatal durante el deployment:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  });
}

module.exports = { deployAllLambdas };
