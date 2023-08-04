const mineflayer = require("mineflayer"); // eslint-disable-line

/**
 * @param {mineflayer.Bot} bot // to enable intellisense
 */

module.exports = (bot) => {
  bot.on("messagestr", (msg) => {
    const inPvpArea = /(!) Fly mode enabled./;
    const inSpawn = /(!) Fly mode disabled./;

    if (msg.match(inPvpArea)) {
      bot.fightBot.isInArea = true;
    } else if (inSpawn) {
      bot.fightBot.isInArea = false;
    }
  });
};
