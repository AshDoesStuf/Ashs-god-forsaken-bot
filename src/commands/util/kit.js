/**
 * @type {import("../../index.d.ts").Command}
 */
module.exports = {
  name: "kit",
  execute(bot, _, args) {
    const kitList = [
      "mixed",
      "Frisk's",
      "Nethpot",
      "FriskNeth",
      "uhc",
      "FriskNormal",
      "NetheritePot",
      "diamondpot",
      "elementalpot",
      "magicD",
      "classic",
    ];

    if (!kitList.includes(args[1])) return bot.chat("Invalid kit");

    bot.fightBot.kit = args[1];
  },
};
