/**
 * @type {import("../../index.d.ts").Command}
 */
module.exports = {
  name: "kit",
  async execute(bot, username, args) {
    const kit = args[0];
    bot.chat(`/kit claim ${kit}`)
  },
};
