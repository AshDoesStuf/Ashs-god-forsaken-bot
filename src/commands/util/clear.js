/**
 * @type {import("../../index").Command}
 */

module.exports = {
  name: "clear",
  execute(bot) {
    bot.fightBot.clear();
  },
};
