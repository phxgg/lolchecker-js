import fetch from 'node-fetch';
import * as Types from '../typedef.js';

export class HttpSession {
  #proxyAgent;
  #cookies;
  #timeout = 10;

  /**
   * @param {Types.HttpsProxyAgent} proxyAgent Proxy agent to use for requests
   */
  constructor(proxyAgent) {
    this.#proxyAgent = proxyAgent ?? null;
    this.#cookies = new Map();
  }

  /**
   * @returns {Types.Cookies} Cookies
   */
  get cookies() {
    return this.#cookies;
  }

  /**
   * @param {Types.Cookies} cookies Cookies
   */
  set cookies(cookies) {
    this.#cookies = cookies;
  }

  /**
   * Makes a GET request.
   * @param {string} url URL to make the request to
   * @param {object} headers Headers to pass to fetch
   * @returns {Promise<Types.Response>} Response
   */
  async get(url, headers = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.#timeout * 1000);

    const res = await fetch(url, {
      agent: this.#proxyAgent,
      signal: controller.signal,
      redirect: 'manual',
      method: 'GET',
      headers: {
        Cookie: this.stringifyCookies(),
        ...headers,
      },
    });
    clearTimeout(id);
    this.updateCookies(res);

    return res;
  }

  /**
   * Makes a GET request and follows redirects. Returns the final response.
   * @param {string} url URL to make the request to
   * @param {object} headers Headers to pass to fetch
   * @returns {Promise<Types.Response>} Response
   */
  async getFollow(url, headers = {}) {
    const res = await this.get(url, headers);

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) throw new Error('No location header found');
      // check if location is relative
      if (!location.startsWith('https')) {
        const urlSplit = url.split('/');
        urlSplit.pop();
        const baseUrl = urlSplit.join('/');
        return this.getFollow(baseUrl + '/' + location, headers);
      } else {
        return this.getFollow(location, headers);
      }
    }

    return res;
  }

  /**
   * Makes a PUT request.
   * @param {string} url URL to make the request to
   * @param {object} data Data to send in the request body
   * @param {object} options Options to pass to fetch
   * @param {object} headers Headers to pass to fetch
   * @returns {Promise<Types.Response>} Response
   */
  async put(url, data, options = {}, headers = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.#timeout * 1000);

    const res = await fetch(url, {
      agent: this.#proxyAgent,
      signal: controller.signal,
      method: 'PUT',
      redirect: 'manual',
      headers: {
        Cookie: this.stringifyCookies(),
        ...headers,
      },
      ...options,
      body: JSON.stringify(data),
    });
    clearTimeout(id);
    this.updateCookies(res);

    return res;
  }

  /**
   * Makes a POST request.
   * @param {string} url URL to make the request to
   * @param {object} data Data to send in the request body
   * @param {object} options Options to pass to fetch
   * @param {object} headers Headers to pass to fetch
   * @returns {Promise<Types.Response>} Response
   */
  async post(url, data, options = {}, headers = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.#timeout * 1000);

    const res = await fetch(url, {
      agent: this.#proxyAgent,
      signal: controller.signal,
      method: 'POST',
      redirect: 'manual',
      headers: {
        Cookie: this.stringifyCookies(),
        ...headers,
      },
      ...options,
      body: JSON.stringify(data),
    });
    clearTimeout(id);
    this.updateCookies(res);

    return res;
  }

  /**
   * Returns cookies as a string.
   * @returns {string} Stringified cookies
   */
  stringifyCookies() {
    let result = '';

    for (const [key, value] of this.cookies) {
      // value till first semicolon
      let valueTillSemicolon = value.split(';')[0];
      result += `${key}=${valueTillSemicolon}`;
      // if it's not last index add a semicolon
      if (this.cookies.size - 1 !== Array.from(this.cookies.keys()).indexOf(key)) {
        result += '; ';
      }
    }

    return result.trim();
  }

  /**
   * Parses cookies from the `set-cookie` header.
   * @param {Types.Response} response Response object to parse cookies from
   * @returns {Types.Cookies} Parsed cookies
   */
  parseSetCookie(response) {
    const cookies = new Map();

    const setCookie = response.headers.raw()['set-cookie'];
    if (!setCookie) return cookies;

    for (const value of setCookie) {
      const [key, ...rest] = value.split('=');
      const remainder = rest.join('=');
      cookies.set(key, remainder);
    }

    return cookies;
  }

  /**
   * Updates the cookies map.
   * @param {Types.Response} response Response object to parse cookies from
   * @returns {void}
   */
  updateCookies(response) {
    const cookies = this.parseSetCookie(response);

    for (const [key, value] of cookies) {
      this.cookies.set(key, value);
    }
  }
}
