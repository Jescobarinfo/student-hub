const { SecretsManagerClient, CreateSecretCommand, DescribeSecretCommand } = require("@aws-sdk/client-secrets-manager");

const client = new SecretsManagerClient({ region: "us-east-1" });

async function createSecrets() {
  console.log("🔐 Creando secretos en AWS Secrets Manager...\n");

  const secretData = {
    jwt: {
      secret: "uss-super-secret-jwt-key-2025-production",
      expiresIn: "24h"
    },
    oracle: {
      host: "banner-db.uss.cl",
      port: 1521,
      database: "BANNER",
      username: "banner_readonly",
      password: "mock_password_123"
    }
  };

  try {
    // Verificar si el secreto ya existe
    try {
      await client.send(new DescribeSecretCommand({
        SecretId: "uss-student-hub-secrets"
      }));
      console.log("⚠️  Secreto 'uss-student-hub-secrets' ya existe\n");
      console.log("✅ Puedes continuar con el siguiente paso\n");
      return;
    } catch (err) {
      if (err.name !== 'ResourceNotFoundException') {
        throw err;
      }
    }

    // Crear el secreto
    console.log("📝 Creando secreto 'uss-student-hub-secrets'...");
    await client.send(new CreateSecretCommand({
      Name: "uss-student-hub-secrets",
      Description: "Secretos para USS Student Hub (JWT y mock Oracle)",
      SecretString: JSON.stringify(secretData)
    }));

    console.log("✅ Secreto creado exitosamente\n");
    console.log("🔑 Contenido del secreto:");
    console.log("   - JWT Secret: [oculto]");
    console.log("   - Oracle Host: banner-db.uss.cl (mock)");
    console.log("   - Oracle User: banner_readonly (mock)\n");

  } catch (error) {
    console.error("❌ Error creando secreto:", error.message);
    process.exit(1);
  }
}

createSecrets();
