const mineflayer = require("mineflayer");
const ReadLn = require("node:readline");
const { Movements, goals } = require("mineflayer-pathfinder");
const { argv, stdin, stdout } = require("node:process");
const { password, master, prefix } = require("./config.json");
const Fight = require("./fightBot.js");
const pathfinder = require("mineflayer-pathfinder").pathfinder;
const movement = require("mineflayer-movement");
const mother = require("./clutch.js").mother;
const logUpdate = require("log-update");
const chalk = require("chalk");
const { Vec3 } = require("vec3");
const fs = require("fs");
const stripindent = require("strip-indent");
const bloodhoundPlugin = require("mineflayer-bloodhound")(mineflayer);
const minecraftHawkEye = require("minecrafthawkeye");
const sleep = async (ms = 2000) => {
  return new Promise((r) => setTimeout(r, ms));
};

const info = require("./index.js");
const path = require("path");

const bot = mineflayer.createBot({
  host: info[2] || "localhost",
  username: "Frisk",
  mainHand: "left",
  version: "1.18.2",
  port: parseInt(info[3]),
  viewDistance: "tiny",
});

bot.loadPlugin(pathfinder);
bot.loadPlugin(minecraftHawkEye);
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
  bot.chat("sup sup chicken butt");

  /**
   * @type {Fight}
   * For intellisence
   */
  bot.fightBot = new Fight(bot);
  loadModules(bot);

  bot.on("hit", () => {
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
    if (bot.fightBot.settings.persistant) {
      stop();
      bot.fightBot.clear();
      await bot.fightBot.redo();
    } else {
      stop();
      bot.fightBot.clear();
      bot.chat("alright");
    }
  });

  bot.on("entityDead", async (e) => {
    if (e.id !== bot.entity.id && e.id === bot.fightBot.target_G?.id) {
      if (bot.fightBot.settings.persistant) {
        stop();
        bot.fightBot.clear();
        await bot.fightBot.redo();
      } else {
        stop();
        bot.fightBot.clear();
        bot.chat("gg nerd");
      }

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

  function stop() {
    bot.fightBot.stop();
    bot.clearControlStates();
  }

  setInterval(async () => {
    bot.fightBot.followTarget();
    bot.fightBot.followMob();
    bot.fightBot.block();
    bot.fightBot.setPriority();
    await bot.fightBot.releve();
    if (bot.heldItem) {
      bot.fightBot.debounce = bot.fightBot.changeDebounce(bot?.heldItem);
    } else if (!bot?.heldItem) {
      bot.fightBot.debounce = bot.fightBot.changeDebounce();
    }

    if (!bot.usingHeldItem) {
      await bot.fightBot.runAndEatGap();
    }

    bot.fightBot.calcTicks(bot.fightBot?.debounce);
    await bot.fightBot.updateMainHand();
    await bot.fightBot.totemEquip();
  }, 10);
});

bot.on("error", (err) => {
  console.log(`${chalk.bgRed(err.name)}: ${chalk.redBright(err.message)}`);
  process.exit(0);
});
bot.on("kicked", (r) => {
  console.log(`Kicked due to ${chalk.blue(r)}`);
  process.exit(0);
});
bot.on("end", (r) => {
  console.log(`Kicked due to ${chalk.blue(r)}`);
  process.exit(0);
});

module.exports = { bot, hitCounter };
