const TelegramBot = require("node-telegram-bot-api");
const { TOKEN_BOT } = require("./config");

const bot = new TelegramBot(TOKEN_BOT, { polling: true });

bot.on("polling_error", err => {
  console.error("Polling error:", err.message);
});

console.log("🤖 Bot iniciado");

module.exports = bot;
