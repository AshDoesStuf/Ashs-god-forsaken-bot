// commands/fight.js

const {
  bestPlayerFilter,
  sortEntityListByDistance,
} = require("../../js/utils");

const { useLogs } = require("../../config.json");

/**
 * @type {import("../../index").Command}
 */
module.exports = {
  name: "fight",
  async execute(bot, username, args) {
    const subCommand = args.shift();

    if (subCommand.includes("-")) {
      const subCommandArgs = args;

      // For free for all
      if (subCommand === "-s") {
        const targets = Object.values(bot.entities)
          .filter(bestPlayerFilter)
          .filter((e) => {
            // In our use case we wanna use for um waht anfasnf ultra lobby thing idk

            // In our case we only just search for one armor piece
            return (
              e !== bot.entity &&
              e.equipment[4] &&
              e.equipment[4].name === "diamond_chestplate"
            );
          })
          .sort((a, b) => sortEntityListByDistance(bot, a, b))
          .map((e) => {
            return e.username;
          });
        bot.fightBot.clear();
        bot.fightBot.setTargets(targets);
        console.log("Got: " + targets.length);
      }

      // For specific user
      else if (subCommand === "-p") {
        const user = subCommandArgs[0] || username;

        if (bot.fightBot.inBattle) {
          return;
        }

        if (user === bot.username) {
          return;
        }

        bot.fightBot.clear();
        bot.fightBot.setTarget(user);
        bot.fightBot.attack();
      } else if (subCommand === "-ffa") {
        if (bot.fightBot.inBattle) {
          return;
        }
        console.log("gay")
        bot.fightBot.ffa = true;
        await bot.fightBot.ffaAttack();
      } else if (subCommand === "-a") {
        if (bot.fightBot.inBattle) {
          return;
        }
        const user = subCommandArgs[0] || username;

        if (user === bot.username) {
          return;
        }

        const target = bot.players[user].entity;

        if (target) {
          bot.fightBot.archerTarget = target;
          await bot.fightBot.archerAttack();
        } else {
          if (useLogs) {
            console.log("target is far");
          } else bot.chat("target is far away");
        }
      }
    }
  },
};
