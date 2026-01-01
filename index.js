import TelegramBot from "node-telegram-bot-api";
import { MongoClient, ObjectId } from "mongodb";

// ========= VALIDACIONES =========
if (!process.env.TOKEN_BOT) throw new Error("Falta TOKEN_BOT");
if (!process.env.MONGO_URL) throw new Error("Falta MONGO_URL");
if (!process.env.ID_DEL_CANAL) throw new Error("Falta ID_DEL_CANAL");

// ========= BOT =========
const bot = new TelegramBot(process.env.TOKEN_BOT, { polling: true });

// ========= MONGO =========
const client = new MongoClient(process.env.MONGO_URL);
await client.connect();
console.log("🟢 Conectado a MongoDB");

const db = client.db(); // usa la DB del URI
const orders = db.collection("orders");

// ========= SESIONES =========
const sessions = {};

// ========= START / HELP =========
bot.onText(/\/start|\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
`🤖 Bot P2P activo

Comandos:
/sell → Crear orden de venta
/buy → Crear orden de compra
/orders → Ver órdenes activas`
  );
});

// ========= ORDERS =========
bot.onText(/\/orders/, async (msg) => {
  const list = await orders
    .find({ status: "open" })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();

  if (list.length === 0) {
    return bot.sendMessage(msg.chat.id, "📭 No hay órdenes activas");
  }

  let text = "📋 Órdenes activas:\n\n";
  list.forEach((o, i) => {
    text +=
`#${i + 1}
${o.type === "SELL" ? "🟥 VENTA" : "🟩 COMPRA"} ${o.asset}
💰 ${o.min} - ${o.max} COP
💳 ${o.payment}
📈 ${o.rate}
👤 @${o.username}

`;
  });

  bot.sendMessage(msg.chat.id, text);
});

// ========= SELL =========
bot.onText(/\/sell/, (msg) => {
  sessions[msg.chat.id] = { type: "SELL", step: 1 };
  bot.sendMessage(msg.chat.id, "💲 Activo (ej: USDT Polygon)");
});

// ========= BUY =========
bot.onText(/\/buy/, (msg) => {
  sessions[msg.chat.id] = { type: "BUY", step: 1 };
  bot.sendMessage(msg.chat.id, "💲 Activo (ej: USDT Polygon)");
});

// ========= FLUJO =========
bot.on("message", async (msg) => {
  const s = sessions[msg.chat.id];
  if (!s || msg.text.startsWith("/")) return;

  try {
    if (s.step === 1) {
      s.asset = msg.text;
      s.step = 2;
      return bot.sendMessage(msg.chat.id, "💰 Monto mínimo (COP)");
    }

    if (s.step === 2) {
      s.min = msg.text;
      s.step = 3;
      return bot.sendMessage(msg.chat.id, "💰 Monto máximo (COP)");
    }

    if (s.step === 3) {
      s.max = msg.text;
      s.step = 4;
      return bot.sendMessage(msg.chat.id, "💳 Método de pago (Nequi, etc)");
    }

    if (s.step === 4) {
      s.payment = msg.text;
      s.step = 5;
      return bot.sendMessage(msg.chat.id, "📈 Tasa (ej: yadio.io +2%)");
    }

    if (s.step === 5) {
      s.rate = msg.text;
      s.step = 6;
      return bot.sendMessage(msg.chat.id, "⭐ Reputación (ej: 4.9 ⭐⭐⭐⭐⭐)");
    }

    if (s.step === 6) {
      s.rep = msg.text;

      const order = {
        userId: msg.from.id,
        username: msg.from.username || "sin_user",
        type: s.type,
        asset: s.asset,
        min: s.min,
        max: s.max,
        payment: s.payment,
        rate: s.rate,
        rep: s.rep,
        status: "open",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
      };

      // GUARDAR Y OBTENER ID
      const result = await orders.insertOne(order);
      order._id = result.insertedId;

      const text =
`💲💵💲
Nueva orden de ${order.type === "SELL" ? "VENTA" : "COMPRA"} ${order.asset}
💰 ${order.min} - ${order.max} COP 🇨🇴
💳 ${order.payment}
📈 ${order.rate}
${order.rep}
👤 @${order.username}`;

      const sent = await bot.sendMessage(process.env.ID_DEL_CANAL, text, {
        reply_markup: {
          inline_keyboard: [[
            { text: "🤝 Aceptar", callback_data: `accept_${order._id}` },
            { text: "❌ Cancelar", callback_data: `cancel_${order._id}` }
          ]]
        }
      });

      // guardar message_id del canal
      await orders.updateOne(
        { _id: order._id },
        { $set: { messageId: sent.message_id } }
      );

      await bot.sendMessage(msg.chat.id, "✅ Orden publicada");
      delete sessions[msg.chat.id];
    }
  } catch (e) {
    console.error(e);
    bot.sendMessage(msg.chat.id, "❌ Error al crear la orden");
    delete sessions[msg.chat.id];
  }
});

// ========= BOTONES =========
bot.on("callback_query", async (q) => {
  const [action, id] = q.data.split("_");
  const userId = q.from.id;

  const order = await orders.findOne({ _id: new ObjectId(id) });
  if (!order) {
    return bot.answerCallbackQuery(q.id, { text: "❌ Orden no encontrada" });
  }

  if (action === "accept") {
    if (order.status !== "open") {
      return bot.answerCallbackQuery(q.id, { text: "❌ No disponible" });
    }

    await orders.updateOne(
      { _id: order._id },
      { $set: { status: "taken", takenBy: userId } }
    );

    bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
      chat_id: q.message.chat.id,
      message_id: q.message.message_id
    });

    return bot.answerCallbackQuery(q.id, { text: "✅ Orden tomada" });
  }

  if (action === "cancel") {
    if (order.userId !== userId) {
      return bot.answerCallbackQuery(q.id, { text: "❌ No autorizado" });
    }

    await orders.updateOne(
      { _id: order._id },
      { $set: { status: "cancelled" } }
    );

    bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
      chat_id: q.message.chat.id,
      message_id: q.message.message_id
    });

    return bot.answerCallbackQuery(q.id, { text: "❌ Orden cancelada" });
  }
});

// ========= EXPIRACIÓN AUTOMÁTICA =========
setInterval(async () => {
  const now = new Date();

  const expired = await orders.find({
    status: "open",
    expiresAt: { $lte: now }
  }).toArray();

  for (const order of expired) {
    await orders.updateOne(
      { _id: order._id },
      { $set: { status: "expired" } }
    );

    if (order.messageId) {
      try {
        await bot.editMessageReplyMarkup(
          { inline_keyboard: [] },
          {
            chat_id: process.env.ID_DEL_CANAL,
            message_id: order.messageId
          }
        );
      } catch (e) {
        console.log("No se pudo limpiar botones", order._id.toString());
      }
    }
  }
}, 60 * 1000); // cada 1 minuto

console.log("🤖 Bot iniciado");