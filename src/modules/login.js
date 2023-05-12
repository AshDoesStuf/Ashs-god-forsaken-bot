const mineflayer = require("mineflayer"); // eslint-disable-line
const { password } = require("../config.json");
const chalk = require("chalk");

/**
 * @param {mineflayer.Bot} bot // to enable intellisense
 */

module.exports = (bot) => {
  bot.on("messagestr", async (msg) => {
    const registerMsg = /PikaNetwork » Please register with \/register .+ .+$/;
    const loginMsg = /PikaNetwork » Please login with \/login .+$/;

    const matchReg = registerMsg.test(msg);
    const matchLog = loginMsg.test(msg);

    if (matchReg) {
      bot.chat(`/reg ${password} ${password}`);
      console.log(`${chalk.bold.green("Succesfuly registerd!")}`);
      return;
    } else if (matchLog) {
      bot.chat(`/login ${password}`);
      console.log(`${chalk.bold.green("Succesfuly loged in!")}`);
    }
  });
};
