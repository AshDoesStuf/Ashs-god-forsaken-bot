const mineflayer = require("mineflayer");

module.exports = {
  name: "ctr",

  /**
   *
   * @param {mineflayer.Bot} bot
   * @param {string} username
   * @param {string[]} args
   */
  execute(bot, username, args) {
    switch (args[1]) {
      case "jump":
        bot.setControlState("jump", true);
        bot.setControlState("jump", false);
        break;
      case "sneak":
        bot.setControlState("sneak", true);
        bot.setControlState("sneak", false);
        break;
      // add more cases for other control states as needed
      default:
        bot.chat("Unknown control state");
    }
  },
};
