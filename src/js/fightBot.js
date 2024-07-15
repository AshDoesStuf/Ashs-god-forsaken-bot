const { master, useLogs } = require("../config.json");
const {
  Movements,
  goals: { GoalNear, GoalFollow, GoalBlock },
} = require("mineflayer-pathfinder");
const fs = require("fs");
const speeds = require("../speeds.json");
const weaponBase = require("../weaponBase.json");
const { Vec3 } = require("vec3");
const mineflayer = require("mineflayer");
const {
  Timer,
  getKit,
  hasTotems,
  bestPlayerFilter,
  sortEntityListByDistance,
  canSeeEntity,
  getDistance,
  between,
  getSpeed,
  getItemEnchantments,
  getNearestPlayers,
  isPlayerBlocking,
  getBestWeapon,
} = require("./utils");
const sleep = (ms = 2000) => {
  return new Promise((r) => setTimeout(r, ms));
};
const { getDirection } = require("./utils.js");
const Entity = require("prismarine-entity").Entity;

const mcData = require("minecraft-data")("1.19.4");

const CarinalDirections = {
  north: { x: 0, z: -1, name: "north" },
  south: { x: 0, z: 1, name: "south" },
  east: { x: 1, z: 0, name: "east" },
  west: { x: -1, z: 0, name: "west" },
};

class Fight {
  /**
   *
   * @param {mineflayer.Bot} bot The bot to be injected
   */
  constructor(bot) {
    /**
     * The player to attack
     */
    /**
     * @type {mineflayer.Bot}
     */
    this.bot = bot;
    this.delay = 10;
    this.settings = {
      aggressive: false,
      hacker: false,
      display: false, // Display chat messages like hits
      persistant: false,
      freeForAll: false,
      critSpam: false,
      duels: true,
      requestHelp: true,
      useAxe: false,
      useSword: true,
    };
    this.strafeStyles = {
      default: true,
      circle: false,
    };
    this.combatItems = [778, 149, 680];
    this.knownSexOffenders = [];
    this.passiveMobs = [
      "Bat",
      "Chicken",
      "Cow",
      "Donkey",
      "Horse",
      "Llama",
      "Mooshroom",
      "Mule",
      "Ocelot",
      "Pig",
      "Rabbit",
      "Sheep",
      "Snow Golem",
      "Squid",
      "Trader Llama",
      "Wolf",
      "Axolotl",
    ];
    this.tempTargetE = null;
    this.tempTargetN = "";
    this.kit = "NetheritePot";
    this.faceDirectionZ = "";
    this.faceDirectionX = "";
    this.direction = { x: 0, z: 0, name: "" };
    // Random bs
    this.lookInter = null;
    this.atkInter = null;
    this.shootInter = null;
    this.movementInter = null;
    this.calcInter = null;
    this.miscInter = null;
    this.switchInter = null;
    this.pveInter = null;
    this.followInter = null;

    this.eating = false;
    this.target_G = null;
    this.target = "";
    this.targets = [];
    this.pveTarg = null;
    this.archerTarget = null;
    this.ffaTarget = null;
    // Bools
    this.targetAbove3 = false;
    this.isInArea = false;
    this.exploring = false;
    this.hasReached = false;
    this.isSprinting = false;
    this.closeToTarg = false;
    this.ffa = false;
    this.isShooting = false;
    this.building = false;
    this.isPearling = false;
    this.isHungry = false;
    this.isPathfinding = false;
    this.IsCombat = false;
    this.healing = false;
    this.placing = false;
    this.gettingReady = false;
    this.pve = false;
    this.safety = false;
    this.blocking = false;
    this.upperCutting = false;
    this.stapping = false;
    this.wtapping = false;
    this.ashtapping = false;
    this.hasGottenKit = false;
    this.inBattle = false;
    this.isAttacking = false;
    // Ints
    this.maxFollowDistance = 20;
    this.maxAttackDistance = 2.8;
    this.minAttackDistance = 0;
    this.maxBowDistance = 35;
    this.debounce = 0.6; //Default;
    this.timeToReachTarg = 0;
    this.jumpDistance = 5;
    this.currentCooldown = 0;
    this.offHandPriority = 0;
    this.lastHealTime = 0;
    this.distance = 0;
    this.timeSinceLastChug = 0;
    this.lastAttackTime = 0;
    this.heldItemCooldown = 0;

    this.timeElapsed = 0;
    this.currentTime = 0;
    this.startTime = 0;

    this.timer = new Timer();
  }

  /**
   * Look at the specified target
   */
  async lookPlayer() {
    if (!this.target_G) return;

    const currentPosition = this.bot.entity.position;
    const dx = this.target_G.position.x - currentPosition.x;
    const dz = this.target_G.position.z - currentPosition.z;

    const yaw = Math.atan2(-dx, -dz);

    this.bot.look(yaw, 0, true);
  }

  async lookMob() {
    if (!this.pveTarg) return;

    await this.bot.lookAt(
      this.pveTarg.position.offset(0, this.pveTarg.height, 0)
    );
  }

  /**
   * Sets the target to a specific player
   */
  async setTarget(player) {
    if (player === this.bot.username) {
      if (useLogs) {
        console.log("cant set bot to target");
      } else this.bot.chat("go away nerd");
      return;
    }

    if (this.bot.players[player]) {
      this.target = player;
      this.target_G = this.bot.players[player]?.entity;
      this.tempTargetE = this.target_G;
      this.tempTargetN = this.target;
    } else {
      if (useLogs) {
        console.log("no pleayer");
      } else this.bot.chat("no pls");
      return;
    }
  }

  async setTargets(targets) {
    this.targets = targets;
  }

  /**
   *
   * @param {Entity} target
   */
  setPveTarget(target) {
    if (target) this.pveTarg = target;
  }

