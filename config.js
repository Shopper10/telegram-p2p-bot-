require("dotenv").config();

const required = ["TOKEN_BOT", "CHANNEL_ID"];
required.forEach(v => {
  if (!process.env[v]) {
    throw new Error(`Falta variable ${v}`);
  }
});

module.exports = {
  TOKEN_BOT: process.env.TOKEN_BOT,
  CHANNEL_ID: process.env.CHANNEL_ID
};
