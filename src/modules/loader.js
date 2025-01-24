const AshPvP = require("../../../ash-pvp/src/pvp.js");

/**
 * 
 * @type {import("../index.d.ts").FightModule}
 */
module.exports = (bot) => {
  bot.ashpvp = new AshPvP(bot);
};
  