  /**
   * Sets the bots control-states depending on the situation
   */
  async followTarget() {
    if (!this.target_G) return;

    if (this.isShooting) return;

    if (this.bot.entity.isCollidedHorizontally && !this.isPathfinding) {
      this.bot.setControlState("jump", true);
    }

    if (this.distance <= this.maxFollowDistance) {
      if (this.distance > 1.5) {
        if (this.wtapping || this.ashtapping || this.stapping) return;

        // Move towards the target
        this.bot.setControlState("sprint", true);
        this.bot.setControlState("forward", true);

        if (this.settings.hacker) {
          const randomLocation = this.target_G.position.offset(
            Math.floor(Math.random() * (5 - 1) + 1),
            0,
            Math.floor(Math.random() * (5 - 1) + 1)
          );

          this.bot._client.write("position", {
            x: randomLocation.x,
            y: randomLocation.y,
            z: randomLocation.z,
          });
        }
      } else {
        if (this.wtapping && this.ashtapping && this.stapping) return;

        // Stop moving if too close
        this.bot.setControlState("forward", false);

        if (this.settings.hacker) {
          const randomLocation = this.target_G.position.offset(
            Math.floor(Math.random() * (5 - 1) + 1),
            0,
            Math.floor(Math.random() * (5 - 1) + 1)
          );

          this.bot._client.write("position", {
            x: randomLocation.x,
            y: randomLocation.y,
            z: randomLocation.z,
          });
        }
      }

      // if (this.closeToTarg) {
      //   if (this.settings.hacker) return;

      //   if (!this.target || !this.target_G || this.isPathfinding) return;

      //   const distance = this.distance;
      //   const state = {
      //     jump:
      //       Math.random() < 0.00255 &&
      //       this.isSprinting &&
      //       distance <= this.jumpDistance &&
      //       !this.placing &&
      //       !this.settings.aggressive &&
      //       !this.settings.critSpam &&
      //       !this.upperCutting,
      //     strafeLeft:
      //       Math.random() < 0.3 && this.isSprinting && this.bot.entity.onGround,
      //     strafeRight:
      //       Math.random() < 0.3 && this.isSprinting && this.bot.entity.onGround,
      //     nothing: Math.random() < 0.5,
      //   };

      //   if (this.strafeStyles.default) {
      //     if (state.jump) {
      //       this.bot.setControlState("jump", true);
      //     } else if (state.strafeLeft) {
      //       this.bot.setControlState("left", true);
      //       this.bot.setControlState("right", false);
      //     } else if (state.strafeRight) {
      //       this.bot.setControlState("right", true);
      //       this.bot.setControlState("left", false);
      //     } else if (state.nothing) {
      //       this.bot.setControlState("left", false);
      //       this.bot.setControlState("right", false);
      //     }
      //   } else if (this.strafeStyles.circle) {
      //     if (state.jump) {
      //       this.bot.setControlState("jump", true);
      //     } else if (state.strafeLeft) {
      //       this.bot.setControlState("left", true);
      //       this.bot.setControlState("right", false);
      //     } else if (state.strafeRight) {
      //       this.bot.setControlState("right", true);
      //       this.bot.setControlState("left", false);
      //     } else if (state.nothing) {
      //       this.bot.setControlState("left", false);
      //       this.bot.setControlState("right", false);
      //     }
      //   }
      // } else {
      //   this.bot.setControlState("left", false);
      //   this.bot.setControlState("right", false);
      // }
    }
  }

  async followMob() {
    if (!this.pveTarg) return;

    if (this.isShooting) return;

    if (this.bot.entity.isCollidedHorizontally && !this.isPathfinding) {
      this.bot.setControlState("jump", true);
      await sleep(300);
      this.bot.setControlState("jump", false);
    }

    if (this.pveTarg?.position) {
      const targetPosition = this.pveTarg.position;
      const distance = this.bot.entity.position.distanceTo(targetPosition);

      // console.log("here");
      if (distance > 1.5) {
        this.bot.setControlState("sprint", true);
        this.bot.setControlState("forward", true);
        this.isSprinting = true;
      } else {
        this.bot.setControlState("forward", false);
        this.bot.setControlState("back", true);
        this.bot.setControlState("back", false);
      }
    }
  }

  //#region Main stuff

  /**
   * The acutally attacking system
   */
  async attackTick() {
    if (!this.target_G || this.isAttacking) return;
    const targetEntity = this.target_G;

    const currentTime = Date.now();
    const timeSinceLastAttack = currentTime - this.lastAttackTime;

    if (timeSinceLastAttack >= this.heldItemCooldown) {
      this.lastAttackTime = currentTime;
      this.isAttacking = true;

      const currentPosition = this.bot.entity.position;
      const targetPosition = this.target_G.position;

      const distance = getDistance(currentPosition, targetPosition);

      if (distance < this.maxFollowDistance) {
        if (this.isShooting) {
          this.bot.hawkEye.stop();
          this.isShooting = false;
        }

        this.IsCombat = true;

        // melee combat
        if (
          between(distance, this.minAttackDistance, this.maxAttackDistance) &&
          !this.eating &&
          !this.isHungry &&
          !this.placing &&
          !this.blocking &&
          !this.gettingReady &&
          !this.healing
        ) {
          this.closeToTarg = true;
          this.performAttack();
        } else this.closeToTarg = false;
      }
      // range combat
      else if (
        this.distance > this.maxFollowDistance &&
        !this.eating &&
        !this.isHungry &&
        !this.isPathfinding &&
        !this.isPearling &&
        !this.gettingReady &&
        !this.placing
      ) {
        const pearl = this.bot.inventory
          .items()
          .find((i) => i.name === "ender_pearl");
        const bow = this.bot.inventory.items().find((i) => i.name === "bow");
        const arrow = this.bot.inventory
          .items()
          .find((i) => i.name === "arrow");

        if (this.IsCombat) {
          this.bot.clearControlStates();
          this.IsCombat = false;
        }

        const weapon = "bow";

        if (
          pearl &&
          this.bot.health > 14 &&
          !this.isPearling &&
          !this.isPathfinding &&
          !this.gettingReady
        ) {
          if (this.isShooting) {
            this.bot.hawkEye.stop();
            this.isShooting = false;
          }
          this.isPathfinding = true;
          this.isPearling = true;

          this.bot.clearControlStates();

          const shot = this.bot.hawkEye.getMasterGrade(
            targetEntity,
            new Vec3(0, 0.05, 0),
            "ender_pearl"
          );

          try {
            if (shot) {
              await this.bot.look(shot.yaw, shot.pitch);
              await sleep(10);
              await this.bot.equip(pearl, "hand");
              await sleep(300);
              this.bot.activateItem();
            } else {
              this.bot.hawkEye.oneShot(targetEntity, "ender_pearl");
            }

            await this.waitForPearl();
            this.isPearling = false;
            this.isPathfinding = false;
          } catch (err) {
            this.isPearling = false;
            this.isPathfinding = false;
            // this.bot.chat("could not throw pearl");
            this.logError(err);
          }
        } else if (bow && arrow && !this.isShooting) {
          this.bot.clearControlStates();
          this.bot.hawkEye.autoAttack(targetEntity, weapon);
          this.isShooting = true;
        } else if (!arrow || this.distance > this.maxBowDistance) {
          if (this.isShooting) {
            this.bot.hawkEye.stop();
            this.isShooting = false;
          }

          this.isPathfinding = true;

          try {
            await this.bot.pathfinder.goto(
              new GoalFollow(targetEntity, bow && arrow ? 16 : 8)
            );
            this.isPathfinding = false;
          } catch {
            this.isPathfinding = false;
          }
        } else return;
      }

      setTimeout(() => {
        this.isAttacking = false;
      }, this.heldItemCooldown);
    }
  }

