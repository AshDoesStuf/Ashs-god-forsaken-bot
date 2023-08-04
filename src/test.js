const { Worker, isMainThread } = require("worker_threads");
const createBot = require("./mineflayerBot.js");

if (isMainThread) {
  // Number of bots you want to create
  const numBots = 4;

  const botInfo = [
    { username: "bot1", host: "NubPlayzBoi.aternos.me", port: 26216 },
    // Add more bot information here for each bot
  ];

  // Create a worker thread for each bot
  for (let i = 0; i < numBots; i++) {
    const worker = new Worker(__filename);

    worker.on("message", (message) => {
      console.log(`Bot ${message.username} says: ${message.message}`);
    });

    worker.postMessage(botInfo[i]);
  }
} else {
  // Inside the worker thread
  const botData = require("worker_threads").workerData;
  const bot = createBot(botData.username, botData.host, botData.port);

  // Your bot-specific logic here
  bot.on("message", (message) => {
    // Example: Send a message from the bot
    bot.chat(`Hello, I am ${bot.username}. I am a bot!`);
  });
}
