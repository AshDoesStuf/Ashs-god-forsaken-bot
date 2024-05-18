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
    this.loadPoints();
  }

  addPoint(pos) {
    if (this.points[this.bot.username].includes(pos)) {
      console.log("Already a point there1");
      return;
    }

    this.points[this.bot.username].push(pos);
    console.log("point added");
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
    if (this.patrolling) {
      const points = this.points[this.bot.username];
      if (points.length === 0) {
        console.log("[PATROL]: Please set points!");
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
              this.bot.players[target.username].gamemode !== 0 &&
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
    const jsonData = JSON.stringify(this.points[this.bot.username]);
    const filePath = path.join(__dirname, "patrolPoints.json");

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (data[this.bot.username]) {
      data[this.bot.username] = jsonData;
    }

    fs.writeFileSync(filePath, JSON.stringify(data), "utf8");
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
