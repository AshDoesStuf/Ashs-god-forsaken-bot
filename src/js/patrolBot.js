const { goals } = require("mineflayer-pathfinder");
const { Timer, bestPlayerFilter } = require("./utils");
const Vec3 = require("vec3").Vec3;
const fs = require("fs");
const path = require("path");
const { Weapons } = require("minecrafthawkeye");
const { GoalNear } = require("../../../mineflayer-baritone/src/goal");

const sleep = (ms = 2000) => {
  return new Promise((r) => {
    setTimeout(r, ms);
  });
};

class PatrolBot {
  constructor(bot) {
    /**
     * @type {import("mineflayer").Bot}
     */
    this.bot = bot;
    /**
     * @type {Object.<string, Vec3[]>}
     */
    this.points = { [bot.username]: [] };
    this.patrolling = false;
    this.lastPoint = null;
    /**
     * @type {import("prismarine-entity").Entity}
     */
    this.target = null;
    this.attackPathing = false;
    this.attacking = false;
    this.lastAttackTime = 0;
    this.usingBow = false;
    /**
     * @type {import("prismarine-entity").Entity[]}
     */
    this.enemies = [];

    this.loadPoints();
  }

  addPoint(pos) {
    if (this.points[this.bot.username].includes(pos)) {
      console.log("Already a point there1");
      return;
    }

    this.points[this.bot.username].push(pos);
    console.log("point added");
    this.savePoints();
  }

  removePoint(point) {
    const points = this.points[this.bot.username];
    for (let i = points.length - 1; i >= 0; i--) {
      if (points[i] === point) {
        this.points[this.bot.username].splice(i, 1);
      }
    }
  }

  async startPatrol() {
    if (!this.patrolling) return;

    const points = this.points[this.bot.username];

    if (points.length === 0) {
      console.log("[PATROL]: Please set points!");
      return;
    }

    if (this.target) {
      //thens we ins combats
      return;
    }

    if (this.enemies.length > 0) return;

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      this.lastPoint = point;
      const vec3 = new Vec3(point.x, point.y, point.z);
      const distanceTo = this.bot.entity.position.distanceTo(point);

      console.log(`[PATROL]: Going to point ${i + 1}`);

      if (distanceTo > 0.8) {
        const goal = new GoalNear(vec3, 1);

        try {
          await this.bot.ashfinder.goto(goal);
        } catch (error) {
          console.log(error);
        }
      }

      let timeElapsed = 0;
      const attackInterval = 1000;

      while (timeElapsed < 5000) {
        const potentialTargets = this.bot.nearestEntities(
          (e) =>
            e.type === "hostile" &&
            e.position.distanceTo(this.bot.entity.position) <= 16,
          5
        );

        if (potentialTargets.length === 0) {
          await sleep(attackInterval);
          timeElapsed += attackInterval;
          continue;
        }

        const targets = potentialTargets.sort(
          (a, b) =>
            a.position.distanceTo(this.bot.entity.position) -
            b.position.distanceTo(this.bot.entity.position)
        );

        if (targets.length > 0) {
          this.enemies = targets;
          console.log("[PATROL]: Found enemies");
          const enemiesString = targets.map((e) => e.name).join(", ");
          console.log(`[PATROL]: Enemies: ${enemiesString}`);

          this.patrolling = false;
          await this.attackEnemies();
          return;
        }

        await sleep(attackInterval);
        timeElapsed += attackInterval;
      }

      console.log("[PATROL]: No target found, moving to next point...");
    }

