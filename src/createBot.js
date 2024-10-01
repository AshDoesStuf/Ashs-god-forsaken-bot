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
const ashloader = require("F:\\mineflayer\\mineflayer-baritone\\src\\loader.js");
const { useLogs } = require("./config.json");
const path = require("path");
const {
  bestPlayerFilter,
  getClosestPlayer,
  getDistance,
  remove,
} = require("./js/utils.js");
const { goals } = require("mineflayer-pathfinder");
const PatrolBot = require("./js/patrolBot.js");
const HuntBot = require("./js/huntBot.js");
const botmindapi = require("F:\\mineflayer\\BotMind\\src\\loader.js");
const { bloodhound } = require("@miner-org/bloodhound");

async function createBot(
  options = {
    host: argv[2],
    port: parseInt(argv[3]),
    username: usernames[2],
    version: "1.18.2",
  }
) {
  return new Promise(async (resolve, reject) => {
    console.log(options)
    let bot;

    bot = mineflayer.createBot({
      host: options.host,
      port: parseInt(options.port),
      username: options.username,
      version: options.version,
    });
    if (options.fakeHost !== "") {
      bot = mineflayer.createBot({
        host: options.host,
        port: parseInt(options.port),
        username: options.username,
        version: options.version,
        fakeHost: options.fakeHost,
      });
    }

    bot.loadPlugin(pathfinder);
    bot.loadPlugin(minecraftHawkEye.default);
    bot.loadPlugin(loader);
    bot.loadPlugin(movement);
    bot.loadPlugin(ashloader);
    bot.loadPlugin(botmindapi);
    bot.loadPlugin(bloodhound);
    // bloodhoundPlugin(bot);

    bot.on("error", (err) => {
      console.log(`${chalk.bgRed(err.name)}: ${chalk.redBright(err.message)}`);
      bot.end();
      return reject();
    });

    bot.on("kicked", (r) => {
      console.log(`Kicked due to ${chalk.green(r)}`);
      bot.end(r);
      return reject();
    });

    bot.on("end", (r) => {
      console.log(`Ended due to ${chalk.blue(r)}`);
      bot.end(r);
      return reject();
    });

    bot.once("login", async () => {
      bot.setMaxListeners(100);

      const spawnData = {
        message: `Bot ${bot.username} connected to ${bot._client.socket._host}`,
        type: "fighter",
        botId: Math.floor(1 + Math.random() * 10),
        name: bot.username,
      };

      bot.bm.sendInfo(JSON.stringify(spawnData));

      bot.fightBot = new Fight(bot);
      bot.patrolBot = new PatrolBot(bot);
      bot.guardBot = new GuardBot(bot);
      bot.huntBot = new HuntBot(bot);
      bot.commands = [];
      bot.bmCommands = [];
      bot.followTarget = null;
      // hive mind shit
      bot.hivemind = {};
      bot.hivemind.config = bot.bm.getConfig();
      bot.hivemind.kings = bot.bm.getKings();
      bot.hivemind.botId = spawnData.botId;
      //

      const { Default } = bot.movement.goals;
      bot.movement.setGoal(Default);

      bot.bloodhound.yawCorrelation = true;

      loadModules(bot);

      resolve(bot);
    });
  });
}

function loadModules(bot) {
  const MODULES_DIRECTORY = path.join(__dirname, "modules");
  const modules = fs
    .readdirSync(MODULES_DIRECTORY) // find the plugins
    .filter((x) => x.endsWith(".js")) // only use .js files
    .map((pluginName) => require(path.join(MODULES_DIRECTORY, pluginName)));

  bot.loadPlugins(modules);
  console.log("loeaded modules", modules.length);
}

module.exports = { createBot };
