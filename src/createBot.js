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
const { SendingData } = require("C:\\Users\\ashpl\\AshUtils\\index.js");
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

let kings;
let hiveConfig;
let id;
let workers;
let fileData;

async function createBot(
  options = {
    username: "Frisk",
    host: "localhost",
    port: 25565,
  }
) {
  return new Promise(async (resolve, reject) => {
    const bot = mineflayer.createBot(options);

    bot.loadPlugin(pathfinder);
    bot.loadPlugin(minecraftHawkEye);
    bot.loadPlugin(loader);
    bot.loadPlugin(movement);
    bloodhoundPlugin(bot);

    const ws = new WebSocket("ws://localhost:8080");

    ws.on("open", () => {
      console.log(`Bot ${options.username} connected to the WebSocket backend`);
      bot.ws = ws;
    });

    ws.on("message", (message) => {
      console.log(`Bot ${options.username} received message from WebSocket backend:`);
      try {
        const data = JSON.parse(message.toString("utf-8"));
        console.log(data);

        if (data.type && data.type === "important") {
          kings = data.data.kings;
        }

        if (data.type === "normal") {
          if (data.data.config) hiveConfig = data.data.config;

          if (data.data.id) id = data.data.id;

          if (data.data.fileData) fileData = data.data.fileData;
        } else if (data.type === "workers") {
          workers = data.data.workers;
        }
      } catch (error) {
        console.log(error);
      }
    });

    bot.on("error", (err) => {
      console.log(`${chalk.bgRed(err.name)}: ${chalk.redBright(err.message)}`);
      bot.end();
      return reject();
    });

    bot.on("kicked", (r) => {
      console.log(`Kicked due to ${chalk.green(r)}`);
      bot.end();
      return reject();
    });

    bot.on("end", (r) => {
      console.log(`Ended due to ${chalk.blue(r)}`);
      bot.end();
      return reject();
    });

    bot.once("spawn", async () => {
      await bot.waitForChunksToLoad();

      bot.setMaxListeners(100);
      // bot.chat("sup sup chicken butt");
      const spawnData = new SendingData("normal", {
        health: bot.health,
        food: bot.food,
        type: "fighter",
        botId: id,
        name: bot.username,
      }).toJson();
      // const spawnData = {
      //   message: `Bot ${bot.username} connected to ${bot._client.socket._host}`,
      //   health: bot.health,
      //   food: bot.food,
      //   type: "fighter",
      //   botId: id,
      //   name: bot.username,
      // };

      ws.send(spawnData);

      bot.fightBot = new Fight(bot);
      bot.patrolBot = new PatrolBot(bot);
      bot.guardBot = new GuardBot(bot);
      bot.commands = [];
      bot.followTarget = null;
      // hive mind shit
      bot.hivemind = {};
      bot.hivemind.config = hiveConfig;
      bot.hivemind.workers = workers;
      bot.hivemind.botId = id;
      bot.hivemind.kings = kings;
      bot.hivemind.fileData = fileData;
      //

      const { Default } = bot.movement.goals;
      bot.movement.setGoal(Default);
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
