const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const { argv } = require("node:process");

module.exports = argv;
const { bot, hitCounter } = require("./bot.js");

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

app.get("/", (req, res) => {
  res.render("index", { bot });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

bot.on("spawn", async() => {
  await bot.waitForChunksToLoad();
  io.on("connection", (socket) => {
    // Send the initial values of the bot's health and food level
    socket.emit("update", {
      health: bot.health,
      food: bot.food,
      position: bot.entity.position,
    });

    socket.emit("settings-update", {
      agg: bot.fightBot.settings.aggressive,
      per: bot.fightBot.settings.persistant,
      hack: bot.fightBot.settings.hacker,
      display: bot.fightBot.settings.display,
      ffa: bot.fightBot.settings.freeForAll,
    });

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
    });

    // Update the values of the bot's health and food level in real-time
    setInterval(() => {
      socket.emit("update", {
        health: bot.health,
        food: bot.food,
        position: bot.entity.position,
      });

      socket.emit("settings-update", {
        agg: bot.fightBot.settings.aggressive,
        per: bot.fightBot.settings.persistant,
        hack: bot.fightBot.settings.hacker,
        display: bot.fightBot.settings.display,
        ffa: bot.fightBot.settings.freeForAll,
      });

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
