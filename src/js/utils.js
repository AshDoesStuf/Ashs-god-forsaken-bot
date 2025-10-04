const { Vec2 } = require("minecrafthawkeye");
const { Vec3 } = require("vec3");
const WebSocket = require("ws");
const Entity = require("prismarine-entity").Entity;
const speeds = require("../speeds.json");
const weaponBase = require("../weaponBase.json");

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

  const survivalPpl = noDeadPpl.filter((player) => player.gamemode === 0);

  // Return the closest player (the first player in the sorted array)
  return survivalPpl[0];
}

/**
 *
 * @param {import("mineflayer").Bot} bot
 * @param {number} range
 */
function getNearestPlayers(bot, range) {
  // Filter players to ensure they have an entity
  const players = Object.values(bot.players)
    .filter((player) => player.entity)
    .filter((player) => player !== bot.player);

  //Filter out the bot

  // Find and return the nearest players within the specified range
  const nearestPlayers = players.filter(
    (player) => player.entity.position.distanceTo(bot.entity.position) <= range
  );

  return nearestPlayers;
}

function getDistanceTo(vec1, vec2) {
  return vec1.distanceTo(vec2);
}

/**
 *
 * @param {import("mineflayer").Bot} bot
 * @param {string} id
 */
async function equipItemById(bot, id) {
  const ItemInInventory = bot.inventory.items().find((i) => i.type === id);

  if (!ItemInInventory) return;

  await bot.equip(ItemInInventory, "hand");
}

/**
 *
 * @param {import("mineflayer").Bot} bot
 * @param {string} name
 */
async function equipItemByName(bot, name) {
  const ItemInInventory = bot.inventory.items().find((i) => i.name === name);

  if (!ItemInInventory) return;

  await bot.equip(ItemInInventory, "hand");
}

function remove(array, element) {
  if (!array.includes(element)) return new Error("Element not found");

  for (let i = array.length - 1; i >= 0; i--) {
    if (array[i] === element) {
      array.splice(i, 1);
    }
  }
}

function sortEntityListByDistance(bot, e1, e2) {
  if (
    getDistance(e1.position, bot.entity.position) >
    getDistance(e2.position, bot.entity.position)
  ) {
    return 1;
  } else if (
    getDistance(e1.position, bot.entity.position) >
    getDistance(e2.position, bot.entity.position)
  ) {
    return -1;
  } else return 0;
}

/**
 *
 * @param {import("mineflayer").Bot} bot
 * @param {Entity} entity
 * @param {number} vectorLength
 */
function canSeeEntity(bot, entity, vectorLength = 5 / 16) {
  const { height, position } = bot.entity;
  const transparentBlocks = bot.registry.blocksArray
    .filter((e) => e.transparent || e.boundingBox === "empty")
    .map((e) => e.id);
  const entityPos = entity.position.offset(
    -entity.width / 2,
    0,
    -entity.width / 2
  );

  // bounding box verticies (8 verticies)
  const targetBoundingBoxVertices = [
    entityPos.offset(0, 0, 0),
    entityPos.offset(entity.width, 0, 0),
    entityPos.offset(0, 0, entity.width),
    entityPos.offset(entity.width, 0, entity.width),
    entityPos.offset(0, entity.height, 0),
    entityPos.offset(entity.width, entity.height, 0),
    entityPos.offset(0, entity.height, entity.width),
    entityPos.offset(entity.width, entity.height, entity.width),
  ];

  // Check the line of sight for every vertex
  const lineOfSight = targetBoundingBoxVertices.map((bbVertex) => {
    // cursor starts at bot's eyes
    const cursor = position.offset(0, height, 0);
    // a vector from a to b = b - a
    const step = bbVertex.minus(cursor).unit().scaled(vectorLength);
    // we shouldn't step farther than the distance to the entity, plus the longest line inside the bounding box
    const maxSteps = bbVertex.distanceTo(position) / vectorLength;

    // check for obstacles
    for (let i = 0; i < maxSteps; ++i) {
      cursor.add(step);

      const block = bot.blockAt(cursor);

      // block must be air/null or a transparent block
      if (block !== null && !transparentBlocks.includes(block.type)) {
        return false;
      }
    }

    return true;
  });

  // must have at least 1 vertex in line-of-sight
  return lineOfSight.some((e) => e);
}

/**
 * @param {Entity} player
 */
function isPlayerBlocking(player) {
  return (
    player.metadata[8] === 1 &&
    player.equipment[1] &&
    player.equipment[1].name === "shield"
  );
}

function between(x, min, max) {
  return x >= min && x <= max;
}

function getSpeed(weaponName) {
  if (!weaponName) return speeds.other;

  return speeds[weaponName.name] || speeds.other;
}

function getItemEnchantments(item) {
  if (!item) return [];

  let enchantments = [];

  const itemEnchants = item?.nbt?.value?.Enchantments?.value?.value;

  if (itemEnchants == undefined) return [];

  for (const obj of itemEnchants) {
    const enchant = {
      name: obj.id.value,
      level: obj.lvl.value,
    };

    enchantments.push(enchant);
  }

  return enchantments;
}

function getBestWeapon(items) {
  if (!items || items.length === 0) return;

  const getItemTotalDamage = (item) => {
    let totalDamage = weaponBase[item.name] || 0;
    const enchantments = getItemEnchantments(item);

    for (const enchantment of enchantments) {
      if (enchantment.name.split(":")[1] === "sharpness") {
        const enchantDamage = 0.5 * enchantment.level + 0.5;
        totalDamage += enchantDamage;
      }
    }

    return totalDamage;
  };

  const sortedItems = items.slice().sort((itemA, itemB) => {
    const damageA = getItemTotalDamage(itemA);
    const damageB = getItemTotalDamage(itemB);

    return damageB - damageA;
  });

  return sortedItems[0];
}

function useItemWithRotation(bot, { offHand = false } = {}) {
  const hand = offHand ? 1 : 0;
  const yaw = bot.entity.yaw || 0;
  const pitch = bot.entity.pitch || 0;

  // bot._client.nextSequenceNumber
  //? bot._client.nextSequenceNumber()

  const sequence = Math.floor(Math.random() * 10000);

  bot._client.write("use_item", {
    hand,
    sequence,
    rotation: {
      x: pitch,
      y: yaw,
    },
  });
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
  equipItemById,
  equipItemByName,
  remove,
  sortEntityListByDistance,
  canSeeEntity,
  isPlayerBlocking,
  between,
  getSpeed,
  getItemEnchantments,
  getNearestPlayers,
  getBestWeapon,
  useItemWithRotation,
};
