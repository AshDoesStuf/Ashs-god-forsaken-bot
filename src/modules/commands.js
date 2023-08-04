const fs = require("fs");
const { master, prefix } = require("../config.json");

/**
 *
 * @param {import("mineflayer").Bot} bot
 */
module.exports = (bot) => {
  const commandFolders = fs.readdirSync("./commands");

  for (const folder of commandFolders) {
    const commandFiles = fs
      .readdirSync(`./commands/${folder}`)
      .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
      const command = require(`../commands/${folder}/${file}`);
      if (!command) continue;
      bot.commands.push(command);

      bot.on("chat", (username, message) => {
        if (username === bot.username) return;

        if (!message.startsWith(prefix)) return;
        const args = message.slice(prefix.length).split(" ");

        if (args[0] === command.name && master.includes(username)) {
          // Remove the command name from the args array
          args.splice(0, 1);

          command.execute(bot, username, args);
        }
      });

      // Normal servers
      bot.on("whisper", (username, message) => {
        if (username === bot.username) return;

        if (!message.startsWith(prefix)) return;
        const args = message.slice(prefix.length).split(" ");

        if (args[0] === command.name && master.includes(username)) {
          // Remove the command name from the args array
          args.splice(0, 1);

          command.execute(bot, username, args);
        }
      });

      // Pikanetwork
      bot.on("messagestr", (msg) => {
        const whipserRegex = /\[\!\] Message from (\w+) ➠ (.+)/;
        const kitPvpRegex = /^► \[([^\]]+)\s->\sme\]\s(.*)$/;
        const match = msg.match(whipserRegex);
        const kitMatach = msg.match(kitPvpRegex);

        if (match) {
          const [, username, message] = match;
          if (username === bot.username) return;

          if (!message.startsWith(prefix)) return;
          const args = message.slice(prefix.length).split(" ");

          if (args[0] === command.name && master.includes(username)) {
            // Remove the command name from the args array
            args.splice(0, 1);

            command.execute(bot, username, args);
          }
        } else if (kitMatach) {
          const [, username, message] = kitMatach;
          if (username === bot.username) return;

          if (!message.startsWith(prefix)) return;
          const args = message.slice(prefix.length).split(" ");

          if (args[0] === command.name && master.includes(username)) {
            // Remove the command name from the args array
            args.splice(0, 1);

            command.execute(bot, username, args);
          }
        }
      });
    }
  }
};
