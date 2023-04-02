const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const { argv } = require("node:process");

module.exports = argv;
const { bot, hitCounter } = require("./js/bot.js");
const EventEmitter = require("events");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  express.static(path.join(__dirname, "public"), {
    setHeaders: function (res, path) {
      if (path.endsWith(".js")) {
        res.set("Content-Type", "text/javascript");
      }
    },
  })
);

const port = 3000;
let data = {};

app.get("/", (req, res) => {
  res.render("index", { bot });
});

app.get("/chat", (req, res) => {
  res.render("chat", { data });
});

app.get("/greet", (req, res) => {
  res.sendFile(__dirname + "/public/greet.html");
});

app.get("/botView", (req, res) => {
  const block = bot.blockAt(bot.entity.position.offset(1, 0, 0));
  res.render("botView", { block });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

bot.once("spawn", async () => {
  await bot.waitForChunksToLoad();
  console.log("bot spawned");

  bot.setMaxListeners(100);
  EventEmitter.setMaxListeners(100);
  io.on("connection", (socket) => {
    socket.on("chat message", (message) => {
      bot.chat(message);
    });

    bot.on("chat", (username, message) => {
      socket.emit("game-message", {
        username: username,
        message: message,
      });
    });

    // Send the initial values of the bot's health and food level
    socket.emit("update", {
      health: bot.health,
      food: bot.food,
      position: bot.entity.position,
      velocity: bot.entity.velocity,
      distance: bot.fightBot.distance,
      direction: bot.fightBot.direction,
    });

    // Create an object to hold the settings

    // Emit the settingsObj to the server using socket.emit()
    socket.emit("settings-update", bot.fightBot.settings);

    socket.emit("initial-load");

    const mcData = require("minecraft-data")(bot.version);
    const currentEffects = [];
    for (const effect of Object.values(bot.entity.effects)) {
      currentEffects.push(mcData.effects[effect.id].displayName);
    }
    socket.emit("main-update", {
      eating: bot.fightBot?.eating,
      sprinting: bot.fightBot?.isSprinting,
      close: bot.fightBot?.closeToTarg,
      timeToReach: bot.fightBot?.timeToReachTarg,
      reach: bot.fightBot?.attackDistnace,
      shooting: bot.fightBot?.isShooting,
      combat: bot.fightBot?.IsCombat,
      pve: bot.fightBot?.pve,
      debounce: bot.fightBot?.debounce,
      currentCooldown: bot.fightBot?.currentCooldown,
      pearling: bot.fightBot?.isPearling,
      hungry: bot.fightBot?.isHungry,
      pathing: bot.fightBot?.isPathfinding,
      hasHealthPotions: bot.fightBot?.hasHealthPotions(),
      lookingAt: bot.fightBot?.isLookingAtTarget(),
      placing: bot.fightBot?.placing,
      blocking: bot.fightBot.blocking,
      hits: hitCounter,
      lastFightTime: {
        seconds: Math.floor(bot.fightBot?.currentTime / 1000),
        minutes: (Math.floor(bot.fightBot?.currentTime / 1000) / 60).toFixed(2),
      },
      timeSinceStart: Math.floor(bot.fightBot?.timeElapsed / 1000),
      activeEffects:
        currentEffects.length > 0 ? currentEffects.join(" + ") : "none",
      heldItemDurability: getDurability(),
      offenders: getKnownOffenders(),
      currentTarget: bot.fightBot?.target ? bot.fightBot?.target : "no one",
      offhandPrio: bot.fightBot.offHandPriority,
      moving: bot.fightBot.isMoving(),
      uppercutting: bot.fightBot.upperCutting,
      exploring: bot.fightBot.exploring,
      getting_ready: bot.fightBot.gettingReady,
      healing: bot.fightBot.healing,
    });

    // Update the values of the bot's health and food level in real-time
    setInterval(() => {
      socket.emit("update", {
        health: bot.health,
        food: bot.food,
        position: bot.entity.position,
        velocity: bot.entity.velocity,
        distance: bot.fightBot.distance,
        direction: bot.fightBot.direction,
      });

      socket.emit("settings-update", bot.fightBot.settings);

      socket.emit("main-update", {
        eating: bot.fightBot?.eating,
        sprinting: bot.fightBot?.isSprinting,
        close: bot.fightBot?.closeToTarg,
        timeToReach: bot.fightBot?.timeToReachTarg,
        reach: bot.fightBot?.attackDistnace,
        shooting: bot.fightBot?.isShooting,
        combat: bot.fightBot?.IsCombat,
        pve: bot.fightBot?.pve,
        debounce: bot.fightBot?.debounce,
        currentCooldown: bot.fightBot?.currentCooldown,
        pearling: bot.fightBot?.isPearling,
        hungry: bot.fightBot?.isHungry,
        pathing: bot.fightBot?.isPathfinding,
        hasHealthPotions: bot.fightBot?.hasHealthPotions(),
        lookingAt: bot.fightBot?.isLookingAtTarget(),
        placing: bot.fightBot?.placing,
        blocking: bot.fightBot.blocking,
        hits: hitCounter,
        lastFightTime: {
          seconds: Math.floor(bot.fightBot?.currentTime / 1000),
          minutes: (Math.floor(bot.fightBot?.currentTime / 1000) / 60).toFixed(
            2
          ),
        },
        timeSinceStart: Math.floor(bot.fightBot?.timeElapsed / 1000),
        activeEffects:
          currentEffects.length > 0 ? currentEffects.join(" + ") : "none",
        heldItemDurability: getDurability(),
        offenders: getKnownOffenders(),
        currentTarget: bot.fightBot?.target ? bot.fightBot?.target : "no one",
        offhandPrio: bot.fightBot.offHandPriority,
        moving: bot.fightBot.isMoving(),
        uppercutting: bot.fightBot.upperCutting,
        exploring: bot.fightBot.exploring,
        getting_ready: bot.fightBot.gettingReady,
        healing: bot.fightBot.healing,
      });
    }, 50);

    function getDurability() {
      const mcData = require("minecraft-data")(bot.version);
      if (bot.heldItem !== null) {
        return `${
          mcData.items[bot.heldItem.type]?.maxDurability -
          bot.heldItem.durabilityUsed
        } / ${mcData.items[bot.heldItem.type].maxDurability}`;
      }
      return "no item";
    }

    function getKnownOffenders() {
      let txt = "";
      if (bot.fightBot.knownSexOffenders) {
        if (bot.fightBot.knownSexOffenders.length >= 2) {
          txt = bot.fightBot.knownSexOffenders.join(",");
        } else if (bot.fightBot.knownSexOffenders.length === 1) {
          txt = bot.fightBot.knownSexOffenders[0];
        }
      }
      return txt !== "" ? txt : "none";
    }
  });
});

// /**
//  * @param {RGBot} rgbot
//  */
// function configureBot(rgbot) {
//   // turn on debug logging
//   // logs are displayed within the Regression Games app during a match
//   rgbot.setDebug(true);

//   // announce in chat when Bot spawns
//   rgbot.on("spawn", function () {
//     rgbot.chat("Hello World");
//   });

// }

// exports.configureBot = configureBot;
