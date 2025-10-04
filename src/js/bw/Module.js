const BedWarsBot = require("./BedWarsBot");

class Module {
  constructor(parent) {
    /**
     * @type {BedWarsBot}
     */
    this.parent = parent;
    this.bot = this.parent.bot;
  }

  getTeammates() {
    return Object.values(this.bot.teams).map((team) => {
      return Object.keys(team.memberMap).filter(
        (username) => username !== this.bot.username
      );
    });
  }

  getOwnBed() {
    return this.bot.findBlock({
      matching: (block) => block.name.includes("bed"),
      maxDistance: 30, // broad search just in case
    });
  }

  getInventoryCount(itemName) {
    return this.bot.inventory
      .items()
      .filter((item) => item.name === itemName)
      .reduce((sum, item) => sum + item.count, 0);
  }

  hasBlock(itemName, min = 1) {
    return this.getInventoryCount(itemName) >= min;
  }

  log(...args) {
    console.log(`[${this.constructor.name}]`, ...args);
  }
}

module.exports = Module;
