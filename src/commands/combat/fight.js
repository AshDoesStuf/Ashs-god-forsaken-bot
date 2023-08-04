// commands/fight.js

const { bestPlayerFilter } = require("../../js/utils");

/**
 * @type {import("../../index").Command}
 */
module.exports = {
  name: "fight",
  execute(bot, username, args) {
    let localPlayer = args[0] || username;
    if (bot.fightBot.settings.freeForAll) {
      localPlayer = bot.nearestEntity(bestPlayerFilter).username;
    }

    if (bot.fightBot.IsCombat) {
      return bot.chat("stfu dumass im already fighting someone");
    }
    if (localPlayer === bot.username) {
      return bot.chat("go away you wench");
    }

    bot.fightBot.clear();
    bot.fightBot.readyUp();
    bot.fightBot.setTarget(localPlayer);
    bot.fightBot.attack();
  },
};
