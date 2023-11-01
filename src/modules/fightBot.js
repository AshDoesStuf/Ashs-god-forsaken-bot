/**
 *
 * @type {import("../index.d.ts").FightModule}
 */
module.exports = (bot) => {
  bot.on("physicsTick", () => bot.fightBot.update());
  bot.on("messagestr", async (msg) => {
    const regex = /(.+) was killed by (.+)/;
    const match = msg.match(regex);

    if (!match) return;

    const victim = match[1];
    const killer = match[2];

    // that means bot dided
    if (victim === bot.username) {
      bot.fightBot.stop();
      bot.clearControlStates();
    } else if (killer === bot.username) {
      bot.fightBot.stop();
      bot.clearControlStates();
    } else if (victim === bot.fightBot.target && !bot.fightBot.ffa) {
      bot.fightBot.stop();
      bot.clearControlStates();
    } else if (
      victim !== bot.username &&
      victim === bot.fightBot.target &&
      bot.fightBot.ffa
    ) {
      bot.fightBot.stop();
      bot.clearControlStates();

      let targets = await bot.fightBot.getFFATargets(
        (e) =>
          e !== bot.entity &&
          e.equipment[4] &&
          e.equipment[4].name === "diamond_chestplate"
      );

      bot.fightBot.ffaTarget =
        targets[Math.floor(Math.random() * targets.length)];
    }
  });
};
