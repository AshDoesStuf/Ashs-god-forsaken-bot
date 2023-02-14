const { master } = require("./config.json");
const { Movements, goals } = require("mineflayer-pathfinder");
const fs = require("fs");
const speedsString = fs.readFileSync("./speeds.json").toString();
const speeds = JSON.parse(speedsString);
const { Vec3 } = require("vec3");
const mineflayer = require("mineflayer");
const prismarineEntity = require("prismarine-entity").Entity;
const sleep = async (ms = 2000) => {
  return new Promise((r) => setTimeout(r, ms));
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
    this.target;
    this.IsCombat = false;
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
    };
    this.combatItems = [778, 149, 680];
    this.knownSexOffenders = [];
    this.tempTargetE = null;
    this.tempTargetN = "";

    this.lookInter = null;
    this.atkInter = null;
    this.shootInter = null;
    this.movementInter = null;
    this.calcInter = null;
    this.switchInter = null;
    this.pveInter = null;
    this.kit = "uhc";

    this.eating = false;
    this.target_G = null;
    this.pveTarg = null;
    this.exploring = false;
    this.hasReached = false;
    this.isSprinting = false;
    this.closeToTarg = false;
    this.isShooting = false;
    this.isPearling = false;
    this.isHungry = false;
    this.isPathfinding = false;
    this.placing = false;
    this.gettingReady = false;
    this.pve = false;
    this.safety = false;
    this.blocking = false;
    this.upperCutting = false;

    this.followDistance = 10;
    this.attackDistnace = 3;
    this.maxBowDistance = 30;
    this.debounce = 0.6; //Default;
    this.timeToReachTarg = 0;
    this.jumpDistance = 4;
    this.currentCooldown = 0;
    this.offHandPriority = 0;

    this.timeElapsed = 0;
    this.currentTime = 0;
    this.startTime = 0;
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
        await this.bot.lookAt(player.position.offset(0, 1.6, 0), true);
      }
    };

    this.lookInter = setInterval(look);
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
  async followTarget() {
    if (!this.target_G) return;

    const distance = this.bot.entity.position.distanceTo(
      this.target_G.position
    );
    if (this.target && this.IsCombat && !this.placing && !this.isPearling) {
      if (distance > 2) {
        this.bot.setControlState("forward", true);
        this.bot.setControlState("sprint", true);
        this.isSprinting = true;
      } else {
        this.bot.setControlState("forward", false);
        this.bot.setControlState("sprint", false);
        this.bot.setControlState("back", true);
        setTimeout(() => {
          this.bot.setControlState("back", false);
        }, 90);
        this.isSprinting = false;
        if (!this.upperCutting) {
          this.bot.setControlState("jump", false);
        }
      }
    }
  }

  followMob() {
    if (this.pveTarg !== null) {
      const distance = this.bot.entity.position
        .distanceTo(this.pveTarg.position)
        .toFixed(2);
      if (this.pve && !this.exploring) {
        this.bot.setControlState("forward", true);
        this.bot.setControlState("sprint", true);
        this.isSprinting = true;
        if (distance <= 3) {
          this.bot.setControlState("forward", false);
          this.bot.setControlState("sprint", false);
          this.isSprinting = false;
        }
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

      const randomIdiot =
        this.knownSexOffenders[
          Math.floor(Math.random() * this.knownSexOffenders.length)
        ];
      this.target = randomIdiot;
      this.target_G = this.bot.players[randomIdiot]?.entity;
    };

    const attk = async () => {
      const targetEntity = this.bot.players[this.target]?.entity;
      if (targetEntity) {
        const distance = this.bot.entity.position
          .distanceTo(targetEntity.position)
          .toFixed(2);
        const sword = this.bot.inventory
          .items()
          .find((i) => i.name.includes("sword") || i.name.includes("hoe"));
        // Sword combat
        if (
          distance < this.followDistance &&
          !this.eating &&
          !this.isHungry &&
          !this.placing &&
          !this.blocking &&
          !this.gettingReady
        ) {
          // this.attackDistnace = this.generateRandomReach();
          if (this.isShooting) {
            this.bot.hawkEye.stop();
            this.isShooting = false;
          }
          this.IsCombat = true;

          if (
            sword &&
            !this.bot.heldItem?.name.includes("sword") &&
            !this.isPearling &&
            !this.isPathfinding
          ) {
            await this.bot.equip(sword, "hand");
          }

          //Inner sword combat
          if (between(distance, 0, this.attackDistnace) && this.IsCombat) {
            this.closeToTarg = true;
            let shouldPlace = false;

            if (this.settings.aggressive) {
              shouldPlace = Math.random() < 0.4;
            }
            // Normal mdoe
            if (
              this.isLookingAtTarget() &&
              !this.settings.aggressive &&
              !this.settings.freeForAll &&
              !this.settings.hacker
            ) {
              this.bot.attack(targetEntity);
              this.tap();
              this.bot.setControlState("jump", false);
              this.bot.emit("hit");
            }
            // Agressive + FFA
            if (this.settings.freeForAll && this.settings.aggressive) {
              if (!this.switchInter) {
                this.switchInter = setInterval(dillyDally, 15 * 1000);
              }

              if (
                shouldPlace &&
                targetEntity.onGround &&
                this.checkForPlacables()
              ) {
                this.bot.setControlState("back", true);
                await sleep(300);
                this.bot.setControlState("back", false);
                await this.placeObstacle();
                await sleep(100);
                this.bot.setControlState("back", false);
              }
              this.stap();
              this.bot.attack(targetEntity);
              this.uppercut();
              this.bot.setControlState("jump", false);
              this.bot.emit("hit");
            }
            // Aggressive
            if (this.settings.aggressive) {
              this.uppercut();
              this.stap();
              this.bot.attack(targetEntity);
              this.bot.setControlState("jump", false);
              this.bot.emit("hit");

              if (
                shouldPlace &&
                targetEntity.onGround &&
                this.checkForPlacables()
              ) {
                this.bot.setControlState("back", true);
                await sleep(300);
                this.bot.setControlState("back", false);
                await this.placeObstacle();
                await sleep(100);
                this.bot.setControlState("back", false);
              }
            }
            // HAcker
            if (this.settings.hacker) {
              this.attackDistnace = 4;
              this.tap();
              this.bot.attack(targetEntity);
              this.bot.setControlState("jump", false);
              this.bot.emit("hit");
            }
            // await sleep(this.debounce);
          } else {
            this.closeToTarg = false;
          }
        } //range combat
        else if (
          distance > this.followDistance &&
          !this.eating &&
          !this.isHungry &&
          !this.isPathfinding &&
          !this.gettingReady
        ) {
          const pearl = this.bot.inventory
            .items()
            .find((i) => i.name === "ender_pearl");
          const bow = this.bot.inventory.items().find((i) => i.name === "bow");
          const arrow = this.bot.inventory
            .items()
            .find((i) => i.name === "arrow");

          if (this.IsCombat) {
            this.IsCombat = false;
            this.bot.clearControlStates();
          }

          const weapon = "bow";

          if (
            pearl &&
            this.bot.health > 14 &&
            !this.isPearling &&
            !this.isPathfinding
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
                await this.bot.look(shot.yaw, shot.pitch, true);
                await sleep(10);
                await this.bot.equip(pearl, "hand");
                this.bot.activateItem();
              } else {
                this.bot.hawkEye.oneShot(targetEntity, "ender_pearl");
              }

              await waitForPearl();
              this.isPearling = false;
              this.isPathfinding = false;
              if (sword) {
                this.bot.equip(sword, "hand");
              }
            } catch {
              this.bot.chat("could not throw pearl");
            }
          } else if (bow && arrow && !this.isShooting) {
            this.bot.clearControlStates();
            this.bot.hawkEye.autoAttack(targetEntity, weapon);
            this.isShooting = true;
          } else if (!arrow || distance > this.maxBowDistance) {
            if (this.isShooting) {
              this.bot.hawkEye.stop();
              this.isShooting = false;
            }

            this.isPathfinding = true;

            try {
              await this.bot.pathfinder.goto(
                new goals.GoalFollow(targetEntity, bow && arrow ? 16 : 8)
              );
              this.isPathfinding = false;
            } catch {
              this.isPathfinding = false;
            }
          }
        }
      }
    };

    const movementSwitch = async () => {
      if (!this.target || !this.target_G || this.isPathfinding) return;

      const distance = this.bot.entity.position.distanceTo(
        this.target_G.position
      );

      if (distance <= this.followDistance) {
        const shouldJump = Math.random() < 0.05;
        const shouldStrafeLeft = Math.random() < 0.3;
        const shouldStrafeRight = Math.random() < 0.3;
        const nothing = Math.random() < 0.5;

        if (
          shouldJump &&
          this.isSprinting &&
          distance <= this.jumpDistance &&
          !this.placing &&
          !this.settings.aggressive
        ) {
          this.bot.setControlState("jump", true);
        } else if (shouldStrafeLeft && this.isSprinting) {
          this.bot.setControlState("right", false);
          this.bot.setControlState("left", true);
        } else if (shouldStrafeRight && this.isSprinting) {
          this.bot.setControlState("right", true);
          this.bot.setControlState("left", false);
        } else if (nothing) {
          this.bot.setControlState("left", false);
          this.bot.setControlState("right", false);
        }
      }
    };

    if (!this.target && !this.target_G) return;
    this.currentTime = 0;
    this.startTime = performance.now();
    await this.equip();
    this.lookPlayer();
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

    // if (!this.atkInter) {
    //   this.atkInter = setInterval(attk, this.currentCooldown);
    // }

    const loop = () => {
      if (!this.target) return;
      attk();
      this.atkInter = setTimeout(loop, this.currentCooldown);
    };
    loop();
    this.movementInter = setInterval(movementSwitch, 500);

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

    const waitForPearl = () => {
      return new Promise((resolve) => {
        this.bot.once("forcedMove", () => {
          resolve();
        });
      });
    };
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
          e.position.distanceTo(this.bot.entity.position) <= 16 &&
          !passiveMobs.includes(e.mobType)
      );

      if (!nearestEntity) {
        this.pveInter = setTimeout(loop, this.currentCooldown);
        await this.explore();
        return;
      }

      this.pve = true;
      this.exploring = false;
      this.pveTarg = nearestEntity;
      const distance = this.bot.entity.position
        .distanceTo(nearestEntity.position)
        .toFixed(2);

      if (distance <= 3 && !this.eating && !this.isHungry) {
        this.bot.attack(nearestEntity);
      }

      this.pveInter = setTimeout(loop, this.currentCooldown);
    };

    await this.lookMob();
    loop();
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
        const chanceToBlock = Math.random() * 2 < 0.05134;
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

  /**
   * W-tapping
   */
  tap() {
    const delay = Math.floor(Math.random() * (200 - 160) + 160);
    if (this.closeToTarg) {
      this.bot.setControlState("sprint", false);
      this.isSprinting = false;
      setTimeout(() => {
        this.bot.setControlState("sprint", true);
        this.isSprinting = true;
      }, delay);
    }
  }

  uppercut() {
    if (this.upperCutting) return;
    this.bot.setControlState("jump", true);
    this.upperCutting = true;
    setTimeout(() => {
      this.bot.setControlState("jump", false);
      this.upperCutting = false;
    }, 360);
  }

  /**
   * S-tapping
   */
  stap() {
    const delay = Math.floor(Math.random() * (200 - 180) + 180);
    if (this.closeToTarg) {
      this.bot.setControlState("sprint", false);
      this.bot.setControlState("back", true);
      this.isSprinting = false;
      setTimeout(() => {
        this.bot.setControlState("sprint", true);
        this.bot.setControlState("back", false);
        this.isSprinting = true;
      }, delay);
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
    this.target = null;
    this.IsCombat = false;
    this.target_G = null;
    this.knownSexOffenders = [];
    this.closeToTarg = false;
    this.isShooting = false;
    this.isSprinting = false;
    this.isPathfinding = false;
    this.placing = false;
    this.pve = false;
    this.blocking = false;
    this.exploring = false;
    this.hasReached = false;
    // --------------------
    this.bot.clearControlStates();

    this.bot.pathfinder?.stop();
    // --------------------
    clearTimeout(this.atkInter);
    clearInterval(this.lookInter);
    clearInterval(this.strafeInter);
    clearInterval(this.styleInter);
    clearInterval(this.calcInter);
    clearInterval(this.switchInter);
    clearInterval(this.pveInter);
    this.atkInter = null;
    this.pveInter = null;
    this.switchInter = null;
    this.calcInter = null;
    this.lookInter = null;
    this.strafeInter = null;
    this.styleInter = null;
    // -------------------
    this.timeToReachTarg = 0;
    this.timeElapsed = 0;
    this.startTime = 0;
    this.bot.emit("fight-stop");
  }

  async readyUp() {
    this.gettingReady = true;
    this.bot.chat("/clear");
    this.bot.chat("/kit claim " + this.kit);
    this.bot.chat("/give @s cobweb");
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
      if (!pot) return;
  
      try {
        await this.bot.lookAt(this.bot.entity.position.offset(0, -1, 0), true);
        await sleep(10);
        await this.bot.equip(pot, "hand");
        await sleep(340);
        this.bot.activateItem();
        await sleep(760);
      } catch {
        this.gettingReady = false;
      }
    };
  
    await throwPot(fireResistancePotion);
    await throwPot(swiftnessPotion);
    this.gettingReady = false;
  }
  

  async runAndEatGap() {
    const eatGap = async () => {
      let gap;

      for (const item of this.bot.inventory.items()) {
        if (
          item.name === "golden_apple" ||
          item.name === "enchanted_golden_apple"
        ) {
          gap = item;
          break;
        }
      }

      if (!gap) return;

      if (!this.eating && this.IsCombat) {
        try {
          this.eating = true;
          const isEquipped =
            this.getOffHand() !== null
              ? this.getOffHand().type === gap.type
              : false;

          if (!isEquipped) {
            await this.bot.equip(gap, "off-hand");
          }

          await this.bot.lookAt(
            this.bot.entity.position.offset(
              0,
              0,
              Math.floor(Math.random() * -90) - 5
            ),
            true
          );
          if (!this.isMoving()) {
            this.bot.setControlState("forward", true);
          }
          this.bot.activateItem(true);
          await sleep(1600);
          this.bot.deactivateItem();

          if (!isEquipped) {
            await this.bot.unequip("off-hand");
          }
          this.eating = false;
        } catch (err) {
          this.logError(err);
          this.bot.chat("Failed to eat gap!");
          this.eating = false;
          await sleep(1000);
        }
      }
    };
    const autoEat = async () => {
      let items = this.bot.inventory.items(); //Get the bots items
      let validFoods = this.bot.registry.foods; // a database thing of minecraft's foods

      if (!this.IsCombat)
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

    if (this.bot.health <= 10 && !this.eating) {
      await eatGap();
    }

    if (this.bot.food <= 16) {
      await autoEat();
    }
  }

  async pearlAway() {
    const { position } = this.bot.entity;
    let block = null;
    let foundBlock = false;

    console.log(`Bot position: (${position.x}, ${position.y}, ${position.z})`);

    const waitForPearl = () => {
      return new Promise((resolve) => {
        this.bot.once("forcedMove", () => {
          resolve();
        });
      });
    };

    for (let i = 0; i < 20; i++) {
      const offset = position.offset(
        Math.floor(Math.random() * 30) - 20,
        0,
        Math.floor(Math.random() * 30) - 20
      );
      block = this.bot.blockAt(offset);
      this.bot.chat(
        `Checking block at (${Math.floor(offset.x)}, ${Math.floor(
          offset.y
        )}, ${Math.floor(offset.z)})`
      );
      if (block) {
        this.bot.chat(
          `Block found at (${Math.floor(offset.x)}, ${Math.floor(
            offset.y
          )}, ${Math.floor(offset.z)})`
        );
        foundBlock = true;
        break;
      }
    }

    if (foundBlock) {
      const pearl = await this.getItemByName("ender_pearl");
      this.bot.chat(`Pearl item found: ${pearl.count}`);
      const shot = this.bot.hawkEye.getMasterGrade(block, null, "ender_pearl");
      this.bot.chat(
        `Shot information: ${shot ? Math.floor(shot.yaw) : "nope"}, ${
          shot ? Math.floor(shot.pitch) : "nada"
        }`
      );
      await this.bot.equip(pearl, "hand");
      try {
        if (shot && this.bot.health >= 15) {
          this.isPearling = true;

          await this.bot.equip(pearl, "hand");
          await this.bot.look(shot.yaw, shot.pitch);
          this.bot.activateItem(false);

          await waitForPearl();
          this.isPearling = false;
        }
      } catch {
        this.bot.chat("failed");
        console.error("Pearling failed");
      }
    } else {
      console.log("No block found after 20 attempts");
    }
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
    this.bot.pathfinder.goto(new goals.GoalFollow(player, 3));
  }

  changeDebounce(weaponName) {
    if (!weaponName) return speeds.other;

    return speeds[weaponName.name] || speeds.other;
  }

  calcTicks(seconds) {
    return (this.currentCooldown = Math.floor((1 / seconds) * 1000) - 2);
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
    const sword = this.bot.inventory
      .items()
      .find((i) => i.name.includes("sword"));

    const trident = this.bot.inventory
      .items()
      .find((i) => i.name.includes("trident"));

    // If has both weapons choose sword
    if (trident && sword) {
      if (this.isShooting) {
        return;
      }

      if (this.gettingReady) return;

      if (this.eating || this.isHungry) return;

      await this.bot.equip(sword, "hand");
    } else if (!trident && sword) {
      if (this.isShooting) {
        return;
      }

      if (this.gettingReady) return;

      if (this.eating || this.isHungry) return;

      await this.bot.equip(sword, "hand");
    } else if (trident && !sword) {
      if (this.isShooting) {
        return;
      }

      if (this.gettingReady) return;

      if (this.eating || this.isHungry) return;

      await this.bot.equip(trident, "hand");
    }
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

  hasShield() {
    const offandSlot = this.bot.getEquipmentDestSlot("off-hand");
    const slots = this.bot.inventory.slots;
    const shield = this.bot.inventory.items().find((i) => i.name === "shield");

    if (slots[offandSlot] && slots[offandSlot].name === "shield") {
      return true;
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
    const velocity = this.bot.entity.velocity.toArray();
    return velocity[0] > 0 || velocity[1] > 0 || velocity[2] > 0;
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

    if (!totemItem || this.hasTotems() || this.eating) return;

    await this.bot.equip(
      totemItem,
      this.offHandPriority === 2 ? "off-hand" : null
    );
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
      await this.bot.equip(randomItem, "hand");

      if (randomItem.name.includes("flint_and_steel")) {
        await this.bot.lookAt(near.position.offset(0, -1, 0), true);
        try {
          await this.bot.placeBlock(
            this.bot.blockAt(near.position.offset(0, -1, 0)),
            new Vec3(0, 1, 0)
          );
        } catch (err) {
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
      } else if (randomItem.name.includes("cobweb")) {
        try {
          await this.bot.placeBlock(
            this.bot.blockAt(near.position.offset(0, -1, 0)),
            new Vec3(0, 1, 0)
          );
        } catch (err) {
          this.logError(err);
        }
        await sleep(300);
      }
      this.placing = false;
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

    await this.bot.equip(bucket, "hand");
    await this.bot.lookAt(block.position, true);
    await sleep(150);

    this.bot.activateItem();
    await sleep(450);
    const waterBlock = this.bot.findBlock({
      matching: (b) => b.name === "water",
      maxDistance: 3,
    });
    const bucketer = await this.getItemByName("bucket");
    await sleep(145);
    if (waterBlock && bucketer) {
      try {
        await this.bot.equip(bucketer, "hand");
        await this.bot.lookAt(waterBlock.position, true);
        await sleep(170);
        this.bot.activateItem(false);
        this.placing = false;
      } catch (err) {
        this.logError(err);
        this.placing = false;
      }
    } else {
      this.bot.chat("did not find :(");
      this.placing = false;
    }
  }

  async explore() {
    const { position: botPos } = this.bot.entity;
    const x = Math.floor(Math.random() * 30) - 20;
    const z = Math.floor(Math.random() * 30) - 20;
    const blockPos = botPos.offset(x, 0, z);
    const block = this.bot.blockAt(blockPos);

    const path = async () => {
      return new Promise(async (r) => {
        if (!this.hasReached) await this.bot.lookAt(block.position);
        const dist = this.bot.entity.position.distanceTo(block.position);
        if (dist < 0.3) {
          r();
          this.exploring = false;
          this.hasReached = true;
          await sleep(1600);
        } else {
          this.bot.setControlState("forward", true);
        }
      });
    };
    if (block) {
      this.exploring = true;
      while (this.exploring) {
        this.hasReached = false;
        await path();
        await sleep(50);
      }
      this.bot.clearControlStates();
    }
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

  setSettings(setting, value) {
    if (
      (setting in this.settings && value === "true") ||
      (setting in this.settings && value === "false")
    ) {
      this.settings[setting] = value;
      this.bot.chat(`${this.settings[setting]}`);
    } else this.bot.chat("unknown setting or incorrect value type");
  }

  async logError(err) {
    const errorTime = new Date().toLocaleString();
    const errorMessage = `[${errorTime}] Message: ${err.message}\nStack Trace: ${err.stack}`;
    fs.writeFileSync("logs.txt", errorMessage);
  }
}

module.exports = Fight;
