const mineflayer = require("mineflayer"); // eslint-disable-line
const { password, password2 } = require("../config.json");
const chalk = require("chalk");

/**
 * @param {mineflayer.Bot} bot // to enable intellisense
 */

module.exports = (bot) => {
  const actions = [
    {
      regex: /PikaNetwork » Please register with \/register .+ .+$/,
      action: () => bot.chat(`/reg ${password} ${password}`),
      type: "register",
    },
    {
      regex: /PikaNetwork » Please login with \/login .+$/,
      action: () => bot.chat(`/login ${password}`),
      type: "login",
    },
    {
      regex: /Please register using \/register .+ .+$/,
      action: () => bot.chat(`/register ${password} ${password}`),
      type: "register",
    },
    {
      regex: /Please login with the command \/login .+$/,
      action: () => bot.chat(`/login ${password}`),
      type: "login",
    },
    {
      regex:
        /Please, register to the server with the command: \/register <password> <ConfirmPassword>/,
      action: () => bot.chat(`/register ${password} ${password}`),
      type: "register",
    },
    {
      regex: /Please, login with the command: \/login <password>/,
      action: () => bot.chat(`/login ${password}`),
      type: "login",
    },
    {
      regex: /Please register using: \/register <password> <password>/,
      action: () => bot.chat(`/register ${password2} ${password2}`),
      type: "register",
    },
    {
      regex: /Please login using: \/login <password> \[2fa_code\]/,
      action: () => bot.chat(`/login ${password2}`),
      type: "login",
    },
    {
      regex: /\/register password password/,
      action: () => bot.chat(`/register ${password} ${password}`),
      type: "register",
    },
    {
      regex: /\/login password/,
      action: () => bot.chat(`/login ${password}`),
      type: "login",
    },
    {
      regex: /\[\+\] Register: \/register <password> <password>/,
      action: () => bot.chat(`/register ${password} ${password}`),
      type: "register",
    },
    {
      regex: /\[\+\] Login: \/login <password>/,
      action: () => bot.chat(`/login ${password}`),
      type: "login",
    },
    {
      regex: /Use the command \/register/,
      action: () => bot.chat(`/register ${password} ${password}`),
      type: "register",
    },
    {
      regex: /Use the command \/login/,
      action: () => bot.chat(`/login ${password}`),
      type: "login",
    },
  ];

  bot.on("messagestr", (msg, pos) => {
    // console.log(msg);

    // Specific "game_info" messages
    if (pos === "game_info") {
      if (/Register with \/register <password>/.test(msg)) {
        console.log(chalk.bold.green("Successfully registered!"));
      }
      if (/Log in with \/login <password>/.test(msg)) {
        bot.chat(`/login ${password}`);
        console.log(chalk.bold.green("Successfully logged in!"));
      }
    }

    for (const { regex, action, type } of actions) {
      if (regex.test(msg)) {
        action();
        console.log(chalk.bold.green(`Successfully ${type}ed!`));
        break;
      }
    }
  });
};
