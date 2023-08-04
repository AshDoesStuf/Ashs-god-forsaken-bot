/**
 *
 * @type {import("../index.d.ts").FightModule}
 */
module.exports = (bot) => {
  bot.on("physicsTick", async () => {
    bot.fightBot.update();
  });
};
