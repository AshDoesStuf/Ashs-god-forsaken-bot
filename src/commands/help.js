const fs = require("fs");
const path = require("path");

module.exports = {
  name: "help",
  description: "Displays all available commands",
  execute(bot, username, args) {
    const commandFiles = fs
      .readdirSync(path.join(__dirname, "../commands"))
      .filter((file) => file.endsWith(".js"));

    console.log("Available commands:");
    for (const file of commandFiles) {
      const command = require(`../commands/${file}`);
      console.log(command.name);
    }
  },
};
