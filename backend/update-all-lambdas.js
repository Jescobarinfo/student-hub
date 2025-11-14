const { LambdaClient, UpdateFunctionCodeCommand } = require("@aws-sdk/client-lambda");
const AdmZip = require('adm-zip');

const lambdaClient = new LambdaClient({ region: "us-east-1" });

// Código completo que funciona (el mismo que uss-login)
const lambdaCode = `
const { DynamoDBClient, GetItemCommand, QueryCommand, PutItemCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const { unmarshall, marshall } = require("@aws-sdk/util-dynamodb");

const dynamoClient = new DynamoDBClient({});
const secretsClient = new SecretsManagerClient({});

function createJWT(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = require('crypto')
    .createHmac('sha256', secret)
    .update(encodedHeader + '.' + encodedPayload)
    .digest('base64url');
  return encodedHeader + '.' + encodedPayload + '.' + signature;
}

exports.handler = async (event) => {
  console.log("Event:", JSON.stringify(event));
  
  const path = event.requestContext?.resourcePath || event.path || event.resource;
  const method = event.requestContext?.httpMethod || event.httpMethod;
  
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Content-Type": "application/json"
  };
  
  try {
    console.log("Path:", path, "Method:", method);
    
    // LOGIN
    if (path === "/login" && method === "POST") {
      const body = JSON.parse(event.body);
      const { rut, password } = body;
      
      const result = await dynamoClient.send(new GetItemCommand({
        TableName: "USS_Students",
        Key: marshall({ rut })
      }));
      
      if (!result.Item) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: "Credenciales inválidas" })
        };
      }
      
      const student = unmarshall(result.Item);
      
      if (student.password !== password) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: "Credenciales inválidas" })
        };
      }
      
      const secretResponse = await secretsClient.send(new GetSecretValueCommand({
        SecretId: "uss-student-hub-secrets"
      }));
      const secrets = JSON.parse(secretResponse.SecretString);
      
      const token = createJWT({
        rut: student.rut,
        name: student.name,
        email: student.email,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      }, secrets.jwt.secret);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          token,
          user: {
            rut: student.rut,
            name: student.name,
            email: student.email,
            career: student.career
          }
        })
      };
    }
    
    // GET NOTIFICATIONS
    if (path === "/notifications" && method === "GET") {
      const studentId = event.queryStringParameters?.studentId;
      
      if (!studentId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: "studentId requerido" })
        };
      }
      
      const result = await dynamoClient.send(new QueryCommand({
        TableName: "USS_Notifications",
        KeyConditionExpression: "studentId = :studentId",
        ExpressionAttributeValues: marshall({
          ":studentId": studentId
        }),
        ScanIndexForward: false,
        Limit: 20
      }));
      
      const notifications = result.Items?.map(item => unmarshall(item)) || [];
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          notifications,
          count: notifications.length
        })
      };
    }
    
    // CREATE NOTIFICATION
    if (path === "/notifications" && method === "POST") {
      const body = JSON.parse(event.body);
      const { studentId, type, title, message, metadata } = body;
      
      const timestamp = Date.now();
      const notification = {
        studentId,
        timestamp,
        notificationId: timestamp.toString() + Math.random().toString(36).substr(2, 9),
        type: type || "INFO",
        title,
        message,
        isRead: "false",
        metadata: metadata || {}
      };
      
      await dynamoClient.send(new PutItemCommand({
        TableName: "USS_Notifications",
        Item: marshall(notification)
      }));
      
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          notification
        })
      };
    }
    
    // MARK AS READ
    if (path === "/notifications/read" && method === "PUT") {
      const body = JSON.parse(event.body);
      const { studentId, timestamp } = body;
      
      await dynamoClient.send(new UpdateItemCommand({
        TableName: "USS_Notifications",
        Key: marshall({ studentId, timestamp: parseInt(timestamp) }),
        UpdateExpression: "SET isRead = :isRead",
        ExpressionAttributeValues: marshall({
          ":isRead": "true"
        })
      }));
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: "Notificación marcada como leída"
        })
      };
    }
    
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Endpoint no encontrado: " + path })
    };
    
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: "Error interno del servidor",
        details: error.message 
      })
    };
  }
};
`;

async function updateAllLambdas() {
  console.log("🔄 Actualizando TODAS las Lambdas con código corregido...\n");
  
  const lambdas = [
    "uss-login",
    "uss-get-notifications",
    "uss-create-notification",
    "uss-mark-read"
  ];
  
  try {
    // Crear ZIP
    const zip = new AdmZip();
    zip.addFile("index.js", Buffer.from(lambdaCode));
    const zipBuffer = zip.toBuffer();
    
    // Actualizar todas las Lambdas
    for (const functionName of lambdas) {
      console.log(`📦 Actualizando ${functionName}...`);
      await lambdaClient.send(new UpdateFunctionCodeCommand({
        FunctionName: functionName,
        ZipFile: zipBuffer
      }));
      console.log(`  ✅ ${functionName} actualizada`);
    }
    
    console.log("\n🎉 ¡Todas las Lambdas actualizadas!\n");
    console.log("🧪 Prueba los endpoints:\n");
    console.log("1. GET Notifications:");
    console.log('   Invoke-WebRequest -Uri "https://fqttaemgp7.execute-api.us-east-1.amazonaws.com/prod/notifications?studentId=12345678-9"\n');
    console.log("2. POST Notification:");
    console.log('   Invoke-WebRequest -Uri "https://fqttaemgp7.execute-api.us-east-1.amazonaws.com/prod/notifications" -Method POST -Headers @{"Content-Type"="application/json"} -Body \'{"studentId":"12345678-9","type":"GRADE","title":"Nueva nota","message":"Nota de Física: 7.0","metadata":{"courseCode":"FIS101","grade":7.0}}\'');
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

updateAllLambdas();
