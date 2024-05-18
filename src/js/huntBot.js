const { goals } = require("mineflayer-pathfinder");
const Vec3 = require("vec3").Vec3;
const fs = require("fs");
const path = require("path");

const sleep = (ms = 2000) => {
  return new Promise((r) => {
    setTimeout(r, ms);
  });
};

class HuntBot {
  constructor(bot) {
    /**
     * @type { import("mineflayer").Bot}
     */
    this.bot = bot;
    this.target = null;
    this.isAttacking = false;
    this.isPathing = false;
  }

  setTarget(entity) {
    if (!entity) return console.log("No entity provided.");

    this.target = entity;
    this.startHunting();
  }

  async startHunting() {
    if (!this.target) return console.log("No target set.");

    // Start chasing the target

    if (this.target.position) {
      const distance = this.bot.entity.position.distanceTo(
        this.target.position
      );

      if (distance > 3 && !this.isPathing) {
        this.isPathing = true;
        const vec = new Vec3(
          this.target.position.x,
          this.target.position.y,
          this.target.position.z
        );

        await this.bot.ashfinder.goto(vec)

        this.isPathing = false;
      }
    }
  }

  attackTarget() {
    if (this.isAttacking || this.isPathing) return;

    this.isAttacking = true;
    this.bot.attack(this.target);
    setTimeout(() => {
      this.isAttacking = false;
    }, 2000);
  }

  async update() {
    if (!this.target) return;

    const distance = this.bot.entity.position.distanceTo(this.target.position);

    if (distance > 3 && !this.isPathing) {
      this.isPathing = true;
      const goal = new goals.GoalNear(
        this.target.position.x,
        this.target.position.y,
        this.target.position.z,
        2
      );

      await this.bot.pathfinder.goto(goal);
      this.isPathing = false;
    }

    if (distance < 3) {
      this.attackTarget();
    }
  }

  stop() {
    this.bot.pathfinder.stop();
    this.target = null;
  }
}

module.exports = HuntBot;
