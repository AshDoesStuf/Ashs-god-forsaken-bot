const mineflayer = require("mineflayer"); // eslint-disable-line
const { password } = require("../config.json");
const chalk = require("chalk");

/**
 * @param {mineflayer.Bot} bot // to enable intellisense
 */

module.exports = (bot) => {
  bot.on("messagestr", async (msg, pos) => {
    const registerMsg = /PikaNetwork » Please register with \/register .+ .+$/;
    const loginMsg = /PikaNetwork » Please login with \/login .+$/;
    const ultraReg = /Please register using \/register .+ .+$/;
    const ultraLog = /Please login with the command \/login .+$/;

    const matchReg = registerMsg.test(msg);
    const matchLog = loginMsg.test(msg);
    const ultraRegMatch = ultraReg.test(msg);
    const ultraLogMatch = ultraLog.test(msg);

    if (pos === "game_info") {
      const regex = /Register with \/register <password>/;
      const regex2 = /Log in with \/login <password>/;

      if (regex.test(msg)) {
        console.log(`${chalk.bold.green("Succesfuly registerd!")}`);
      }

      if (regex2.test(msg)) {
        bot.chat("/login gayman1");
        console.log(`${chalk.bold.green("Succesfuly loged in!")}`);
      }
    }

    if (matchReg) {
      bot.chat(`/reg ${password} ${password}`);
      console.log(`${chalk.bold.green("Succesfuly registerd!")}`);
    } else if (matchLog) {
      bot.chat(`/login ${password}`);
      console.log(`${chalk.bold.green("Succesfuly loged in!")}`);
    } else if (ultraRegMatch) {
      bot.chat(`/register ${password} ${password}`);
      console.log(`${chalk.bold.green("Succesfuly registerd!")}`);
    } else if (ultraLogMatch) {
      bot.chat(`/login ${password}`);
      console.log(`${chalk.bold.green("Succesfuly loged in!")}`);
    }
  });
};
