const { equipItemByName, useItemWithRotation } = require("../../js/utils");

/**
 * @type {import("../../index").Command}
 */
module.exports = {
  name: "openGui",
  description: "Opens a GUI using an item",
  async execute(bot, username, args) {
    const itemName = args[0];
    if (!itemName)
      return console.log("Please specify an item to open the GUI.");

    const item = bot.inventory.items().find((i) => i.name === itemName);
    if (!item) return console.log(`Item "${itemName}" not found in inventory.`);

    await bot.equip(item, "hand");

    //look at the nearest block to ensure the GUI opens correctly
    const targetBlock = bot.blockAt(bot.entity.position.offset(0, -1, 0));
    await bot.lookAt(targetBlock.position.offset(0.5, 0.5, 0.5), true);
    useItemWithRotation(bot);
    // bot.swingArm("left");

    bot.once("windowOpen", (window) => {
      bot.guiSessionActive = true;
      console.log("[GUI] GUI opened. You can now use f!gui commands.");
    });

    bot.once("windowClose", () => {
      bot.guiSessionActive = false;
      console.log("[GUI] GUI closed. Exiting GUI session.");
    });
  },
};
