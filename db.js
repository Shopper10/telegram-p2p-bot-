const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Falta MONGODB_URI");
}

const client = new MongoClient(uri);

let db;

async function connectDB() {
  if (db) return db;

  try {
    await client.connect();
    db = client.db(); // base de datos por defecto
    console.log("🟢 Conectado a MongoDB");
    return db;
  } catch (err) {
    console.error("🔴 Error conectando a MongoDB:", err.message);
    process.exit(1);
  }
}

// EXPORTA LA FUNCIÓN
module.exports = { connectDB };

// 🔥 ESTO ES LO QUE FALTABA
// Conecta automáticamente al arrancar el bot
connectDB();