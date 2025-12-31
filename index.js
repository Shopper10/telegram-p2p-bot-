require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const crypto = require("crypto");

// ===== VALIDACIONES =====
if (!process.env.TOKEN_BOT) {
  throw new Error("Falta TOKEN_BOT");
}
if (!process.env.CHANNEL_ID) {
  throw new Error("Falta CHANNEL_ID");
}

// ===== BOT =====
const bot = new TelegramBot(process.env.TOKEN_BOT, { polling: true });

console.log("🤖 Bot P2P iniciado");

// ===== ESTADO DE ÓRDENES =====
const sellOrders = {};

// ===== /start =====
bot.onText(/\/start/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    "🤖 Bot P2P activo\n\n" +
    "Comandos disponibles:\n" +
    "/sell → Crear orden de venta\n" +
    "/help → Ayuda"
  );
});

// ===== /help =====
bot.onText(/\/help/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    "📌 Ayuda\n\n" +
    "/sell → Crear una orden de venta USDT\n\n" +
    "El bot te pedirá los datos paso a paso."
  );
});

// ===== /sell =====
bot.onText(/\/sell$/, async (msg) => {
  const chatId = msg.chat.id;

  sellOrders[chatId] = {
    step: 1,
    user: msg.from
  };

  await bot.sendMessage(
    chatId,
    "💲 Nueva orden de VENTA USDT (Polygon)\n\n" +
    "Ingresa el monto mínimo en COP (ej: 10000)"
  );
});

// ===== FLUJO DE MENSAJES =====
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  // Si no está creando orden, ignorar
  if (!sellOrders[chatId]) return;

  // Ignorar comandos
  if (msg.text.startsWith("/")) return;

  const order = sellOrders[chatId];

  // Paso 1: mínimo
  if (order.step === 1) {
    order.min = msg.text;
    order.step = 2;
    return bot.sendMessage(chatId, "Ingresa el monto máximo en COP (ej: 100000)");
  }

  // Paso 2: máximo
  if (order.step === 2) {
    order.max = msg.text;
    order.step = 3;
    return bot.sendMessage(chatId, "💳 Método de pago (ej: Nequi)");
  }

  // Paso 3: pago
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

  // Paso 5: publicar
  if (order.step === 5) {
    order.price = msg.text;

    const username = order.user.username
      ? `@${order.user.username}`
      : "Usuario sin username";

    // Stats simulados (luego DB real)
    const ops = Math.floor(Math.random() * 200) + 1;
    const days = Math.floor(Math.random() * 500) + 1;
    const rating = (Math.random() * (5 - 4.6) + 4.6).toFixed(1);
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
    await bot.sendMessage(chatId, "✅ Orden de venta publicada en el canal");

    delete sellOrders[chatId];
  }
});

// ===== ERRORES =====
bot.on("polling_error", (err) => {
  console.error("Polling error:", err.message);
});