const bot = require("./bot");
const { CHANNEL_ID } = require("./config");

async function publishToChannel(text) {
  return bot.sendMessage(CHANNEL_ID, text);
}

module.exports = { publishToChannel };
