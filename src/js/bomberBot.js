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

      this.bot.removeListener("entityDead", onTargetDeath);
    };

    const onTargetGone = (entity) => {
      if (entity.id !== this.target.id) return;

      this.target = null;

      this.bot.removeListener("entityGone", onTargetGone);
    };

    this.bot.on("entityDead", onTargetDeath);
    this.bot.on("entityGone", onTargetGone);
  }

  async tick(dt) {
    await this.followTarget();
    await this.bombTarget();
  }

  async followTarget() {
    if (!this.target) return;

    const distance = this.bot.entity.position.distanceTo(this.target.position);

    if (distance <= this.options.minFollowDist) return;

    const goal = new GoalNear(this.target.position, this.options.minFollowDist);

    try {
      await this.bot.ashfinder.goto(goal);
    } catch (error) {
      console.log("Failed to reach target");
      console.log(error);
    }
  }

  async bombTarget() {
    if (!this.target) return;
    const distance = this.bot.entity.position.distanceTo(this.target.position);

    if (distance <= this.options.minFollowDist) return;

    const goodAnchorPos = this.getGoodAnchorPlacement(this.target);

    if (!goodAnchorPos) return;

    await placeBlock(this.bot, "respawn_anchor", goodAnchorPos, {
      delayAfter: 0,
      delayBefore: 0,
    });

    await this.detonate(goodAnchorPos);
  }

  /**
   * @param {Vec3} pos
   */
  async detonate(pos) {
    const blockAt = this.bot.blockAt(pos);

    if (blockAt.name === "air" || blockAt.name !== "respawn_anchor") return;

    const glowstone = this.bot.inventory
      .items()
      .find((i) => i.name === "glowstone");

    if (!glowstone) return;

    await this.bot.equip(glowstone);

    const charges = parseInt(blockAt.getProperties().charges);

    while (charges < 5 || blockAt.name === "respawn_anchor") {
      await this.bot.equip(glowstone);

      await this.bot.activateBlock(blockAt);
    }
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

      if (blockAt.name !== "air") continue;

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

      const score = targetDamage * distPoints - selfDamage * 1.3;

      if (score >= bestScore) {
        bestScore = score;
        bestPos = targetOffestPos;
      }
    }

    return bestPos;
  }

  _startTickLoop() {
    if (this.running) return;
    this.running = true;

    const tickRate = 50;

    const update = () => {
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
