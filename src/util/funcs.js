import * as fs from 'fs';
import readline from 'readline';
import { Logger } from './Logger.js';

const logger = Logger.getInstance();

export function readLines(path) {
  try {
    const file = fs.readFileSync(path, 'utf-8');
    const lines = file.split('\n');
    return lines;
  } catch (err) {
    console.log(err);
    logger.error(`Could not read file - ${path}`);
    process.exit();
  }
}

export async function readLinesStream(path, onLineCallback) {
  try {
    const stream = fs.createReadStream(path, { encoding: 'utf-8' });
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity, // Handles both \n and \r\n line endings
    });

    for await (const line of rl) {
      onLineCallback(line); // Process each line using the provided callback
    }
  } catch (err) {
    console.log(err);
    logger.error(`Could not read file - ${path}`);
    process.exit(1);
  }
}

export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
