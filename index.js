require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');

/* ======================
   VARIABLES DE ENTORNO
====================== */
const TOKEN = process.env.TOKEN_BOT;
const MONGO_URL = process.env.MONGO_URL;
const CHANNEL_ID = process.env.ID_DEL_CANAL;

if (!TOKEN) throw new Error('Falta TOKEN_BOT');
if (!MONGO_URL) throw new Error('Falta MONGO_URL');
if (!CHANNEL_ID) throw new Error('Falta ID_DEL_CANAL');

/* ======================
   BOT
====================== */
const bot = new TelegramBot(TOKEN, { polling: true });

console.log('🤖 Bot iniciado');

/* ======================
   MONGODB
====================== */
const client = new MongoClient(MONGO_URL);

async function connectDB() {
  await client.connect();
  console.log('🟢 Conectado a MongoDB');
}
connectDB();

/* ======================
   COMANDOS
====================== */

// START
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `🤖 Bot P2P activo

Comandos disponibles:
/sell → Publicar orden de venta
/buy → Publicar orden de compra`
  );
});

// HELP
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `/sell → Publicar orden de venta
/buy → Publicar orden de compra`
  );
});

// SELL
bot.onText(/\/sell/, async (msg) => {
  const text = `💲💵💲
Nueva orden de *VENTA* USDT (Polygon)
Por 10.000 - 100.000 COP 🇨🇴
1 USD = 3812.55 COP
Recibir pago por Nequi
Tiene 128 operaciones exitosas
Usa el bot hace 350 días
#SELLCOP
Tasa: yadio.io +2%
4.9 ⭐⭐⭐⭐⭐ (122)`;

  try {
    await bot.sendMessage(CHANNEL_ID, text, { parse_mode: 'Markdown' });
    bot.sendMessage(msg.chat.id, '✅ Orden de venta publicada en el canal');
  } catch (err) {
    console.error(err);
    bot.sendMessage(msg.chat.id, '❌ Error al publicar en el canal');
  }
});

// BUY
bot.onText(/\/buy/, async (msg) => {
  const text = `🟢
Nueva orden de *COMPRA* USDT
Pago en COP 🇨🇴
Método: Nequi
#BUYCOP`;

  try {
    await bot.sendMessage(CHANNEL_ID, text, { parse_mode: 'Markdown' });
    bot.sendMessage(msg.chat.id, '✅ Orden de compra publicada en el canal');
  } catch (err) {
    console.error(err);
    bot.sendMessage(msg.chat.id, '❌ Error al publicar en el canal');
  }
});
// ===== FLUJO /sell =====
const sellSteps = new Map();

bot.onText(/\/sell/, (msg) => {
  const chatId = msg.chat.id;

  sellSteps.set(chatId, { step: 1 });

  bot.sendMessage(chatId, "💲 Venta P2P\n\nIngresa el MONTO MÍNIMO en COP:");
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  if (!sellSteps.has(chatId)) return;

  const data = sellSteps.get(chatId);
  if (!msg.text || msg.text.startsWith("/")) return;

  // PASO 1: mínimo
  if (data.step === 1) {
    data.min = msg.text;
    data.step = 2;
    return bot.sendMessage(chatId, "Ingresa el MONTO MÁXIMO en COP:");
  }

  // PASO 2: máximo
  if (data.step === 2) {
    data.max = msg.text;
    data.step = 3;
    return bot.sendMessage(chatId, "Método de pago (Ej: Nequi):");
  }

  // PASO 3: pago
  if (data.step === 3) {
    data.payment = msg.text;
    data.step = 4;
    return bot.sendMessage(chatId, "Porcentaje sobre yadio.io (Ej: 2):");
  }

  // PASO 4: tasa
  if (data.step === 4) {
    data.percent = msg.text;
    data.step = 5;

    return bot.sendMessage(
      chatId,
      `✅ CONFIRMA LA ORDEN:\n\n` +
      `Monto: ${data.min} - ${data.max} COP\n` +
      `Pago: ${data.payment}\n` +
      `Tasa: yadio.io +${data.percent}%\n\n` +
      `Escribe CONFIRMAR para publicar`
    );
  }

  // PASO 5: confirmar
  if (data.step === 5 && msg.text.toLowerCase() === "confirmar") {
    sellSteps.delete(chatId);

    return bot.sendMessage(chatId, "✅ Orden registrada (siguiente paso: publicar)");
  }
});