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
const ashloader = require("../../mineflayer-baritone/src/loader.js");
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
const botmindapi = require("../../BotMind/src/loader.js");
const { bloodhound } = require("@miner-org/bloodhound");
const autoEat = require("mineflayer-auto-eat");

async function createBot(
  options = {
    host: argv[2],
    port: parseInt(argv[3]),
    username: usernames[2],
    version: "1.18.2",
  }
) {
  return new Promise(async (resolve, reject) => {
    console.log(options);
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

    bot.loadPlugin(botmindapi);
    bot.loadPlugin(autoEat.plugin);
    bot.loadPlugin(pathfinder);
    bot.loadPlugin(minecraftHawkEye.default);
    bot.loadPlugin(loader);
    bot.loadPlugin(movement);
    bot.loadPlugin(ashloader);
    bot.loadPlugin(bloodhound);
    // bloodhoundPlugin(bot);

    bot.on("error", (err) => {
      console.log(`${chalk.bgRed(err.name)}: ${chalk.redBright(err.message)}`);
      bot.end();
      bot.ws.close();
      return reject();
    });

    bot.on("kicked", (r) => {
      console.log(`Kicked due to ${chalk.green(r)}`);
      bot.end(r);
      bot.ws.close();
      return reject();
    });

    bot.on("end", (r) => {
      console.log(`Ended due to ${chalk.blue(r)}`);
      bot.end(r);
      bot.ws.close();
      return reject();
    });

    bot.once("login", async () => {
      function generateUniqueId() {
        return "id-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
      }

      bot.setMaxListeners(100);

      const spawnData = {
        message: `Bot ${bot.username} connected to ${bot._client.socket._host}`,
        type: "fighter",
        botId: generateUniqueId(),
        name: bot.username,
      };

      bot.bmID = spawnData.botId;

      bot.bm.sendInfo(JSON.stringify(spawnData));
      bot.ashfinder.debug = false;

      bot.fightBot = new Fight(bot);
      bot.patrolBot = new PatrolBot(bot);
      bot.guardBot = new GuardBot(bot);
      bot.huntBot = new HuntBot(bot);
      bot.commands = [];
      bot.bmCommands = [];
      bot.followTarget = null;
      // hive mind shit
      bot.hivemind = {};
      bot.hivemind.config = await bot.bm.getConfig();
      bot.hivemind.kings = await bot.bm.getKings();
      bot.hivemind.botId = spawnData.botId;
      bot.bm.ws.id = bot.bmID;
      //

      const { Default } = bot.movement.goals;
      bot.movement.setGoal(Default);

      bot.bloodhound.yawCorrelation = true;
      bot.autoEat.options.priority = "saturation";
      bot.autoEat.options.startAt = 17;
      bot.autoEat.options.offhand = true;

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
