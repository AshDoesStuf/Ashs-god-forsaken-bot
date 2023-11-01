const { goals } = require("mineflayer-pathfinder");
const { Timer, bestPlayerFilter } = require("./utils");
const Vec3 = require("vec3").Vec3;
const fs = require("fs");

const sleep = (ms = 2000) => {
  return new Promise((r) => {
    setTimeout(r, ms);
  });
};

class PatrolBot {
  constructor(bot) {
    this.bot = bot;
    this.points = [];
    this.patrolling = false;
    this.lastPoint = null;
    this.target = null;
    this.loadPoints();
  }

  addPoint(pos) {
    if (this.points.includes(pos)) {
      console.log("Already a point there1");
      return;
    }

    this.points.push(pos);
    console.log("point added");
  }

  removePoint(point) {
    for (let i = this.points.length - 1; i >= 0; i--) {
      if (this.points[i] === point) {
        this.points.splice(i, 1);
      }
    }
  }

  async startPatrol() {
    if (this.patrolling) {
      if (this.points.length === 0) {
        console.log("[PATROL]: Please set points!");
        return;
      }

      for (let i = 0; i < this.points.length; i++) {
        const point = this.points[i];
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
              e.type === "player" &&
              e !== this.bot.entity &&
              e.position.distanceTo(this.bot.entity.position) <= 16
          );

          if (target) {
            console.log("[PATROL]: Target found, attacking...");

            if (this.bot.fightBot.inBattle) {
              return;
            }

            if (
              this.bot.players[target.username].gamemode !== 0 ||
              this.bot.players[target.username].gamemode !== 2
            ) {
              console.log(
                "[PATROL]: Target is not in survival mode, ignoring..."
              );
            } else {
              this.target = target;
              this.patrolling = false;

              this.bot.fightBot.clear();
              this.bot.fightBot.setTarget(target.username);
              this.bot.fightBot.attack();

              return;
            }
          }

          await sleep(attackInterval);
          timeElapsed += attackInterval;
        }
      }

      // After completing the patrol loop, reset 'patrolling' and continue patrolling
      this.patrolling = true;
      this.startPatrol();
    }
  }

  stop() {
    this.patrolling = false;
    this.target = null;
    this.lastPoint = null;
    this.savePoints();
  }

  savePoints() {
    const jsonData = JSON.stringify(this.points);

    fs.writeFileSync("data.json", jsonData, "utf8");
    console.log("saved data");
  }

  loadPoints() {
    const data = fs.readFileSync("data.json", "utf8");

    // Parse the JSON data into a JavaScript object
    const dataArray = JSON.parse(data);
    for (const point of dataArray) {
      this.points.push(new Vec3(point.x, point.y, point.z));
    }
    console.log(`Loaded all ${this.points.length} points!`);
  }
}

module.exports = PatrolBot;
