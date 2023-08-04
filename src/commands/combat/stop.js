/**
 * @type {import("../../index").Command}
 */
module.exports = {
  name: "stop",
  execute(bot) {
    bot.setControlState("forward", false);
    bot.setControlState("back", false);
    bot.setControlState("sprint", false);
    bot.clearControlStates();

    bot.followTarget = null;
    bot.fightBot.stop();
  },
};
