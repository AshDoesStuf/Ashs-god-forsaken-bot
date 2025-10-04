/**
 * @type {import("../../index.d.ts").Command}
 */
module.exports = {
  name: "say",
  description: "say sum",

  async execute(bot, username, args) {
    bot.chat(args.join(" "));
  },
};
