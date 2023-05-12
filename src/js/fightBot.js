const { master } = require("../config.json");
const {
  Movements,
  goals: { GoalNear, GoalFollow, GoalBlock },
} = require("mineflayer-pathfinder");
const fs = require("fs");
const speeds = require("../speeds.json");
const { Vec3 } = require("vec3");
const mineflayer = require("mineflayer");
const { Timer } = require("./utils");
const sleep = async (ms = 2000) => {
  return new Promise((r) => setTimeout(r, ms));
};

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
      aggressive: true,
      hacker: false,
      display: false, // Display chat messages like hits
      persistant: false,
      freeForAll: false,
      critSpam: false,
      duels: true,
    };
    this.strafeStyles = {
      default: false,
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
    this.kit = "FriskNeth";
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
    this.pveTarg = null;
    // Bools
    this.targetAbove3 = false;
    this.exploring = false;
    this.hasReached = false;
    this.isSprinting = false;
    this.closeToTarg = false;
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
    // Ints
    this.followDistance = 20;
    this.attackDistnace = 2.9;
    this.maxBowDistance = 35;
    this.debounce = 0.6; //Default;
    this.timeToReachTarg = 0;
    this.jumpDistance = 4;
    this.currentCooldown = 0;
    this.offHandPriority = 0;
    this.lastHealTime = 0;
    this.distance = 0;

    this.timeElapsed = 0;
    this.currentTime = 0;
    this.startTime = 0;

    this.timer = new Timer();
  }

  /**
   * Look at the specified target
   */
  async lookPlayer() {
    const look = async () => {
      const player = this.bot.players[this.target]?.entity;
      if (
        player &&
        this.IsCombat &&
        !this.placing &&
        !this.eating &&
        !this.isShooting
      ) {
        await this.bot.smoothLook.lookAt(
          player.position.offset(0, 1.6, 0),
          0.5
        );

        // const deltaX = player.position.x - this.bot.entity.position.x;
        // const deltaY = 1.6;
        // const deltaZ = player.position.z - this.bot.entity.position.z;
        // const horizontalDistance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);

        // let yaw = Math.atan2(deltaZ, deltaX) * (180 / Math.PI) - 90;
        // let pitch = -(Math.atan2(deltaY, horizontalDistance) * (180 / Math.PI));

        // pitch = clamp_float(pitch, -90, 90);

        // let prevYaw = this.bot.entity.yaw;
        // let prevPitch = this.bot.entity.pitch;

        // await this.bot.look(
        //   interpolate(prevYaw, yaw, 1),
        //   interpolate(prevPitch, pitch, 1)
        // );
      }
    };

    function interpolate(prev, next, speed) {
      let diff = wrapAngleTo180_float(next - prev);
      return prev + diff / speed;
    }

    function clamp_float(num, min, max) {
      return Math.max(min, Math.min(num, max));
    }

    function wrapAngleTo180_float(angle) {
      return ((angle + 180) % 360) - 180;
    }

    await look();
  }

  async lookMob() {
    const look = async () => {
      const nearestEntity = this.bot.nearestEntity(
        (e) =>
          e.type === "mob" &&
          e.position.distanceTo(this.bot.entity.position) <= 16 &&
          e.mobType !== "Armor Stand"
      );

      if (nearestEntity) {
        await this.bot.lookAt(
          nearestEntity.position.offset(0, nearestEntity.height, 0)
        );
      }
    };

    this.lookInter = setInterval(look);
  }

  /**
   * Sets the target to a specific player
   */
  async setTarget(player) {
    if (player === this.bot.username) return this.bot.chat("go away nerd");
    if (this.bot.players[player]) {
      this.target = player;
      this.target_G = this.bot.players[player]?.entity;
      this.tempTargetE = this.target_G;
      this.tempTargetN = this.target;
    } else return this.bot.chat("no pls");
  }

  /**
   * Sets the bots control-states depending on the situation
   */
  followTarget() {
    const follow = () => {
      if (!this.target_G) return;
      const distance = this.bot.entity.position.distanceTo(
        this.target_G.position
      );

      if (
        (this.bot.entity.velocity.x === 0 ||
          this.bot.entity.velocity.x === -0) &&
        (this.bot.entity.velocity.z === 0 ||
          this.bot.entity.velocity.z === -0) &&
        !this.wtapping &&
        !this.ashtapping &&
        !this.stapping &&
        !this.targetAbove3
      ) {
        // Means we are stuck
        this.bot.setControlState("jump", true);
        setTimeout(() => this.bot.setControlState("jump", false), 200);
      }

      if (
        this.IsCombat &&
        distance > 2 &&
        !this.placing &&
        !this.isPearling &&
        !this.isPathfinding &&
        !this.targetAbove3
      ) {
        this.bot.setControlState("sprint", true);
        this.bot.setControlState("forward", true);
        this.isSprinting = true;
      } else if (!this.wtapping && !this.ashtapping && !this.stapping) {
        // this.bot.setControlState("forward", false);
        this.bot.setControlState("back", true);
        this.bot.setControlState("back", false);
        // this.bot.setControlState("forward", true);
      } else {
      }
    };

    follow();
    this.followInter = setInterval(follow);
  }

  followMob() {
    if (!this.pve) return;

    const nearestEntity = this.bot.nearestEntity(
      (e) =>
        e.type === "mob" &&
        e.position.distanceTo(this.bot.entity.position) <= 16 &&
        e.mobType !== "Armor Stand"
    );
    const targetPosition = this.pveTarg.position.clone();
    const distance = this.bot.entity.position.distanceTo(targetPosition);

    if (nearestEntity && !this.isShooting && !this.isPearling) {
      if (distance > 2.8) {
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

  async attack() {
    const dillyDally = () => {
      if (this.knownSexOffenders.length <= 1) return;

      if (!this.IsCombat) return;

      const randomIdiot =
        this.knownSexOffenders[
          Math.floor(Math.random() * this.knownSexOffenders.length)
        ];
      this.target = randomIdiot;
      this.target_G = this.bot.players[randomIdiot]?.entity;
    };

    const attk = async () => {
      const targetEntity = this.bot.players[this.target]?.entity;
      if (
        targetEntity &&
        !this.eating &&
        !this.isHungry &&
        !this.placing &&
        !this.blocking &&
        !this.gettingReady
      ) {
        if (
          this.distance < this.followDistance &&
          this.targetAbove3 &&
          this.hasRangedWeapon()
        ) {
          if (this.IsCombat) {
            this.IsCombat = false;
          }

          if (this.isShooting) {
            this.isShooting = false;
          }

          const weapon = "bow";

          await this.backUp();

          this.isShooting = true;
          this.bot.clearControlStates();
          this.bot.hawkEye.autoAttack(targetEntity, weapon);
          return;
        }

        // Sword combat
        if (this.distance < this.followDistance) {
          if (this.isShooting) {
            this.bot.hawkEye.stop();
            this.isShooting = false;
          }
          this.IsCombat = true;

          //Inner sword combat
          if (between(this.distance, 0, this.attackDistnace) && this.IsCombat) {
            this.closeToTarg = true;
            let shouldPlace = false;

            if (this.settings.aggressive) {
              shouldPlace = Math.random() < 0.8924;
            }
            // Normal

            if (this.settingsToggled()) {
              this.ashTap();
              this.bot.attack(targetEntity);
              this.bot.setControlState("jump", false);
              this.bot.emit("hit");
            }
            // Aggressive
            else if (this.settings.aggressive && this.isLookingAtTarget()) {
              if (
                shouldPlace &&
                targetEntity.onGround &&
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
              this.bot.attack(targetEntity);
              if (this.bot.getControlState("jump")) {
                this.bot.setControlState("jump", false);
              }

              this.bot.emit("hit");
            }
            // Crit spam 😞
            else if (
              this.settings.critSpam &&
              this.bot.entity.velocity.y < -0.44 &&
              this.isLookingAtTarget()
            ) {
              this.tap();
              this.bot.attack(targetEntity);
              this.bot.emit("hit");
            }
            // Aggressive + FFA
            else if (
              this.settings.aggressive &&
              this.settings.freeForAll &&
              this.isLookingAtTarget()
            ) {
              if (
                shouldPlace &&
                targetEntity.onGround &&
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
              this.bot.attack(targetEntity);
              this.stap();

              this.bot.emit("hit");
            } else if (this.settings.hacker) {
              if (this.timer.hasTimeElapsed(500, true)) {
                const randomLocation = targetEntity.position.offset(
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

              this.uppercut();
              this.stap("pre");
              this.bot.attack(targetEntity);
              if (this.bot.getControlState("jump")) {
                this.bot.setControlState("jump", false);
              }

              this.bot.emit("hit");
            }
          } else {
            this.closeToTarg = false;
          }
        } //range combat
        else if (
          this.distance > this.followDistance &&
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
              null,
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
              this.bot.chat("could not throw pearl");
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
        } else {
          return;
        }
      }
    };

    const movementSwitch = async () => {
      if (this.settings.hacker) return;

      if (!this.target || !this.target_G || this.isPathfinding) return;

      const distance = this.bot.entity.position.distanceTo(
        this.target_G.position
      );

      let timer = 0; // initialize timer to 0
      const maxTime = 2500; // set the maximum time to circle for (in milliseconds)

      const state = {
        jump:
          Math.random() < 0.05 &&
          this.isSprinting &&
          distance <= this.jumpDistance &&
          !this.placing &&
          !this.settings.aggressive &&
          !this.settings.critSpam,
        strafeLeft:
          Math.random() < 0.3 &&
          this.isSprinting &&
          this.closeToTarg &&
          this.settingsToggled(),
        strafeRight:
          Math.random() < 0.3 &&
          this.isSprinting &&
          this.closeToTarg &&
          this.settingsToggled(),
        nothing: Math.random() < 0.5,
      };

      if (this.strafeStyles.default && this.closeToTarg) {
        if (state.jump) {
          this.bot.setControlState("jump", true);
        } else if (state.strafeLeft) {
          this.bot.setControlState("left", true);
          this.bot.setControlState("right", false);
        } else if (state.strafeRight) {
          this.bot.setControlState("right", true);
          this.bot.setControlState("left", false);
        } else if (state.nothing) {
          this.bot.setControlState("left", false);
          this.bot.setControlState("right", false);
        }
      } else if (this.strafeStyles.circle && this.closeToTarg) {
        if (state.jump) {
          this.bot.setControlState("jump", true);
        } else if (timer < maxTime && state.strafeLeft) {
          this.bot.setControlState("left", true);
          this.bot.setControlState("right", false);
        } else if (timer < maxTime && state.strafeRight) {
          this.bot.setControlState("right", true);
          this.bot.setControlState("left", false);
        } else if (state.nothing) {
          this.bot.setControlState("left", false);
          this.bot.setControlState("right", false);
        }

        if (timer >= maxTime) {
          this.bot.setControlState("left", false);
          this.bot.setControlState("right", false);
        }

        timer++; // increment the timer each time we circle
      }
    };

    const combatModeMovement = async () => {};

    let switchInterval;
    const miscCombat = async () => {
      if (this.settings.critSpam && this.IsCombat) {
        this.crit();
      }

      // Check if free-for-all mode is enabled and switch targets every 15 seconds
      if (this.settings.freeForAll && this.IsCombat) {
        if (!switchInterval) {
          switchInterval = setInterval(dillyDally, 15 * 1000);
        }
      } else {
        if (switchInterval) {
          clearInterval(switchInterval);
          switchInterval = null;
        }
      }
    };

    if (!this.target && !this.target_G) return;
    this.currentTime = 0;
    this.startTime = performance.now();
    await this.equip();
    this.calcInter = setInterval(() => {
      this.timeToReachTarg = this.target_G
        ? timeToReach(
            this.bot.entity.position,
            this.target_G?.position,
            this.bot.entity.velocity
          )
        : 0;
      this.timeElapsed = (performance.now() - this.startTime).toFixed(2);
      this.currentTime = this.timeElapsed;
    }, 90);

    const loop = async () => {
      if (!this.target) return;
      await attk();
      setTimeout(loop, this.currentCooldown);
    };
    loop();
    this.followTarget();
    this.movementInter = setInterval(() => {
      movementSwitch();
      combatModeMovement();
    }, 500);
    this.miscInter = setInterval(miscCombat, 100);

    function between(x, min, max) {
      return x >= min && x <= max;
    }

    function timeToReach(position1, position2, speed) {
      // Calculate the distance traveled in each direction
      const dx = position2.x - position1.x;
      const dy = position2.y - position1.y;
      const dz = position2.z - position1.z;

      // Calculate the total distance traveled using the formula for
      // distance in 3 dimensions: sqrt(dx^2 + dy^2 + dz^2)
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Calculate the time it will take to reach the second object
      // by dividing the distance by the magnitude of the speed vector
      const time = (distance / speed.norm()).toFixed(2);

      // Return the time
      return time;
    }
  }

  async attackMobs() {
    const passiveMobs = [
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

    const loop = async () => {
      if (!this.safety) return;

      const nearestEntity = this.bot.nearestEntity(
        (e) =>
          e.type === "mob" &&
          e.position.distanceTo(this.bot.entity.position) <= 32 &&
          !passiveMobs.includes(e.mobType)
      );

      if (!nearestEntity) {
        this.pveInter = setTimeout(loop, this.currentCooldown);
        return;
      }

      this.pve = true;
      this.pveTarg = nearestEntity;
      const distance = this.bot.entity.position
        .distanceTo(nearestEntity.position)
        .toFixed(2);

      const distanceY = nearestEntity.position.y - this.bot.entity.position.y;

      if (distanceY >= 3 && distance < 10) {
        if (this.isShooting) {
          this.isShooting = false;
          this.bot.hawkEye.stop();
        }

        const bow = this.getItemByName("bow");
        const arrows = this.getItemByName("arrow");

        const weapon = "bow";

        if (bow && arrows && !this.isShooting) {
          this.bot.clearControlStates();
          this.isShooting = true;
          this.bot.hawkEye.autoAttack(nearestEntity, weapon);
        }
        return;
      }
      // Melee
      if (distance < 10 && !this.eating && !this.isHungry) {
        if (between(distance, 0, 3)) {
          if (this.isShooting) {
            this.isShooting = false;
            this.bot.hawkEye.stop();
          }

          this.bot.attack(nearestEntity);
        }
      }
      this.pveInter = setTimeout(loop, this.currentCooldown);
    };

    await this.lookMob();
    loop();

    function between(x, min, max) {
      return x >= min && x <= max;
    }
  }

  async block() {
    const offHandSlot = this.bot.getEquipmentDestSlot("offhand");
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
        const chanceToBlock = Math.random() * 2 < 0.09583;
        if (chanceToBlock) {
          this.blocking = true;
          this.bot.activateItem(true);
          await sleep(delay * 1000);
          this.bot.deactivateItem();
          this.blocking = false;
        }
      }
    } else if (shield && this.offHandPriority === 3) {
      await this.bot.equip(shield, "off-hand");
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

  update() {
    if (
      this.target_G != null &&
      Math.round(this.target_G.position.y - this.bot.entity.position.y) >= 3
    ) {
      this.targetAbove3 = true;
    } else {
      this.targetAbove3 = false;
    }

    // Idk if better
    if (this.bot.entity.velocity.z > 0 || this.bot.entity.velocity.z > -0) {
      this.direction = CarinalDirections.south;
      return;
    }
    if (this.bot.entity.velocity.z < 0 || this.bot.entity.velocity.z < -0) {
      this.direction = CarinalDirections.north;
      return;
    }

    if (this.bot.entity.velocity.x > 0 || this.bot.entity.velocity.x > -0) {
      this.direction = CarinalDirections.east;
      return;
    }
    if (this.bot.entity.velocity.x < 0 || this.bot.entity.velocity.x < -0) {
      this.direction = CarinalDirections.west;
      return;
    }
  }

  async testMovement() {
    const bot = this.bot;
    const blockUnder = getBlockInFrontUnder();
    const blockFront = getBlockInFront();
    const blockEyeHeight = getBlockInFrontEye();

    const blockUnderBack = getBlockBehindUnder();
    const blockBack = getBlockBehind();
    const blockEyeHeightBack = getBlockBehindEye();

    const blockUnderRight = getBlockRightUnder();
    const blockRight = getBlockRight();
    const blockRightEye = getBlockRightEye();

    const blockUnderLeft = getBlockLeftUnder();
    const blockLeft = getBlockLeft();
    const blockLeftEye = getBlockLeftEye();

    //bot.setControlState("forward", true);
    if (
      blockUnder &&
      blockUnderBack &&
      blockUnderRight &&
      blockUnderLeft &&
      shouldJumpAcross(
        blockUnder,
        blockUnderBack,
        blockUnderRight,
        blockUnderLeft,
        this.direction
      )
    ) {
      bot.clearControlStates();
      jumpAcross();
    } else if (
      blockFront &&
      blockBack &&
      blockRight &&
      blockLeft &&
      blockEyeHeight &&
      blockEyeHeightBack &&
      blockRightEye &&
      blockLeftEye &&
      shouldJumpUp(
        blockFront,
        blockBack,
        blockRight,
        blockLeft,
        blockEyeHeight,
        blockEyeHeightBack,
        blockRightEye,
        blockLeftEye,
        this.direction
      )
    ) {
      bot.clearControlStates();
      jumpUp();
      return;
    }

    if (
      blockEyeHeight &&
      blockEyeHeight.name.includes("door") &&
      this.faceDirectionZ === ZDirections.ZPos
    ) {
      await openDooria(blockEyeHeight, ZDirections.ZPos);
    } else if (
      blockEyeHeightBack &&
      blockEyeHeightBack.name.includes("door") &&
      this.faceDirectionZ === ZDirections.ZNega
    ) {
      await openDooria(blockEyeHeightBack, ZDirections.ZNega);
    }

    function shouldJumpAcross(
      blockUnder,
      blockUnderBack,
      blockUnderRight,
      blockUnderLeft,
      direction
    ) {
      return (
        (blockUnder.name.includes("air") &&
          direction === CarinalDirections.south) ||
        (blockUnderBack.name.includes("air") &&
          direction === CarinalDirections.north) ||
        (blockUnderRight.name.includes("air") &&
          direction === CarinalDirections.west) ||
        (blockUnderLeft.name.includes("air") &&
          direction === CarinalDirections.east)
      );
    }

    function shouldJumpUp(
      blockFront,
      blockBack,
      blockRight,
      blockLeft,
      blockEyeHeight,
      blockEyeHeightBack,
      blockRightEye,
      blockLeftEye,
      direction
    ) {
      return (
        (!blockFront.name.includes("air") &&
          blockEyeHeight.name.includes("air") &&
          direction === CarinalDirections.south) ||
        (!blockBack.name.includes("air") &&
          blockEyeHeightBack.name.includes("air") &&
          direction === CarinalDirections.north) ||
        (!blockRight.name.includes("air") &&
          blockRightEye.name.includes("air") &&
          direction === CarinalDirections.west) ||
        (!blockLeft.name.includes("air") &&
          blockLeftEye.name.includes("air") &&
          direction === CarinalDirections.east)
      );
    }

    //#region getBlocks
    function getBlockInFront() {
      const blockPos = bot.entity.position.offset(0, 0, 1);
      const block = bot.blockAt(blockPos);
      if (block) {
        return block;
      }
      return null;
    }

    function getBlockInFrontUnder() {
      const blockPos = bot.entity.position.offset(0, -1, 1);
      const block = bot.blockAt(blockPos);
      if (block) {
        return block;
      }
      return null;
    }

    function getBlockInFrontEye() {
      const blockPos = bot.entity.position.offset(0, 1, 1);
      const block = bot.blockAt(blockPos);
      if (block) {
        return block;
      }
      return null;
    }

    function getBlockBehind() {
      const blockPos = bot.entity.position.offset(0, 0, -1);
      const block = bot.blockAt(blockPos);
      if (block) {
        return block;
      }
      return null;
    }

    function getBlockBehindUnder() {
      const blockPos = bot.entity.position.offset(0, -1, -1);
      const block = bot.blockAt(blockPos);
      if (block) {
        return block;
      }
      return null;
    }

    function getBlockBehindEye() {
      const blockPos = bot.entity.position.offset(0, 1, -1);
      const block = bot.blockAt(blockPos);
      if (block) {
        return block;
      }
      return null;
    }

    function getBlockLeft() {
      const blockPos = bot.entity.position.offset(1, 0, 0);
      const block = bot.blockAt(blockPos);
      if (block) {
        return block;
      }
      return null;
    }

    function getBlockLeftUnder() {
      const blockPos = bot.entity.position.offset(1, -1, 0);
      const block = bot.blockAt(blockPos);
      if (block) {
        return block;
      }
      return null;
    }

    function getBlockLeftEye() {
      const blockPos = bot.entity.position.offset(1, 1, 0);
      const block = bot.blockAt(blockPos);
      if (block) {
        return block;
      }
      return null;
    }

    function getBlockRight() {
      const blockPos = bot.entity.position.offset(-1, 0, 0);
      const block = bot.blockAt(blockPos);
      if (block) {
        return block;
      }
      return null;
    }

    function getBlockRightUnder() {
      const blockPos = bot.entity.position.offset(-1, -1, 0);
      const block = bot.blockAt(blockPos);
      if (block) {
        return block;
      }
      return null;
    }

    function getBlockRightEye() {
      const blockPos = bot.entity.position.offset(-1, 1, 0);
      const block = bot.blockAt(blockPos);
      if (block) {
        return block;
      }
      return null;
    }

    //#endregion
    function jumpAcross() {
      bot.setControlState("sprint", true);
      bot.setControlState("forward", true);
      bot.setControlState("jump", true);
      setTimeout(() => {
        bot.setControlState("sprint", false);
        bot.setControlState("forward", false);
        bot.setControlState("jump", false);
      }, 150);
    }

    function jumpUp() {
      bot.setControlState("jump", true);
      bot.setControlState("forward", true);
      setTimeout(() => {
        bot.setControlState("forward", false);
        bot.setControlState("jump", false);
      }, 250);
    }

    async function openDooria(door, dir) {
      if (dir === ZDirections.ZNega) {
        await bot.activateBlock(door, new Vec3(0, 0, -1));
      } else if (dir === ZDirections.ZPos) {
        await bot.activateBlock(door, new Vec3(0, 0, 1));
      }
    }
  }

  async builderMan(mode = "surround") {
    const blocks = this.bot.inventory
      .items()
      .find((i) => i.name.includes("dirt") || i.name.includes("cobblestone"));

    if (mode === "surround") {
      this.building = true;
      if (blocks) {
        await this.bot.equip(blocks, "hand");
      }

      const forward = this.bot.entity.position.offset(0, -1, -1);
      const back = this.bot.entity.position.offset(0, -1, 1);
      const left = this.bot.entity.position.offset(-1, -1, 0);
      const right = this.bot.entity.position.offset(1, -1, 0);

      for (let i = 0; i < 6; i++) {
        try {
          await this.bot.placeBlock(
            this.bot.blockAt(forward),
            new Vec3(0, 1, 0)
          );
          await sleep(2000);
          await this.bot.placeBlock(this.bot.blockAt(back), new Vec3(0, 1, 0));
          await sleep(2000);
          await this.bot.placeBlock(this.bot.blockAt(left), new Vec3(0, 1, 0));
          await sleep(2000);
          await this.bot.placeBlock(this.bot.blockAt(right), new Vec3(0, 1, 0));
        } catch (error) {
          this.building = false;
        }
      }

      this.building = false;
    }
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

    if (this.closeToTarg && this.isSprinting && this.IsCombat) {
      this.bot.setControlState("jump", true);
      if (Math.random() < 0.5) {
        this.bot.setControlState("left", true);
      } else {
        this.bot.setControlState("right", true);
      }
      setTimeout(() => {
        this.bot.setControlState("jump", false);
        this.bot.setControlState("left", false);
        this.bot.setControlState("right", false);
      }, 500);
    }
  }

  crit() {
    if (this.closeToTarg && this.IsCombat) {
      this.bot.setControlState("sprint", false);
      this.bot.setControlState("jump", true);
      this.isSprinting = false;
      this.bot.setControlState("jump", false);
      this.bot.setControlState("sprint", false);
      this.isSprinting = false;
    }
  }

  ashTap() {
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
      if (this.closeToTarg) {
        this.stapping = true;
        this.bot.setControlState("sprint", false);
        this.bot.setControlState("back", true);
        this.isSprinting = false;
        this.bot.setControlState("sprint", true);
        this.bot.setControlState("back", false);
        this.isSprinting = true;
        this.stapping = false;
      }
    } else if (mode === "post") {
      this.stapping = true;
      setTimeout(() => {
        this.bot.setControlState("sprint", false);
        this.bot.setControlState("back", true);
        this.isSprinting = false;
        this.bot.setControlState("sprint", true);
        this.bot.setControlState("back", false);
        this.isSprinting = true;
        this.stapping = false;
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

  /**
   * Stop the bot from attacking or moving
   */

  stop() {
    this.attackDistnace = 3;
    this.target = null;
    this.IsCombat = false;
    this.target_G = null;
    this.knownSexOffenders = [];
    this.closeToTarg = false;
    this.isShooting = false;
    this.isSprinting = false;
    this.isPathfinding = false;
    this.isPearling = false;
    this.placing = false;
    this.pve = false;
    this.blocking = false;
    this.exploring = false;
    this.hasReached = false;
    this.ashtapping = false;
    this.stapping = false;
    this.wtapping = false;
    this.upperCutting = false;
    // --------------------
    this.bot.clearControlStates();
    this.bot.hawkEye.stop();
    this.bot.pathfinder?.stop();
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
    this.bot.emit("fight-stop");
  }

  async attempHeal() {
    if (this.healing || this.lastHealTime + 1000 > Date.now()) {
      // Already healing or too soon to heal again
      return;
    }

    const healingPotions = [
      "healing",
      "strong_healing",
      "regenration",
      "strong_regenration",
    ];

    const potions = this.bot.inventory
      .items()
      .filter((i) => healingPotions.includes(i.nbt?.value?.Potion?.value));

    if (potions.length >= 1) {
      this.healing = true;
      for (const item of potions) {
        if (this.bot.health < 10 && !this.IsCombat) {
          try {
            await this.bot.lookAt(this.bot.entity.position.offset(0, -1, 0));
            await sleep(100);
            await this.bot.equip(item);
            this.bot.activateItem();

            this.lastHealTime = Date.now();
            this.healing = false;
            return true;
          } catch (err) {
            this.healing = false;
            console.error(err);
            this.logError(err);
            break;
          }
        }
      }
      this.healing = false;
    }
  }

  async readyUp(mode = "none") {
    if (mode === "none") {
      this.gettingReady = true;
      //this.bot.chat("/clear");
      this.bot.chat("/kit claim " + this.kit);
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
    const eatGap = async () => {
      const gap = this.bot.inventory
        .items()
        .find(
          (item) =>
            item.name === "golden_apple" ||
            item.name === "enchanted_golden_apple"
        );

      const effects = Object.values(this.bot.entity.effects);
      const hasRegeneration = effects.find((e) => e.id === 10);

      if (hasRegeneration) return;

      if (!gap) return;

      if (!this.IsCombat) return;

      if (this.eating) return;

      try {
        this.eating = true;

        const isEquipped = this.getOffHand()?.type === gap.type;

        const hasTotemOf =
          this.getOffHand()?.type ===
          this.bot.registry.itemsByName["totem_of_undying"]?.id;

        const hasShieldOf =
          this.getOffHand()?.type ===
          this.bot.registry.itemsByName["shield"]?.id;

        if (hasTotemOf) await this.bot.unequip("off-hand");
        else if (hasShieldOf) await this.bot.unequip("off-hand");

        if (!isEquipped) await this.bot.equip(gap, "off-hand");

        await this.bot.lookAt(
          this.bot.entity.position.offset(
            0,
            0,
            Math.floor(Math.random() * -180) - 5
          ),
          true
        );

        if (!this.isMoving()) this.bot.setControlState("forward", true);

        this.bot.activateItem(true);
        await sleep(1600);
        this.bot.deactivateItem();

        if (!isEquipped) await this.bot.unequip("off-hand");

        this.eating = false;
      } catch (err) {
        this.logError(err);
        this.bot.chat("Failed to eat gap!");
        this.eating = false;
        await sleep(1000);
      }
    };

    const autoEat = async () => {
      let items = this.bot.inventory.items(); //Get the bots items
      let validFoods = this.bot.registry.foods; // a database thing of minecraft's foods

      if (this.IsCombat) return;

      for (let i = 0; i < items.length; i++) {
        // Check if there are food items in the bots inventory, if so eat
        if (items[i].type in validFoods) {
          try {
            if (this.isHungry) return;
            this.isHungry = true;
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

    if (this.bot.health <= 10) {
      await eatGap();
    }

    if (this.bot.food <= 16) {
      await autoEat();
    }
  }

  async pearlAway(offestEntity = this.bot.entity) {
    const { position } = offestEntity;
    let block = null;
    let foundBlock = false;
    let success = false;
    let retries = 0;
    let maxDistance = 40;
    let MaxTries = 3;

    const getBlock = () => {
      for (let i = 0; i < 20; i++) {
        const offset = position.offset(
          Math.floor(Math.random() * maxDistance) - 5,
          0,
          Math.floor(Math.random() * maxDistance) - 5
        );
        block =
          this.bot
            .blockAt(offset, true)
            .position.distanceTo(this.target_G.position) > 15
            ? this.bot.blockAt(offset, true)
            : null;
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
        const pearl = await this.getItemByName("ender_pearl");
        if (!pearl) return false;
        console.log(`Pearl item found: ${pearl?.count}`);
        const shot = this.bot.hawkEye.getMasterGrade(
          block,
          null,
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
        console.log("No block found after 20 attempts");
        return false;
      }
    }

    this.isPearling = false;
  }

  /**
   * For equiping sword and armor
   */

  async equip() {
    const checkForPieces = () => {
      const helmetSlot = this.bot.getEquipmentDestSlot("head");
      const chestSlot = this.bot.getEquipmentDestSlot("torso");
      const legSlot = this.bot.getEquipmentDestSlot("legs");
      const feetSlot = this.bot.getEquipmentDestSlot("feet");

      const slots = this.bot.inventory.slots;

      if (
        slots[helmetSlot] &&
        slots[chestSlot] &&
        slots[legSlot] &&
        slots[feetSlot]
      ) {
        return true;
      }
      return false;
    };

    const equipArmor = async () => {
      // find armor pieces
      const helm = this.bot.inventory
        .items()
        .find((i) => i.name.includes("helmet"));
      const chest = this.bot.inventory
        .items()
        .find((i) => i.name.includes("chestplate"));
      const leg = this.bot.inventory
        .items()
        .find((i) => i.name.includes("leggings"));
      const boot = this.bot.inventory
        .items()
        .find((i) => i.name.includes("boots"));

      try {
        if (checkForPieces()) return;
        if (!helm && !chest & !leg && !boot) return;
        await this.bot.equip(helm, "head");
        await this.bot.equip(chest, "torso");
        await this.bot.equip(leg, "legs");
        await this.bot.equip(boot, "feet");
      } catch (err) {
        this.logError(err);
        this.bot.chat("something went wrong when equiping armor");
      }
    };

    equipArmor();
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
    return (this.currentCooldown = Math.floor((1 / seconds) * 1000));
  }

  getInv() {
    if (!this.bot) return;
    const items = this.bot.inventory.items();

    const output = items.map(itemToString).join(", ");
    if (output) {
      this.bot.chat(output);
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
    const weaponTypes = [
      "wooden_sword",
      "stone_sword",
      "iron_sword",
      "golden_sword",
      "diamond_sword",
      "wooden_axe",
      "stone_axe",
      "iron_axe",
      "golden_axe",
      "diamond_axe",
      "trident",
    ];

    const sword = this.bot.inventory
      .items()
      .filter((i) => i.name.includes("sword"))
      .sort((a, b) => (a.name < b.name ? -1 : 1))[0];

    const trident = this.bot.inventory
      .items()
      .find((i) => i.name.includes("trident"));

    const axe = this.bot.inventory
      .items()
      .filter((i) => i.name.includes("axe"))
      .sort((a, b) => (a.name < b.name ? -1 : 1))[0];

    if (
      !this.isShooting &&
      !this.eating &&
      !this.isHungry &&
      !this.placing &&
      !this.isPearling &&
      !this.gettingReady &&
      !this.isPathfinding
    ) {
      // If has both weapons choose sword
      if (trident && sword) {
        await this.bot.equip(sword, "hand");
      } else if (axe && !sword && !trident) {
        await this.bot.equip(axe, "hand");
      } else if (!trident && sword) {
        await this.bot.equip(sword, "hand");
      } else if (trident && !sword) {
        await this.bot.equip(trident, "hand");
      } else if (axe && !sword && !trident) {
        await this.bot.equip(axe, "hand");
      }
    }
  }

  calculateDistance() {
    if (!this.target) return;
    const targetEntity = this.bot.players[this.target]?.entity;

    if (!targetEntity) return;
    this.distance = Math.floor(
      this.bot.entity.position.distanceTo(targetEntity.position)
    );
  }

  hasHealthPotions() {
    const botInv = this.bot.inventory.items();
    for (const item of botInv) {
      if (item.nbt?.value?.Potion?.value.includes("healing")) {
        return true;
      }
    }
    return false;
  }

  getBlocks() {
    const registry = this.bot.registry;
    const bot = this.bot;
    const blocks = this.bot.findBlocks({
      matching: function (block) {
        for (const blocke of registry.blocksArray) {
          if (block.position && block.position.y !== bot.entity.position.y - 1)
            continue;

          if (block.type === blocke.id) return block;
        }
      },
      maxDistance: 3,
      count: 6,
    });

    let blockArray = [];
    for (const pos of blocks) {
      const block = this.bot.blockAt(pos);
      if (block) blockArray.push(block.name);
    }
    console.log(blockArray);
    return blockArray;
  }

  hasShield() {
    const offandSlot = this.bot.getEquipmentDestSlot("off-hand");
    const slots = this.bot.inventory.slots;
    const shield = this.bot.inventory.items().find((i) => i.name === "shield");

    if (slots[offandSlot] && slots[offandSlot].name === "shield") {
      return true;
    }
    return false;
  }

  hasGaps() {
    const inv = this.bot.inventory.items();
    const gapTypes = ["golden_apple", "enchanted_golden_apple"];

    for (let i = 0; i < inv.length; i++) {
      if (gapTypes.includes(inv[i].name)) return true;
    }
    return false;
  }

  hasTotems() {
    const offandSlot = this.bot.getEquipmentDestSlot("off-hand");
    const slots = this.bot.inventory.slots;
    const totem = this.bot.inventory.items().find((i) => i.name === "totem");

    if (slots[offandSlot] && slots[offandSlot].name === "totem_of_undying") {
      return true;
    }
    return false;
  }

  isMoving() {
    const vel = this.bot.entity.velocity;
    return vel.x >= -0.15 && vel.y > 0 && vel.z >= -0.15;
  }

  getOffHand() {
    const offandSlot = this.bot.getEquipmentDestSlot("off-hand");
    const slots = this.bot.inventory.slots;

    if (slots[offandSlot]) {
      return slots[offandSlot];
    }
    return null;
  }

  async totemEquip() {
    const totemItem = this.bot.inventory
      .items()
      .find((i) => i.name.includes("totem"));

    if (!totemItem) return;

    if (this.hasTotems()) return;

    if (this.eating) return;

    if (this.gettingReady) return;

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
      !this.settings.freeForAll &&
      !this.settings.hacker &&
      !this.settings.critSpam
    );
  }

  /**
   *
   * @param {String} itemName the item to look for in the bots inventory
   * @returns Null or the item if found
   */
  async getItemByName(itemName) {
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

  async explore() {
    const farMob = this.bot.nearestEntity(
      (e) => e.type === "mob" && e.position.distanceTo(this.bot.entity.position)
    );

    if (farMob) return true;

    return false;
  }

  async clear() {
    if (this.knownSexOffenders >= 1) {
      this.knownSexOffenders = [];
    }
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

  setSettings(setting) {
    if (setting in this.settings) {
      this.settings[setting] = !this.settings[setting];
      this.bot.chat(`${this.settings[setting]}`);
    } else this.bot.chat("unknown setting");
  }

  async logError(err) {
    const errorTime = new Date().toLocaleString();
    const errorMessage = `[${errorTime}] Message: ${err.message}\nStack Trace: ${err.stack}`;
    fs.writeFileSync("logs.txt", errorMessage);
  }
}

module.exports = Fight;
