import { Bot } from "mineflayer";

export interface Command {
  name: string;
  description: string;
  usage: string;
  execute(bot:Bot,username:string,args: string[]): void | Promise<void>;
}
