/**
 * 
 * @type {import("../index.d.ts").FightModule}
 */
module.exports = (bot) => {
  bot.on("windowOpen", function (window) {
    window.requiresConfirmation = false;
  });
};
  