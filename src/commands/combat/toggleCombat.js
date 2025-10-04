/**
 * @type {import("../../index.d.ts").Command}
 */
module.exports = {
  name: "toggleCombat",
  aliases: ["tc", "combat", "togglecombat"],
  description: "Toggles combat mode for the user.",

  async execute(bot, username, args) {
    if (bot.ashpvp.combatEnabled) {
      bot.ashpvp.disableCombat();
      console.log(`Combat mode disabled for ${username}.`);
    } else {
      bot.ashpvp.enableCombat();
      console.log(`Combat mode enabled for ${username}.`);
    }
  },
};