  async performAttack() {
    const targetEntity = this.target_G;

    if (this.settingsToggled()) {
      this.bot.attack(targetEntity);
      this.bot.setControlState("jump", false);
      this.stap();
      this.bot.emit("hit");
    }
    // Aggressive
    else if (this.settings.aggressive) {
      if (shouldPlace && targetEntity.onGround && this.checkForPlacables()) {
        this.bot.clearControlStates();
        this.bot.setControlState("back", true);
        await sleep(300);
        this.bot.setControlState("back", false);
        await this.placeObstacle();
        await sleep(100);
        this.bot.setControlState("back", false);
      }

      if (Math.random() * 5 > 4) {
        this.uppercut();
      }

      this.stap("pre");
      this.bot.attack(targetEntity);
      if (this.bot.getControlState("jump")) {
        this.bot.setControlState("jump", false);
      }
      this.stap("pre");

      this.bot.emit("hit");
    }
    // Crit spam 😞
    else if (this.settings.critSpam) {
      this.bot.setControlState("jump", true);
      if (this.bot.entity.velocity.y < -0.3) {
        this.bot.setControlState("sprint", false);
      }

      this.bot.attack(targetEntity);
      this.bot.emit("hit");

      this.tap();
      if (this.bot.getControlState("jump")) {
        this.bot.setControlState("jump", false);
      }
    }
    // Aggressive + FFA
    else if (this.settings.aggressive && this.settings.freeForAll) {
      if (shouldPlace && targetEntity.onGround && this.checkForPlacables()) {
        this.bot.clearControlStates();
        this.bot.setControlState("back", true);
        await sleep(300);
        this.bot.setControlState("back", false);
        await this.placeObstacle();
        await sleep(100);
        this.bot.setControlState("back", false);
      }
      this.uppercut();
      this.bot.attack(targetEntity);
      this.stap();

      this.bot.emit("hit");
    } else if (this.settings.hacker) {
      this.uppercut();
      this.stap("pre");
      this.bot.attack(targetEntity);
      if (this.bot.getControlState("jump")) {
        this.bot.setControlState("jump", false);
      }
      this.stap("pre");

      this.bot.emit("hit");
    }
  }

  async ffaTick() {
    if (!this.ffa) return;

    const targets = getNearestPlayers(this.bot, 16);
    const targetEntities = targets
      .map((player) => player.entity)
      .sort((a, b) => sortEntityListByDistance(this.bot, a, b));
  }

  async ffaAttack() {
    let targets = await this.getFFATargets(
      (e) =>
        e !== this.bot.entity &&
        e.equipment[4] &&
        e.equipment[4].name === "diamond_chestplate"
    );
    console.log(targets);
    this.inBattle = true;

    this.ffaTarget = targets.shift();

    const attack = async () => {
      if (targets.length === 0) return;

      if (!this.ffaTarget) return;

      const currentTarget = this.bot.players[this.ffaTarget]?.entity;
      if (
        currentTarget &&
        !this.eating &&
        !this.isHungry &&
        !this.placing &&
        !this.blocking &&
        !this.gettingReady &&
        !this.healing
      ) {
        this.target_G = currentTarget;
        this.target = this.ffaTarget;
        this.calculateDistance();
        console.log(
          "Current target",
          currentTarget.username,
          "distance:",
          this.distance
        );

        if (this.distance < this.maxFollowDistance) {
          this.IsCombat = true;
          if (
            between(this.distance, 0, this.maxAttackDistance) &&
            this.IsCombat
          ) {
            this.closeToTarg = true;
            let shouldPlace = false;

            if (this.settings.aggressive) {
              shouldPlace = Math.random() < 0.8924;
            }

            // Normal
            if (this.settingsToggled()) {
              this.ashTap();
              this.bot.attack(currentTarget);
              this.bot.setControlState("jump", false);
              this.ashTap();
              this.bot.emit("hit");
            }
            // Aggressive
            else if (this.settings.aggressive) {
              if (
                shouldPlace &&
                currentTarget.onGround &&
                this.checkForPlacables()
              ) {
                this.bot.clearControlStates();
                this.bot.setControlState("back", true);
                await sleep(300);
                this.bot.setControlState("back", false);
                await this.placeObstacle();
                await sleep(100);
                this.bot.setControlState("back", false);
              }

              if (Math.random() * 5 > 4) {
                this.uppercut();
              }

              this.stap("pre");
              this.bot.attack(currentTarget);
              if (this.bot.getControlState("jump")) {
                this.bot.setControlState("jump", false);
              }
              this.stap("pre");

              this.bot.emit("hit");
            }
            // Crit spam 😞
            else if (this.settings.critSpam) {
              this.bot.setControlState("sprint", false);
              this.bot._client.write("position", {
                ...this.bot.entity.position.offset(0, 0.11, 0),
                onGround: false,
              });
              this.bot._client.write("position", {
                ...this.bot.entity.position.offset(0, 0.1100013579, 0),
                onGround: false,
              });
              this.bot._client.write("position", {
                ...this.bot.entity.position.offset(0, 0.0000013579, 0),
                onGround: false,
              });

              this.stap("pre");
              this.bot.attack(currentTarget);
              if (this.bot.getControlState("jump")) {
                this.bot.setControlState("jump", false);
              }
              this.bot.emit("hit");
            }
            // Aggressive + FFA
            else if (this.settings.aggressive && this.settings.freeForAll) {
              if (
                shouldPlace &&
                currentTarget.onGround &&
                this.checkForPlacables()
              ) {
                this.bot.clearControlStates();
                this.bot.setControlState("back", true);
                await sleep(300);
                this.bot.setControlState("back", false);
                await this.placeObstacle();
                await sleep(100);
                this.bot.setControlState("back", false);
              }
              this.uppercut();
              this.bot.attack(currentTarget);
              this.stap();

              this.bot.emit("hit");
            } else if (this.settings.hacker) {
              const randomLocation = currentTarget.position.offset(
                Math.floor(Math.random() * (5 - 1) + 1),
                0,
                Math.floor(Math.random() * (5 - 1) + 1)
              );

              this.bot._client.write("position", {
                x: randomLocation.x,
                y: randomLocation.y,
                z: randomLocation.z,
              });

              this.uppercut();
              this.stap("pre");
              this.bot.attack(currentTarget);
              if (this.bot.getControlState("jump")) {
                this.bot.setControlState("jump", false);
              }
              this.stap("pre");

              this.bot.emit("hit");
            }
          } else {
            this.closeToTarg = false;
          }
        }
      } else if (!currentTarget) {
        this.target_G = null;
        this.target = null;
      }
    };

    const loop = async () => {
      if (!this.ffa) return;

      await attack();
      setTimeout(loop, this.currentCooldown);
    };

    await loop();

    function between(x, min, max) {
      return x >= min && x <= max;
    }
  }

