const { argv } = require("node:process");

const mineflayer = require("mineflayer");
const bloodhoundPlugin = require("mineflayer-bloodhound")(mineflayer);
const chalk = require("chalk");
const { loader } = require("@nxg-org/mineflayer-smooth-look");
const minecraftHawkEye = require("minecrafthawkeye");
const Fight = require("./fightBot.js");
const pathfinder = require("mineflayer-pathfinder").pathfinder;

const bot = mineflayer.createBot({
  host: argv[2],
  port: parseInt(argv[3]),
  username: "Chara",
  version: "1.18.2",
  mainHand: "left",
});

bot.loadPlugin(pathfinder);
bot.loadPlugin(minecraftHawkEye);
bot.loadPlugin(loader);
bloodhoundPlugin(bot);

bot.bloodhound.yaw_correlation_enabled = true;

bot.once("spawn", async () => {
  await bot.waitForChunksToLoad();

  bot.chat("Heyyy =)");

  bot.fightBot = new Fight(bot);

  bot.on("death", async () => {
    stop();
    bot.fightBot.clear();
    bot.chat("alright");
  });

  bot.on("chat", (u, m) => {
    if (u === bot.username) return;

    const args = m.split(" ");

    if (args[0] === "c!fight") {
      const localPlayer = args[1] || username;
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
    bot.fightBot.testMovement();
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
