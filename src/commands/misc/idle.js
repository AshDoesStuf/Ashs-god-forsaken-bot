let toggle = false;

/**
 * @type {import("../../index").Command}
 */
module.exports = {
  name: "idle",
  async execute(bot) {
    toggle = !toggle;
    let time = 0; // Starting time for the animation
    let rotateSpeed = 0.1; // Adjust this to change the speed of rotation
    let rotateAmplitude = 0.5; // Adjust this to change the range of rotation (amplitude)

    while (toggle) {
      let yawOffset = Math.sin(time) * rotateAmplitude; // Calculate the rotation offset using sine wave
      let pitchOffset = Math.cos(time) * rotateAmplitude; // Calculate the pitch offset using cosine wave

      let yaw = bot.entity.yaw + yawOffset;
      let pitch = bot.entity.pitch + pitchOffset;

      bot.look(yaw, pitch); // Set the bot's yaw and pitch angle
      await sleep(50); // Wait for a short amount of time before updating the angle

      time += rotateSpeed; // Increment time for smooth animation
    }
  },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
