import TelegramBot from "node-telegram-bot-api";
import mongoose from "mongoose";

const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URL = process.env.MONGO_URL;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN no definido");
  process.exit(1);
}

if (!MONGO_URL) {
  console.error("❌ MONGO_URL no definido");
  process.exit(1);
}

mongoose.connect(MONGO_URL)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => {
    console.error("❌ Error MongoDB:", err.message);
    process.exit(1);
  });

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🤖 Bot P2P activo\n\nUsa /help para ver comandos"
  );
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "📌 Comandos disponibles:\n/start – Iniciar bot\n/help – Ayuda"
  );
});

console.log("🚀 Bot iniciado y escuchando Telegram");
