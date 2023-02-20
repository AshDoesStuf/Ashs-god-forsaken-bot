const path = require("path");
const fs = require("fs");
const { master, prefix } = require("../config.json");

module.exports = (bot) => {
  const commandFolders = fs.readdirSync("./commands");

  for (const folder of commandFolders) {
    const commandFiles = fs
    .readdirSync(`./commands/${folder}`)
    .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
      const command = require(`../commands/${folder}/${file}`)
      if (!command) continue

      bot.on("chat", (username, message) => {
        if (!message.startsWith(prefix)) return;
        const args = message.slice(prefix.length).split(" ");
        if (args[0] === command.name && master.includes(username)) {
          command.execute(bot, username, args);
        }
      });
    }
    
  }
};
