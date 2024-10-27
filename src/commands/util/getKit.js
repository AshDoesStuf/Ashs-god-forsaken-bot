/**
 * @type {import("../../index").Command}
 */
module.exports = {
  name: "getKit",
  description: "Used on pika network",
  execute(bot, username, args) {
    const kit = args[0];

    bot.chat(`/kit`);

    bot.once("windowOpen", async (window) => {
      switch (kit) {
        case "knight":
          await bot.clickWindow(11, 0, 0);
          // ► You selected the kit Knight.
          break;
      }
    });
  },
};
