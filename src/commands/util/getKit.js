/**
 * @type {import("../../index").Command}
 */
module.exports = {
  name: "getKit",
  execute(bot, username, args) {
    const kit = args[0];

    bot.chat(`/kit ${kit}`);

    // bot.once("windowOpen", async (window) => {
    //   switch (kit) {
    //     case "knight":
    //       await bot.clickWindow(11, 0, 0);
    //       break;
    //   }
    // });
  },
};
