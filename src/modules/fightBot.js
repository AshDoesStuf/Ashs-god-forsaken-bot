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
  bot.on("physicsTick", async () => {
    bot.fightBot.update();
    bot.guardBot.update();
    bot.huntBot.update();
    await bot.patrolBot.attackTarget();
    await bot.guardBot.attackMob();
  });

  bot.on("target-death", (entity) => {
    if (bot.patrolBot.target && entity.id === bot.patrolBot.target.id) {
      stop();

      bot.patrolBot.target = null;
      bot.patrolBot.patrolling = true;
      bot.patrolBot.startPatrol();
    }
  });

  bot.on("entityDead", async (e) => {
    if (bot.patrolBot.target && e.id === bot.patrolBot.target.id) {
      bot.patrolBot.resetCombatState();
      bot.patrolBot.startPatrol();
    }

    if (bot.guardBot.attackTarget && e.id === bot.guardBot.attackTarget.id) {
      bot.guardBot.resetCombatState();
      if (!bot.guardBot.isNearGuardTarget())
        await bot.guardBot.gotoGuardTarget();
    }
  });

  bot.on("entityGone", async (e) => {
    if (bot.patrolBot.target && e.id === bot.patrolBot.target.id) {
      bot.patrolBot.resetCombatState();
      bot.patrolBot.startPatrol();
    }

    if (bot.guardBot.attackTarget && e.id === bot.guardBot.attackTarget.id) {
      bot.guardBot.resetCombatState();
      if (!bot.guardBot.isNearGuardTarget())
        await bot.guardBot.gotoGuardTarget();
    }
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
      console.log("i merked someone");
      bot.fightBot.stop({ ffa: true });
      bot.clearControlStates();
    } else if (victim === bot.fightBot.target && !bot.fightBot.ffa) {
      console.log("pluh");
      bot.fightBot.stop();
      bot.clearControlStates();
    }
  });

  bot.on("death", async () => {
    bot.fightBot.stop({ ffa: true });
    bot.clearControlStates();
    if (useLogs) {
      console.log("i ded lol");
    } else {
      bot.chat("alright");
    }
  });

  bot.on("entityDead", async (e) => {
    if (bot.fightBot.archerTarget && e.id === bot.fightBot.archerTarget.id) {
      stop();

      if (useLogs) {
        console.log("target died");
      } else {
        bot.chat("gg nerd");
      }
    } else if (bot.huntBot.target && e.id === bot.huntBot.target.id) {
      stop();

      bot.huntBot.stop();
    }
  });

  bot.on("entityGone", async (e) => {
    if (bot.fightBot.archerTarget && e.id === bot.fightBot.archerTarget.id) {
      bot.fightBot.stop();
      bot.clearControlStates();

      if (useLogs) {
        console.log("target left");
      } else {
        bot.chat("alright");
      }
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

    // if (kings && hiveConfig && hiveConfig.defendOwner) {
    //   if (bot.fightBot.inBattle) return;

    //   if (kings.includes(victim.username)) {
    //     const distance = bot.entity.position.distanceTo(victim.position);

    //     if (distance >= 25) return;

    //     bot.chat("Hey leave my king alone mortal");

    //     bot.fightBot.clear();
    //     bot.fightBot.setTarget(attacker.username);
    //   }
    // }

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

    // if (victim === bot.entity) {
    //   if (bot.fightBot.inBattle) {
    //     return;
    //   }

    //   if (bot.ashpvp.target) return;

    //   if (attacker.username === bot.username) {
    //     return;
    //   }

    //   bot.ashpvp.stop();
    //   bot.ashpvp.attack(attacker);
    // }
  });

  function stop() {
    bot.fightBot.stop();
    bot.clearControlStates();
  }
};
