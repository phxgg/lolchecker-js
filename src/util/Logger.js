import chalk from 'chalk';

export class Logger {
  static instance;

  constructor() {}

  static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  log(message) {
    console.log(chalk.white(message));
  }

  success(message) {
    console.log(chalk.green(`[SUCCESS] ${message}`));
  }

  info(message) {
    console.info(chalk.cyan(`[INFO] ${message}`));
  }

  error(message) {
    console.error(chalk.red(`[ERROR] ${message}`));
  }

  warn(message) {
    console.warn(chalk.yellow(`[WARN] ${message}`));
  }
}
