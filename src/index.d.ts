import { Bot } from "mineflayer";
import GuardBot from "./js/guardBot";
import HuntBot from "./js/huntBot";
import BotWebSocketClient from "H:\\Bost\\BotMind\\src\\WSWrapper.js"

declare module "mineflayer" {
  interface Bot {
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
