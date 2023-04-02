const { RGBot } = require('rg-bot');
const { RGCTFUtils, CTFEvent } = require('rg-ctf-utils');



let rgCtfUtils = null;
/**
 * @param {RGBot} rgbot
 */
function configureBot(rgbot) {
  // turn on debug logging
  // logs are displayed within the Regression Games app during a match
  rgbot.setDebug(true);

  rgCtfUtils = new RGCTFUtils(bot)
  rgCtfUtils.setDebug(true)

  // announce in chat when Bot spawns
  rgbot.on("spawn", function () {
    rgbot.chat("Hello World");
  });

  
}

exports.configureBot = configureBot;
