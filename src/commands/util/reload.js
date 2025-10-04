const fs = require("fs");

/**
 * @type {import("../../index.d.ts").Command}
 */
module.exports = {
  name: "reload",
  description: "Reload a command",
  args: true,
  usage: "#reload <commandName>",
  

  async execute(bot, username, args) {
    /**
     * @type {String}
     * @description Name of the specified command in lowercase.
     */
    const commandName = args[0]?.toLowerCase();

    const command = bot.commands.find((cmd) => cmd.name.toLowerCase().includes(commandName));

    if (!command) {
      console.log(
        `There is no command with name or alias \`${commandName}\`, ${username}!`
      );
      return; // Early return if the command is not found
    }

    /**
     * @type {String[]}
     * @description Array of all command categories aka folders.
     */
    const commandFolders = fs.readdirSync("./commands");

    /**
     * @type {String}
     * @description Name of the command category/folder of the specified command.
     */
    const folderName = commandFolders.find((folder) =>
      fs.readdirSync(`./commands/${folder}`).includes(`${command.name}.js`)
    );

    if (!folderName) {
      console.log(`Command file for \`${command.name}\` not found.`);
      return; // Early return if the folder is not found
    }

    // Remove the command from the require cache
    delete require.cache[
      require.resolve(`../${folderName}/${command.name}.js`)
    ];

    try {
      /**
       * @type {import("../../index.d.ts").Command}
       * @description The new command (code fetch)
       */
      const newCommand = require(`../${folderName}/${command.name}.js`);

      // Replace the existing command with the new one
      const commandIndex = bot.commands.indexOf(command);
      if (commandIndex > -1) {
        bot.commands[commandIndex] = newCommand;
      } else {
        bot.commands.push(newCommand);
      }

      console.log(`Command \`${command.name}\` reloaded!`);
    } catch (error) {
      console.log(
        `Error reloading command \`${command.name}\`: ${error.message}`
      );
    }
  },
};
