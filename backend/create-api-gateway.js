const { 
  APIGatewayClient, 
  CreateRestApiCommand, 
  GetResourcesCommand,
  CreateResourceCommand,
  PutMethodCommand,
  PutIntegrationCommand,
  CreateDeploymentCommand,
  PutMethodResponseCommand,
  PutIntegrationResponseCommand
} = require("@aws-sdk/client-api-gateway");
const { LambdaClient, AddPermissionCommand } = require("@aws-sdk/client-lambda");

const apiGatewayClient = new APIGatewayClient({ region: "us-east-1" });
const lambdaClient = new LambdaClient({ region: "us-east-1" });

const ACCOUNT_ID = "823420278803";
const REGION = "us-east-1";

async function createAPIGateway() {
  console.log("🚀 Creando API Gateway...\n");
  
  try {
    // 1. Crear REST API
    console.log("📝 Creando REST API...");
    const api = await apiGatewayClient.send(new CreateRestApiCommand({
      name: "USS-Student-Hub-API",
      description: "API para USS Student Hub",
      endpointConfiguration: {
        types: ["REGIONAL"]
      }
    }));
    
    const apiId = api.id;
    console.log("✅ API creada:", apiId);
    
    // 2. Obtener root resource
    const resources = await apiGatewayClient.send(new GetResourcesCommand({
      restApiId: apiId
    }));
    const rootId = resources.items[0].id;
    
    // 3. Crear recursos y métodos
    const endpoints = [
      {
        path: "login",
        method: "POST",
        lambda: "uss-login"
      },
      {
        path: "notifications",
        method: "GET",
        lambda: "uss-get-notifications"
      },
      {
        path: "notifications",
        method: "POST",
        lambda: "uss-create-notification"
      },
      {
        path: "notifications/read",
        method: "PUT",
        lambda: "uss-mark-read"
      }
    ];
    
    console.log("\n📦 Creando recursos y métodos...");
    
    const createdResources = {};
    
    for (const endpoint of endpoints) {
      const pathParts = endpoint.path.split('/');
      let currentParentId = rootId;
      let currentPath = '';
      
      // Crear cada parte del path
      for (const part of pathParts) {
        currentPath += '/' + part;
        
        if (!createdResources[currentPath]) {
          console.log(`  → Creando recurso: ${currentPath}`);
          const resource = await apiGatewayClient.send(new CreateResourceCommand({
            restApiId: apiId,
            parentId: currentParentId,
            pathPart: part
          }));
          createdResources[currentPath] = resource.id;
          currentParentId = resource.id;
        } else {
          currentParentId = createdResources[currentPath];
        }
      }
      
      const resourceId = currentParentId;
      
      // Crear método
      console.log(`  → Creando método ${endpoint.method} para ${endpoint.path}`);
      await apiGatewayClient.send(new PutMethodCommand({
        restApiId: apiId,
        resourceId: resourceId,
        httpMethod: endpoint.method,
        authorizationType: "NONE",
        apiKeyRequired: false
      }));
      
      // Response 200
      await apiGatewayClient.send(new PutMethodResponseCommand({
        restApiId: apiId,
        resourceId: resourceId,
        httpMethod: endpoint.method,
        statusCode: "200",
        responseParameters: {
          "method.response.header.Access-Control-Allow-Origin": false
        }
      }));
      
      // Integración con Lambda
      const lambdaUri = `arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${endpoint.lambda}/invocations`;
      
      await apiGatewayClient.send(new PutIntegrationCommand({
        restApiId: apiId,
        resourceId: resourceId,
        httpMethod: endpoint.method,
        type: "AWS_PROXY",
        integrationHttpMethod: "POST",
        uri: lambdaUri
      }));
      
      // Integration Response
      await apiGatewayClient.send(new PutIntegrationResponseCommand({
        restApiId: apiId,
        resourceId: resourceId,
        httpMethod: endpoint.method,
        statusCode: "200",
        responseParameters: {
          "method.response.header.Access-Control-Allow-Origin": "'*'"
        }
      }));
      
      // Dar permiso a API Gateway para invocar Lambda
      try {
        await lambdaClient.send(new AddPermissionCommand({
          FunctionName: endpoint.lambda,
          StatementId: `apigateway-${endpoint.lambda}-${Date.now()}`,
          Action: "lambda:InvokeFunction",
          Principal: "apigateway.amazonaws.com",
          SourceArn: `arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${apiId}/*/*`
        }));
      } catch (err) {
        // Ignorar si ya existe el permiso
        if (!err.message.includes("already exists")) {
          throw err;
        }
      }
      
      console.log(`  ✅ ${endpoint.method} /${endpoint.path} → ${endpoint.lambda}`);
    }
    
    // 4. Desplegar API
    console.log("\n🚀 Desplegando API...");
    await apiGatewayClient.send(new CreateDeploymentCommand({
      restApiId: apiId,
      stageName: "prod"
    }));
    
    const apiUrl = `https://${apiId}.execute-api.${REGION}.amazonaws.com/prod`;
    
    console.log("\n🎉 ¡API Gateway desplegada exitosamente!\n");
    console.log("📍 URL de la API:");
    console.log(`   ${apiUrl}\n`);
    console.log("📝 Endpoints disponibles:");
    console.log(`   POST   ${apiUrl}/login`);
    console.log(`   GET    ${apiUrl}/notifications?studentId=12345678-9`);
    console.log(`   POST   ${apiUrl}/notifications`);
    console.log(`   PUT    ${apiUrl}/notifications/read\n`);
    
    console.log("💡 Prueba el login:");
    console.log(`   curl -X POST ${apiUrl}/login \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"rut":"12345678-9","password":"password123"}'\n`);
    
    // Guardar URL para el frontend
    const fs = require('fs');
    fs.writeFileSync('api-url.txt', apiUrl);
    console.log("✅ URL guardada en api-url.txt");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createAPIGateway();
