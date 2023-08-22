import * as fs from "fs";
import { Logger } from "./Logger.js";

const logger = Logger.getInstance();

export const readLines = (path: string): string[] => {
  try {
    const file = fs.readFileSync(path, "utf-8")
    const lines = file.split("\n");
    return lines;
  } catch (err) {
    logger.error(`Could not read file - ${path}`);
    process.exit(0);
  }
};

export const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
