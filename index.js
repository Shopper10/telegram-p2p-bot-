require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { connectDB } = require("./db");

if (!process.env.TOKEN_BOT) {
  throw new Error("❌ Falta TOKEN_BOT");
}

const bot = new TelegramBot(process.env.TOKEN_BOT, {
  polling: true
});

console.log("🤖 Bot iniciado");

connectDB()
  .then(() => console.log("🟢 Conectado a MongoDB"))
  .catch(err => console.error("🔴 Error MongoDB:", err));

bot.onText(/\/start/, msg => {
  bot.sendMessage(
    msg.chat.id,
    "🤖 Bot P2P activo\n\nUsa /help para ver comandos"
  );
});

bot.onText(/\/help/, msg => {
  bot.sendMessage(
    msg.chat.id,
    "/sell - Crear orden de venta\n/buy - Crear orden de compra"
  );
});
