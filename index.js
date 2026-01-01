import TelegramBot from "node-telegram-bot-api";
import { MongoClient } from "mongodb";

// ================== VALIDACIONES ==================
if (!process.env.TOKEN_BOT) throw new Error("Falta TOKEN_BOT");
if (!process.env.MONGO_URL) throw new Error("Falta MONGO_URL");
if (!process.env.ID_DEL_CANAL) throw new Error("Falta ID_DEL_CANAL");

// ================== BOT ==================
const bot = new TelegramBot(process.env.TOKEN_BOT, { polling: true });

// ================== MONGO ==================
const client = new MongoClient(process.env.MONGO_URL);
await client.connect();
console.log("🟢 Conectado a MongoDB");

const db = client.db("test");
const orders = db.collection("orders");

// ================== ESTADO TEMPORAL ==================
const sessions = {};

// ================== HELP ==================
bot.onText(/\/start|\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `🤖 *Bot P2P activo*

Comandos:
/sell → Crear orden de venta
/buy → Crear orden de compra`,
    { parse_mode: "Markdown" }
  );
});

// ================== SELL ==================
bot.onText(/\/sell/, (msg) => {
  sessions[msg.chat.id] = { type: "SELL", step: 1 };
  bot.sendMessage(msg.chat.id, "💲 Activo (ej: USDT Polygon)");
});

// ================== BUY ==================
bot.onText(/\/buy/, (msg) => {
  sessions[msg.chat.id] = { type: "BUY", step: 1 };
  bot.sendMessage(msg.chat.id, "💲 Activo (ej: USDT Polygon)");
});

// ================== FLUJO ==================
bot.on("message", async (msg) => {
  const session = sessions[msg.chat.id];
  if (!session || msg.text.startsWith("/")) return;

  try {
    switch (session.step) {
      case 1:
        session.asset = msg.text;
        session.step = 2;
        return bot.sendMessage(msg.chat.id, "💰 Monto mínimo (COP)");

      case 2:
        session.min = msg.text;
        session.step = 3;
        return bot.sendMessage(msg.chat.id, "💰 Monto máximo (COP)");

      case 3:
        session.max = msg.text;
        session.step = 4;
        return bot.sendMessage(msg.chat.id, "💱 Método de pago (ej: Nequi)");

      case 4:
        session.payment = msg.text;
        session.step = 5;
        return bot.sendMessage(msg.chat.id, "📈 Tasa (ej: yadio.io +2%)");

      case 5:
        session.rate = msg.text;
        session.step = 6;
        return bot.sendMessage(msg.chat.id, "⭐ Reputación (ej: 4.9 ⭐⭐⭐⭐⭐)");

      case 6:
        session.rep = msg.text;

        const order = {
          userId: msg.from.id,
          username: msg.from.username || "sin_user",
          type: session.type,
          asset: session.asset,
          min: session.min,
          max: session.max,
          payment: session.payment,
          rate: session.rate,
          rep: session.rep,
          createdAt: new Date()
        };

        // GUARDAR EN MONGO
        await orders.insertOne(order);

        // MENSAJE CANAL
        const text = `
💲💵💲
Nueva orden de ${order.type === "SELL" ? "VENTA" : "COMPRA"} ${order.asset}
Por ${order.min} - ${order.max} COP 🇨🇴
Pago: ${order.payment}
Tasa: ${order.rate}
${order.rep}
@${order.username}
        `;

        await bot.sendMessage(process.env.ID_DEL_CANAL, text);

        await bot.sendMessage(msg.chat.id, "✅ Orden publicada y guardada");
        delete sessions[msg.chat.id];
        break;
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(msg.chat.id, "❌ Error al procesar la orden");
    delete sessions[msg.chat.id];
  }
});

console.log("🤖 Bot iniciado");