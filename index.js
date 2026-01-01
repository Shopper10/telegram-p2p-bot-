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
   COMANDOS BÁSICOS
====================== */
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `🤖 Bot P2P activo

Comandos:
/sell → Crear orden de venta
/buy → Crear orden de compra`
  );
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `/sell → Crear orden de venta
/buy → Crear orden de compra`
  );
});

/* ======================
   FLUJO /SELL PASO A PASO
====================== */
const sellSteps = new Map();

bot.onText(/\/sell/, (msg) => {
  const chatId = msg.chat.id;
  sellSteps.set(chatId, { step: 1 });

  bot.sendMessage(chatId, '💲 Venta P2P\n\nIngresa el MONTO MÍNIMO en COP:');
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (!sellSteps.has(chatId)) return;
  if (!msg.text || msg.text.startsWith('/')) return;

  const data = sellSteps.get(chatId);

  // Paso 1: mínimo
  if (data.step === 1) {
    data.min = msg.text;
    data.step = 2;
    return bot.sendMessage(chatId, 'Ingresa el MONTO MÁXIMO en COP:');
  }

  // Paso 2: máximo
  if (data.step === 2) {
    data.max = msg.text;
    data.step = 3;
    return bot.sendMessage(chatId, 'Método de pago (ej: Nequi):');
  }

  // Paso 3: método de pago
  if (data.step === 3) {
    data.payment = msg.text;
    data.step = 4;
    return bot.sendMessage(chatId, 'Porcentaje sobre yadio.io (ej: 2):');
  }

  // Paso 4: tasa
  if (data.step === 4) {
    data.percent = msg.text;
    data.step = 5;

    return bot.sendMessage(
      chatId,
      `✅ CONFIRMA LA ORDEN:

Monto: ${data.min} - ${data.max} COP
Pago: ${data.payment}
Tasa: yadio.io +${data.percent}%

Escribe CONFIRMAR para publicar`
    );
  }

  // Paso 5: confirmar y publicar
if (data.step === 5 && msg.text.toLowerCase() === 'confirmar') {
  sellSteps.delete(chatId);

  const order = {
    userId: msg.from.id,
    username: msg.from.username || null,
    min: data.min,
    max: data.max,
    payment: data.payment,
    percent: data.percent,
    createdAt: new Date(),
    type: 'SELL',
    status: 'OPEN'
  };

  try {
    const db = client.db('p2p');
    await db.collection('orders').insertOne(order);

    const channelText = `💲💵💲
Nueva orden de VENTA USDT (Polygon)
Por ${data.min} - ${data.max} COP 🇨🇴
1 USD = 3812.55 COP
Recibir pago por ${data.payment}

Tiene 128 operaciones exitosas
Usa el bot hace 350 días

#SELLCOP
Tasa: yadio.io +${data.percent}%
4.9 ⭐⭐⭐⭐⭐ (122)`;

    await bot.sendMessage(CHANNEL_ID, channelText);
    return bot.sendMessage(chatId, '✅ Orden guardada y publicada en el canal');
  } catch (err) {
    console.error(err);
    return bot.sendMessage(chatId, '❌ Error al guardar la orden');
  }
}

    const channelText = `💲💵💲
Nueva orden de VENTA USDT (Polygon)
Por ${data.min} - ${data.max} COP 🇨🇴
1 USD = 3812.55 COP
Recibir pago por ${data.payment}

Tiene 128 operaciones exitosas
Usa el bot hace 350 días

#SELLCOP
Tasa: yadio.io +${data.percent}%
4.9 ⭐⭐⭐⭐⭐ (122)`;

    try {
      await bot.sendMessage(CHANNEL_ID, channelText);
      return bot.sendMessage(chatId, '✅ Orden de venta publicada en el canal');
    } catch (err) {
      console.error(err);
      return bot.sendMessage(chatId, '❌ Error al publicar en el canal');
    }
  }
});

/* ======================
   /BUY (BÁSICO)
====================== */
bot.onText(/\/buy/, (msg) => {
  bot.sendMessage(msg.chat.id, '🟢 Función /buy próximamente');
});