/**
 * @type {import("../../index.d.ts").Command}
 */
module.exports = {
  name: "leave",
  description: "leave the game",

  async execute(bot, username, args) {
    bot.end("left");
  },
};
