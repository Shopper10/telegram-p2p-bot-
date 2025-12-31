import TelegramBot from "node-telegram-bot-api";
import mongoose from "mongoose";

// ===== VARIABLES DE ENTORNO =====
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URL = process.env.MONGO_URL;
const CHANNEL_ID = process.env.CHANNEL_ID;

// ===== VALIDACIONES =====
if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN no definido");
  process.exit(1);
}

if (!MONGO_URL) {
  console.error("❌ MONGO_URL no definido");
  process.exit(1);
}

if (!CHANNEL_ID) {
  console.error("⚠️ CHANNEL_ID no definido (el bot arrancará pero no publicará)");
}

// ===== MONGODB =====
mongoose.connect(MONGO_URL)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => {
    console.error("❌ Error MongoDB:", err.message);
    process.exit(1);
  });

// ===== TELEGRAM BOT =====
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.on("polling_error", (err) => {
  console.error("Polling error:", err.message);
});

// ===== COMANDOS =====

// /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🤖 Bot P2P activo\n\nUsa /help para ver comandos"
  );
});

// /help
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "📌 Comandos disponibles:\n" +
    "/start – Iniciar bot\n" +
    "/help – Ayuda\n" +
    "/post <mensaje> – Publicar en el canal"
  );
});

// /post <mensaje>
bot.onText(/\/post (.+)/, async (msg, match) => {
  if (!CHANNEL_ID) {
    return bot.sendMessage(msg.chat.id, "❌ CHANNEL_ID no configurado");
  }

  const text = match[1];

  try {
    await bot.sendMessage(
      CHANNEL_ID,
      `📢 *Nueva publicación P2P*\n\n${text}`,
      { parse_mode: "Markdown" }
    );

    bot.sendMessage(msg.chat.id, "✅ Mensaje enviado al canal");
  } catch (err) {
    console.error("❌ Error al publicar:", err.message);
    bot.sendMessage(msg.chat.id, "❌ Error al publicar en el canal");
  }
});

console.log("🚀 Bot iniciado y escuchando Telegram");