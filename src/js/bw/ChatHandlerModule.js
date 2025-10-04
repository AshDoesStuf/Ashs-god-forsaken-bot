const Module = require("./Module");

class ChatHandlerModule extends Module {
  constructor(bot, parent) {
    super(bot, parent);
    this.team = null;
    this.setupChatListener();
  }

  setupChatListener() {
    this.bot.on('messagestr', (msg) => {
      // Detect team
      const teamMatch = msg.match(/BedWars ► You and your party are now in team (\w+)/);
      if (teamMatch) {
        this.team = teamMatch[1].toLowerCase();
        this.parent.team = this.team;
        this.log(`Team set to: ${this.team}`);
      }

      // Detect game start
      const startMatch = msg.match(/BedWars ► The game will start in \d+ second/);
      if (startMatch) {
        this.log('Game is about to start!');
        this.parent.onGameStart();
      }
    });
  }
}
module.exports = ChatHandlerModule;