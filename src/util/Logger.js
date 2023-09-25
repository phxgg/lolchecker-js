import chalk from 'chalk';

export class Logger {
  static instance;

  constructor() {}

  /**
   * @returns {Logger}
   */
  static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Prints a message to the console
   * @param {*} message
   */
  log(message) {
    console.log(chalk.white(message));
  }

  /**
   * Prints a success message to the console
   * @param {*} message
   */
  success(message) {
    console.log(chalk.green(`[SUCCESS] ${message}`));
  }

  /**
   * Prints an info message to the console
   * @param {*} message
   */
  info(message) {
    console.info(chalk.cyan(`[INFO] ${message}`));
  }

  /**
   * Prints an error message to the console
   * @param {*} message
   */
  error(message) {
    console.error(chalk.red(`[ERROR] ${message}`));
  }

  /**
   * Prints a warning message to the console
   * @param {*} message
   */
  warn(message) {
    console.warn(chalk.yellow(`[WARN] ${message}`));
  }
}
