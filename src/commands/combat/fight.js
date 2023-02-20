// commands/fight.js

/**
 * @type {import("../../index").Command}
 */
module.exports = {
  name: "fight",
  async execute(bot, username, args) {
    const localPlayer = args[1] || username;
    if (
      bot.fightBot.knownSexOffenders.length >= 1 &&
      bot.fightBot.settings.freeForAll
    ) {
      localPlayer = bot.fightBot.knownSexOffenders[0];
    }

    if (bot.fightBot.IsCombat) {
      return bot.chat("stfu dumass im already fighting someone");
    }
    if (localPlayer === bot.username) {
      return bot.chat("go away you wench");
    }

    const mode = args[2]

    if(!mode) {
      bot.fightBot.clear()
      await bot.fightBot.readyUp()
      await bot.fightBot.setTarget(localPlayer)
      await bot.fightBot.attack()
    } else if (mode === "fist") {
      bot.fightBot.clear()
      await bot.fightBot.setTarget(localPlayer)
      await bot.fightBot.attack()
    }
  
  
  },
};
