const AshPvP = require("F:\\mineflayer\\ash-pvp\\src\\pvp.js");

/**
 * 
 * @type {import("../index.d.ts").BotModule}
 */
module.exports = (bot) => {
  bot.ashpvp = new AshPvP(bot);
};
  