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

  let username = "";

  bot.on("messagestr", async (msg) => {
    const match = msg.match(duelRecevive);
    const match2 = msg.match(duelAccept);
    const kitMatch = msg.match(kitMsg);
    const winMatch = msg.match(winOrLoseMsg);

    let kit = "";
    if (match) {
      username = match[0].replace(duelRecevive, "$1");

      //Accept the request
      bot.chat(`/duel accept ${username}`);
    }

    if (kitMatch) {
      kit = kitMatch[1];
      console.log(`Kit: ${kit}`);

      if (kit === "Sumon") {
        getReady("Sumo", username);
      } else if (kit === "Neth2") {
        getReady("Neth", username);
      } else if (kit === "Neth") {
        getReady("Neth", username);
      } else if (kit === "AxeUhc") {
        setTimeout(() => {
          getReady("uhc", username);
        }, 2000);
      } else if (kit === "neth1") {
        setTimeout(() => {
          getReady("Neth", username);
        }, 2000);
      } else {
        setTimeout(() => {
          getReady("Neth", username);
        }, 2000);
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
    bot.fightBot.setTarget(username);
  }
};
