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
    try {
      bot.ashfinder.stop();
      bot.fightBot.stop();
      bot.patrolBot.stop();
      bot.guardBot.stopGuarding();
      bot.huntBot.stop();
      bot.pathfinder.setGoal(null);
      bot.pathfinder.stop();
      bot.ashpvp.stop()
    } catch (error) {
      console.log(error);
    }
  },
};
