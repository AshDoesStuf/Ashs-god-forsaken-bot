const mineflayer = require("mineflayer");
const ReadLn = require("node:readline");
const Fight = require("./js/fightBot.js");
const pathfinder = require("mineflayer-pathfinder").pathfinder;
const chalk = require("chalk");
const fs = require("fs");
const bloodhoundPlugin = require("mineflayer-bloodhound")(mineflayer);
const { loader } = require("@nxg-org/mineflayer-smooth-look");
const minecraftHawkEye = require("minecrafthawkeye");
const mineflayerViewer = require('prismarine-viewer').mineflayer
const sleep = async (ms = 2000) => {
  return new Promise((r) => setTimeout(r, ms));
};

const info = require("./main.js");
const path = require("path");

const bot = mineflayer.createBot({
  host: info[2] || "localhost",
  username: "Frisk",
  mainHand: "left",
  version: "1.18.2",
  port: parseInt(info[3]),
});

bot.loadPlugin(pathfinder);
bot.loadPlugin(minecraftHawkEye);
bot.loadPlugin(loader);
bloodhoundPlugin(bot);

function loadModules(bot) {
  const MODULES_DIRECTORY = path.join(__dirname, "modules");
  const modules = fs
    .readdirSync(MODULES_DIRECTORY) // find the plugins
    .filter((x) => x.endsWith(".js")) // only use .js files
    .map((pluginName) => require(path.join(MODULES_DIRECTORY, pluginName)));

  bot.loadPlugins(modules);
}
let hitCounter = 0;
let tempCount = 0;
bot.bloodhound.yaw_correlation_enabled = true;
bot.once("spawn", async () => {
  await bot.waitForChunksToLoad();
  //mineflayerViewer(bot, { port: 5000 })
  bot.chat("sup sup chicken butt");

  bot.fightBot = new Fight(bot);
  bot.fightBot.settings.aggressive = false;
  loadModules(bot);

  bot.on("hit", () => {
    bot.fightBot.block();

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
    bot.chat("alright");
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
    // bot.fightBot.testMovement();
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

module.exports = { bot, hitCounter };
