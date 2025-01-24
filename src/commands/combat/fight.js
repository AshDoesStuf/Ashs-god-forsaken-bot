// commands/fight.js

const Vec3 = require("vec3").Vec3;

const {
  bestPlayerFilter,
  sortEntityListByDistance,
  getClosestPlayer,
} = require("../../js/utils");

const { useLogs } = require("../../config.json");
const { goals } = require("mineflayer-pathfinder");
const { TargetManager } = require("../../js/Managers");

/**
 * @type {import("../../index").Command}
 */
module.exports = {
  name: "fight",
  async execute(bot, username, args) {
    const subCommand = args.shift();

    if (!subCommand) {
      if (useLogs) {
        console.log("-s, -p [username], -ffa, -a, -patrol, -kitPvp");
      } else bot.chat("-s, -p [username], -ffa, -a, -patrol, -kitPvp");
      return;
    }

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

        if (bot.players[user] && bot.players[user].entity) {
          const target = bot.players[user].entity;

          try {
            await bot.ashpvp.attack(target);
          } catch (error) {
            console.log(error);
          }
        }
      } else if (subCommand === "-ffa") {
        bot.ashpvp.ffa();
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
      } else if (subCommand === "-patrol") {
        bot.patrolBot.patrolling = true;
        await bot.patrolBot.startPatrol();
      } else if (subCommand === "-kitPvp") {
        const pos = new Vec3(-1, 67, -52);
        const goal = new goals.GoalGetToBlock(pos.x, pos.y, pos.z);

        await bot.pathfinder.goto(goal);
      } else if (subCommand === "-n") {
        const bots = await bot.bm.getConnectedBots();
        const botNames = bots.map((obj) => {
          return obj.name;
        });

        const nearestPlayer = getClosestPlayer(bot);

        if (TargetManager.isPlayerTargeted(nearestPlayer)) return;

        if (nearestPlayer && !botNames.includes(nearestPlayer.username)) {
          if (bot.fightBot.inBattle) {
            return;
          }

          TargetManager.TargetedPlayers.set(bot.username, nearestPlayer);
          bot.fightBot.clear();
          bot.fightBot.setTarget(nearestPlayer.username);
        }
      } else if (subCommand === "-t") {
        /**
         * username : Team
         */
        const teams = bot.teamMap;
        const botTeam = teams[bot.username];

        if (!botTeam) bot.chat("I aint on a team");

        const opTeamName = args[0];
        const opTeam = Object.values(bot.teamMap).find(
          (team) => team.team === opTeamName
        );
        const opTeamMembers = opTeam.members;
        let target = null;

        for (const member of opTeamMembers) {
          const opPlayer = bot.players[member];

          if (!opPlayer) continue;

          if (TargetManager.isPlayerTargeted(opPlayer)) {
            continue;
          }

          if (!opPlayer.entity) continue;

          if (opPlayer.entity.position.distanceTo(bot.entity.position) >= 16)
            continue;

          target = opPlayer;
          break;
        }

        if (!target) return;

        bot.ashpvp.stop();
        TargetManager.TargetedPlayers.set(bot.username, target);
        bot.ashpvp.attack(target);
      } else if (subCommand === "-tffa") {
        //Team free for all

        /**
         * username : Team
         */
        const teams = bot.teamMap;
        const botTeam = teams[bot.username];

        
      }
    }
  },
};
