const mineflayer = require("mineflayer");
const Fight = require("./js/fightBot.js");
const GuardBot = require("./js/guardBot.js");
const pathfinder = require("mineflayer-pathfinder").pathfinder;
const chalk = require("chalk");
const fs = require("fs");
const bloodhoundPlugin = require("mineflayer-bloodhound")(mineflayer);
const { loader } = require("@nxg-org/mineflayer-smooth-look");
const movement = require("mineflayer-movement").plugin;
const minecraftHawkEye = require("minecrafthawkeye");
const WebSocket = require("ws");
const { useLogs } = require("./config.json");

const sleep = async (ms = 2000) => {
  return new Promise((r) => setTimeout(r, ms));
};

const info = require("./main.js");
const path = require("path");
const {
  bestPlayerFilter,
  getClosestPlayer,
  getDistance,
  remove,
} = require("./js/utils.js");
const { goals } = require("mineflayer-pathfinder");
const PatrolBot = require("./js/patrolBot.js");

const bot = mineflayer.createBot({
  host: info[2] || "localhost",
  username: "Frisk",
  mainHand: "left",
  version: "1.20.1",
  // physicsEnabled: true,
  port: parseInt(info[3]),
});

bot.loadPlugin(pathfinder);
bot.loadPlugin(minecraftHawkEye);
bot.loadPlugin(loader);
bot.loadPlugin(movement);
bloodhoundPlugin(bot);

function loadModules(bot) {
  const MODULES_DIRECTORY = path.join(__dirname, "modules");
  const modules = fs
    .readdirSync(MODULES_DIRECTORY) // find the plugins
    .filter((x) => x.endsWith(".js")) // only use .js files
    .map((pluginName) => require(path.join(MODULES_DIRECTORY, pluginName)));

  bot.loadPlugins(modules);
  console.log("loeaded modules", modules.length);
}

let hitCounter = 0;
let tempCount = 0;
bot.bloodhound.yaw_correlation_enabled = true;

const ws = new WebSocket("ws://localhost:8080");
let kings;
let hiveConfig;
let id;
let workers;

ws.on("open", () => {
  console.log(`Bot Frisk connected to the WebSocket backend`);
});

ws.on("message", (message) => {
  console.log(`Bot Frisk received message from WebSocket backend:`);
  try {
    const data = JSON.parse(message.toString("utf-8"));
    console.log(data);

    if (data.type && data.type === "important") {
      kings = data.data.kings;
    }

    if (data.message) {
      switch (data.message) {
        case "config":
          hiveConfig = data.data;
          break;
        case "id":
          id = data.id;
          break;
        case "workers":
          workers = data.workers;
          break;
      }
    }
  } catch (error) {
    console.log(error);
  }
});

