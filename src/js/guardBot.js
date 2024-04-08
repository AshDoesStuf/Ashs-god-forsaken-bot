const EventEmitter = require("events");
const { goals } = require("mineflayer-pathfinder");

const Entity = require("prismarine-entity").Entity;
const Vec3 = require("vec3").Vec3;

// For positions we set a position to guard, when we are in the guarding state we look for entities to attack, if we find some we and it is abit far we set the state to pathfinding and we set a goal to that entity and when we are close enough to attack we set the state to attacking after the entity is dead check if we are near the guard post if not we path to it otherwise we set the state back to guarding

class GuardBot extends EventEmitter {
  constructor(bot) {
    super();

    /**
     * @type {import("mineflayer").Bot}
     */
    this.bot = bot;
    /**
     * @type {import("../index.d.ts").GuardState}
     */
    this.state = "idle";

    /**
     * @type {Vec3 | Entity | null}
     */
    this.guardTarget = null;

    /**
     * @type {Entity | null}
     */
    this.attackTarget = null;
  }

  /**
   * @param {Entity | Vec3} target
   */
  async startGuarding(target) {
    // If we have nothing to guard then return
    if (!target) return;
    console.log("Started guarding!");
    this.guardTarget = target;
    this.state = "guarding";

    // If we aren't attacking then head to the target
    if (this.state !== "attacking" && !this.isNearGuardTarget())
      await this.gotoGuardTarget();
  }

  stopGuarding() {
    this.state = "idle";
    this.guardTarget = null;
    this.bot.pathfinder.setGoal(null);
  }

  async update() {
    if (!this.guardTarget) return;

    // wait untill we reach whatever we were pathing to
    if (this.state === "pathing") return;

    // this means we are already fighting an entity
    if (this.state === "attacking") return;

    const entity = this.bot.nearestEntity(
      (e) =>
        e.type === "hostile" &&
        e.position.distanceTo(this.bot.entity.position) <= 16
    );

    if (!entity) return;

    // we attack that entity
    this.state = "attacking";
    this.attackTarget = entity;
    this.bot.fightBot.safety = true;
    this.bot.fightBot.attackMob(entity);
    this.emit("guard-start-attack", { target: entity, state: this.state });
  }

  isNearGuardTarget() {
    if (!this.guardTarget) return;

    let distance = Number.POSITIVE_INFINITY;

    if (this.guardTarget instanceof Vec3) {
      distance = this.bot.entity.position.distanceTo(this.guardTarget);
    } else if (this.guardTarget instanceof Entity) {
      distance = this.bot.entity.position.distanceTo(this.guardTarget.position);
    }

    if (distance <= 3) {
      return true;
    }

    return false;
  }

  async gotoGuardTarget() {
    if (!this.guardTarget) return;

    if (this.state === "pathing") return;

    let pos = null;

    if (this.guardTarget instanceof Vec3) {
      pos = this.guardTarget;
    } else if (this.guardTarget instanceof Entity) {
      pos = this.guardTarget.position;
    }

    const goal = new goals.GoalNear(pos.x, pos.y, pos.z, 1);
    this.state = "pathing";
    await this.bot.pathfinder.goto(goal);
    this.state = "guarding";
  }
}

module.exports = GuardBot;
