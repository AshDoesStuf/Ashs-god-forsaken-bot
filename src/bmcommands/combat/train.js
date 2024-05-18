/**
 * @type {import("../../index").Command}
 */
module.exports = {
  name: "train",
  description: "faifam",

  async execute(bot, username, args) {
    const bots = await bot.bm.getConnectedBots();

    console.log(bots);
    

  },
};
