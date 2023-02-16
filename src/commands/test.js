const mineflayer = require("mineflayer");

module.exports = {
  name: "test",

  /**
   *
   * @param {mineflayer.Bot} bot
   * @param {string} username
   * @param {string[]} args
   */
  execute(bot, username, args) {
    console.log(username);
  },
};
