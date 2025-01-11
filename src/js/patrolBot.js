const { goals } = require("mineflayer-pathfinder");
const { Timer, bestPlayerFilter } = require("./utils");
const Vec3 = require("vec3").Vec3;
const fs = require("fs");
const path = require("path");

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
    this.points = { [bot.username]: [] };
    this.patrolling = false;
    this.lastPoint = null;
    this.target = null;
    this.attackPathing = false;
    this.attacking = false;
    this.lastAttackTime = 0;

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

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      this.lastPoint = point;
      const distanceTo = this.bot.entity.position.distanceTo(point);

      console.log(`[PATROL]: Going to point ${i + 1}`);

      if (distanceTo > 0.8) {
        const goal = new goals.GoalNear(point.x, point.y, point.z, 1);

        try {
          await this.bot.pathfinder.goto(goal);
        } catch (error) {
          console.log(error);
        }
      }

      let timeElapsed = 0;
      const attackInterval = 1000;

      while (timeElapsed < 5000) {
        const target = this.bot.nearestEntity(
          (e) =>
            e.type === "hostile" &&
            e.position.distanceTo(this.bot.entity.position) <= 16
        );

        if (target) {
          console.log("[PATROL]: Target found, attacking...");

          if (this.bot.fightBot.inBattle) {
            return;
          }

          console.log("[PATROL]: Not in combat");

          this.target = target;
          this.patrolling = false;
          return;
        }

        await sleep(attackInterval);
        timeElapsed += attackInterval;
      }
    }

    // After completing the patrol loop, reset 'patrolling' and continue patrolling
    this.patrolling = true;
    this.startPatrol();
  }

  //This will run every tick
  async attackTarget() {
    if (!this.target) return;

    if (this.patrolling) return;

    if (this.attackPathing) return;

    if (this.attacking) return;

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
