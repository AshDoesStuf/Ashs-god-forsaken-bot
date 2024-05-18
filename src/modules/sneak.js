const mineflayer = require("mineflayer"); // eslint-disable-line

/**
 * @param {mineflayer.Bot} bot // to enable intellisense
 */

module.exports = (bot) => {
  bot.on("entityCrouch", (entity) => {
    if (
      entity.type === "player" &&
      bot.entity.position.distanceTo(entity.position) <= 6
    ) {
      const player = bot.players[entity.name];
      if (
        player &&
        player.entity &&
        player.entity.metadata &&
        player.entity.metadata[0]
      ) {
        const isSneaking = player.entity.metadata[0].sneaking;
        if (isSneaking) {
          bot.setControlState("sneak", true);
        } else {
          bot.setControlState("sneak", false);
        }
      }
    }
  });
};
