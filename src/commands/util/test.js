const mineflayer = require("mineflayer");
const { isPlayerBlocking } = require("../../js/utils.js");
const { placeBlock } = require("../../../../ash-pvp/src/utils/utils.js");
const sleep = async (ms = 2000) => {
  return new Promise((r) => setTimeout(r, ms));
};

let toggled = false;

/**
 * @type {import("../../index.d.ts").Command}
 */
module.exports = {
  name: "test",

  async execute(bot, username, args) {
    // const nearestEntity = bot.nearestEntity((e) => e.type === "player");

    // if (nearestEntity) {
    //   console.log(isPlayerBlocking(nearestEntity));

    // }

    // const entity = bot.players[username].entity;

    // if (!entity) return;

    // await bot.ashpvp.trackEntity(entity);

    await placeBlock(
      bot,
      "cobweb",
      bot.entity.position.floored().offset(0, -1, 0)
    );
  },
};
