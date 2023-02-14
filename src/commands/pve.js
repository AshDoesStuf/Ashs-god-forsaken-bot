module.exports = {
  name: "pve",
  async execute(bot) {
    bot.fightBot.safety = true;
    await bot.fightBot.attackMobs();
  },
};
