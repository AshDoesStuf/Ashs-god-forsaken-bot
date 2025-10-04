let watching = false;
let slotUpdateListener = null;

const mcColorMap = {
  black: "\x1b[30m",
  dark_blue: "\x1b[34m",
  dark_green: "\x1b[32m",
  dark_aqua: "\x1b[36m",
  dark_red: "\x1b[31m",
  dark_purple: "\x1b[35m",
  gold: "\x1b[33m",
  gray: "\x1b[37m",
  dark_gray: "\x1b[90m",
  blue: "\x1b[94m",
  green: "\x1b[92m",
  aqua: "\x1b[96m",
  red: "\x1b[91m",
  light_purple: "\x1b[95m",
  yellow: "\x1b[93m",
  white: "\x1b[97m",
  reset: "\x1b[0m",
};

/**
 * @type {import("../../index").Command}
 */
module.exports = {
  name: "gui",
  description: "Performs actions while a GUI is open (requires .openGui first)",
  async execute(bot, username, args) {
    if (!bot.guiSessionActive || !bot.windowManager?.isWindowOpen()) {
      return console.log("You must open a GUI first using f!openGui <item>");
    }

    const sub = args[0];

    switch (sub) {
      case "click":
        return handleClick(bot, args.slice(1));
      case "list":
        return listItems(bot);
      case "close":
        bot.closeWindow();
        return;
      case "watch":
        return toggleWatch(bot, args[1]);
      default:
        console.log(
          "Subcommands: click name <text> | list | close | watch on|off"
        );
    }
  },
};

async function handleClick(bot, args) {
  const type = args[0];
  const value = args.slice(1).join(" ").replace(/^"|"$/g, "");

  if (type === "name") {
    const success = await bot.windowManager.clickItemByName(value);
    if (success) {
      console.log(`[GUI] Clicked item with name "${value}"`);
    } else {
      console.log(`[GUI] No item found with name "${value}"`);
    }
  } else {
    console.log("Usage: .gui click name <item name>");
  }
}

function parseCustomName(raw) {
  try {
    const json = JSON.parse(raw);
    const extras = json.extra || [];
    return (
      extras
        .map((part) => {
          const color = mcColorMap[part.color] || "";
          const bold = part.bold ? "\x1b[1m" : "";
          const text = part.text || "";
          return `${bold}${color}${text}`;
        })
        .join("") + mcColorMap.reset
    );
  } catch {
    return raw;
  }
}

function listItems(bot) {
  const items = bot.windowManager.getCustomItems();
  if (!items.length) return console.log("[GUI] No custom items found.");

  console.log(`\n[GUI] Custom Items:\n`);
  items.forEach((item, i) => {
    const name = item.customName ? parseCustomName(item.customName) : item.name;
    console.log(`[${i}] ${name}`);
  });
}

/**
 *
 * @param {import("mineflayer").Bot} bot
 * @param {*} state
 * @returns
 */
function toggleWatch(bot, state) {
  if (state === "on") {
    if (watching) return console.log("[GUI] Already watching slot updates.");
    watching = true;

    slotUpdateListener = (window, slot, oldItem, newItem) => {
      if (window !== bot.currentWindow) return;
      console.log(
        `[WATCH] Slot ${slot} changed:\n  Old: ${formatItem(
          oldItem
        )}\n  New: ${formatItem(newItem)}`
      );
    };

    bot.windowManager.on("windowUpdateSlot", slotUpdateListener);
    console.log("[GUI] Watching slot updates.");
  } else if (state === "off") {
    if (!watching) return console.log("[GUI] Watch mode is not active.");
    watching = false;

    bot.windowManager.off("windowUpdateSlot", slotUpdateListener);
    slotUpdateListener = null;
    console.log("[GUI] Stopped watching slot updates.");
  } else {
    console.log("Usage: .gui watch on | off");
  }
}

function formatItem(item) {
  if (!item) return "empty";
  return `${item.name}${item.customName ? ` (${item.customName})` : ""}`;
}