  async archerAttack() {
    const attack = async () => {
      const target = this.archerTarget;

      if (target && canSeeEntity(this.bot, target) && !this.isShooting) {
        const bow = this.getItemByName("bow");
        const crossBow = this.getItemByName("crossbow");
        const arrow = this.getItemByName("arrow");

        const trident = this.getItemByName("trident");

        if (bow && arrow) {
          this.bot.hawkEye.autoAttack(target, bow.name);
          this.isShooting = true;
        } else if (crossBow && arrow) {
          this.bot.hawkEye.autoAttack(target, crossBow.name);
          this.isShooting = true;
        } else if (trident) {
          this.bot.hawkEye.autoAttack(target, trident.name);
          this.isShooting = true;
        }
      }
    };

    const loop = async () => {
      if (!this.archerTarget) return;

      await attack();
      setTimeout(loop, 991);
    };

    loop();
  }

  /**
   *
   * @param {Function} filter
   * @description Get free for all targets based on distance to bot and provided filter
   */
  async getFFATargets(filter) {
    const bot = this.bot;
    const targets = Object.values(bot.entities)
      .filter(bestPlayerFilter)
      .filter(filter)
      .sort((a, b) => sortEntityListByDistance(bot, a, b))
      .map((e) => {
        return e.username;
      });

    if (targets.length > 0) {
      return targets;
    }
    return [];
  }

  async attackMob() {
    if (!this.pveTarg) return;
    const target = this.pveTarg;

    const currentTime = Date.now();
    const timeSinceLastAttack = currentTime - this.lastAttackTime;

    const distance = this.bot.entity.position.distanceTo(target.position);

    if (timeSinceLastAttack >= this.heldItemCooldown) {
      if (distance < 10 && !this.eating && !this.isHungry) {
        if (between(distance, 0, 3)) {
          if (this.isShooting) {
            this.isShooting = false;
            this.bot.hawkEye.stop();
          }

          this.lastAttackTime = currentTime;
          this.isAttacking = true;

          this.bot.attack(target);
        }
      }

      setTimeout(() => {
        this.isAttacking = false;
      }, this.heldItemCooldown);
    }
  }

  async block() {
    const offHandSlot = this.bot.getEquipmentDestSlot("off-hand");
    const slots = this.bot.inventory.slots;
    const shield = this.bot.inventory
      .items()
      .find((item) => item.name === "shield");

    const delay = 0.9;

    if (slots[offHandSlot] && slots[offHandSlot].name === "shield") {
      if (
        this.IsCombat &&
        this.closeToTarg &&
        !this.eating &&
        !this.isHungry &&
        !this.blocking
      ) {
        const chanceToBlock = Math.random() * 2 > 1.425;

        if (chanceToBlock) {
          this.blocking = true;
          this.bot.activateItem(true);
          await new Promise((resolve) => setTimeout(resolve, delay * 1000));
          this.bot.deactivateItem();
          this.blocking = false;
        }
      }
    } else if (shield && this.offHandPriority === 3 && !this.bot.heldItem) {
      if (slots[offHandSlot] && slots[offHandSlot].name === "shield") {
        if (
          this.IsCombat &&
          this.closeToTarg &&
          !this.eating &&
          !this.isHungry &&
          !this.blocking
        ) {
          const chanceToBlock = Math.random() * 2 > 1.425;

          if (chanceToBlock) {
            this.blocking = true;
            this.bot.activateItem(true);
            await new Promise((resolve) => setTimeout(resolve, delay * 1000));
            this.bot.deactivateItem();
            this.blocking = false;
          }
        }
      } else if (shield && this.offHandPriority === 3 && !this.bot.heldItem) {
        await this.bot.equip(shield, "off-hand");
      }
    }
  }

  async waitForPearl() {
    return new Promise((resolve) => {
      this.bot.once("forcedMove", () => {
        resolve();
      });
    });
  }

  async backUp() {
    return new Promise(async (res) => {
      await this.bot.lookAt(this.target_G.position);

      this.bot.setControlState("back", true);
      await sleep(1200);
      this.bot.setControlState("back", false);
      res();
    });
  }

  calculateHeldItemCooldown() {
    const heldItem = this.bot.heldItem;

    if (!heldItem) return 1;

    const seconds = getSpeed(heldItem);
    const cooldown = Math.floor((1 / seconds) * 1000);

    return cooldown;
  }

  async update() {
    this.heldItemCooldown = this.calculateHeldItemCooldown();
    this.calculateDistance();
    this.lookPlayer();
    this.lookMob();
    this.followTarget();
    this.followMob();
    this.attackTick();
    this.attackMob();
    this.equip();
    this.updateMainHand();
    this.runAndEatGap();
  }

  /**
   * W-tapping
   */
  tap(mode = "pre") {
    if (mode === "pre") {
      if (this.closeToTarg) {
        this.wtapping = true;
        this.bot.setControlState("sprint", false);
        this.isSprinting = false;
        this.bot.setControlState("sprint", true);
        this.isSprinting = true;
        this.wtapping = false;
      }
    } else if (mode === "post") {
      this.wtapping = true;
      setTimeout(() => {
        this.bot.setControlState("sprint", false);
        this.isSprinting = false;
        this.bot.setControlState("sprint", true);
        this.isSprinting = true;
        this.wtapping = false;
      }, 500);
    }
  }

  uppercut() {
    if (this.upperCutting) return;

    if (
      this.closeToTarg &&
      this.isSprinting &&
      this.IsCombat &&
      this.bot.entity.onGround
    ) {
      this.bot.setControlState("jump", true);
      this.bot.setControlState("back", true);
      sleep(90);
      this.bot.setControlState("back", false);
      // if (Math.random() < 0.5) {
      //   this.bot.setControlState("left", true);
      // } else {
      //   this.bot.setControlState("right", true);
      // }
      setTimeout(() => {
        this.bot.setControlState("jump", false);
        this.bot.setControlState("back", false);
        // this.bot.setControlState("left", false);
        // this.bot.setControlState("right", false);
      }, 500);
    }
  }

  crit() {
    if (this.closeToTarg && this.IsCombat && this.bot.entity.onGround) {
      this.bot.setControlState("sprint", false);
      this.bot.setControlState("jump", true);
      this.isSprinting = false;
      this.bot.setControlState("jump", false);
      this.bot.setControlState("sprint", false);
      this.isSprinting = false;
    }
  }

  ashTap() {
    if (!this.bot.entity.onGround) return;
    this.ashtapping = true;
    this.bot.setControlState("sprint", false);
    this.bot.setControlState("back", true);
    this.bot.setControlState("sprint", true);
    this.bot.setControlState("back", false);
    this.ashtapping = false;
  }

