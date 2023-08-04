/**
 * @type {import("../../index").Command}
 */
module.exports = {
  name: "follow",
  execute(bot, username) {
    bot.followTarget = bot.players[username].entity;
  },
};
