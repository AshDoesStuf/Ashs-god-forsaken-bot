module.exports = {
  name: "toggle",
  execute(bot, _, args) {
    bot.fightBot.setSettings(args[1]);
  },
};
