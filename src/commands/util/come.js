const { goals } = require("mineflayer-pathfinder");
const { GoalNear } = require("../../../../mineflayer-baritone/src/goal.js");
const Vec3 = require("vec3").Vec3;


/**
 * @type {import("../../index.d.ts").Command}
 */
module.exports = {
  name: "come",
  description: "goto specific coords or eyes(16)",
  args: true,
  usage: "f!come <eyes> | <pos> <x> <y> <z>",

  async execute(bot, username, args) {
    const mode = args[0];

    if (mode === "eyes") {
      const player = bot.players[username];

      const gotoPos = bot.blockAtEntityCursor(player.entity, 16);

      if (gotoPos) {
        const goal = new GoalNear(
          gotoPos.position,
          1
        );

        await bot.ashfinder.goto(goal);

        // const goal = new goals.GoalNear(
        //   gotoPos.position.x,
        //   gotoPos.position.y,
        //   gotoPos.position.z,
        //   1
        // );

        // try {
        //   await bot.pathfinder.goto(goal);
        // } catch (error) {
        //   console.log(error.message);
        // }
      }
    } else if (mode === "pos") {
      const x = parseInt(args[1]);
      const y = parseInt(args[2]);
      const z = parseInt(args[3]);

      const position = new Vec3(x, y, z);
      const goal = new GoalNear(position, 1);

      await bot.ashfinder.goto(goal);
      // const goal = new goals.GoalNear(x, y, z, 1);

      // try {
      //   await bot.pathfinder.goto(goal);
      // } catch (error) {
      //   console.log(error.message);
      // }
    }
  },
};
