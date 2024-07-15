const { useLogs } = require("../config.json");
const { MobManager, TargetManager } = require("../js/Managers.js");

/**
 *
 * @type {import("../index.d.ts").FightModule}
 */
module.exports = (bot) => {
  console.log("man i run this hsit");
  const hiveConfig = bot.hivemind.config;
  const kings = bot.hivemind.kings;
  bot.on("physicsTick", () => {
    bot.fightBot.update();
    bot.guardBot.update();
    bot.huntBot.update();
  });

  bot.on("messagestr", async (msg) => {
    const regex = /(.+) was killed by (.+)/;
    const match = msg.match(regex);

    if (!match) return;

    const victim = match[1];
    const killer = match[2];

    // that means bot dided
    if (victim === bot.username) {
      bot.fightBot.stop();
      bot.clearControlStates();
    } else if (killer === bot.username) {
      bot.fightBot.stop();
      bot.clearControlStates();
    } else if (victim === bot.fightBot.target && !bot.fightBot.ffa) {
      bot.fightBot.stop();
      bot.clearControlStates();
    } else if (
      victim !== bot.username &&
      victim === bot.fightBot.target &&
      bot.fightBot.ffa
    ) {
      bot.fightBot.stop();
      bot.clearControlStates();

      let targets = await bot.fightBot.getFFATargets(
        (e) =>
          e !== bot.entity &&
          e.equipment[4] &&
          e.equipment[4].name === "diamond_chestplate"
      );

      bot.fightBot.ffaTarget =
        targets[Math.floor(Math.random() * targets.length)];
    }
  });

  bot.on("death", async () => {
    bot.fightBot.stop();
    bot.clearControlStates();
    if (useLogs) {
      console.log("i ded lol");
    } else {
      bot.chat("alright");
    }
  });

  bot.on("entityDead", async (e) => {
    if (
      e.id !== bot.entity.id &&
      e.id === bot.fightBot.target_G?.id &&
      !bot.fightBot.ffa
    ) {
      bot.fightBot.stop();
      bot.clearControlStates();

      TargetManager.unTargetPlayer(bot.username);

      if (useLogs) {
        console.log("target died");
      } else {
        bot.chat("gg nerd");
      }

      console.log(bot.fightBot.targets);
      if (bot.fightBot.settings.freeForAll && bot.fightBot.targets.length > 0) {
        if (bot.fightBot.targets.includes(e.username)) {
          remove(bot.fightBot.targets, e.username);
        }

        const next = bot.fightBot.targets[0];
        console.log(next);

        if (next) {
          bot.fightBot.setTarget(next);
          bot.fightBot.attack();
        }
      }
    } else if (
      bot.fightBot.archerTarget &&
      e.id === bot.fightBot.archerTarget.id
    ) {
      stop();

      if (useLogs) {
        console.log("target died");
      } else {
        bot.chat("gg nerd");
      }
    } else if (bot.patrolBot.target && e.id === bot.patrolBot.target.id) {
      stop();

      bot.patrolBot.target = null;
      bot.patrolBot.patrolling = true;
      bot.patrolBot.startPatrol();
    } else if (
      e.id !== bot.entity.id &&
      e.id === bot.fightBot.target_G?.id &&
      bot.fightBot.ffa
    ) {
      bot.fightBot.stop();
      bot.clearControlStates();

      let targets = await bot.fightBot.getFFATargets(
        (e) =>
          e !== bot.entity &&
          e.equipment[4] &&
          e.equipment[4].name === "diamond_chestplate"
      );

      bot.fightBot.ffaTarget =
        targets[Math.floor(Math.random() * targets.length)];
    } else if (bot.huntBot.target && e.id === bot.huntBot.target.id) {
      stop();

      bot.huntBot.stop();
    }
  });

  bot.on("entityGone", async (e) => {
    if (
      e.id !== bot.entity.id &&
      e.id === bot.fightBot.target_G?.id &&
      !bot.fightBot.ffa
    ) {
      stop();

      if (useLogs) {
        console.log("target left");
      } else {
        bot.chat("sure i guess");
      }

      if (bot.fightBot.settings.freeForAll && bot.fightBot.targets.length > 0) {
        if (bot.fightBot.targets.includes(e.username)) {
          remove(bot.fightBot.targets, e.username);
        }

        const next = bot.fightBot.targets[0];
        console.log(next);

        if (next) {
          bot.fightBot.setTarget(next);
          bot.fightBot.attack();
        }
      }
    } else if (
      bot.fightBot.archerTarget &&
      e.id === bot.fightBot.archerTarget.id
    ) {
      bot.fightBot.stop();
      bot.clearControlStates();

      if (useLogs) {
        console.log("target left");
      } else {
        bot.chat("alright");
      }
    } else if (
      e.id !== bot.entity.id &&
      e.id === bot.fightBot.target_G?.id &&
      bot.fightBot.ffa
    ) {
      bot.fightBot.stop();
      bot.clearControlStates();

      let targets = await bot.fightBot.getFFATargets(
        (e) =>
          e !== bot.entity &&
          e.equipment[4] &&
          e.equipment[4].name === "diamond_chestplate"
      );

      bot.fightBot.ffaTarget =
        targets[Math.floor(Math.random() * targets.length)];
    } else if (bot.patrolBot.target && e.id === bot.patrolBot.target.id) {
      stop();

      bot.patrolBot.target = null;
      bot.patrolBot.patrolling = true;
      bot.patrolBot.startPatrol();
    }



    if (
      e.id !== bot.entity.id &&
      e.id === bot.fightBot.pveTarg?.id &&
      bot.fightBot.pve
    ) {
      try {
        bot.fightBot.stop();
        bot.clearControlStates();
      } catch (error) {
        console.log(error.message);
      }

      MobManager.unTargetMob(e);

      if (bot.guardBot.attackTarget && e.id === bot.guardBot.attackTarget.id) {
        bot.guardBot.attackTarget = null;
        bot.guardBot.emit("guard-stop-attack");

        if (!bot.guardBot.isNearGuardTarget())
          await bot.guardBot.gotoGuardTarget();
      }
    } else if (bot.huntBot.target && e.id === bot.huntBot.target.id) {
      stop();

      bot.huntBot.stop();
    }
  });

  bot.on("entityAttack", async function (victim, attacker, weapon) {
    if (victim === bot.entity && bot.fightBot.settings.freeForAll) {
      if (bot.fightBot?.knownSexOffenders?.indexOf(attacker.username) !== -1)
        return;

      bot.fightBot?.knownSexOffenders?.push(
        attacker.username || attacker.displayName
      );
    }

    if (kings && hiveConfig && hiveConfig.defendOwner) {
      if (bot.fightBot.inBattle) return;

      if (kings.includes(victim.username)) {
        const distance = bot.entity.position.distanceTo(victim.position);

        if (distance >= 25) return;

        bot.chat("Hey leave my king alone mortal");

        bot.fightBot.clear();
        bot.fightBot.setTarget(attacker.username);
      }
    }

    // if (hiveConfig && hiveConfig.defendWorkers) {
    //   const requestWorkers = new SendingData("workers").toJson();
    //   ws.send(requestWorkers);

    //   await sleep(1000);

    //   if (workers.length > 0) {
    //     if (bot.fightBot.inBattle) return;

    //     if (
    //       workers.includes(victim.username) &&
    //       !kings.includes(attacker.username)
    //     ) {
    //       const distance = bot.entity.position.distanceTo(victim.position);

    //       if (distance >= 25) return;

    //       bot.chat("Hey leave my worker alone mortal");

    //       bot.fightBot.clear();
    //       bot.fightBot.setTarget(attacker.username);
    //     }
    //   }
    // }

    if (victim === bot.entity) {
      if (bot.fightBot.inBattle) {
        return;
      }

      if (attacker.username === bot.username) {
        return;
      }

      bot.fightBot.clear();
      bot.fightBot.setTarget(attacker.username);
    }
  });

  function stop() {
    bot.fightBot.stop();
    bot.clearControlStates();
  }
};
