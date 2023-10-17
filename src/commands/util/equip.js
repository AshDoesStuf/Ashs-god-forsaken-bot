const { equipItemByName } = require("../../js/utils.js");

/**
 * @type {import("../../index.d.ts").Command}
 */
module.exports = {
  name: "equip",
  description: "equip an item from inv",

  async execute(bot, username, args) {
    const item = args[0];
    await equipItemByName(bot, item);
  },
};
