const { LambdaClient, CreateFunctionCommand, UpdateFunctionCodeCommand, GetFunctionCommand } = require("@aws-sdk/client-lambda");
const { APIGatewayClient, CreateResourceCommand, PutMethodCommand, PutIntegrationCommand, CreateDeploymentCommand, GetResourcesCommand, PutMethodResponseCommand, PutIntegrationResponseCommand } = require("@aws-sdk/client-api-gateway");
const { AddPermissionCommand } = require("@aws-sdk/client-lambda");
const AdmZip = require('adm-zip');
const fs = require('fs');

const lambdaClient = new LambdaClient({ region: "us-east-1" });
const apiGatewayClient = new APIGatewayClient({ region: "us-east-1" });

const ROLE_ARN = "arn:aws:iam::823420278803:role/uss-lambda-execution-role";
const API_ID = "fqttaemgp7";
const REGION = "us-east-1";
const ACCOUNT_ID = "823420278803";

async function deployGraphQL() {
  console.log("🚀 Deploying GraphQL Lambda...\n");
  
  try {
    // Read Lambda code
    const code = fs.readFileSync('./lambda-graphql.js', 'utf8');
    
    // Create ZIP
    const zip = new AdmZip();
    zip.addFile("index.js", Buffer.from(code));
    const zipBuffer = zip.toBuffer();
    
    // Create or update Lambda
    console.log("📦 Creating/Updating Lambda function...");
    try {
      await lambdaClient.send(new GetFunctionCommand({
        FunctionName: "uss-graphql"
      }));
      
      // Update existing
      await lambdaClient.send(new UpdateFunctionCodeCommand({
        FunctionName: "uss-graphql",
        ZipFile: zipBuffer
      }));
      console.log("✅ Lambda updated");
      
    } catch (err) {
      // Create new
      await lambdaClient.send(new CreateFunctionCommand({
        FunctionName: "uss-graphql",
        Runtime: "nodejs20.x",
        Role: ROLE_ARN,
        Handler: "index.handler",
        Code: { ZipFile: zipBuffer },
        Timeout: 30,
        MemorySize: 512,
        Environment: {
          Variables: {
            NODE_ENV: "production"
          }
        }
      }));
      console.log("✅ Lambda created");
      
      // Wait for Lambda to be ready
      console.log("⏳ Waiting 5 seconds for Lambda to be ready...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Get resources
    const resources = await apiGatewayClient.send(new GetResourcesCommand({
      restApiId: API_ID
    }));
    
    const rootId = resources.items.find(r => r.path === '/').id;
    
    // Create /graphql resource
    console.log("\n📝 Creating /graphql endpoint...");
    let graphqlResourceId;
    
    const existingGraphql = resources.items.find(r => r.path === '/graphql');
    if (existingGraphql) {
      graphqlResourceId = existingGraphql.id;
      console.log("  ⚠️  /graphql already exists");
    } else {
      const resource = await apiGatewayClient.send(new CreateResourceCommand({
        restApiId: API_ID,
        parentId: rootId,
        pathPart: "graphql"
      }));
      graphqlResourceId = resource.id;
      console.log("  ✅ /graphql created");
    }
    
    // Create POST method
    console.log("  → Creating POST method...");
    try {
      await apiGatewayClient.send(new PutMethodCommand({
        restApiId: API_ID,
        resourceId: graphqlResourceId,
        httpMethod: "POST",
        authorizationType: "NONE"
      }));
      
      await apiGatewayClient.send(new PutMethodResponseCommand({
        restApiId: API_ID,
        resourceId: graphqlResourceId,
        httpMethod: "POST",
        statusCode: "200",
        responseParameters: {
          "method.response.header.Access-Control-Allow-Origin": false
        }
      }));
      
      console.log("    ✅ POST method created");
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
      console.log("    ⚠️  POST method already exists");
    }
    
    // Integration
    console.log("  → Creating Lambda integration...");
    const lambdaUri = `arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:uss-graphql/invocations`;
    
    await apiGatewayClient.send(new PutIntegrationCommand({
      restApiId: API_ID,
      resourceId: graphqlResourceId,
      httpMethod: "POST",
      type: "AWS_PROXY",
      integrationHttpMethod: "POST",
      uri: lambdaUri
    }));
    
    await apiGatewayClient.send(new PutIntegrationResponseCommand({
      restApiId: API_ID,
      resourceId: graphqlResourceId,
      httpMethod: "POST",
      statusCode: "200",
      responseParameters: {
        "method.response.header.Access-Control-Allow-Origin": "'*'"
      }
    }));
    
    console.log("    ✅ Integration created");
    
    // Add Lambda permission
    console.log("  → Adding Lambda permission...");
    try {
      await lambdaClient.send(new AddPermissionCommand({
        FunctionName: "uss-graphql",
        StatementId: `apigateway-graphql-${Date.now()}`,
        Action: "lambda:InvokeFunction",
        Principal: "apigateway.amazonaws.com",
        SourceArn: `arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*`
      }));
      console.log("    ✅ Permission added");
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
      console.log("    ⚠️  Permission already exists");
    }
    
    // Create OPTIONS for CORS
    console.log("  → Creating OPTIONS method for CORS...");
    try {
      await apiGatewayClient.send(new PutMethodCommand({
        restApiId: API_ID,
        resourceId: graphqlResourceId,
        httpMethod: "OPTIONS",
        authorizationType: "NONE"
      }));
      
      await apiGatewayClient.send(new PutMethodResponseCommand({
        restApiId: API_ID,
        resourceId: graphqlResourceId,
        httpMethod: "OPTIONS",
        statusCode: "200",
        responseParameters: {
          "method.response.header.Access-Control-Allow-Headers": false,
          "method.response.header.Access-Control-Allow-Methods": false,
          "method.response.header.Access-Control-Allow-Origin": false
        }
      }));
      
      await apiGatewayClient.send(new PutIntegrationCommand({
        restApiId: API_ID,
        resourceId: graphqlResourceId,
        httpMethod: "OPTIONS",
        type: "MOCK",
        requestTemplates: {
          "application/json": '{"statusCode": 200}'
        }
      }));
      
      await apiGatewayClient.send(new PutIntegrationResponseCommand({
        restApiId: API_ID,
        resourceId: graphqlResourceId,
        httpMethod: "OPTIONS",
        statusCode: "200",
        responseParameters: {
          "method.response.header.Access-Control-Allow-Headers": "'Content-Type,Authorization'",
          "method.response.header.Access-Control-Allow-Methods": "'POST,OPTIONS'",
          "method.response.header.Access-Control-Allow-Origin": "'*'"
        }
      }));
      
      console.log("    ✅ OPTIONS created");
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
      console.log("    ⚠️  OPTIONS already exists");
    }
    
    // Deploy
    console.log("\n🚀 Deploying API...");
    await apiGatewayClient.send(new CreateDeploymentCommand({
      restApiId: API_ID,
      stageName: "prod",
      description: "Add GraphQL endpoint"
    }));
    
    console.log("\n🎉 GraphQL endpoint deployed!\n");
    console.log("📍 GraphQL URL:");
    console.log(`   https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/graphql\n`);
    console.log("🧪 Test with curl:");
    console.log(`   curl -X POST https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/graphql \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"query":"{ dashboard(studentId: \\"12345678-9\\") { user { name email } stats { total unread avgGrade } } }"}'`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

deployGraphQL();
