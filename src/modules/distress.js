const { GoalNear } = require("../../../mineflayer-baritone/src/goal.js");

/**
 *
 * @type {import("../index.d.ts").FightModule}
 */
module.exports = (bot) => {
  bot.nearestEntities = function (filter, limit) {
    let entities = [];

    for (const entity of Object.values(bot.entities)) {
      if (filter(entity)) {
        entities.push(entity);
      }
    }

    entities.sort((a, b) => {
      return (
        bot.entity.position.distanceTo(a.position) -
        bot.entity.position.distanceTo(b.position)
      );
    });

    return entities.slice(0, limit);
  };

  //Handle when a worker bot from the botmind is in distress
  bot.on("distressSignal", async (botID, position, entities) => {
    // Check if we are close to the distressed bot
    if (bot.entity.position.distanceTo(position) > 100) return;

    const goal = new GoalNear(position.x, position.y, position.z, 3);

    await bot.ashfinder.goto(goal);

    //Check for nearby mobs and check if some of them match the entities array
    const mobs = bot.nearestEntities(
      (entity) =>
        entity.type === "hostile" &&
        entity.position.distanceTo(bot.entity.position) <= 16,
      5
    );

    // If there are no mobs nearby, we can ignore the distress signal
    if (mobs.length === 0) return;

    //check if atleat 2 of the mobs are in the entities array
    let count = 0;
    for (const mob of mobs) {
      if (entities.find((e) => e.uuid === mob.uuid)) {
        count++;
      }
    }

    if (count < 2) return;

    //If we have 2 or more mobs from the entities array near us, we should
    //help the distressed bot

    await bot.ashpvp.attackMobGroup(mobs);
  });
};