  /**
   * S-tapping
   */
  stap(mode = "pre") {
    if (mode === "pre") {
      if (this.closeToTarg && this.bot.entity.onGround) {
        this.stapping = true;
        this.bot.setControlState("forward", false);
        this.bot.setControlState("sprint", false);
        this.bot.setControlState("left", true);
        this.bot.setControlState("back", true);
        this.isSprinting = false;
        this.bot.setControlState("forward", true);
        this.bot.setControlState("sprint", true);
        this.bot.setControlState("back", false);
        this.bot.setControlState("left", false);
        this.isSprinting = true;
        this.stapping = false;
      }
    } else if (mode === "post") {
      this.stapping = true;
      setTimeout(() => {
        if (this.closeToTarg && this.bot.entity.onGround) {
          this.stapping = true;
          this.bot.setControlState("forward", false);
          this.bot.setControlState("sprint", false);
          this.bot.setControlState("left", true);
          this.bot.setControlState("back", true);
          this.isSprinting = false;
          this.bot.setControlState("forward", true);
          this.bot.setControlState("sprint", true);
          this.bot.setControlState("left", true);

          this.bot.setControlState("back", false);
          this.isSprinting = true;
          this.stapping = false;
        }
      }, 500);
    }
  }

  checkForPlacables() {
    const flint = this.bot.inventory
      .items()
      .find((i) => i.name.includes("flint_and_steel"));
    const lava = this.bot.inventory
      .items()
      .find((i) => i.name.includes("lava_bucket"));
    const web = this.bot.inventory
      .items()
      .find((i) => i.name.includes("cobweb"));

    if (!flint && !lava && web) return true;
    if (!flint && !web && lava) return true;
    if (!lava && !web && flint) return true;

    return false;
  }

  isLookingAtTarget() {
    if (
      this.bot.entityAtCursor(3.5) &&
      this.target_G &&
      this.bot.entityAtCursor(3.5).id === this.target_G.id
    ) {
      return true;
    }

    return false;
  }

  async redo() {
    if (this.tempTargetE && this.tempTargetN) {
      this.bot.chat("aight bet bro frfrfrfrfr");
      await this.readyUp();
      await this.setTarget(this.tempTargetN);
      await this.attack();
    }
  }

  requestHelp(ws) {
    const data = {
      message: `help`,
      target: this.target_G.username,
    };
    const jsonString = JSON.stringify(data);
    ws.send(jsonString);
  }

  /**
   * Stop the bot from attacking or moving
   */

  stop() {
    this.maxAttackDistance = 3;
    this.target = null;
    this.targets = [];
    this.IsCombat = false;
    this.target_G = null;
    this.archerTarget = null;
    this.pveTarg = null;
    this.knownSexOffenders = [];
    this.closeToTarg = false;
    this.isShooting = false;
    this.isSprinting = false;
    this.isPathfinding = false;
    this.isPearling = false;
    this.placing = false;
    this.pve = false;
    this.inBattle = false;
    this.isInArea = false;
    this.blocking = false;
    this.exploring = false;
    this.hasReached = false;
    this.ashtapping = false;
    this.stapping = false;
    this.wtapping = false;
    this.upperCutting = false;
    this.healing = false;
    this.ffa = false;
    this.isAttacking = false;
    // --------------------
    this.bot.clearControlStates();
    this.bot.hawkEye.stop();
    this.bot.pathfinder.setGoal(null);
    // --------------------
    clearTimeout(this.atkInter);
    clearInterval(this.lookInter);
    clearInterval(this.strafeInter);
    clearInterval(this.styleInter);
    clearInterval(this.calcInter);
    clearInterval(this.switchInter);
    clearInterval(this.pveInter);
    clearInterval(this.miscInter);
    clearInterval(this.followInter);
    this.followInter = null;
    this.atkInter = null;
    this.pveInter = null;
    this.switchInter = null;
    this.calcInter = null;
    this.lookInter = null;
    this.strafeInter = null;
    this.styleInter = null;
    this.miscInter = null;
    // -------------------
    this.timeToReachTarg = 0;
    this.timeElapsed = 0;
    this.startTime = 0;
    this.lastHealTime = 0;
    this.lastAttackTime = 0;
    this.bot.emit("fight-stop");
  }

  async attempHeal() {
    if (this.healing) {
      // Already healing or too soon to heal again
      return false;
    }

    const healingPotions = [16453, 16421];

    // console.log(this.bot.inventory.items());

    const potions = this.bot.inventory
      .items()
      .find((i) => healingPotions.includes(i.metadata));

    if (!potions) {
      this.healing = false;
      return false;
    }

    if (this.bot.health <= 15) {
      this.healing = true;
      try {
        await this.bot.lookAt(this.bot.entity.position.offset(0, -1, 0), true);
        await new Promise((resolve) => setTimeout(resolve, 250));
        await this.bot.equip(potions);

        if (this.bot?.heldItem && this.bot?.heldItem === potions) {
          this.bot.activateItem(false);
        }

        this.healing = false;
        return true;
      } catch (err) {
        this.healing = false;
        this.logError(err);
        return false;
      }
    }

    this.healing = false;
  }

  async readyUp(mode = "none") {
    if (mode === "none") {
      this.gettingReady = true;

      // this.bot.chat("/clear");
      // this.bot.chat("/kit knight");
      await sleep(1000);

      const inv = this.bot.inventory.items();
      const fireResistancePotion = inv.find((item) => {
        return item.nbt?.value?.Potion?.value.includes("fire");
      });
      const swiftnessPotion = inv.find((item) => {
        return item.nbt?.value?.Potion?.value.includes("swiftness");
      });

      if (!fireResistancePotion && !swiftnessPotion) {
        this.gettingReady = false;
        return;
      }

      const throwPot = async (pot) => {
        return new Promise(async (res, rej) => {
          try {
            if (!this.gettingReady) return;
            await this.bot.smoothLook.lookAt(
              this.bot.entity.position.offset(0, -1, 0),
              50,
              true
            );
            await sleep(100);
            await this.bot.equip(pot, "hand");
            this.bot.activateItem();
            res();
          } catch (err) {
            this.logError(err);
          }
        });
      };

      await throwPot(fireResistancePotion);
      await throwPot(swiftnessPotion);

      this.gettingReady = false;
    } else if (mode === "duel") {
      this.gettingReady = true;
      await sleep(6000);

      const inv = this.bot.inventory.items();
      const fireResistancePotion = inv.find((item) => {
        return item.nbt?.value?.Potion?.value.includes("fire");
      });
      const swiftnessPotion = inv.find((item) => {
        return item.nbt?.value?.Potion?.value.includes("swiftness");
      });

      if (!fireResistancePotion && !swiftnessPotion) {
        this.gettingReady = false;
        return;
      }

      const throwPot = async (pot) => {
        return new Promise(async (res, rej) => {
          try {
            if (!this.gettingReady) return;
            await this.bot.smoothLook.lookAt(
              this.bot.entity.position.offset(0, -1, 0),
              50,
              true
            );
            await sleep(100);
            await this.bot.equip(pot, "hand");
            this.bot.activateItem();
            res();
          } catch (err) {
            this.logError(err);
          }
        });
      };

      await throwPot(fireResistancePotion);
      await throwPot(swiftnessPotion);

      this.gettingReady = false;
    }
  }

