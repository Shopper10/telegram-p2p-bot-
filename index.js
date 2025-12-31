require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

// ===== VALIDACIONES BÁSICAS =====
if (!process.env.TOKEN_BOT) {
  throw new Error("Falta TOKEN_BOT");
}
if (!process.env.CHANNEL_ID) {
  throw new Error("Falta CHANNEL_ID");
}

// ===== CREAR BOT =====
const bot = new TelegramBot(process.env.TOKEN_BOT, {
  polling: true,
});

// ===== LOG DE ARRANQUE =====
console.log("🤖 Bot iniciando...");

// ===== PRUEBA DIRECTA AL INICIAR (MUY IMPORTANTE) =====
bot.on("polling_error", (err) => {
  console.error("Polling error:", err.message);
});

setTimeout(async () => {
  try {
    await bot.sendMessage(
      process.env.CHANNEL_ID,
      "✅ Prueba directa: el bot puede escribir en el canal"
    );
    console.log("✅ Mensaje de prueba enviado al canal");
  } catch (err) {
    console.error(
      "❌ Error prueba directa:",
      err.response?.body || err.message
    );
  }
}, 5000);

// ===== /start =====
bot.onText(/\/start/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    "🤖 Bot P2P activo\n\nUsa /post <mensaje> para publicar en el canal"
  );
});

// ===== /help =====
bot.onText(/\/help/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    "📌 Comandos disponibles:\n\n" +
      "/post <mensaje> → Publicar en el canal P2P\n" +
      "/help → Ver ayuda"
  );
});

// ===== /post =====
bot.onText(/\/post (.+)/s, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];

  try {
    await bot.sendMessage(
      process.env.CHANNEL_ID,
      "📢 Nueva publicación P2P\n\n" + text
    );

    await bot.sendMessage(chatId, "✅ Mensaje enviado al canal");
  } catch (err) {
    console.error(
      "❌ Error al publicar:",
      err.response?.body || err.message
    );

    await bot.sendMessage(
      chatId,
      "❌ Error al publicar en el canal\n\n" +
        (err.response?.body?.description || err.message)
    );
  }
});

// ===== MENSAJE SIN TEXTO =====
bot.onText(/\/post$/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    "⚠️ Uso correcto:\n/post <mensaje>"
  );
});