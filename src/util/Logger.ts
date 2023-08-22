import chalk from "chalk";

export class Logger {
  private static instance: Logger;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public log(message: string): void {
    console.log(chalk.white(message));
  }

  public success(message: string): void {
    console.log(chalk.green(`[SUCCESS] ${message}`));
  }

  public info(message: string): void {
    console.info(chalk.cyan(`[INFO] ${message}`));
  }

  public error(message: string): void {
    console.error(chalk.red(`[ERROR] ${message}`));
  }

  public warn(message: string): void {
    console.warn(chalk.yellow(`[WARN] ${message}`));
  }
}
