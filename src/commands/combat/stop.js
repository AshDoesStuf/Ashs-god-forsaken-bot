/**
 * @type {import("../../index.d.ts").Command}
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
    bot.patrolBot.stop();
    bot.guardBot.stopGuarding();
  },
};
