const mineflayer = require("mineflayer"); // eslint-disable-line

/**
 * @param {mineflayer.Bot} bot // to enable intellisense
 */

module.exports = (bot) => {
  const duelRecevive = /^Duel request received from ([A-Za-z0-9]{3,16})/g;
  const duelAccept =
    /\[Duels] Accepted the duel request from ([A-Za-z0-9]{3,16})/g;
  const kitMsg = /- Kit: (\S+)/;
  const winOrLoseMsg =
    /^\[Duels\] ([A-Za-z0-9]+) \(\d+\) \(\+[0-9-]+\).* has defeated ([A-Za-z0-9]+) \(\d+\) \(\-[0-9-]+\).* on kit ([A-Za-z0-9]+)/;

  let username = ""; // Declare username variable here

  bot.on("messagestr", async (msg) => {
    const match = msg.match(duelRecevive);
    const match2 = msg.match(duelAccept);
    const kitMatch = msg.match(kitMsg);
    const winMatch = msg.match(winOrLoseMsg);

    let kit = "";
    if (match) {
      username = match[0].replace(duelRecevive, "$1"); // Assign value to username variable here

      //Accept the request
      bot.chat(`/duel accept ${username}`);
    }

    if (kitMatch) {
      kit = kitMatch[1];
      console.log(`Kit: ${kit}`);

      if (kit === "Sumon") {
        getReady("Sumo", username); // Pass username as argument to getReady function
      } else if (kit === "Neth2") {
        getReady("Neth", username); // Pass username as argument to getReady function
      }
    }

    setTimeout(() => {
      if (match2) {
        console.log("accepted!");
      }
    }, 2000);

    if (winMatch) {
      const winner = winMatch[1];
      const loser = winMatch[2];

      if (winner === bot.username) {
        console.log(`I won match against ${loser}`);
      } else if (winner !== bot.username) {
        console.log(`I lost match against ${winner}`);
      }
    }
  });

  async function getReady(mode = "Neth", username) {
    // Pass username as parameter to getReady function
    if (mode === "Neth") {
      bot.chat("accepted!");

      bot.fightBot.clear();
      await bot.fightBot.readyUp("duel");
      await bot.fightBot.setTarget(username);
      await bot.fightBot.attack();
    } else if (mode === "Sumo") {
      bot.chat("accepted!");
      bot.fightBot.clear();
      await bot.fightBot.setTarget(username);
      await bot.fightBot.attack();
    }
  }
};
