const mineflayer = require("mineflayer"); // eslint-disable-line

/**
 * @param {mineflayer.Bot} bot // to enable intellisense
 */

module.exports = (bot) => {
  bot.on("physicsTick", async () => {
    if (!bot.followTarget) return;

    // set the proximity target to the nearest entity
    bot.movement.heuristic.get("proximity").target(bot.followTarget.position);
    // move towards the nearest entity
    const yaw = bot.movement.getYaw(240, 15, 1);

    if (bot.entity.position.distanceTo(bot.followTarget.position) > 2) {
      bot.setControlState("forward", true);
      bot.setControlState("sprint", true);
      bot.movement.steer(yaw);
    } else {
      bot.setControlState("forward", false);
      bot.setControlState("sprint", false);
    }
  });
};
