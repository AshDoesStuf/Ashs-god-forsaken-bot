const mineflayer = require("mineflayer"); // eslint-disable-line

/**
 * @param {mineflayer.Bot} bot // to enable intellisense
 */

module.exports = (bot) => {
  bot.on("messagestr", (msg) => {
    // console.log(msg);
    const inPvpArea = /(!) Fly mode disabled\.$/;
    const inSpawn = /(!) Fly mode enabled\.$/;

    if (inPvpArea.test(msg)) {
      bot.fightBot.isInArea = true;
      console.log("Im in the pvp area")
    } else if (inSpawn.test(msg)) {
      bot.fightBot.isInArea = false;
      console.log("Im at spawn")
    }
  });
};
