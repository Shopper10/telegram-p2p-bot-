const crypto = require("crypto");
const { createOrder } = require("./orders.model");
const bot = require("./bot");
const { publishToChannel } = require("./channel");

const sellOrders = {};

bot.onText(/\/sell$/, async (msg) => {
  const chatId = msg.chat.id;

  sellOrders[chatId] = {
    step: 1,
    user: msg.from
  };

  await bot.sendMessage(chatId, "💲 Nueva orden de venta\n\nMonto mínimo en COP:");
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  if (!sellOrders[chatId]) return;
  if (msg.text.startsWith("/")) return;

  const o = sellOrders[chatId];

  if (o.step === 1) {
    o.min = msg.text;
    o.step = 2;
    return bot.sendMessage(chatId, "Monto máximo en COP:");
  }

  if (o.step === 2) {
    o.max = msg.text;
    o.step = 3;
    return bot.sendMessage(chatId, "Método de pago (Nequi, Bancolombia, etc):");
  }

  if (o.step === 3) {
    o.payment = msg.text;
    o.step = 4;
    return bot.sendMessage(chatId, "Tasa (ej: yadio.io +2%):");
  }

  if (o.step === 4) {
    o.rate = msg.text;
    o.step = 5;
    return bot.sendMessage(chatId, "Precio USD/COP:");
  }

  if (o.step === 5) {
    o.price = msg.text;

const orderId = await createOrder({
  type: "SELL",
  userId: o.user.id,
  username: o.user.username || null,
  min: o.min,
  max: o.max,
  payment: o.payment,
  rate: o.rate,
  price: o.price
});

const username = o.user.username
  ? `@${o.user.username}`
  : "Sin username";

const post =
`💲💵💲
Nueva orden de venta USDT (Polygon)

💰 ${o.min} - ${o.max} COP 🇨🇴
💱 ${o.rate}
📊 1 USD = ${o.price} COP
💳 ${o.payment}

👤 ${username}

#SELLCOP
🆔 ${orderId}`;

await publishToChannel(post);
await bot.sendMessage(chatId, "✅ Orden publicada en el canal");

delete sellOrders[chatId];
