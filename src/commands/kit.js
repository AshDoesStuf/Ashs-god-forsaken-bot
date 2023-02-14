module.exports = {
  name: "kit",
  execute(bot, _, args) {
    bot.fightBot.kit = args[1];
  },
};
