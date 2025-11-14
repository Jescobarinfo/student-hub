const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: "us-east-1" });

async function createTables() {
  console.log("🚀 Creando tablas en DynamoDB...\n");

  // Tabla de Estudiantes
  const studentsTable = {
    TableName: "USS_Students",
    KeySchema: [
      { AttributeName: "rut", KeyType: "HASH" }
    ],
    AttributeDefinitions: [
      { AttributeName: "rut", AttributeType: "S" },
      { AttributeName: "email", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "EmailIndex",
        KeySchema: [
          { AttributeName: "email", KeyType: "HASH" }
        ],
        Projection: { ProjectionType: "ALL" }
      }
    ],
    BillingMode: "PAY_PER_REQUEST"
  };

  // Tabla de Notificaciones
  const notificationsTable = {
    TableName: "USS_Notifications",
    KeySchema: [
      { AttributeName: "studentId", KeyType: "HASH" },
      { AttributeName: "timestamp", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "studentId", AttributeType: "S" },
      { AttributeName: "timestamp", AttributeType: "N" },
      { AttributeName: "isRead", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "UnreadIndex",
        KeySchema: [
          { AttributeName: "studentId", KeyType: "HASH" },
          { AttributeName: "isRead", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      }
    ],
    BillingMode: "PAY_PER_REQUEST"
  };

  try {
    // Verificar tablas existentes
    const listCommand = new ListTablesCommand({});
    const existingTables = await client.send(listCommand);
    
    // Crear tabla Students si no existe
    if (!existingTables.TableNames.includes("USS_Students")) {
      console.log("📊 Creando tabla USS_Students...");
      await client.send(new CreateTableCommand(studentsTable));
      console.log("✅ Tabla USS_Students creada\n");
    } else {
      console.log("⚠️  Tabla USS_Students ya existe\n");
    }

    // Crear tabla Notifications si no existe
    if (!existingTables.TableNames.includes("USS_Notifications")) {
      console.log("📊 Creando tabla USS_Notifications...");
      await client.send(new CreateTableCommand(notificationsTable));
      console.log("✅ Tabla USS_Notifications creada\n");
    } else {
      console.log("⚠️  Tabla USS_Notifications ya existe\n");
    }

    console.log("🎉 ¡Tablas DynamoDB listas!\n");
    console.log("Puedes verlas en: https://console.aws.amazon.com/dynamodbv2/home?region=us-east-1#tables");

  } catch (error) {
    console.error("❌ Error creando tablas:", error.message);
    process.exit(1);
  }
}

createTables();
