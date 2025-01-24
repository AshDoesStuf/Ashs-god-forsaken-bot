const Vec3 = require("vec3").Vec3;

/**
 * @type {import("../../index").Command}
 */
module.exports = {
  name: "guard",
  description: "Guard an area or a person",
  usage: "f!guard <mode> <args>",
  async execute(bot, username, args) {
    const mode = args.shift();

    if (!mode) return bot.chat("No");

    if (mode === "pos") {
      const x = parseInt(args[0]);
      const y = parseInt(args[1]);
      const z = parseInt(args[2]);

      const pos = new Vec3(x, y, z);

      bot.guardBot.startGuarding(pos);
    } else if (mode === "eyes") {
      const player = bot.players[username];

      const guardBlock = bot.blockAtEntityCursor(player.entity, 16);

      if (!guardBlock) return;

      bot.guardBot.startGuarding(guardBlock.position);
    } else if (mode === "player") {
      const target = args[0];

      const player = bot.players[target];

      if (!player) return bot.chat("Player not found");

      bot.guardBot.startGuarding(player.entity);
    }
  },
};
