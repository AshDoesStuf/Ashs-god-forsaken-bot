import { Bot } from "mineflayer";
import GuardBot from "./js/guardBot";
import HuntBot from "./js/huntBot";
import BotWebSocketClient from "../../BotMind/src/WSWrapper.js";
import Fight from "./js/fightBot";
import AshPvP from "../../ash-pvp/src/pvp.js";
import { Vec3 } from "vec3";
import { Entity } from "prismarine-entity";
import PatrolBot from "./js/patrolBot";

declare module "mineflayer" {
  interface Bot {
    fightBot: Fight;
    guardBot: GuardBot;
    huntBot: HuntBot;

    patrolBot: PatrolBot;
    hivemind: {
      config: object;
      workers: Array<any>?;
      botId: string;
      kings: Array<string>;
      fileData: object;
    };
    commands: Array<Command>;
    bmCommands: Array<Command>;
    bm: BotWebSocketClient;
    ashpvp: AshPvP;
    nearestEntities(
      filter: (entity: Entity) => boolean,
      limit: number
    ): Entity[];
  }

  interface BotEvents {
    distressSignal: (
      botId: string,
      position: Vec3,
      entities: Array<Entity>
    ) => void;
  }
}

export interface Command {
  name: string;
  description: string;
  args?: boolean;
  usage?: string;
  aliases?: string[];
  execute(bot: Bot, username: string, args: string[]): void | Promise<void>;
}

export interface FightModule {
  (bot: Bot): void;
}

export type GuardState = "idle" | "guarding" | "attacking" | "pathing";
