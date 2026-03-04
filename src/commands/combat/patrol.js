/**
 * @type {import("../../index.d.ts").Command}
 */
module.exports = {
  name: "patrol",
  description: "patrol given points",

  async execute(bot, username, args) {
    const subCommand = args.shift();

    if (subCommand === "start") {
      bot.patrolBot.patrolling = true;
      await bot.patrolBot.startPatrol();
    } else if (subCommand === "stop") {
      bot.patrolBot.stop();
    }
    else if (subCommand === "addPoint") {
      const player = bot.players[username];

      if (player.entity) {
        bot.patrolBot.addPoint(player.entity.position.clone());
      }
    } else if (subCommand === "removePoint") {
      const player = bot.players[username];

      if (player.entity) {
        bot.patrolBot.removePoint(player.entity.position.clone());
      }
    } else if (subCommand === "clear") {
      bot.patrolBot.clearPoints();
    }
  },
};
