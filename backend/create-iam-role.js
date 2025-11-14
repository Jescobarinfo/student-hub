const { IAMClient, GetRoleCommand, CreateRoleCommand, AttachRolePolicyCommand } = require("@aws-sdk/client-iam");

const iamClient = new IAMClient({ region: "us-east-1" });
const ROLE_NAME = "uss-lambda-execution-role";

async function createRole() {
  console.log("🔐 Creando IAM Role para Lambdas...\n");
  
  try {
    // Verificar si ya existe
    try {
      const existing = await iamClient.send(new GetRoleCommand({
        RoleName: ROLE_NAME
      }));
      console.log("✅ Role ya existe:", existing.Role.Arn);
      return;
    } catch (err) {
      // Si no existe, continuamos para crearlo
      console.log("📝 Role no existe, creando...");
    }
    
    // Trust policy para Lambda
    const trustPolicy = {
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow",
        Principal: { Service: "lambda.amazonaws.com" },
        Action: "sts:AssumeRole"
      }]
    };
    
    // Crear role
    const roleResult = await iamClient.send(new CreateRoleCommand({
      RoleName: ROLE_NAME,
      AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
      Description: "Role para Lambdas de USS Student Hub"
    }));
    
    console.log("✅ Role creado:", roleResult.Role.Arn);
    
    // Attach policies necesarias
    const policies = [
      { name: "Basic Lambda Execution", arn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" },
      { name: "DynamoDB Full Access", arn: "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess" },
      { name: "Secrets Manager Read", arn: "arn:aws:iam::aws:policy/SecretsManagerReadWrite" }
    ];
    
    console.log("\n📎 Adjuntando políticas...");
    for (const policy of policies) {
      await iamClient.send(new AttachRolePolicyCommand({
        RoleName: ROLE_NAME,
        PolicyArn: policy.arn
      }));
      console.log(`  ✅ ${policy.name}`);
    }
    
    console.log("\n⏳ Esperando 10 segundos para que el role se propague en AWS...");
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log("\n🎉 Role listo para usar");
    console.log("ARN:", roleResult.Role.Arn);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Detalle:", error);
    process.exit(1);
  }
}

createRole();
