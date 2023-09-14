import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch, { Response } from 'node-fetch';

export class HttpSession {
  /**
   * 
   * @param {HttpsProxyAgent<string>} proxyAgent 
   */
  constructor(proxyAgent) {
    this.proxyAgent = proxyAgent;
    this.cookies = new Map();
  }

  async get(url, headers = {}) {
    const res = await fetch(url, {
      // agent: this.proxyAgent,
      redirect: 'manual',
      method: 'GET',
      headers: {
        Cookie: this.stringifyCookies(),
        ...headers,
      },
    });

    this.updateCookies(res);
    return res;
  }

  async put(url, data, options = {}, headers = {}) {
    const res = await fetch(url, {
      agent: this.proxyAgent,
      method: 'PUT',
      redirect: 'manual',
      headers: {
        Cookie: this.stringifyCookies(),
        ...headers,
      },
      ...options,
      body: JSON.stringify(data),
    });

    this.updateCookies(res);
    return res;
  }

  async getFollow(url, headers = {}) {
    const res = await fetch(url, {
      agent: this.proxyAgent,
      redirect: 'follow',
      method: 'GET',
      headers: {
        Cookie: this.stringifyCookies(),
        ...headers,
      },
    });

    this.updateCookies(res);
    return res;
  }

  /**
   * Makes a POST request
   * @param {string} url
   * @param {object} data
   * @param {object} options
   * @param {object} headers
   * @returns
   */
  async post(url, data, options = {}, headers = {}) {
    const res = await fetch(url, {
      agent: this.proxyAgent,
      method: 'POST',
      redirect: 'manual',
      headers: {
        Cookie: this.stringifyCookies(),
        ...headers,
      },
      ...options,
      body: JSON.stringify(data),
    });

    this.updateCookies(res);
    return res;
  }

  /**
   *
   * @returns Stringified cookies
   */
  stringifyCookies() {
    let result = '';

    for (const [key, value] of this.cookies) {
      result += `${key}=${value}`;
      // if it's not last index add a semicolon
      if (
        this.cookies.size - 1 !==
        Array.from(this.cookies.keys()).indexOf(key)
      ) {
        result += '; ';
      }
    }

    return result.trim();
  }

  /**
   * Parses cookies from set-cookie header
   * @typedef {Map<string, string>} Cookies
   * @param {Response} response
   * @returns Parsed cookies from set-cookie header
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
   * Updates cookies
   * @param {Response} response
   */
  updateCookies(response) {
    const cookies = this.parseSetCookie(response);

    for (const [key, value] of cookies) {
      this.cookies.set(key, value);
    }
  }
}
