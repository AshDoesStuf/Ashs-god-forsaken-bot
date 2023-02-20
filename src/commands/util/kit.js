module.exports = {
  name: "kit",
  execute(bot, _, args) {
    const kitList = ["mixed", "Frisk's", "Nethpot", "FriskNeth", "uhc"];

    if (!kitList.includes(args[1])) return bot.chat("Invalid kit");

    bot.fightBot.kit = args[1];
  },
};
