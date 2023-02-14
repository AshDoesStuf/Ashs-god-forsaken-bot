export interface Command {
  name: string;
  description: string;
  usage: string;
  execute(args: string[]): void | Promise<void>;
}
