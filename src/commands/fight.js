// commands/fight.js
module.exports = {
  name: "fight",
  execute(bot, username, args) {
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
    bot.fightBot.knownSexOffenders = [];
    bot.fightBot.readyUp();
    bot.fightBot.setTarget(localPlayer);
    bot.fightBot.attack();
  },
};
