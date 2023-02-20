module.exports = {
  name: "set",
  execute(bot, _, args) {
    bot.fightBot.setSettings(args[1]);
  },
};
