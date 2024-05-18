const { goals } = require("mineflayer-pathfinder");
const { getDistance } = require("../js/utils.js");

/**
 *
 * @type {import("../index.d.ts").FightModule}
 */
module.exports = (bot) => {
  bot.on("physicsTick", async () => {
    if (bot.hivemind !== null) {
      const shouldFollow = bot.hivemind.config.followOwner;

      if (shouldFollow) {
        const owner = Object.values(bot.entities).find(
          (e) =>
            bot.hivemind.kings.includes(e.username) &&
            bot.entity.position.distanceTo(e.position) <= 25
        );

        // Either too far away or not in game
        if (!owner) return;

        const distance = getDistance(bot.entity.position, owner.position);

        if (bot.fightBot.inBattle) {
          bot.pathfinder.stop();
          return;
        }

        if (pathing) return;

        if (distance <= 3) return;

        const goal = new goals.GoalNear(
          owner.position.x,
          owner.position.y,
          owner.position.z,
          3
        );
        pathing = true;
        await bot.pathfinder.goto(goal).catch((r) => {
          console.log(r);
          pathing = false;
        });
        pathing = false;
      }
    }
  });
};
