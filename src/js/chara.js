const { argv } = require("node:process");

const mineflayer = require("mineflayer");
const bloodhoundPlugin = require("mineflayer-bloodhound")(mineflayer);
const chalk = require("chalk");
const { loader } = require("@nxg-org/mineflayer-smooth-look");
const minecraftHawkEye = require("minecrafthawkeye");
const Fight = require("./fightBot.js");
const pathfinder = require("mineflayer-pathfinder").pathfinder;
const movement = require("mineflayer-movement");
const WebSocket = require("ws");
const { getDistance } = require("./utils.js");
const { goals } = require("mineflayer-pathfinder");

const bot = mineflayer.createBot({
  host: argv[2],
  port: parseInt(argv[3]),
  username: "Chara",
  version: "1.18.2",
  mainHand: "left",
});

const ws = new WebSocket("ws://localhost:8080");
let kings;
let hiveConfig;
let botId;

ws.on("open", () => {
  console.log(`Bot Chara connected to the WebSocket backend`);
});

ws.on("message", (message) => {
  console.log(`Bot Chara received message from WebSocket backend:`);
  try {
    const data = JSON.parse(message.toString("utf-8"));
    console.log(data.message);

    if (data.type && data.type === "important") {
      kings = data.data.kings;
    }

    if (data.message) {
      switch (data.message) {
        case "config":
          hiveConfig = data.data;
          break;

        case "help":
          if (bot.fightBot.inBattle) return;
          bot.fightBot.clear();
          bot.fightBot.readyUp();
          bot.fightBot.setTarget(data.target.username);
          bot.fightBot.attack();
          break;

        case "id":
          botId = data.id;
          break;
      }
    }
  } catch (error) {
    console.log(error);
  }
});

bot.loadPlugin(pathfinder);
bot.loadPlugin(minecraftHawkEye);
bot.loadPlugin(loader);
bot.loadPlugin(movement.plugin);
bloodhoundPlugin(bot);

bot.bloodhound.yaw_correlation_enabled = true;

bot.once("spawn", async () => {
  await bot.waitForChunksToLoad();

  bot.chat("Heyyy =)");

  const spawnData = {
    message: `Bot ${bot.username} connected to ${bot._client.socket._host}`,
    health: bot.health,
    food: bot.food,
    type: "fighter",
    id: botId,
  };

  const spawnDataString = JSON.stringify(spawnData);

  ws.send(spawnDataString);

  bot.fightBot = new Fight(bot);

  let pathing;
  bot.on("physicsTick", async () => {
    if (
      bot.health <= 8 &&
      bot.fightBot.settings.requestHelp &&
      bot.fightBot.IsCombat
    ) {
      bot.fightBot.requestHelp(ws);
    }

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

  bot.on("death", async () => {
    stop();
    bot.fightBot.clear();
    bot.chat("alright");
  });

  bot.on("chat", (u, m) => {
    if (u === bot.username) return;

    const args = m.split(" ");

    if (args[0] === "c!fight") {
      const localPlayer = args[1] || u;
      if (
        bot.fightBot.knownSexOffenders.length >= 1 &&
        bot.fightBot.settings.freeForAll
      ) {
        localPlayer = bot.fightBot.knownSexOffenders[0];
      }

      if (bot.fightBot.IsCombat) {
        return bot.chat("stfu dumass im already fighting someone");
      }
      if (localPlayer === bot.username) {
        return bot.chat("go away you wench");
      }

      bot.fightBot.clear();
      bot.fightBot.readyUp();
      bot.fightBot.setTarget(localPlayer);
      bot.fightBot.attack();
    }

    if (args[0] === "c!stop") {
      stop();
    }
  });

  bot.on("entityDead", async (e) => {
    if (e.id !== bot.entity.id && e.id === bot.fightBot.target_G?.id) {
      stop();
      bot.fightBot.clear();
      bot.chat("gg nerd");

      const healthPot = bot.inventory
        .items()
        .find((i) => i.nbt?.value?.Potion?.value.includes("healing"));
      if (healthPot && bot.health <= 10 && bot.fightBot?.hasHealthPotions()) {
        await bot.lookAt(bot.entity.position, true);
        await sleep(200);
        await bot.equip(healthPot, "hand");
        bot.activateItem(false);
      }
    }
  });

  bot.on("entityGone", async (e) => {
    if (e.id !== bot.entity.id && e.id === bot.fightBot.target_G?.id) {
      stop();
      bot.fightBot.clear();
      bot.chat("sure i guess");

      const healthPot = bot.inventory
        .items()
        .find((i) => i.nbt?.value?.Potion?.value.includes("healing"));
      if (healthPot && bot.health <= 10 && bot.fightBot?.hasHealthPotions()) {
        await bot.lookAt(bot.entity.position, true);
        await sleep(200);
        await bot.equip(healthPot);
        bot.activateItem(false);
      }
    }
  });

  bot.on("onCorrelateAttack", function (attacker, victim, weapon) {
    if (victim === bot.entity && bot.fightBot.settings.freeForAll) {
      if (bot.fightBot?.knownSexOffenders?.indexOf(attacker.username) !== -1)
        return;

      bot.fightBot?.knownSexOffenders?.push(
        attacker.username || attacker.displayName
      );
    }
  });

  bot.on("physicTick", () => {
    bot.fightBot.updateMainHand();
    bot.fightBot.totemEquip();
    bot.fightBot.update();
  });

  function stop() {
    bot.fightBot.stop();
    bot.clearControlStates();
  }

  setInterval(async () => {
    bot.fightBot.lookPlayer();
    bot.fightBot.followMob();
    bot.fightBot.setPriority();
    bot.fightBot.calculateDistance();
    bot.fightBot.releve();
    if (bot.heldItem) {
      bot.fightBot.debounce = bot.fightBot.changeDebounce(bot?.heldItem);
    } else if (!bot?.heldItem) {
      bot.fightBot.debounce = bot.fightBot.changeDebounce();
    }

    bot.fightBot.attempHeal();

    if (!bot.usingHeldItem) {
      bot.fightBot.runAndEatGap();
    }

    bot.fightBot.calcTicks(bot.fightBot?.debounce);
  });
});

bot.on("error", (err) => {
  console.log(`${chalk.bgRed(err.name)}: ${chalk.redBright(err.message)}`);
  process.exit(0);
});
bot.on("kicked", (r) => {
  console.log(`Kicked due to ${chalk.white(r)}`);
  process.exit(0);
});
bot.on("end", (r) => {
  console.log(`Ended due to ${chalk.blue(r)}`);
  process.exit(0);
});
