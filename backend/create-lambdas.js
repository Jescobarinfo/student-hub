/**
 * Create Lambda Functions
 * Autor: Johan Escobar Acosta
 * 
 * Este script crea las 4 funciones Lambda en AWS
 */

const {
  LambdaClient,
  CreateFunctionCommand,
  GetFunctionCommand,
} = require('@aws-sdk/client-lambda');
const {
  IAMClient,
  GetRoleCommand,
} = require('@aws-sdk/client-iam');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const lambdaClient = new LambdaClient({ region: 'us-east-1' });
const iamClient = new IAMClient({ region: 'us-east-1' });

const IAM_ROLE_NAME = 'uss-lambda-execution-role';

const LAMBDA_FUNCTIONS = [
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
  {
    name: 'uss-login',
    handler: 'login.handler',
    description: 'Autenticación de estudiantes',
    sourcePath: 'lambdas/auth',
    mainFile: 'login.ts',
  },
];

/**
 * Obtener ARN del rol IAM
 */
async function getRoleArn() {
  try {
    const response = await iamClient.send(
      new GetRoleCommand({
        RoleName: IAM_ROLE_NAME,
      })
    );
    return response.Role.Arn;
  } catch (error) {
    console.error(`❌ Rol ${IAM_ROLE_NAME} no encontrado`);
    console.log('💡 Créalo primero con: node create-iam-role.js');
    throw error;
  }
}

/**
 * Verificar si Lambda existe
 */
async function lambdaExists(functionName) {
  try {
    await lambdaClient.send(
      new GetFunctionCommand({ FunctionName: functionName })
    );
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') return false;
    throw error;
  }
}

/**
 * Crear paquete ZIP básico
 */
function createBasicZip() {
  const zip = new AdmZip();
  
  // Código básico de respuesta
  const basicCode = `
exports.handler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ 
      success: true, 
      message: 'Lambda created - deploy code with deploy-lambdas.js' 
    }),
  };
};
  `;
  
  zip.addFile('index.js', Buffer.from(basicCode));
  return zip.toBuffer();
}

/**
 * Crear función Lambda
 */
async function createLambda(config, roleArn) {
  try {
    console.log(`📦 Creando ${config.name}...`);
    
    const zipBuffer = createBasicZip();
    
    const response = await lambdaClient.send(
      new CreateFunctionCommand({
        FunctionName: config.name,
        Runtime: 'nodejs20.x',
        Role: roleArn,
        Handler: 'index.handler',
        Code: {
          ZipFile: zipBuffer,
        },
        Description: config.description,
        Timeout: 30,
        MemorySize: 512,
        Environment: {
          Variables: {
            NODE_ENV: 'production',
          },
        },
      })
    );
    
    console.log(`✅ ${config.name} creada`);
    console.log(`   ARN: ${response.FunctionArn}\n`);
    return true;
  } catch (error) {
    console.error(`❌ Error creando ${config.name}:`, error.message);
    return false;
  }
}

/**
 * Crear todas las Lambdas
 */
async function createAllLambdas() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 CREATE LAMBDA FUNCTIONS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  try {
    // 1. Obtener rol IAM
    console.log('🔍 Verificando rol IAM...');
    const roleArn = await getRoleArn();
    console.log(`✅ Rol encontrado: ${roleArn}\n`);
    
    // 2. Crear cada Lambda
    const results = { created: [], existed: [], failed: [] };
    
    for (const config of LAMBDA_FUNCTIONS) {
      const exists = await lambdaExists(config.name);
      
      if (exists) {
        console.log(`ℹ️  ${config.name} ya existe\n`);
        results.existed.push(config.name);
        continue;
      }
      
      const created = await createLambda(config, roleArn);
      if (created) {
        results.created.push(config.name);
      } else {
        results.failed.push(config.name);
      }
    }
    
    // 3. Resumen
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 RESUMEN');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`✅ Creadas: ${results.created.length}`);
    console.log(`ℹ️  Ya existían: ${results.existed.length}`);
    console.log(`❌ Fallidas: ${results.failed.length}\n`);
    
    if (results.created.length > 0) {
      console.log('🎉 Lambdas creadas exitosamente!\n');
      console.log('📋 Próximo paso:');
      console.log('   node deploy-lambdas.js\n');
      console.log('   Esto desplegará el código real de cada Lambda.\n');
    }
    
    if (results.existed.length === LAMBDA_FUNCTIONS.length) {
      console.log('ℹ️  Todas las Lambdas ya existen.');
      console.log('💡 Usa deploy-lambdas.js para actualizar el código.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  }
}

// Ejecutar
if (require.main === module) {
  createAllLambdas();
}

module.exports = { createAllLambdas };
