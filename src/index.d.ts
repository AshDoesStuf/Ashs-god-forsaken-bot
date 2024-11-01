import { Bot } from "mineflayer";
import GuardBot from "./js/guardBot";
import HuntBot from "./js/huntBot";
import BotWebSocketClient from "../../BotMind/src/WSWrapper.js";
import Fight from "./js/fightBot";

declare module "mineflayer" {
  interface Bot {
    fightBot: Fight
    guardBot: GuardBot;
    huntBot: HuntBot
    hivemind: {
      config: object;
      workers: Array<any>?;
      botId: string;
      kings: Array<string>;
      fileData: object;
    };
    commands: Array<Command>
    bmCommands: Array<Command>
    bm: BotWebSocketClient
  }
}

export interface Command {
  name: string;
  description: string;
  args?: boolean;
  usage?: string;
  execute(bot: Bot, username: string, args: string[]): void | Promise<void>;
}

export interface FightModule {
  (bot: Bot): void;
}

export type GuardState = "idle" | "guarding" | "attacking" | "pathing";
