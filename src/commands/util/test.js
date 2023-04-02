const mineflayer = require("mineflayer");
const sleep = async (ms = 2000) => {
  return new Promise((r) => setTimeout(r, ms));
};

let toggled = false;

module.exports = {
  name: "test",

  /**
   *
   * @param {mineflayer.Bot} bot
   * @param {string} username
   * @param {string[]} args
   */
  async execute(bot, username, args) {
    // toggled = !toggled;
    // define the minimum clearance for boats and the maximum depth of the water
    const boatClearance = 2;
    const maxDepth = 3;

    // find the bot's current position
    const botPos = bot.entity.position;

    // create a list of candidate starting locations for the bridge
    const candidateStarts = [];
    for (let x = botPos.x - 10; x <= botPos.x + 10; x++) {
      for (let z = botPos.z - 10; z <= botPos.z + 10; z++) {
        const groundBlock = bot.blockAt(new Vec3(x, botPos.y - 1, z));
        if (
          groundBlock &&
          mcData.blocksByStateId[groundBlock.stateId].boundingBox !== "empty"
        ) {
          // check if the ground is a solid block
          const waterBlocks = [];
          for (let y = botPos.y - 1; y >= botPos.y - maxDepth; y--) {
            const block = bot.blockAt(new Vec3(x, y, z));
            if (mcData.blocksByStateId[block.stateId].name === "water") {
              waterBlocks.push(block);
            } else {
              break;
            }
          }
          if (waterBlocks.length > 0) {
            // calculate the clearance of the water at the candidate location
            const waterClearance =
              Math.min(...waterBlocks.map((block) => block.position.y)) -
              botPos.y;
            if (waterClearance >= boatClearance) {
              candidateStarts.push({
                x: x,
                z: z,
                clearance: waterClearance,
              });
            }
          }
        }
      }
    }

    // find the safest starting location for the bridge
    let targetStart = null;
    let highestSafetyScore = 0;
    for (const start of candidateStarts) {
      // calculate the safety score of the starting location
      const safetyScore = calculateSafetyScore(start);

      // if the starting location is safer than the current target, update the target
      if (safetyScore > highestSafetyScore) {
        targetStart = start;
        highestSafetyScore = safetyScore;
      }
    }

    function calculateSafetyScore(start) {
      // calculate the end position of the bridge
      const endPos = new Vec3(start.x, botPos.y, start.z).offset(0, 0, 10);

      // check if the bridge will have enough clearance for boats to pass underneath
      const bridgeBlocks = [];
      for (let y = botPos.y; y <= botPos.y + 1; y++) {
        const block = bot.blockAt(new Vec3(start.x, y, start.z));
        if (mcData.blocksByStateId[block.stateId].boundingBox === "empty") {
          bridgeBlocks.push(block);
        }
      }
      if (bridgeBlocks.length > 0) {
        const bridgeHeight =
          Math.min(...bridgeBlocks.map((block) => block.position.y)) - botPos.y;
        if (bridgeHeight >= boatClearance) {
          // calculate the safety score of the starting location
          return bridgeHeight;
        }
      }
      return 0; // the starting location is not safe for building a bridge
    }
  },
};