  async runAndEatGap() {
    try {
      const eatGap = async () => {
        const gap =
          this.bot.inventory
            .items()
            .find(
              (item) =>
                item.name === "golden_apple" ||
                item.name === "enchanted_golden_apple"
            ) ||
          this.bot.inventory.slots[this.bot.getEquipmentDestSlot("off-hand")];

        const effects = Object.values(this.bot.entity.effects);
        const hasRegeneration = effects.find((e) => e.id === 10) !== undefined;

        if (hasRegeneration) return;

        if (!gap) {
          return;
        }

        if (this.eating) {
          return;
        }

        this.eating = true;

        try {
          const isEquipped = this.getOffHand()?.name === gap.name;

          console.log("Is gap already equipped:", isEquipped);

          const hasTotemOf = this.getOffHand()?.name === "totem_of_undying";
          const hasShieldOf = this.getOffHand()?.name === "shield";

          // if (hasTotemOf) await this.bot.unequip("off-hand");
          // if (hasShieldOf) await this.bot.unequip("off-hand");

          if (!isEquipped) await this.bot.equip(gap, "off-hand");

          if (!this.getItemByName("ender_pearl")) {
            await this.bot.lookAt(
              this.bot.entity.position.offset(
                0,
                0,
                Math.floor(Math.random() * -180) - 5
              ),
              true
            );
          } else {
            await this.pearlAway();
          }

          this.bot.activateItem(true);
          await sleep(1600);
          this.bot.deactivateItem();
          this.timeSinceLastChug = 0;

          if (isEquipped) await this.bot.unequip("off-hand");

          this.eating = false;
        } catch (err) {
          this.logError(err);

          this.eating = false;
          await sleep(1000);
        }
      };

      const autoEat = async () => {
        let items = this.bot.inventory.items(); //Get the bots items
        let validFoods = this.bot.registry.foods; // a database thing of Minecraft's foods
        let notEdibleFoods = ["rotten_flesh", "spider_eye", "poisonous_potato"];
        validFoods = validFoods.filter(
          (food) => !notEdibleFoods.includes(food.type)
        );

        if (this.IsCombat) {
          return;
        }

        if (this.healing) {
          return;
        }

        for (let i = 0; i < items.length; i++) {
          // Check if there are food items in the bot's inventory, if so eat
          if (items[i].type in validFoods) {
            try {
              if (this.isHungry) {
                return;
              }

              this.isHungry = true;
              console.log("Eating:", items[i]);

              await this.bot.equip(items[i], "hand");
              this.bot.activateItem(false);
              await sleep(1600);
              this.bot.deactivateItem();
              await sleep(100);

              this.isHungry = false;

              break;
            } catch (err) {
              this.logError(err);

              this.isHungry = false;
              await sleep(10000);
            }
          }
        }
      };

      await Promise.all([
        this.bot.health <= 15 && eatGap(),
        this.bot.food <= 16 && autoEat(),
      ]);
    } catch (err) {
      this.logError(err);
    }
  }

  async pearlAway(offestEntity = this.bot.entity) {
    const { position } = offestEntity;
    let block = null;
    let foundBlock = false;
    let success = false;
    let retries = 0;
    let maxDistance = 10;
    let minDistance = 5;
    let MaxTries = 3;

    const getBlock = () => {
      for (let i = 0; i < 20; i++) {
        const offset = position.offset(
          Math.floor(Math.random() * (maxDistance - minDistance)) + minDistance,
          0,
          Math.floor(Math.random() * (maxDistance - minDistance)) + minDistance
        );
        block = this.bot.blockAt(offset, true);
        console.log("===========================");
        console.log(
          `Checking block at (${Math.floor(offset.x)}, ${Math.floor(
            offset.y
          )}, ${Math.floor(offset.z)})`
        );
        if (block) {
          console.log(
            `Block found at (${Math.floor(offset.x)}, ${Math.floor(
              offset.y
            )}, ${Math.floor(offset.z)})`
          );
          foundBlock = true;
          break;
        }
      }
    };

    while (!success && retries < MaxTries) {
      getBlock();

      if (foundBlock) {
        this.isPearling = true;
        if (this.bot.getControlState("forward")) {
          this.bot.setControlState("forward", false);
        }

        if (this.bot.health <= 8) {
          this.isPearling = false;
          return false;
        }

        const pearl = await this.getItemByName("ender_pearl");
        if (!pearl) {
          this.isPearling = false;
          return false;
        }
        console.log(`Pearl item found: ${pearl?.count}`);
        const shot = this.bot.hawkEye.getMasterGrade(
          { position: block.position },
          new Vec3(0, 0.05, 0),
          "ender_pearl"
        );
        console.log(
          `Shot information: ${shot ? Math.floor(shot.yaw) : "nope"}, ${
            shot ? Math.floor(shot.pitch) : "nada"
          }`
        );
        await this.bot.equip(pearl, "hand");
        try {
          if (shot) {
            await this.bot.look(shot.yaw, shot.pitch, true);
            await this.bot.equip(pearl, "hand");
            this.bot.activateItem(false);

            await this.waitForPearl();
            this.isPearling = false;
            success = true;
            console.log("Pearling succeeded");
            return success;
          }
        } catch {
          console.error("Pearling failed");
        }
        if (!success) {
          console.log(`Retry ${retries + 1}`);
          retries++;
          await sleep(500); // wait 1 second before retrying
        }
      } else {
        console.log("No block found after 20 ts");
        return false;
      }
    }

    this.isPearling = false;
  }

