const { GoalNear } = require("../../../mineflayer-baritone/src/goal.js");
const { Vec3 } = require("vec3");
const { placeBlock } = require("./utils.js");

class BomberBot {
  /**
   *
   * @param {import("mineflayer").Bot} bot
   */
  constructor(bot) {
    this.bot = bot;
    /**
     * @type {import("prismarine-entity").Entity}
     */
    this.target = null;

    this.running = false;
    this.paused = false;
    this.detonating = false;
    this.lastUpdate = performance.now();

    this.options = {
      minFollowDist: 3,
    };

    this._startTickLoop();
  }

  setTarget(target) {
    this.target = target;

    const onTargetDeath = (entity) => {
      if (entity.id !== this.target.id) return;

      this.target = null;
      this.detonating = false;
      this.bot.removeListener("entityDead", onTargetDeath);
    };

    const onTargetGone = (entity) => {
      if (entity.id !== this.target.id) return;

      this.target = null;
      this.detonating = false;
      this.bot.removeListener("entityGone", onTargetGone);
    };

    this.bot.on("entityDead", onTargetDeath);
    this.bot.on("entityGone", onTargetGone);
  }

  stop() {
    this.target = null;
    this.detonating = false;
    this.bot.ashfinder.stop();
  }

  async tick(dt) {
    if (!this.hasAllItems() && this.target) {
      console.log("Stopped bombing target due to loss of items!");
      this.stop();
    }

    await this.followTarget();
    await this.bombTarget();
  }

  async followTarget() {
    if (!this.target) return;

    const distance = this.bot.entity.position.distanceTo(this.target.position);

    if (distance <= this.options.minFollowDist) {
      // Stop moving if we're close enough
      this.bot.clearControlStates();
      return;
    }

    // Calculate direction to target
    const dx = this.target.position.x - this.bot.entity.position.x;
    const dz = this.target.position.z - this.bot.entity.position.z;

    // Set yaw to face target
    const yaw = Math.atan2(-dx, -dz);
    this.bot.look(yaw, 0, true);

    // Move forward towards target
    this.bot.setControlState("forward", true);

    // Jump if there's a block in front
    const frontBlock = this.bot.blockAt(
      this.bot.entity.position.offset(
        Math.sin(yaw) * 0.5,
        0,
        Math.cos(yaw) * 0.5
      )
    );

    if (frontBlock && frontBlock.boundingBox !== "empty") {
      this.bot.setControlState("jump", true);
    }
  }

  async bombTarget() {
    if (!this.target) return;

    await this.quickDetonate();

    let goodAnchorPos = this.getGoodAnchorPlacement(this.target);

    if (!goodAnchorPos) {
      console.log("No good placements! using nearby!");
      goodAnchorPos = this.getBestNearAnchor(this.target);
    }

    if (!goodAnchorPos) return;

    console.log(`Good anchor pos: ${goodAnchorPos.toString()}`);

    try {
      await placeBlock(this.bot, "respawn_anchor", goodAnchorPos, {
        delayAfter: 100,
        delayBefore: 0,
      });
    } catch (error) {
      console.log("Error while placing bomb");
    }

    await this.detonate(goodAnchorPos);
  }

  async quickDetonate() {
    const nearbyAnchors = this.bot.findBlocks({
      matching: (block) => block.name === "respawn_anchor",
      count: 5,
      maxDistance: 5,
      point: this.target.position,
    });

    for (const anchorPos of nearbyAnchors) {
      const anchor = this.bot.blockAt(anchorPos);
      const charges = parseInt(anchor.getProperties().charges);
      if (charges < 4) {
        await this.detonate(anchorPos);
      }
    }
  }

