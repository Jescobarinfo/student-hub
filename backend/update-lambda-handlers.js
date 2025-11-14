/**
 * Update Lambda Handler Configuration
 * Autor: Johan Escobar Acosta
 * 
 * Este script actualiza la configuración del handler de las Lambdas existentes
 * para que apunten correctamente a los archivos JS desplegados
 */

import { LambdaClient, UpdateFunctionConfigurationCommand, GetFunctionCommand } from '@aws-sdk/client-lambda';

const lambdaClient = new LambdaClient({ region: 'us-east-1' });

// Configuración correcta de handlers
const LAMBDA_HANDLERS = [
  {
    name: 'uss-login',
    handler: 'lambdas/auth/login.handler', // mantiene estructura de directorios
  },
  {
    name: 'uss-get-notifications',
    handler: 'lambdas/notifications/get.handler',
  },
  {
    name: 'uss-create-notification',
    handler: 'lambdas/notifications/create.handler',
  },
  {
    name: 'uss-mark-read',
    handler: 'lambdas/notifications/markRead.handler',
  },
];

/**
 * Verificar existencia de Lambda
 */
async function lambdaExists(functionName) {
  try {
    await lambdaClient.send(new GetFunctionCommand({ FunctionName: functionName }));
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') return false;
    throw error;
  }
}

/**
 * Obtener configuración actual del handler
 */
async function getCurrentHandler(functionName) {
  try {
    const response = await lambdaClient.send(
      new GetFunctionCommand({ FunctionName: functionName })
    );
    return response.Configuration.Handler;
  } catch (error) {
    console.error(`Error obteniendo config de ${functionName}:`, error.message);
    return null;
  }
}

/**
 * Actualizar handler de Lambda
 */
async function updateHandler(functionName, newHandler) {
  try {
    console.log(`🔧 Actualizando handler de ${functionName}...`);
    
    const response = await lambdaClient.send(
      new UpdateFunctionConfigurationCommand({
        FunctionName: functionName,
        Handler: newHandler,
      })
    );
    
    console.log(`✅ Handler actualizado: ${response.Handler}\n`);
    return true;
  } catch (error) {
    console.error(`❌ Error actualizando ${functionName}:`, error.message);
    return false;
  }
}

/**
 * Actualizar todos los handlers
 */
async function updateAllHandlers() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔧 UPDATE LAMBDA HANDLERS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const results = { updated: [], skipped: [], failed: [] };
  
  for (const config of LAMBDA_HANDLERS) {
    console.log(`📌 ${config.name}`);
    
    // Verificar si existe
    const exists = await lambdaExists(config.name);
    if (!exists) {
      console.warn(`⚠️ Lambda no existe, omitiendo\n`);
      results.skipped.push(config.name);
      continue;
    }
    
    // Obtener handler actual
    const currentHandler = await getCurrentHandler(config.name);
    console.log(`   Handler actual: ${currentHandler}`);
    console.log(`   Handler nuevo:  ${config.handler}`);
    
    // Actualizar si es diferente
    if (currentHandler === config.handler) {
      console.log(`   ℹ️  Ya está correcto\n`);
      results.skipped.push(config.name);
      continue;
    }
    
    const success = await updateHandler(config.name, config.handler);
    if (success) {
      results.updated.push(config.name);
    } else {
      results.failed.push(config.name);
    }
  }
  
  // Resumen
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 RESUMEN');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`✅ Actualizados: ${results.updated.length}`);
  console.log(`ℹ️  Sin cambios:  ${results.skipped.length}`);
  console.log(`❌ Fallidos:     ${results.failed.length}\n`);
  
  if (results.updated.length > 0) {
    console.log('🎉 Handlers actualizados exitosamente!\n');
    console.log('📋 Próximo paso:');
    console.log('   node deploy-lambdas.js\n');
    console.log('   Para desplegar el código con la configuración correcta.\n');
  }
}

// Ejecutar
updateAllHandlers().catch(err => {
  console.error('❌ Error fatal:', err.message);
  process.exit(1);
});

export { updateAllHandlers };
