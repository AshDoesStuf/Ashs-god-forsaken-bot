const fs = require("fs");
const { master, prefix } = require("../config.json");
const path = require("path");

/**
 *
 * @param {import("mineflayer").Bot} bot
 */
module.exports = (bot) => {
  const filePath = "C:\\Users\\ashpl\\Archer\\src\\commands";
  const commandFolders = fs.readdirSync(filePath);

  for (const folder of commandFolders) {
    const commandFiles = fs
      .readdirSync(`${filePath}/${folder}`)
      .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
      const command = require(`${filePath}/${folder}/${file}`);
      if (!command) continue;

      bot.commands.push(command);
    }
  }

  bot.on("chat", (username, message) => {
    if (username === bot.username) return;

    if (!message.startsWith(`${prefix}${bot.username}`)) return;
    const args = message
      .slice((prefix + bot.username).length)
      .trim()
      .split(" ");
    const command = bot.commands.find((cm) => cm.name === args[0]);

    if (!command) return bot.chat(`Unknown command: ${args[0]}`);

    // console.log("Command name", command.name);
    // console.log(args);

    if (args[0] === command.name && master.includes(username)) {
      args.shift(); // Remove the command name from the args array

      if (command.args && args.length === 0) {
        bot.chat(`Usage: ${command.usage}`);
        return;
      }

      try {
        command.execute(bot, username, args);
      } catch (error) {
        console.log(error.message);
      }
    }
  });

  // Normal servers
  bot.on("whisper", (username, message) => {
    if (username === bot.username) return;

    if (!message.startsWith(prefix)) return;
    const args = message.slice(prefix.length).split(" ");

    const command = bot.commands.find((cm) => cm.name.includes(args[0]));

    if (args[0] === command.name && master.includes(username)) {
      // Remove the command name from the args array
      args.splice(0, 1);
      try {
        command.execute(bot, username, args);
      } catch (error) {
        console.log(error.message);
      }
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
      const command = bot.commands.find((cm) => cm.name.includes(args[0]));

      if (args[0] === command.name && master.includes(username)) {
        // Remove the command name from the args array
        args.splice(0, 1);

        try {
          command.execute(bot, username, args);
        } catch (error) {
          console.log(error.message);
        }
      }
    } else if (kitMatach) {
      const [, username, message] = kitMatach;
      if (username === bot.username) return;

      if (!message.startsWith(prefix)) return;
      const args = message.slice(prefix.length).split(" ");
      const command = bot.commands.find((cm) => cm.name.includes(args[0]));

      if (args[0] === command.name && master.includes(username)) {
        // Remove the command name from the args array
        args.splice(0, 1);

        try {
          command.execute(bot, username, args);
        } catch (error) {
          console.log(error.message);
        }
      }
    }
  });

  //Ultra
  bot.on("messagestr", (msg) => {
    // console.log(msg);
    const whipserRegex = /MEMBER (\w.+) ➟ (.+)/;

    const match = msg.match(whipserRegex);

    if (match) {
      const [, username, message] = match;
      if (username === bot.username) return;

      if (!message.startsWith(prefix)) return;
      const args = message.slice(prefix.length).split(" ");
      const command = bot.commands.find((cm) => cm.name.includes(args[0]));

      if (args[0] === command.name && master.includes(username)) {
        // Remove the command name from the args array
        args.splice(0, 1);

        try {
          command.execute(bot, username, args);
        } catch (error) {
          console.log(error.message);
        }
      }
    }
  });

  //APle
  bot.on("messagestr", (msg) => {
    // console.log(msg);
    const whipserRegex = /MEMBER (.+) ➟ (.+)/;

    const match = msg.match(whipserRegex);

    if (match) {
      const [, username, message] = match;
      if (username === bot.username) return;

      if (!message.startsWith(prefix)) return;
      const args = message.slice(prefix.length).split(" ");
      const command = bot.commands.find((cm) => cm.name.includes(args[0]));

      if (args[0] === command.name && master.includes(username)) {
        // Remove the command name from the args array
        args.splice(0, 1);

        try {
          command.execute(bot, username, args);
        } catch (error) {
          console.log(error.message);
        }
      }
    }
  });
};
