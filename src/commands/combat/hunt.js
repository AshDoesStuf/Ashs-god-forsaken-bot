/**
 * @type {import("../../index.d.ts").Command}
 */
module.exports = {
  name: "hunt",
  description: "hunt someone",
  usage: "hunt <?username>",

  async execute(bot, username, args) {
    const target = bot.players[args[0] || username]?.entity;

    if (!target) return console.log("No target!");

    bot.huntBot.setTarget(target);
  },
};
