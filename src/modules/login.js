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
    const cubanarchyReg =
      /Please, register to the server with the command: \/register <password> <ConfirmPassword>/;
    const cubanarchyLog = /Please, login with the command: \/login <password>/;

    const matchReg = registerMsg.test(msg);
    const matchLog = loginMsg.test(msg);
    const ultraRegMatch = ultraReg.test(msg);
    const ultraLogMatch = ultraLog.test(msg);
    const matchCubaReg = cubanarchyReg.test(msg);
    const matchCubaLog = cubanarchyLog.test(msg);

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
    } else if (matchCubaReg) {
      bot.chat(`/register ${password} ${password}`);
      console.log(`${chalk.bold.green("Succesfuly registerd!")}`);
    } else if (matchCubaLog) {
      bot.chat(`/login ${password}`);
      console.log(`${chalk.bold.green("Succesfuly loged in!")}`);
    }
  });
};
