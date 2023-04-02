/**
 * @param {RGBot} rgbot
 */
function configureBot(rgbot) {
  // turn on debug logging
  // logs are displayed within the Regression Games app during a match
  rgbot.setDebug(true);

  // announce in chat when Bot spawns
  rgbot.on("spawn", function () {
    rgbot.chat("Hello World");
  });
}

exports.configureBot = configureBot;
