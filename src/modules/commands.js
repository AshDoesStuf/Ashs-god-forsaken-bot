const path = require("path");
const fs = require("fs");
const { master, prefix } = require("../config.json");

module.exports = (bot) => {
  const commandFiles = fs
    .readdirSync(path.join(__dirname, "../commands"))
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    bot.on("chat", (username, message) => {
      if (!message.startsWith(prefix)) return;
      const args = message.slice(prefix.length).split(" ");
      if (args[0] === command.name && master.includes(username)) {
        command.execute(bot, username, args);
      }
    });
  }
};