  /**
   * For equiping armor
   */
  async equip() {
    const bot = this.bot;

    const armorPointsMap = {
      lether_helmet: 1,
      lether_chestplate: 3,
      lether_leggings: 2,
      lether_boots: 1,

      golden_helmet: 2,
      golden_chestplate: 5,
      golden_leggings: 3,
      golden_boots: 1,

      chainmail_helmet: 2,
      chainmail_chestplate: 5,
      chainmail_leggings: 4,
      chainmail_boots: 1,

      iron_helmet: 2,
      iron_chestplate: 6,
      iron_leggings: 5,
      iron_boots: 2,

      diamond_helmet: 3,
      diamond_chestplate: 8,
      diamond_leggings: 6,
      diamond_boots: 3,

      netherite_helmet: 3,
      netherite_chestplate: 8,
      netherite_leggings: 6,
      netherite_boots: 3,
    };
    const armorMap = {
      lether_helmet: "head",
      golden_helmet: "head",
      chainmail_helmet: "head",
      iron_helmet: "head",
      diamond_helmet: "head",
      netherite_helmet: "head",

      leather_chestplate: "torso",
      golden_chestplate: "torso",
      chainmail_chestplate: "torso",
      iron_chestplate: "torso",
      diamond_chestplate: "torso",
      netherite_chestplate: "torso",

      leather_leggings: "legs",
      golden_leggings: "legs",
      chainmail_leggings: "legs",
      iron_leggings: "legs",
      diamond_leggings: "legs",
      netherite_leggings: "legs",

      lether_boots: "feet",
      golden_boots: "feet",
      chainmail_boots: "feet",
      iron_boots: "feet",
      diamond_boots: "feet",
      netherite_boots: "feet",
    };

    const getBestArmor = (type) => {
      const equipmentSlot = bot.getEquipmentDestSlot(type);
      const currentArmor = bot.inventory.slots[equipmentSlot];

      let bestArmor = null;

      for (const item of bot.inventory.items()) {
        if (armorMap[item.name.toLowerCase()] !== type) continue;

        const itemPoints = armorPointsMap[item.name.toLowerCase()] || 0;
        const currentPoints =
          armorPointsMap[currentArmor?.name?.toLowerCase()] || 0;

        if (!bestArmor || itemPoints > currentPoints) {
          bestArmor = item;
        }
      }

      if (
        bestArmor &&
        (!currentArmor ||
          armorPointsMap[bestArmor.name.toLowerCase()] >
            armorPointsMap[currentArmor.name.toLowerCase()])
      ) {
        return bestArmor;
      }

      return null;
    };

    const helmet = getBestArmor("head");
    const chest = getBestArmor("torso");
    const leg = getBestArmor("legs");
    const boot = getBestArmor("feet");

    if (helmet) {
      await bot.equip(helmet, "head");
    }

    if (chest) {
      await bot.equip(chest, "torso");
    }

    if (leg) {
      await bot.equip(leg, "legs");
    }

    if (boot) {
      await bot.equip(boot, "feet");
    }
  }

  async follow() {
    const mcData = require("minecraft-data")(this.bot.version);
    const player = this.bot.players[master[0]]?.entity;
    const defaultMove = new Movements(this.bot, mcData);
    defaultMove.allowParkour = true;
    defaultMove.canDig = false;
    if (!player) return;
    this.bot.pathfinder.setMovements(defaultMove);
    this.bot.pathfinder.goto(new GoalFollow(player, 3));
  }

  changeDebounce(weaponName) {
    if (!weaponName) return speeds.other;

    return speeds[weaponName.name] || speeds.other;
  }

  calcTicks(seconds) {
    return (this.currentCooldown = Math.floor((1 / seconds) * 1000) - 1);
  }

  getInv() {
    if (!this.bot) return;
    const items = this.bot.inventory.items();

    const output = items.map(itemToString).join(", ");
    if (output) {
      // this.bot.chat(output);
    } else {
      this.bot.chat("empty");
    }

    function itemToString(item) {
      if (item) {
        return `${item.name} x ${item.count}`;
      } else {
        return "(nothing)";
      }
    }
  }

  async saveBotData() {
    const data = `
    ${this.target}
    ${this.isHungry}
    ${this.IsCombat}
    `;
    fs.writeFileSync("./data/fightData.json", data);
  }

  async updateMainHand() {
    const bot = this.bot;
    if (
      this.healing ||
      (this.isShooting &&
        this.eating &&
        this.isHungry &&
        this.placing &&
        this.isPearling &&
        this.gettingReady &&
        this.isPathfinding)
    ) {
      return;
    }

    if (!this.settings.useAxe && !this.settings.useSword) {
      return;
    }

    if (this.target_G && isPlayerBlocking(this.target_G)) {
      const unsortedItems = bot.inventory
        .items()
        .filter((item) => item.name.includes("axe"));
      const bestSword = getBestWeapon(unsortedItems);

      if (!bestSword) return;

      if (bot.heldItem && bot.heldItem === bestSword) return;

      await bot.equip(bestSword);
      return;
    }

    let unsortedItems;
    if (this.settings.useSword) {
      unsortedItems = bot.inventory
        .items()
        .filter((item) => item.name.includes("sword"));
    } else if (this.settings.useAxe) {
      unsortedItems = bot.inventory
        .items()
        .filter((item) => item.name.includes("axe"));
    }

    const bestSword = getBestWeapon(unsortedItems);

    if (!bestSword) return;

    if (bot.heldItem && bot.heldItem === bestSword) return;

    await bot.equip(bestSword);
  }

  calculateDistance() {
    if (!this.target) return;
    const targetEntity = this.bot.players[this.target]?.entity;

    if (!targetEntity) return;

    this.distance = this.bot.entity.position.distanceTo(targetEntity.position);
  }

  isMoving() {
    const vel = this.bot.entity.velocity;
    return vel.x >= -0.15 && vel.y > 0 && vel.z >= -0.15;
  }

  getOffHand() {
    return this.bot.inventory.slots[this.bot.getEquipmentDestSlot("off-hand")];
  }

  async totemEquip() {
    const totemItem = this.bot.inventory
      .items()
      .find((i) => i.name.includes("totem"));

    if (!totemItem) return;

    if (this.offHandPriority !== 2) return;

    if (hasTotems(this.bot)) return;

    if (this.eating && this.gettingReady) return;

    await this.bot.equip(
      totemItem,
      this.offHandPriority === 2 ? "off-hand" : null
    );
  }

  hasRangedWeapon() {
    let has = false;

    for (const item of this.bot.inventory.items()) {
      if (item.name.includes("bow")) {
        has = true;
        break;
      }
    }

    return has;
  }

