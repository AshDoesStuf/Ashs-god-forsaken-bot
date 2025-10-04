const Module = require("./Module");

const Vec3 = require("vec3");

class BedDefenseModule extends Module {
  async start() {
    const bedBlocks = this.getBedBlocks();
    if (!bedBlocks) return this.log("Bed not found");

    const positions = this.getDefensePositions(bedBlocks);

    const materials = ["wood", "wool"]; // Tier 2 style defense

    for (const mat of materials) {
      if (!this.hasBlock(mat)) {
        this.log(`Missing ${mat}, skipping...`);
        continue;
      }

      await this.equipBlock(mat);

      for (const pos of positions) {
        const targetBlock = this.bot.blockAt(pos.offset(0, -1, 0));
        if (!targetBlock) continue;

        try {
          await this.bot.placeBlock(targetBlock, new Vec3(0, 1, 0));
          await this.bot.waitForTicks(3);
        } catch (err) {
          this.log(`Failed placing ${mat} at ${pos}:`, err.message);
        }
      }
    }

    this.log("Defense build complete");
  }

  getBedBlocks() {
    const bedBlock = this.bot.findBlock({
      matching: (block) => block.name.includes("bed"),
      maxDistance: 30,
    });
    if (!bedBlock) return null;

    const facing = bedBlock.getProperties().facing; // north/south/east/west
    const isHead = bedBlock.getProperties().part === "head";
    const dir = this.facingToOffset(facing);

    const otherPartPos = isHead
      ? bedBlock.position.minus(dir)
      : bedBlock.position.plus(dir);

    const otherBlock = this.bot.blockAt(otherPartPos);
    if (!otherBlock || !otherBlock.name.includes("bed")) return [bedBlock];

    return [bedBlock, otherBlock];
  }

  facingToOffset(facing) {
    switch (facing) {
      case "north":
        return new Vec3(0, 0, -1);
      case "south":
        return new Vec3(0, 0, 1);
      case "west":
        return new Vec3(-1, 0, 0);
      case "east":
        return new Vec3(1, 0, 0);
      default:
        return new Vec3(0, 0, 0);
    }
  }

  getDefensePositions(bedBlocks) {
    const posSet = new Set();

    for (const bed of bedBlocks) {
      const center = bed.position;
      const offsets = [
        [1, 0, 0],
        [-1, 0, 0],
        [0, 0, 1],
        [0, 0, -1],
        [1, 0, 1],
        [1, 0, -1],
        [-1, 0, 1],
        [-1, 0, -1],
        [0, 1, 0], // top
      ];

      for (const [x, y, z] of offsets) {
        const pos = center.offset(x, y, z);
        posSet.add(pos.toString()); // Avoid duplicates
      }
    }

    return Array.from(posSet).map((str) => {
      const [x, y, z] = str.split(",").map(Number);
      return new Vec3(x, y, z);
    });
  }

  async equipBlock(blockName) {
    const item = this.bot.inventory.items().find((i) => i.name === blockName);
    if (item) {
      try {
        await this.bot.equip(item, "hand");
      } catch (err) {
        this.log(`Failed to equip ${blockName}:`, err.message);
      }
    }
  }
}

module.exports = BedDefenseModule;
