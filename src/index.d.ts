import { Bot } from "mineflayer";
import GuardBot from "./js/guardBot";

declare module "mineflayer" {
  interface Bot {
    guardBot: GuardBot;
    hivemind: {
      config: object;
      workers: Array<any>?;
      botId: string;
      kings: Array<string>;
      fileData: object;
    };
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