bot.once("spawn", async () => {
  await bot.waitForChunksToLoad();

  bot.setMaxListeners(100);
  // bot.chat("sup sup chicken butt");

  const spawnData = {
    message: `Bot ${bot.username} connected to ${bot._client.socket._host}`,
    health: bot.health,
    food: bot.food,
    type: "fighter",
    botId: id,
    name: bot.username,
  };

  const spawnDataString = JSON.stringify(spawnData);

  ws.send(spawnDataString);

  bot.fightBot = new Fight(bot);
  bot.patrolBot = new PatrolBot(bot);
  bot.guardBot = new GuardBot(bot);
  bot.commands = [];
  bot.followTarget = null;

  const { Default } = bot.movement.goals;
  bot.movement.setGoal(Default);
  loadModules(bot);

  let pathing = false;
  bot.on("physicsTick", async () => {
    // if (
    //   bot.health <= 8 &&
    //   bot.fightBot.settings.requestHelp &&
    //   bot.fightBot.IsCombat
    // ) {
    //   bot.fightBot.requestHelp(ws);
    // }

    if (hiveConfig !== null) {
      const shouldFollow = hiveConfig.followOwner;

      if (shouldFollow) {
        const owner = Object.values(bot.entities).find(
          (e) =>
            kings.includes(e.username) &&
            bot.entity.position.distanceTo(e.position) <= 25
        );

        // Either too far away or not in game
        if (!owner) return;

        const distance = getDistance(bot.entity.position, owner.position);

        if (bot.fightBot.inBattle) {
          bot.pathfinder.stop();
          return;
        }

        if (pathing) return;

        if (distance <= 3) return;

        const goal = new goals.GoalNear(
          owner.position.x,
          owner.position.y,
          owner.position.z,
          3
        );
        pathing = true;
        await bot.pathfinder.goto(goal).catch((r) => {
          console.log(r);
          pathing = false;
        });
        pathing = false;
      }
    }
  });

  bot.on("hit", () => {
    // bot.fightBot.block();

    hitCounter++;
    if (hitCounter === tempCount + 100 && bot.fightBot.settings.display) {
      bot.chat(`lets goo ${hitCounter} hits`);
      tempCount = hitCounter;
    }
  });

  bot.on("fight-stop", () => {
    if (hitCounter !== 0 && bot.fightBot.settings.display) {
      bot.chat("got: " + hitCounter + " hits in");
      hitCounter = 0;
      tempCount = 0;
    }

    hitCounter = 0;
    tempCount = 0;
  });

  bot.on("death", async () => {
    stop();
    bot.fightBot.clear();
    if (useLogs) {
      console.log("i ded lol");
    } else {
      bot.chat("alright");
    }
  });

  bot.on("entityDead", async (e) => {
    if (
      e.id !== bot.entity.id &&
      e.id === bot.fightBot.target_G?.id &&
      !bot.fightBot.ffa
    ) {
      stop();

      if (useLogs) {
        console.log("target died");
      } else {
        bot.chat("gg nerd");
      }

      // const healthPot = bot.inventory
      //   .items()
      //   .find((i) => i.nbt?.value?.Potion?.value.includes("healing"));
      // if (healthPot && bot.health <= 10 && bot.fightBot?.hasHealthPotions()) {
      //   await bot.lookAt(bot.entity.position, true);
      //   await sleep(200);
      //   await bot.equip(healthPot, "hand");
      //   bot.activateItem(false);
      // }

      console.log(bot.fightBot.targets);
      if (bot.fightBot.settings.freeForAll && bot.fightBot.targets.length > 0) {
        if (bot.fightBot.targets.includes(e.username)) {
          remove(bot.fightBot.targets, e.username);
        }

        const next = bot.fightBot.targets[0];
        console.log(next);

        if (next) {
          bot.fightBot.setTarget(next);
          bot.fightBot.attack();
        }
      }
    } else if (
      bot.fightBot.archerTarget &&
      e.id === bot.fightBot.archerTarget.id
    ) {
      stop();

      if (useLogs) {
        console.log("target died");
      } else {
        bot.chat("gg nerd");
      }
    } else if (bot.patrolBot.target && e.id === bot.patrolBot.target.id) {
      stop();

      bot.patrolBot.target = null;
      bot.patrolBot.patrolling = true;
      bot.patrolBot.startPatrol();
    } else if (
      e.id !== bot.entity.id &&
      e.id === bot.fightBot.target_G?.id &&
      bot.fightBot.ffa
    ) {
      stop();

      let targets = await bot.fightBot.getFFATargets(
        (e) =>
          e !== bot.entity &&
          e.equipment[4] &&
          e.equipment[4].name === "diamond_chestplate"
      );

      bot.fightBot.ffaTarget =
        targets[Math.floor(Math.random() * targets.length)];
    }
  });

  bot.on("entityGone", async (e) => {
    if (
      e.id !== bot.entity.id &&
      e.id === bot.fightBot.target_G?.id &&
      !bot.fightBot.ffa
    ) {
      stop();

      if (useLogs) {
        console.log("target left");
      } else {
        bot.chat("sure i guess");
      }

      // const healthPot = bot.inventory
      //   .items()
      //   .find((i) => i.nbt?.value?.Potion?.value.includes("healing"));
      // if (healthPot && bot.health <= 10 && bot.fightBot?.hasHealthPotions()) {
      //   await bot.lookAt(bot.entity.position, true);
      //   await sleep(200);
      //   await bot.equip(healthPot);
      //   bot.activateItem(false);
      // }

      if (bot.fightBot.settings.freeForAll && bot.fightBot.targets.length > 0) {
        if (bot.fightBot.targets.includes(e.username)) {
          remove(bot.fightBot.targets, e.username);
        }

        const next = bot.fightBot.targets[0];
        console.log(next);

        if (next) {
          bot.fightBot.setTarget(next);
          bot.fightBot.attack();
        }
      }
    } else if (
      bot.fightBot.archerTarget &&
      e.id === bot.fightBot.archerTarget.id
    ) {
      stop();

      if (useLogs) {
        console.log("target left");
      } else {
        bot.chat("alright");
      }
    } else if (
      e.id !== bot.entity.id &&
      e.id === bot.fightBot.target_G?.id &&
      bot.fightBot.ffa
    ) {
      stop();

      let targets = await bot.fightBot.getFFATargets(
        (e) =>
          e !== bot.entity &&
          e.equipment[4] &&
          e.equipment[4].name === "diamond_chestplate"
      );

      bot.fightBot.ffaTarget =
        targets[Math.floor(Math.random() * targets.length)];
    }
    if (
      e.id !== bot.entity.id &&
      e.id === bot.fightBot.pveTarg?.id &&
      bot.fightBot.pve
    ) {
      try {
        stop();
      } catch (error) {
        // 💀
      }

      if (bot.guardBot.attackTarget && e.id === bot.guardBot.attackTarget.id) {
        bot.guardBot.attackTarget = null;

        if (!bot.guardBot.isNearGuardTarget())
          await bot.guardBot.gotoGuardTarget();
      }
    }
  });

  bot.on("onCorrelateAttack", async function (attacker, victim, weapon) {
    if (victim === bot.entity && bot.fightBot.settings.freeForAll) {
      if (bot.fightBot?.knownSexOffenders?.indexOf(attacker.username) !== -1)
        return;

      bot.fightBot?.knownSexOffenders?.push(
        attacker.username || attacker.displayName
      );
    }

    if (kings && hiveConfig && hiveConfig.defendOwner) {
      if (bot.fightBot.inBattle) return;

      if (kings.includes(victim.username)) {
        const distance = bot.entity.position.distanceTo(victim.position);

        if (distance >= 25) return;

        bot.chat("Hey leave my king alone mortal");

        bot.fightBot.clear();
        bot.fightBot.readyUp();
        bot.fightBot.setTarget(attacker.username);
        bot.fightBot.attack();
      }
    }
    if (hiveConfig && hiveConfig.defendWorkers) {
      // console.log("gay3");

      ws.send(
        JSON.stringify({
          message: "currentWorkers",
        })
      );

      // console.log(workers)

      await sleep(1000);

      if (workers.length > 0) {
        if (bot.fightBot.inBattle) return;

        if (
          workers.includes(victim.username) &&
          !kings.includes(attacker.username)
        ) {
          const distance = bot.entity.position.distanceTo(victim.position);

          if (distance >= 25) return;

          bot.chat("Hey leave my worker alone mortal");

          bot.fightBot.clear();
          bot.fightBot.readyUp();
          bot.fightBot.setTarget(attacker.username);
          bot.fightBot.attack();
        }
      }
    }

    if (victim === bot.entity) {
      if (bot.fightBot.inBattle) {
        return;
      }

      if (attacker.username === bot.username) {
        return;
      }

      bot.fightBot.clear();
      bot.fightBot.setTarget(attacker.username);
      bot.fightBot.attack();
    }
  });

  function stop() {
    bot.fightBot.stop();
    bot.clearControlStates();
  }
});

bot.on("error", (err) => {
  console.log(`${chalk.bgRed(err.name)}: ${chalk.redBright(err.message)}`);
  process.exit(0);
});

bot.on("kicked", (r) => {
  console.log(`Kicked due to ${chalk.green(r)}`);
  process.exit(0);
});

bot.on("end", (r) => {
  console.log(`Ended due to ${chalk.blue(r)}`);
  process.exit(0);
});

module.exports = { bot, hitCounter };
