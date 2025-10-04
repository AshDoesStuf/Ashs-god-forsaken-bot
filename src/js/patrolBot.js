const { goals } = require("mineflayer-pathfinder");
const Vec3 = require("vec3").Vec3;
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const { Weapons } = require("minecrafthawkeye");
const {
  GoalNear,
  GoalAvoid,
} = require("../../../mineflayer-baritone/src/goal");

const sleep = (ms = 2000) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Enhanced PatrolBot with improved error handling and state management
 */
class PatrolBot {
  // Configuration constants
  static CONFIG = {
    PATROL_WAIT_TIME: 5000,
    CHECK_INTERVAL: 1000,
    ATTACK_RANGE: 16,
    MELEE_RANGE: 2.9,
    BOW_RANGE: 15,
    PATROL_DISTANCE_THRESHOLD: 0.8,
    BOW_COOLDOWN: 5000,
    RANGED_TARGETS: ["phantom", "creeper"],
  };

  constructor(bot) {
    this.bot = bot;
    this.points = { [bot.username]: [] };

    // State flags
    this.state = {
      patrolling: false,
      attackPathing: false,
      attacking: false,
      usingBow: false,
    };

    // Combat tracking
    this.combat = {
      target: null,
      enemies: [],
      lastAttackTime: 0,
    };

    this.lastPoint = null;
    this.patrolAbortController = null;

    this.loadPoints();
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for cleanup
   */
  setupEventListeners() {
    this.bot.on("end", () => this.cleanup());
  }

  /**
   * Add a patrol point
   */
  addPoint(pos) {
    const points = this.points[this.bot.username];

    // Check if point already exists (with tolerance for floating point)
    const exists = points.some(
      (p) =>
        Math.abs(p.x - pos.x) < 0.1 &&
        Math.abs(p.y - pos.y) < 0.1 &&
        Math.abs(p.z - pos.z) < 0.1
    );

    if (exists) {
      console.log("[PATROL]: Point already exists at this location");
      return false;
    }

    points.push(pos);
    console.log(`[PATROL]: Point added (Total: ${points.length})`);
    this.savePoints();
    return true;
  }

  /**
   * Remove a patrol point
   */
  removePoint(point) {
    const points = this.points[this.bot.username];
    const initialLength = points.length;

    this.points[this.bot.username] = points.filter((p) => p !== point);

    const removed = initialLength - this.points[this.bot.username].length;
    if (removed > 0) {
      console.log(`[PATROL]: Removed ${removed} point(s)`);
      this.savePoints();
    }

    return removed;
  }

  /**
   * Clear all patrol points
   */
  clearPoints() {
    this.points[this.bot.username] = [];
    console.log("[PATROL]: All points cleared");
    this.savePoints();
  }

  /**
   * Start patrol loop
   */
  async startPatrol() {
    if (this.state.patrolling) {
      console.log("[PATROL]: Already patrolling");
      return;
    }

    const points = this.points[this.bot.username];
    if (points.length === 0) {
      console.log("[PATROL]: No patrol points set. Use addPoint() first.");
      return;
    }

    this.state.patrolling = true;
    console.log(`[PATROL]: Starting patrol with ${points.length} points`);

    await this.patrolLoop();
  }

  /**
   * Main patrol loop
   */
  async patrolLoop() {
    while (this.state.patrolling) {
      try {
        await this.executePatrolCycle();
      } catch (error) {
        console.error("[PATROL]: Error in patrol cycle:", error.message);
        await sleep(2000);
      }
    }
  }

  /**
   * Execute one complete patrol cycle
   */
  async executePatrolCycle() {
    const points = this.points[this.bot.username];

    for (let i = 0; i < points.length && this.state.patrolling; i++) {
      const point = points[i];
      this.lastPoint = point;

      console.log(`[PATROL]: Moving to point ${i + 1}/${points.length}`);

      await this.moveToPoint(point);

      if (!this.state.patrolling) break;

      const foundEnemies = await this.scanForEnemies();

      if (foundEnemies) {
        await this.handleCombat();
        if (!this.state.patrolling) break;
      }
    }
  }

  /**
   * Move to a specific point
   */
  async moveToPoint(point) {
    const vec3 = new Vec3(point.x, point.y, point.z);
    const distance = this.bot.entity.position.distanceTo(vec3);

    if (distance <= PatrolBot.CONFIG.PATROL_DISTANCE_THRESHOLD) {
      return;
    }

    const goal = new GoalNear(vec3, 1);

    try {
      this.bot.ashfinder.disablePlacing();
      await this.bot.ashfinder.goto(goal);
      this.bot.ashfinder.enablePlacing();
    } catch (error) {
      console.error(`[PATROL]: Failed to reach point: ${error.message}`);
    }
  }

  /**
   * Scan for enemies at current location
   */
  async scanForEnemies() {
    let timeElapsed = 0;
    const { PATROL_WAIT_TIME, CHECK_INTERVAL, ATTACK_RANGE } = PatrolBot.CONFIG;

    while (timeElapsed < PATROL_WAIT_TIME && this.state.patrolling) {
      const potentialTargets = this.findHostileEntities(ATTACK_RANGE);

      if (potentialTargets.length > 0) {
        this.combat.enemies = this.sortByDistance(potentialTargets);
        const enemyNames = this.combat.enemies.map((e) => e.name).join(", ");
        console.log(
          `[PATROL]: Found ${this.combat.enemies.length} enemies: ${enemyNames}`
        );
        return true;
      }

      await sleep(CHECK_INTERVAL);
      timeElapsed += CHECK_INTERVAL;
    }

    return false;
  }

  /**
   * Find hostile entities within range
   */
  findHostileEntities(range) {
    return this.bot.nearestEntities(
      (e) =>
        e.type === "hostile" &&
        e.position.distanceTo(this.bot.entity.position) <= range,
      20 // Max entities to check
    );
  }

  /**
   * Sort entities by distance from bot
   */
  sortByDistance(entities) {
    return entities.sort(
      (a, b) =>
        a.position.distanceTo(this.bot.entity.position) -
        b.position.distanceTo(this.bot.entity.position)
    );
  }

  /**
   * Handle combat with detected enemies
   */
  async handleCombat() {
    this.state.patrolling = false;

    const mobsInRange = this.combat.enemies.filter(
      (mob) =>
        mob.position.distanceTo(this.bot.entity.position) <=
        PatrolBot.CONFIG.ATTACK_RANGE
    );

    console.log(`[COMBAT]: Engaging ${mobsInRange.length} target(s)`);

    // Attack each mob sequentially for better control
    for (const mob of mobsInRange) {
      if (!this.state.patrolling && mob.isValid) {
        try {
          await this.engageTarget(mob);
        } catch (error) {
          console.error(
            `[COMBAT]: Error engaging ${mob.name}: ${error.message}`
          );
        }
      }
    }

    this.combat.enemies = [];
    console.log("[COMBAT]: Combat complete, resuming patrol");
    this.state.patrolling = true;
  }

  /**
   * Engage a single target
   */
  async engageTarget(target) {
    this.combat.target = target;

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        this.bot.removeListener("entityDead", onDeath);
        this.bot.removeListener("entityGone", onGone);
        this.bot.removeListener("death", onError);
        this.resetCombatState();
      };

      const onDeath = (entity) => {
        if (entity.id === target.id) {
          console.log(`[COMBAT]: ${entity.name} eliminated`);
          cleanup();
          resolve();
        }
      };

      const onGone = (entity) => {
        if (entity.id === target.id) {
          console.log(`[COMBAT]: ${entity.name} left area`);
          cleanup();
          resolve();
        }
      };

      const onError = () => {
        cleanup();
        reject(new Error("Bot died during combat"));
      };

      this.bot.on("entityDead", onDeath);
      this.bot.on("entityGone", onGone);
      this.bot.on("death", onError);

      // Timeout after 30 seconds
      setTimeout(() => {
        cleanup();
        resolve();
      }, 30000);
    });
  }

  /**
   * Attack current target (called every tick)
   */
  async attackTarget() {
    if (!this.combat.target || this.state.patrolling) return;
    if (this.state.attackPathing || this.state.attacking) return;

    // Handle ranged combat
    if (this.shouldUseRangedWeapon()) {
      await this.executeRangedAttack();
      return;
    }

    // Disable bow mode if not needed
    if (this.state.usingBow && !this.shouldUseRangedWeapon()) {
      await this.disableBowMode();
    }

    // Handle melee combat
    await this.executeMeleeAttack();
  }

  /**
   * Check if bot should use ranged weapon
   */
  shouldUseRangedWeapon() {
    if (!this.combat.target) return false;

    const isRangedTarget = PatrolBot.CONFIG.RANGED_TARGETS.includes(
      this.combat.target.name
    );
    const hasBow = this.bot.inventory
      .items()
      .some((item) => item.name.includes("bow"));
    const hasArrows = this.bot.inventory
      .items()
      .some((item) => item.name.includes("arrow"));

    return isRangedTarget && hasBow && hasArrows && !this.state.usingBow;
  }

  /**
   * Execute ranged attack
   */
  async executeRangedAttack() {
    this.state.usingBow = true;

    try {
      if (this.bot.ashpvp.canUpdateMainHand()) {
        this.bot.ashpvp.toggleUpdateMainHand();
      }

      const bow = this.bot.inventory
        .items()
        .find((item) => item.name.includes("bow"));
      if (bow) {
        await this.bot.equip(bow, "hand");
        this.bot.hawkEye.oneShot(this.combat.target, Weapons.bow);
      }

      // Maintain distance
      const goal = new GoalAvoid(this.combat.target.position, 5, this.bot);
      await this.bot.ashfinder.goto(goal).catch((err) => {
        console.error("[COMBAT]: Pathfinding error:", err.message);
      });

      await sleep(PatrolBot.CONFIG.BOW_COOLDOWN);
    } finally {
      this.state.usingBow = false;
    }
  }

  /**
   * Disable bow mode
   */
  async disableBowMode() {
    this.state.usingBow = false;
    if (!this.bot.ashpvp.canUpdateMainHand()) {
      this.bot.ashpvp.toggleUpdateMainHand();
    }
  }

  /**
   * Execute melee attack
   */
  async executeMeleeAttack() {
    const distance = this.bot.entity.position.distanceTo(
      this.combat.target.position
    );

    // Move closer if too far
    if (distance > 3) {
      await this.approachTarget();
    }

    // Attack if cooldown elapsed
    const currentTime = Date.now();
    const timeSinceLastAttack = currentTime - this.combat.lastAttackTime;

    if (timeSinceLastAttack >= this.bot.ashpvp.heldItemCooldown) {
      this.executeAttack();
    }
  }

  /**
   * Approach the target
   */
  async approachTarget() {
    const goal = new goals.GoalNear(
      this.combat.target.position.x,
      this.combat.target.position.y,
      this.combat.target.position.z,
      PatrolBot.CONFIG.MELEE_RANGE
    );

    try {
      this.state.attackPathing = true;
      await this.bot.pathfinder.goto(goal);
    } catch (error) {
      console.error("[COMBAT]: Pathfinding failed:", error.message);
    } finally {
      this.state.attackPathing = false;
    }
  }

  /**
   * Execute attack action
   */
  executeAttack() {
    this.state.attacking = true;
    this.combat.lastAttackTime = Date.now();

    try {
      this.bot.attack(this.combat.target);
    } catch (error) {
      console.error("[COMBAT]: Attack failed:", error.message);
    }

    setTimeout(() => {
      this.state.attacking = false;
    }, this.bot.ashpvp.heldItemCooldown);
  }

  /**
   * Reset combat state
   */
  resetCombatState() {
    this.combat.target = null;
    this.state.attacking = false;
    this.state.attackPathing = false;
    this.state.usingBow = false;
  }

  /**
   * Stop patrol
   */
  stop() {
    console.log("[PATROL]: Stopping patrol");
    this.state.patrolling = false;
    this.resetCombatState();
    this.combat.enemies = [];
    this.lastPoint = null;
  }

  /**
   * Save patrol points to file
   */
  savePoints() {
    const filePath = path.join(__dirname, "patrolPoints.json");

    try {
      let data = {};

      if (fsSync.existsSync(filePath)) {
        const fileContent = fsSync.readFileSync(filePath, "utf8");
        data = JSON.parse(fileContent);
      }

      data[this.bot.username] = this.points[this.bot.username];

      fsSync.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
      console.log(
        `[PATROL]: Saved ${this.points[this.bot.username].length} points`
      );
    } catch (error) {
      console.error("[PATROL]: Failed to save points:", error.message);
    }
  }

  /**
   * Load patrol points from file
   */
  loadPoints() {
    const filePath = path.join(__dirname, "patrolPoints.json");

    try {
      if (!fsSync.existsSync(filePath)) {
        fsSync.writeFileSync(filePath, "{}", "utf8");
        console.log("[PATROL]: Created new patrol points file");
        return;
      }

      const fileContent = fsSync.readFileSync(filePath, "utf8");
      const data = JSON.parse(fileContent);

      if (data[this.bot.username]) {
        this.points[this.bot.username] = data[this.bot.username];
        console.log(
          `[PATROL]: Loaded ${this.points[this.bot.username].length} points`
        );
      } else {
        console.log("[PATROL]: No saved points found");
      }
    } catch (error) {
      console.error("[PATROL]: Failed to load points:", error.message);
      this.points[this.bot.username] = [];
    }
  }

  /**
   * Cleanup on shutdown
   */
  cleanup() {
    this.stop();
    this.savePoints();
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      patrolling: this.state.patrolling,
      points: this.points[this.bot.username].length,
      target: this.combat.target?.name || null,
      enemies: this.combat.enemies.length,
      position: this.bot.entity.position,
      lastPoint: this.lastPoint,
    };
  }
}

module.exports = PatrolBot;
