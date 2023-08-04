const mineflayer = require("mineflayer");
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
    await bot.fightBot.attempHeal();
  },
};
