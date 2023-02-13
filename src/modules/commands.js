const mineflayer = require("mineflayer"); // eslint-disable-line
const { master, prefix } = require("../config.json");
const { Vec3 } = require("vec3");

/**
 * @param {mineflayer.Bot} bot // to enable intellisense
 */

module.exports = (bot) => {
  bot.on("chat", async (username, message) => {
    if (username === bot.username) return;

    let test = false;
    const players = Object.values(bot.players);
    for (const player of players) {
      if (master.includes(username)) {
        test = true;
      }
    }

    if (!test) return;

    const args = message.split(" ");

    if (args[0] === `${prefix}fight`) {
      let localPlayer = args[1] || username;
      if (
        bot.fightBot.knownSexOffenders.length >= 1 &&
        bot.fightBot.settings.freeForAll
      ) {
        localPlayer = bot.fightBot.knownSexOffenders[0];
      }

      if (bot.fightBot.IsCombat)
        return bot.chat("stfu dumass im already fighting someone");
      if (localPlayer === bot.username) return bot.chat("go away you wench");
      bot.fightBot.knownSexOffenders = [];
      await bot.fightBot.readyUp();
      await bot.fightBot.setTarget(localPlayer);
      await bot.fightBot.attack();
    }

    if (message.startsWith(`${prefix}stop`)) {
      bot.fightBot.stop();
    }

    if (message === "home") {
      bot.fightBot.come();
    }

    if (message === "bon") {
      console.log(bot.fightBot.debounce);
    }

    if (message === "pve") {
      bot.fightBot.safety = true;
      await bot.fightBot.attackMobs();
    }

    if (message === "inv") {
      bot.fightBot.getInv();
    }

    if (message === "test") {
     await bot.fightBot.pearlAway()
    }

    if (args[0] === `${prefix}set`) {
      bot.fightBot.setSettings(args[1], args[2]);
    }

    if (message === "clear") {
      bot.fightBot.clear();
    }
  });
};

const sleep = (ms = 2000) => {
  return new Promise((r) => {
    setTimeout(r, ms);
  });
};
