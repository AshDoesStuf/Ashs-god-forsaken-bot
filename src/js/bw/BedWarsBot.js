const BedDefenseModule = require("./BedDefenseModule");
const ChatHandlerModule = require("./ChatHandlerModule");

class BedWarsBot {
  constructor(bot) {
    /**
     * @type {import("mineflayer").Bot}
     */
    this.bot = bot;

    this.team = null;

    this.chatHandler = new ChatHandlerModule(bot, this);
    this.bedDefense = new BedDefenseModule(bot, this);
  }

  async onGameStart() {
    this.log("Initializing modules...");
    // await this.bedDefense.start();
  }

  log(...args) {
    console.log(`[MainBedWarsBot]`, ...args);
  }
}

module.exports = BedWarsBot;