  async placeObstacle() {
    if (!this.target_G || !this.target) return;

    const flint = this.bot.inventory
      .items()
      .find((i) => i.name.includes("flint_and_steel"));
    const lava = this.bot.inventory
      .items()
      .find((i) => i.name.includes("lava_bucket"));
    const web = this.bot.inventory
      .items()
      .find((i) => i.name.includes("cobweb"));
    const items = [flint, lava, web].filter((item) => item !== undefined);

    if (items.length === 0) return;

    const near = this.bot.nearestEntity(
      (e) =>
        e.type === "player" &&
        e.position.distanceTo(this.bot.entity.position) <= 3 &&
        e.username === this.target_G.username
    );
    if (!near) return;

    const blockUnderNear = this.bot.blockAt(near.position);

    if (blockUnderNear && blockUnderNear.name === "cobweb") return;

    const randomItem = items[Math.floor(Math.random() * items.length)];

    if (!this.placing) {
      this.placing = true;

      this.bot.clearControlStates();

      await this.bot.equip(randomItem, "hand");
      if (
        (near.velocity.x > -0.1 && near.velocity.x < 0.2) ||
        (near.velocity.z > -0.1 && near.velocity.z < 0.2)
      ) {
        if (randomItem.name.includes("flint_and_steel")) {
          await this.bot.lookAt(near.position.offset(0, -1, 0), true);
          try {
            await this.bot.placeBlock(
              this.bot.blockAt(near.position.offset(0, -1, 0)),
              new Vec3(0, 1, 0)
            );
            this.placing = false;
          } catch (err) {
            this.placing = false;
            this.logError(err);
          }
          await sleep(300);
        } else if (randomItem.name.includes("lava_bucket")) {
          const previousPos = near.position.clone().offset(0, -1, 0);
          const currentPos = near.position.offset(0, -1, 0);

          const diff = currentPos.subtract(previousPos).norm();

          if (diff == 0) {
            const placePos = near.position.offset(0, -1, 0);
            await this.bot.lookAt(placePos, true);
            await sleep(100);
            this.bot.activateItem();
            await this.bot.lookAt(placePos, true);
            await sleep(100);
            this.bot.activateItem();
            await sleep(300);
            this.placing = false;
          }
        } else if (randomItem.name.includes("cobweb")) {
          try {
            await this.bot.placeBlock(
              this.bot.blockAt(near.position.offset(0, -1, 0)),
              new Vec3(0, 1, 0)
            );
            this.placing = false;
          } catch (err) {
            this.placing = false;
            this.logError(err);
          }
          await sleep(300);
        }

        this.placing = false;
      } else {
        if (randomItem.name.includes("flint_and_steel")) {
          await this.bot.lookAt(near.position.offset(0, -1, 0), true);
          try {
            await this.bot.placeBlock(
              this.bot.blockAt(near.position.offset(0, -1, 0)),
              new Vec3(0, 1, 0)
            );
            this.placing = false;
          } catch (err) {
            this.placing = false;
            this.logError(err);
          }
          await sleep(300);
        } else if (randomItem.name.includes("lava_bucket")) {
          await this.bot.lookAt(near.position.offset(0, -1, 0), true);
          await sleep(100);
          this.bot.activateItem();
          await sleep(100);
          this.bot.activateItem();
          await sleep(300);
          this.placing = false;
        } else if (randomItem.name.includes("cobweb")) {
          try {
            await this.bot.placeBlock(
              this.bot.blockAt(near.position.offset(0, -1, 0)),
              new Vec3(0, 1, 0)
            );
            this.placing = false;
          } catch (err) {
            this.placing = false;
            this.logError(err);
          }
          await sleep(300);
        }

        this.placing = false;
      }
    }
  }

  async getBlockBelow() {
    const pos = this.bot.entity.position;
    const block = this.bot.blockAt(pos);

    if (block) {
      return block;
    }
    return null;
  }

  settingsToggled() {
    return (
      !this.settings.aggressive &&
      !this.settings.hacker &&
      !this.settings.critSpam
    );
  }

  //#region kitpvp stuff
  async kitPvP() {
    if (!this.hasGottenKit) {
      getKit(this.bot, "knight");
    }

    await moveToRandomPosition();
  }

  async moveToRandomPosition() {
    const randomPosition = this.bot.entity.position.offset(
      Math.floor(Math.random() * (150 - 100) + 100),
      67,
      Math.floor(Math.random() * (150 - 100) + 100)
    );

    const block = this.bot.blockAt(randomPosition);

    const goal = new GoalNear(
      randomPosition.x,
      randomPosition.y,
      randomPosition.z,
      1
    );

    await this.bot.pathfinder.goto(goal).catch(console.log);
  }

  //#endregion

  /**
   *
   * @param {String} itemName the item to look for in the bots inventory
   * @returns Null or the item if found
   */
  getItemByName(itemName) {
    const item = this.bot.inventory.items().find((i) => i.name === itemName);

    if (item) {
      return item;
    }

    return null;
  }

  async releve() {
    const block = await this.getBlockBelow();

    if (!block || block.name !== "cobweb") return;

    const bucket = await this.getItemByName("water_bucket");

    if (!bucket) return;

    if (this.placing) return;
    this.placing = true;
    let hasPlacedWater = false;

    await this.bot.equip(bucket, "hand");
    await this.bot.lookAt(block.position, true);
    await sleep(150);

    this.bot.activateItem();
    hasPlacedWater = true;
    await sleep(450);
    const waterBlock = this.bot.findBlock({
      matching: (b) => b.name === "water",
      maxDistance: 3,
    });
    const bucketer = await this.getItemByName("bucket");
    await sleep(145);
    if (waterBlock && bucketer && hasPlacedWater) {
      try {
        this.bot.clearControlStates();
        await this.bot.equip(bucketer, "hand");
        await this.bot.lookAt(waterBlock.position, true).then();
        await sleep(170);
        this.bot.activateItem(false);
        this.placing = false;
      } catch (err) {
        this.logError(err);
        this.placing = false;
      }
    } else {
      this.placing = false;
    }
  }

  async clear() {
    if (this.knownSexOffenders >= 1) {
      this.knownSexOffenders = [];
    }
    this.targets = [];
  }

  setPriority() {
    if (this.offHandPriority) {
      return;
    }

    const totemItem = this.bot.inventory
      .items()
      .find((i) => i.name.includes("totem"));

    const shield = this.bot.inventory
      .items()
      .find((i) => i.name.includes("shield"));

    if (totemItem && shield) {
      this.offHandPriority = 3;
    } else if (totemItem) {
      this.offHandPriority = 2;
    } else if (shield) {
      this.offHandPriority = 3;
    } else this.offHandPriority = 0;
  }

  generateRandomReach() {
    const randomValue = (Math.random() * (3 - 2.8) + 2.8).toFixed(2);
    return parseFloat(randomValue);
  }

  setSettings(setting, value) {
    if (setting in this.settings) {
      this.settings[setting] = value;
      this.bot.chat(`Set ${setting} to ${value} `);
    } else this.bot.chat("unknown setting");
  }

  async logError(err) {
    const errorTime = new Date().toLocaleString();
    const errorMessage = `[${errorTime}] Message: ${err.message}\nStack Trace: ${err.stack}`;
    fs.writeFileSync("logs.txt", errorMessage);
  }
}

module.exports = Fight;
