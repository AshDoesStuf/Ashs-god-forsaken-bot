/**
 * @type {import("../../index.d.ts").Command}
 */
module.exports = {
  name: "patrol",
  description: "patrol given points",

  async execute(bot, username, args) {
    bot.patrolBot.patrolling = true;
    await bot.patrolBot.startPatrol();
  },
};
