/**
 * @type {import("../../index").Command}
 */
module.exports = {
  name: "addPoint",
  async execute(bot, username, args) {
    const player = bot.players[username];

    if (player.entity) {
      bot.patrolBot.addPoint(player.entity.position.clone());
    }
  },
};
