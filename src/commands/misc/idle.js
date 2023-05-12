let toggle = false;

/**
 * @type {import("../../index").Command}
 */
module.exports = {
  name: "idle",
  async execute(bot) {
    toggle = !toggle;
    let rotateAmount = 0.1; // adjust this to change the speed of rotation

    while (toggle) {
      let yaw = bot.entity.yaw += rotateAmount;
      bot.look(yaw, 0); // set the bot's yaw angle
      await sleep(50); // wait for a short amount of time before updating the angle
    }
  },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
