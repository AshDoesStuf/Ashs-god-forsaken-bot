/**
 * @type {import("../../index.d.ts").Command}
 */
module.exports = {
  name: "toggle",
  execute(bot, username, args) {
    bot.fightBot.setSettings(args[0]);
  },
};
