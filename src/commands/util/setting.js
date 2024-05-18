/**
 * @type {import("../../index").Command}
 */
module.exports = {
  name: "setting",
  execute(bot, username, args) {
    const setting = args.shift();
    let value;

    if (!isNaN(args[0])) {
      // If it's a number
      value = parseFloat(args[0]); // or parseInt(args[0]) for integer values
    } else if (args[0] === "true" || args[0] === "false") {
      // If it's a boolean
      value = args[0] === "true";
    } else {
      // Otherwise, it's a string
      value = args[0];
    }

    bot.fightBot.setSettings(setting, value);
  },
};
