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
const crypto = require("crypto");

const sellOrders = {};

// /sell
bot.onText(/\/sell/, async (msg) => {
  const chatId = msg.chat.id;

  sellOrders[chatId] = {
    step: 1,
    user: msg.from,
  };

  await bot.sendMessage(
    chatId,
    "💲 Nueva orden de VENTA\n\nIngresa el monto mínimo (ej: 10000)"
  );
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  if (!sellOrders[chatId]) return;
  if (msg.text.startsWith("/")) return;

  const order = sellOrders[chatId];

  // Paso 1: monto mínimo
  if (order.step === 1) {
    order.min = msg.text;
    order.step = 2;
    return bot.sendMessage(chatId, "Ingresa el monto máximo (ej: 100000)");
  }

  // Paso 2: monto máximo
  if (order.step === 2) {
    order.max = msg.text;
    order.step = 3;
    return bot.sendMessage(chatId, "💳 Método de pago (ej: Nequi)");
  }

  // Paso 3: método de pago
  if (order.step === 3) {
    order.payment = msg.text;
    order.step = 4;
    return bot.sendMessage(chatId, "💱 Tasa (ej: yadio.io +2%)");
  }

  // Paso 4: tasa
  if (order.step === 4) {
    order.rate = msg.text;
    order.step = 5;
    return bot.sendMessage(chatId, "📊 Precio USD/COP (ej: 3812.55)");
  }

  // Paso 5: precio → publicar
  if (order.step === 5) {
    order.price = msg.text;

    const username = order.user.username
      ? `@${order.user.username}`
      : "Usuario sin username";

    // Datos simulados (luego DB real)
    const ops = Math.floor(Math.random() * 200) + 1;
    const days = Math.floor(Math.random() * 500) + 1;
    const rating = (Math.random() * (5 - 4.5) + 4.5).toFixed(1);
    const reviews = Math.floor(Math.random() * 200) + 1;

    const orderId = crypto.randomUUID();

    const post = 
`💲💵💲
Nueva orden de venta USDT (Polygon)

💰 Monto: ${order.min} - ${order.max} COP 🇨🇴
💱 Tasa: ${order.rate}
📊 Precio: 1 USD = ${order.price} COP

💳 Pago: ${order.payment}
👤 Usuario: ${username}

📈 Operaciones exitosas: ${ops}
⏱️ Usando el bot: ${days} días
⭐ Reputación: ${rating} (${reviews})

#SELLCOP
🆔 ${orderId}`;

    await bot.sendMessage(process.env.CHANNEL_ID, post);
    await bot.sendMessage(chatId, "✅ Orden de venta publicada");

    delete sellOrders[chatId];
  }
});