    // After completing the patrol loop, reset 'patrolling' and continue patrolling
    this.patrolling = true;
    this.startPatrol();
  }

  async attackEnemies() {
    // Sort mobs by proximity to the bot
    const mobs = this.enemies;

    mobs.sort(
      (a, b) =>
        a.position.distanceTo(this.bot.entity.position) -
        b.position.distanceTo(this.bot.entity.position)
    );

    // Filter to get mobs within attack range
    const mobsToAttack = mobs.filter(
      (mob) => mob.position.distanceTo(this.bot.entity.position) <= 16
    );

    console.log(`[PATROL]: Attacking ${mobsToAttack.length} mobs`);

    // Create an array of promises for attacking the mobs
    const attackPromises = mobsToAttack.map((mob) => this.setTarget(mob));

    // Wait for all attacks to complete
    await Promise.all(attackPromises);

    // Remove attacked mobs from the original array
    for (const mob of mobsToAttack) {
      const index = this.enemies.indexOf(mob);
      if (index > -1) {
        this.enemies.splice(index, 1);
      }
    }
    console.log(`[PATROL]: ${this.enemies.length} mobs remaining`);
    console.log("[PATROL]: Finished attacking mobs");
    this.patrolling = true;
    this.startPatrol();
  }

  setTarget(target) {
    if (!target) {
      return Promise.reject(new Error("No target specified"));
    }

    this.target = target;

    return new Promise((resolve, reject) => {
      const onDeath = (entity) => {
        if (entity.id === target.id) {
          this.bot.removeListener("entityDead", onDeath);
          this.resetCombatState();
          console.log(`[PATROL]: Target ${entity.name} died`);
          resolve();
        }
      };

      const onGone = (entity) => {
        if (entity.id === target.id) {
          this.bot.removeListener("entityGone", onGone);
          this.resetCombatState();
          console.log(`[PATROL]: Target ${entity.name} is gone`);
          resolve();
        }
      };

      // If the bot dies or another error occurs, reject the promise
      const onError = () => {
        this.bot.removeListener("entityDead", onDeath);
        this.bot.removeListener("death", onError);
        reject(new Error("Bot died or an error occurred while attacking"));
      };

      this.bot.on("entityDead", onDeath);
      this.bot.on("entityGone", onGone);
      this.bot.on("death", onError);
    });
  }

  //This will run every minecraft tick
  async attackTarget() {
    if (!this.target) return;

    if (this.patrolling) return;

    if (this.attackPathing) return;

    if (this.attacking) return;

    //use bows cuz we are cool and phantoms are annoying
    if (
      this.target.name === "phantom" &&
      this.bot.inventory.items().find((item) => item.name.includes("bow")) &&
      this.bot.inventory.items().find((item) => item.name.includes("arrow")) &&
      !this.usingBow
    ) {
      this.usingBow = true;

      if (this.bot.ashpvp.canUpdateMainHand())
        this.bot.ashpvp.toggleUpdateMainHand();

      await this.bot.equip(
        this.bot.inventory.items().find((item) => item.name.includes("bow")),
        "hand"
      );

      this.bot.hawkEye.oneShot(this.target, Weapons.bow);
      return;
    }

    if (this.target.name !== "phantom" && this.usingBow) {
      this.usingBow = false;

      if (!this.bot.ashpvp.canUpdateMainHand())
        this.bot.ashpvp.toggleUpdateMainHand();
    }

    const distanceToTarget = this.bot.entity.position.distanceTo(
      this.target.position
    );

    if (distanceToTarget > 3) {
      const goal = new goals.GoalNear(
        this.target.position.x,
        this.target.position.y,
        this.target.position.z,
        2
      );

      try {
        this.attackPathing = true;
        await this.bot.pathfinder.goto(goal);
        this.attackPathing = false;
      } catch (error) {
        console.log(error);
        this.attackPathing = false;
      }
    }

    const currentTime = Date.now();
    const timeSinceLastAttack = currentTime - this.lastAttackTime;

    if (
      timeSinceLastAttack >= this.bot.ashpvp.heldItemCooldown &&
      this.target !== null
    ) {
      this.attacking = true;
      try {
        this.bot.attack(this.target);
      } catch (error) {
        console.log(error);
      }

      setTimeout(() => {
        this.attacking = false;
      }, this.bot.ashpvp.heldItemCooldown);
    }
  }

  resetCombatState() {
    this.target = null;
    this.attacking = false;
    this.attackPathing = false;
    this.patrolling = true;
  }

  stop() {
    this.patrolling = false;
    this.target = null;
    this.lastPoint = null;
    this.savePoints();
  }

  savePoints() {
    const jsonData = this.points[this.bot.username];
    const filePath = path.join(__dirname, "patrolPoints.json");

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (data[this.bot.username]) {
      data[this.bot.username] = jsonData;
    } else {
      data[this.bot.username] = jsonData;
    }

    const stringify = JSON.stringify(data);

    fs.writeFileSync(filePath, stringify, "utf8");
    console.log("saved data");
  }

  loadPoints() {
    const filePath = path.join(__dirname, "patrolPoints.json");
    const data = fs.readFileSync(filePath, "utf8");

    const dataJson = JSON.parse(data);
    // console.log(dataJson);

    if (dataJson[this.bot.username]) {
      this.points = {
        [this.bot.username]: dataJson[this.bot.username],
      };

      console.log(
        `Loaded all ${this.points[this.bot.username].length} points!`
      );
    }
  }
}

module.exports = PatrolBot;
