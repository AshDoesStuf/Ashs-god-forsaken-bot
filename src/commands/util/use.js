/**
 * @type {import("../../index.d.ts").Command}
 */
module.exports = {
  name: "use",
  description: "use held item",

  async execute(bot, username, args) {
    if (!bot.heldItem) return console.log("No held item.");

    const mode = args[0];

    if (mode === "swing") {
      bot.swingArm("left");
    }
  },
};
