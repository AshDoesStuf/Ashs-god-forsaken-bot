const EventEmitter = require("events");
const { goals } = require("mineflayer-pathfinder");
const { MobManager } = require("./Managers.js");

const Entity = require("prismarine-entity").Entity;
const Vec3 = require("vec3").Vec3;

const { master } = require("../config.json");
const { Cuboid } = require("../../../skybot/js/utils.js");

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
     * @type {Vec3 | Entity | Cuboid}
     */
    this.guardTarget = null;

    /**
     * @type {Entity}
     */
    this.attackTarget = null;

    this.attackPathing = false;

    this.attacking = false;

    this.lastAttackTime = 0;
  }

  /**
   * @param {Entity | Vec3 | Cuboid} target
   */
  async startGuarding(target) {
    if (!target) return;
    if (this.state === "attacking") return;

    console.log("Started guarding!");

    // Clean up any existing attack state
    if (this.attackTarget) {
      MobManager.TargetedMobs.delete(this.bot.username);
      this.attackTarget = null;
    }

    this.guardTarget = target;
    this.state = "guarding";

    if (!this.isNearGuardTarget()) {
      await this.gotoGuardTarget();
    }
  }

  stopGuarding() {
    this.state = "idle";
    this.guardTarget = null;
    this.attackTarget = null;

    // Clean up tracked mobs
    MobManager.TargetedMobs.delete(this.bot.username);

    this.bot.pathfinder.setGoal(null);
    this.attackPathing = false;
    this.attacking = false;
  }

  async update() {
    if (!this.guardTarget) return;

    // ignore if we're already pathing
    if (this.state === "pathing") return;

    const hivemindMates = this.bot.hivemind.connectedBots.map((b) => b.name);

    // 🔥 helper: enemy filter
    const isEnemy = (e) =>
      e.type === "hostile" ||
      (e.type === "player" &&
        !master.includes(e.username) &&
        !hivemindMates.includes(e.username));

    let entity = null;

    // ---------------------------------------------------------
    // 🟥 CASE 1 — guardTarget is a Cuboid: perimeter defense
    // ---------------------------------------------------------
    if (this.guardTarget instanceof Cuboid) {
      // grab entities inside or near cuboid
      const entities = this.guardTarget.getEntitiesAround(
        this.bot,
        4, // margin around cuboid
        isEnemy
      );

      if (entities.length > 0) {
        // pick nearest to center of cuboid
        const center = this.guardTarget.getCenter();
        entities.sort(
          (a, b) =>
            a.position.distanceTo(center) - b.position.distanceTo(center)
        );
        entity = entities[0];
      }
    }

    // ---------------------------------------------------------
    // 🟦 CASE 2 — guardTarget is a Vec3: protect a point
    // ---------------------------------------------------------
    else if (this.guardTarget?.x !== undefined) {
      const point = this.guardTarget;
      const maxDist = 16;

      entity = this.bot.nearestEntity(
        (e) =>
          isEnemy(e) &&
          e.position.distanceTo(point) <= maxDist &&
          Math.abs(e.position.y - point.y) <= 4
      );
    }

    // ---------------------------------------------------------
    // 🟩 CASE 3 — guardTarget is another Entity: bodyguard mode
    // ---------------------------------------------------------
    else if (this.guardTarget?.position !== undefined) {
      const targetEntity = this.guardTarget;
      const maxDist = 16;

      entity = this.bot.nearestEntity(
        (e) =>
          isEnemy(e) &&
          e.position.distanceTo(targetEntity.position) <= maxDist &&
          Math.abs(e.position.y - targetEntity.position.y) <= 4
      );
    }

    // ---------------------------------------------------------
    // no entity found? dip.
    // ---------------------------------------------------------
    if (!entity) return;

    // someone else already targeting that bozo?
    if (MobManager.isMobTargeted(entity)) return;

    // stop pathfinding if needed
    if (this.state === "pathing") {
      try {
        this.bot.pathfinder.setGoal(null);
      } catch (err) {
        console.log(err);
      }
    }

    // no double attacks
    if (this.state === "attacking") return;

    // lock n load 🔥
    this.state = "attacking";
    this.attackTarget = entity;
    MobManager.TargetedMobs.set(this.bot.username, entity);

    this.emit("guard-start-attack", {
      target: entity,
      state: this.state,
    });
  }

  resetCombatState() {
    this.attackTarget = null;
    this.state = "guarding";
    this.emit("guard-stop-attack");
  }

  async attackMob() {
    if (!this.attackTarget) return;

    if (this.attackPathing) return;

    if (this.attacking) return;

    const distanceToTarget = this.bot.entity.position.distanceTo(
      this.attackTarget.position
    );

    if (distanceToTarget > 3) {
      const goal = new goals.GoalNear(
        this.attackTarget.position.x,
        this.attackTarget.position.y,
        this.attackTarget.position.z,
        3
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
      this.attackTarget !== null
    ) {
      this.attacking = true;
      try {
        await this.bot.lookAt(
          this.attackTarget.position.offset(0, this.attackTarget.height, 0),
          true
        );
        this.bot.attack(this.attackTarget);
        this.lastAttackTime = 0;
      } catch (error) {
        console.log(error);
      }

      setTimeout(() => {
        this.attacking = false;
      }, this.bot.ashpvp.heldItemCooldown);
    }
  }

  isNearGuardTarget() {
    if (!this.guardTarget) return;

    let distance = Number.POSITIVE_INFINITY;

    if (this.guardTarget instanceof Vec3) {
      distance = this.bot.entity.position.distanceTo(this.guardTarget);
    } else if (this.guardTarget instanceof Cuboid) {
      const botPos = this.bot.entity.position.offset(0, 0, 0);
      const closestPoint = this.guardTarget.getClosestPointTo(botPos);
      distance = botPos.distanceTo(closestPoint.offset(0.5, 0.5, 0.5));
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
    } else if (this.guardTarget instanceof Cuboid) {
      const closestPoint = this.guardTarget.getClosestPointTo(
        this.bot.entity.position
      );
      const targetPos = closestPoint.offset(0, 1, 0);
      const block = this.bot.blockAt(targetPos);
      if (block && block.boundingBox !== "empty") {
        targetPos.y += 1;
      }
      pos = targetPos;
    }
    if (!pos) return;

    const goal = new goals.GoalNear(pos.x, pos.y, pos.z, 1);
    this.state = "pathing";
    try {
      await this.bot.pathfinder.goto(goal);
    } catch (error) {
      console.log(error.message);
    }
    this.state = "guarding";
  }

  async groupRequest({ id, proffession, area }) {
    if (proffession !== "guard") return;

    // If we are already guarding something, stop
    if (this.state !== "idle") {
      this.stopGuarding();
    }

    // Start guarding the area
    await this.startGuarding(area);
  }
}

module.exports = GuardBot;
