const { Vec3 } = require("vec3");
const {
  GoalNear,
  GoalExact,
} = require("../../../mineflayer-baritone/src/goal.js");
const { placeBlock } = require("./utils.js");

class AirStriker {
  /**
   *
   * @param {import("mineflayer").Bot} bot
   */
  constructor(bot) {
    this.bot = bot;
    /**
     * @type {Vec3}
     */
    this.target = null;

    this.options = {
      yDistance: 10,
    };
  }

  async prepareAirStrike() {
    if (!this.target) return;

    //make sure we have needed shit
    if (!this.hasAllItems()) throw new Error("Missing either tnt or redstone");

    const destination = this.target
      .clone()
      .offset(0, this.options.yDistance, 0);

    const block = this.bot.blockAt(destination);

    if (!block.name.includes("air")) {
      throw new Error("Destination is not air block");
    }

    // try to get to dest
    try {
      this.bot.ashfinder.enableFlight();
      const goal = new GoalNear(destination.offset(0, 4, 0), 1);
      await this.bot.ashfinder.goto(goal);
    } catch (err) {
      console.log("Failed to reach target");
    }

    this.bot.ashfinder.disableFlight();

    // try to place redstone block at feet
    const currentPos = this.bot.entity.position;
    const placePos = currentPos.floored().offset(0, -1, 0);

    const redstone = this.bot.inventory
      .items()
      .find((i) => i.name === "redstone_block");

    if (!redstone) throw new Error("somehow we still dont have redstone");

    await this.bot.equip(redstone);

    await placeBlock(this.bot, "redstone_block", destination);

    this.bot._client.write("position", {
      x: destination.x,
      y: destination.y + 1,
      z: destination.z,
    });

    return destination;
  }

  /**
   * @param {Vec3} redstonePos
   */
  async placeTnT(redstonePos) {
    if (!this.hasAllItems()) throw new Error("Missing tnt");

    const tntItem = this.bot.inventory.items().find((i) => i.name === "tnt");

    const offsets = [
      new Vec3(1, 0, 0),
      new Vec3(-1, 0, 0),
      new Vec3(0, 0, 1),
      new Vec3(0, 0, -1),
    ];

    for (const offset of offsets) {
      const offsetPos = redstonePos.plus(offset);
      const blockAt = this.bot.blockAt(offsetPos);

      if (blockAt.name !== "air") continue;

      await this.bot.equip(tntItem, "hand");

      await placeBlock(this.bot, "tnt", offsetPos, { delayAfter: 0 });
    }
  }

  /**
   * @param {Vec3} target
   */
  async airStrike(target) {
    this.target = target;
    const redstonePos = await this.prepareAirStrike();

    await this.placeTnT(redstonePos);
  }

  async hasAllItems() {
    const redstoneBlock = this.bot.inventory
      .items()
      .find((i) => i.name === "redstone_block");

    const tnt = this.bot.inventory.items().find((i) => i.name === "tnt");

    return redstoneBlock != null && tnt != null;
  }
}

module.exports = AirStriker;
