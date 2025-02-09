/**
 * @type {import("../../index.d.ts").Command}
 */
module.exports = {
  name: "tpa",
  description: "tpa to someone",

  async execute(bot, username, args) {
    bot.chat(`/tpa ${username}`);
  },
};
