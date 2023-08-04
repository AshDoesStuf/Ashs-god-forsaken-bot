const { Vec2 } = require("minecrafthawkeye");
const { Vec3 } = require("vec3");
const Entity = require("prismarine-entity").Entity;

class Timer {
  constructor() {
    this.lastMs = Date.now();
  }

  reset() {
    this.lastMs = Date.now();
  }

  hasTimeElapsed(time, reset) {
    if (Date.now() - this.lastMs > time) {
      if (reset) this.reset();

      return true;
    }

    return false;
  }
}

/**
 *
 * @param {import("mineflayer").Bot} bot
 * @param {Vec3} position
 */
function getDirection(bot, position) {
  const x = bot.entity.position.x - position.x;
  const y = bot.entity.position.y - position.y;
  const z = bot.entity.position.z - position.z;

  const directionVec = new Vec3(x, y, z).normalize();

  return directionVec;
}

function fovFromEntity(bot, en) {
  return (
    ((((bot.entity.yaw - fovToEntity(bot, en)) % 360.0) + 540.0) % 360.0) -
    180.0
  );
}

/**
 *
 * @param {import("mineflayer").Bot} bot
 * @param {Entity} ent
 * @returns {Number}
 */
function fovToEntity(bot, ent) {
  const x = ent.position.x - bot.entity.position.x;
  const z = ent.position.z - bot.entity.position.z;
  const yaw = Math.atan2(x, z) * 57.2957795;
  return yaw * -1.0;
}

function fov(bot, entity, fov) {
  fov = fov * 0.5;
  const v =
    ((bot.entity.yaw - fovToEntity(entity)) % 360.0) + (540.0 % 360.0) - 180.0;
  return (v > 0.0 && v < fov) || (-fov < v && v < 0.0);
}

function generateRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function getDistance(vec1, vec2, round = false) {
  if (round) {
    return Math.round(vec1.distanceTo(vec2));
  }

  return vec1.distanceTo(vec2);
}

function getKit(bot, kit) {
  bot.chat("/kit");

  bot.once("windowOpen", async (window) => {
    switch (kit.toLowerCase()) {
      case "knight":
        await bot.clickWindow(11, 0, 0);
        bot.fightBot.hasGottenKit = true;
        break;
    }
  });
}

function hasHealthPotions(bot) {
  const botInv = bot.inventory.items();
  for (const item of botInv) {
    if (item.nbt?.value?.Potion?.value.includes("healing")) {
      return true;
    }
  }
  return false;
}

function hasShield(bot) {
  const offandSlot = this.bot.getEquipmentDestSlot("off-hand");
  const slots = bot.inventory.slots;

  if (slots[offandSlot] && slots[offandSlot].name === "shield") {
    return true;
  }
  return false;
}

function hasGaps(bot) {
  const inv = bot.inventory.items();
  const gapTypes = ["golden_apple", "enchanted_golden_apple"];

  for (let i = 0; i < inv.length; i++) {
    if (gapTypes.includes(inv[i].name)) return true;
  }
  return false;
}

function hasTotems(bot) {
  const offandSlot = bot.getEquipmentDestSlot("off-hand");
  const slots = bot.inventory.slots;
  const totem = bot.inventory.items().find((i) => i.name === "totem");

  if (slots[offandSlot] && slots[offandSlot].name === "totem_of_undying") {
    return true;
  }
  return false;
}

/**
 *
 * @param {Entity} entity
 */
function bestPlayerFilter(entity) {
  return entity.type === "player";
}

/**
 *
 * @param {import("mineflayer").Bot} bot
 */
function getClosestPlayer(bot) {
  const players = Object.values(bot.players).filter(
    (player) => player.entity !== null && player.entity?.isValid
  );
  players.sort((player1, player2) => {
    if (!player1.entity || !player2.entity) return 0;
    const p1Pos = player1.entity.position;
    const p2Pos = player2.entity.position;

    if (
      getDistanceTo(p1Pos, bot.entity.position) >
      getDistanceTo(p2Pos, bot.entity.position)
    ) {
      return 1;
    } else if (
      getDistanceTo(p1Pos, bot.entity.position) <
      getDistanceTo(p2Pos, bot.entity.position)
    ) {
      return -1;
    } else return 0;
  });

  // Filter out the bot from the list of players
  const filteredPlayers = players.filter((player) => player !== bot.player);

  const noDeadPpl = filteredPlayers.filter(
    (player) => player.entity?.health !== 0
  );

  // Return the closest player (the first player in the sorted array)
  return noDeadPpl[0];
}

function getDistanceTo(vec1, vec2) {
  return vec1.distanceTo(vec2);
}

module.exports = {
  Timer,
  getDirection,
  fov,
  fovFromEntity,
  fovToEntity,
  generateRandom,
  getDistance,
  getKit,
  hasGaps,
  hasHealthPotions,
  hasShield,
  hasTotems,
  bestPlayerFilter,
  getClosestPlayer,
};
