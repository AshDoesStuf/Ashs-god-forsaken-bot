const fs = require("fs");
const { master, prefix } = require("../config.json");
const path = require("path");

const filePath = "/home/ekcrossna/Desktop/mineflayer/archer/src/commands";
const filePath2 = "/home/ekcrossna/Desktop/mineflayer/archer/src/bmcommands";

const sussyVersions = ["1.21", "1.21.1", "1.21.2", "1.21.3", "1.21.4"];

/**
 *
 * @param {import("mineflayer").Bot} bot
 */
module.exports = (bot) => {
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

  const bmCommandFolders = fs.readdirSync(filePath2);
  for (const folder of bmCommandFolders) {
    const commandFiles = fs
      .readdirSync(`${filePath2}/${folder}`)
      .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
      const command = require(`${filePath2}/${folder}/${file}`);
      if (!command) continue;

      bot.bmCommands.push(command);
    }
  }

  console.log(`Loaded ${bot.commands.length} commands`);

  bot.on("messagestr", (username, pos, chatMessage) => {
    if (!sussyVersions.includes(bot.version)) return;

    if (chatMessage.json.translate !== "chat.type.text") return;

    function removeBrackets(str) {
      return str.replace(/[<>]/g, "");
    }

    username = removeBrackets(username).trim();

    //MESSage in this case is the username ig rela pro pro gay men

    // console.log(message);
    // console.log(pos);
    // console.log(chatMessage.json);

    const realMessage =
      chatMessage.json.translate === "chat.type.text"
        ? `${username.trim()}:${Object.values(chatMessage.json.with[1])}`
        : "nope";

    // console.log(realMessage);

    /**
     * @type {string}
     */
    const usableMessage = Object.values(chatMessage.json.with[1])[0];

    // console.log(usableMessage);

    if (username === bot.username) return;
    // console.log(jsonMsg.json.with[1])

    if (usableMessage.startsWith(`${prefix}${bot.username}`)) {
      const args = usableMessage
        .slice((prefix + bot.username).length)
        .trim()
        .split(" ");
      const command = bot.commands.find(
        (cm) => cm.name === args[0] || cm.aliases?.includes(args[0])
      );

      if (!command) return;
      // bot.whisper(`Unknown command: ${args[0]}`);

      // console.log("Command name", command.name);
      // console.log(args);

      if (args[0] === command.name && master.includes(username)) {
        args.shift(); // Remove the command name from the args array

        if (command.args && args.length === 0) {
          // bot.whisper(`Usage: ${command.usage}`);
          return;
        }

        command.execute(bot, username, args);
      }
    }
    // to all bots
    else if (usableMessage.startsWith(`${prefix}`)) {
      const args = usableMessage.slice(prefix.length).trim().split(" ");
      const command = bot.commands.find(
        (cm) => cm.name === args[0] || cm.aliases?.includes(args[0])
      );

      if (!command) return;
      // bot.whisper(`Unknown command: ${args[0]}`);
      if (args[0] === command.name && master.includes(username)) {
        args.shift(); // Remove the command name from the args array
        // console.log("g");
        if (command.args && args.length === 0) {
          // bot.whisper(`Usage: ${command.usage}`);
          return;
        }

        command.execute(bot, username, args);
      }
    }
  });

  bot.on("chat", (username, message, trans, jsonMsg) => {
    if (username === bot.username) return;
    // console.log(jsonMsg.json.with[1])

    if (message.startsWith(`${prefix}${bot.username}`)) {
      const args = message
        .slice((prefix + bot.username).length)
        .trim()
        .split(" ");
      const command = bot.commands.find((cm) => cm.name === args[0]);

      if (!command) return;
      // bot.whisper(`Unknown command: ${args[0]}`);

      // console.log("Command name", command.name);
      // console.log(args);

      if (args[0] === command.name && master.includes(username)) {
        args.shift(); // Remove the command name from the args array

        if (command.args && args.length === 0) {
          // bot.whisper(`Usage: ${command.usage}`);
          return;
        }

        command.execute(bot, username, args);
      }
    }
    // to all bots
    else if (message.startsWith(`${prefix}`)) {
      const args = message.slice(prefix.length).trim().split(" ");
      const command = bot.commands.find((cm) => cm.name === args[0]);

      if (!command) return;
      // bot.whisper(`Unknown command: ${args[0]}`);

      if (args[0] === command.name && master.includes(username)) {
        args.shift(); // Remove the command name from the args array

        if (command.args && args.length === 0) {
          // bot.whisper(`Usage: ${command.usage}`);
          return;
        }

        command.execute(bot, username, args);
      }
    }
  });

  //bot mind commands
  bot.on("chat", async (username, message) => {
    if (username === bot.username) return;

    if (!message.startsWith("bm!")) return;

    const args = message.slice(prefix.length).trim().split(" ");

    const command = bot.bmCommands.find((cm) => cm.name === args[0]);

    if (!command) return bot.chat(`Unknown command: ${args[0]}`);

    const kings = await bot.bm.getKings();

    if (args[0] === command.name && kings.includes(username)) {
      args.shift();

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
    const patterns = [
      {
        name: "whisper",
        regex: /\[\!\] Message from (\w+) ➠ (.+)/,
      },
      {
        name: "kitPvp",
        regex: /^► \[([^\]]+)\s->\sme\]\s(.*)$/,
      },
      {
        name: "party",
        regex: /Party ▏ (\w+): (.+)/,
      },
      {
        name: "practicePvp",
        regex: /MSG ▏ From (\w+): (.+)/,
      },
    ];

    for (const { regex } of patterns) {
      const match = msg.match(regex);
      if (match) {
        const [, username, message] = match;

        if (username === bot.username || !message.startsWith(prefix)) return;

        const args = message.slice(prefix.length).split(" ");
        const command = bot.commands.find((cm) => cm.name.includes(args[0]));

        if (command && args[0] === command.name && master.includes(username)) {
          args.splice(0, 1);
          try {
            command.execute(bot, username, args);
          } catch (error) {
            console.log(error.message);
          }
        }

        return; // Stop after the first match
      }
    }
  });

  //Ultra
  bot.on("messagestr", (msg) => {
    // console.log(msg);
    const whipserRegex = /^(\w+)\s»\sYou\s»\s(.+)$/;

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

  //Ultimis
  bot.on("messagestr", (msg) => {
    const regex = /\[FRIENDS\] (\w+) ➟ (\w+) » (.+\w+)/;
    const match = msg.match(regex);

    if (match) {
      // console.log(match);
      const [, username, botusername, spacedMessage] = match;

      const message = spacedMessage.replace(/^\s+/, "");

      // console.log(message)
      if (username === bot.username) return;

      if (!message.startsWith(prefix)) return;
      const args = message.slice(prefix.length).split(" ");
      const command = bot.commands.find((cm) => cm.name === args[0]);

      if (!command) return;
      // bot.whisper(`Unknown command: ${args[0]}`);

      if (args[0] === command.name && master.includes(username)) {
        args.splice(0, 1);

        command.execute(bot, username, args);
      }
    }
  });

  //Hylex
  bot.on("messagestr", (msg) => {
    const regex = /┃ Friends ┃ (\w+) ➟ (\w+) » (.+\w+)/;
    const match = msg.match(regex);

    if (match) {
      // console.log(match);
      const [, username, botusername, spacedMessage] = match;

      const message = spacedMessage.replace(/^\s+/, "");

      // console.log(message)
      if (username === bot.username) return;

      if (!message.startsWith(prefix)) return;
      const args = message.slice(prefix.length).split(" ");
      const command = bot.commands.find((cm) => cm.name === args[0]);

      if (!command) return;
      // bot.whisper(`Unknown command: ${args[0]}`);

      if (args[0] === command.name && master.includes(username)) {
        args.splice(0, 1);

        command.execute(bot, username, args);
      }
    }
  });
};
