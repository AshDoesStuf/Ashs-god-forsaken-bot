const mineflayer = require("mineflayer");
const { isPlayerBlocking } = require("../../js/utils.js");
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
    const nearestEntity = bot.nearestEntity((e) => e.type === "player");

    if (nearestEntity) {
      console.log(isPlayerBlocking(nearestEntity));
      
    }
  },
};