  /**
   * @param {Vec3} pos
   */
  async detonate(pos) {
    let blockAt = this.bot.blockAt(pos);

    if (!blockAt) return;

    if (blockAt.boundingBox === "empty" || blockAt.name !== "respawn_anchor")
      return;

    const glowstone = this.bot.inventory
      .items()
      .find((i) => i.name === "glowstone");

    if (this.detonating) return;
    if (!glowstone) return;
    this.detonating = true;

    await this.bot.equip(glowstone);

    let charges = parseInt(blockAt.getProperties().charges);

    for (let i = 0; i < Math.abs(5 - charges); i++) {
      blockAt = this.bot.blockAt(pos);

      if (blockAt.name !== "respawn_anchor") break;

      await this.bot.equip(glowstone);

      await this.bot.activateBlock(blockAt);
    }

    this.detonating = false;
  }

  getPredictedPosition(target, timeAhead = 0.5) {
    const predicted = target.position.clone();
    if (target.velocity) {
      predicted.add(target.velocity.scaled(timeAhead * 20)); // 20 ticks per second
    }
    return predicted;
  }

  /**
   *
   * @param {import("prismarine-entity").Entity} target
   */
  getGoodAnchorPlacement(target) {
    const targetPos = target.position;

    const offsets = [
      new Vec3(1, 0, 0),
      new Vec3(-1, 0, 0),
      new Vec3(0, 0, 1),
      new Vec3(0, 0, -1),
      new Vec3(1, 0, 1),
      new Vec3(1, 0, -1),
      new Vec3(-1, 0, 1),
      new Vec3(-1, 0, -1),
    ];

    let bestPos = null;
    let bestScore = -Infinity;

    for (const offset of offsets) {
      const targetOffestPos = targetPos.plus(offset);
      const blockAt = this.bot.blockAt(targetOffestPos);

      if (blockAt.boundingBox !== "empty") continue;

      const targetDamage = this.bot.getExplosionDamages(
        target,
        targetOffestPos,
        3,
        true
      );

      const distPoints =
        targetOffestPos.distanceTo(this.target.position) <= 3 ? 1.5 : 0.5;

      const score = targetDamage * distPoints;

      if (score >= bestScore) {
        bestScore = score;
        bestPos = targetOffestPos;
      }
    }

    return bestPos;
  }
  /**
   *
   * @param {import("prismarine-entity").Entity} target
   */
  getBestNearAnchor(target) {
    const targetPos = target.position;

    const positions = this.bot.findBlocks({
      matching: (block) => block.name === "respawn_anchor",
      count: 8,
      maxDistance: 4,
      point: targetPos,
    });

    if (positions.length === 0) return null;

    const sorted = positions.sort((a, b) => a.distanceTo(b) - b.distanceTo(a));

    let bestPos = null;
    let bestScore = -Infinity;

    for (const pos of sorted) {
      const targetOffestPos = targetPos.plus(pos);
      const blockAt = this.bot.blockAt(targetOffestPos);

      if (blockAt && blockAt.boundingBox !== "empty") continue;

      const targetDamage = this.bot.getExplosionDamages(
        target,
        targetOffestPos,
        3,
        true
      );

      // Calculate potential self-damage
      const selfDamage = this.bot.getExplosionDamages(
        this.bot.entity,
        targetOffestPos,
        3,
        true
      );

      const distPoints =
        targetOffestPos.distanceTo(this.target.position) <= 3 ? 1.5 : 0.5;

      const score = targetDamage * distPoints - selfDamage;

      if (score >= bestScore) {
        bestScore = score;
        bestPos = targetOffestPos;
      }
    }

    return bestPos;
  }

  hasAllItems() {
    const anchors = this.bot.inventory
      .items()
      .find((i) => i.name === "respawn_anchor");

    const glowstone = this.bot.inventory
      .items()
      .find((i) => i.name === "glowstone");

    return anchors !== null && glowstone !== null;
  }

  _startTickLoop() {
    if (this.running) return;
    this.running = true;

    const tickRate = 50;

    const update = async () => {
      if (!this.running) return;

      if (!this.paused) {
        const now = performance.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        this.tick(deltaTime);
      }

      setTimeout(update, tickRate);
    };

    update();
  }
}

module.exports = BomberBot;
