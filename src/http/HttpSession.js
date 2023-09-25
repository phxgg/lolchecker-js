/* eslint-disable no-unused-vars */
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch, { Response } from 'node-fetch';

export class HttpSession {
  /**
   * @param {HttpsProxyAgent<string>} proxyAgent
   */
  constructor(proxyAgent) {
    this.proxyAgent = proxyAgent ?? null;
    this.cookies = new Map();
  }

  /**
   * Makes a GET request
   * @param {string} url
   * @param {object} headers
   * @returns {Response} Response
   */
  async get(url, headers = {}) {
    const res = await fetch(url, {
      agent: this.proxyAgent,
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

  /**
   * Makes a GET request and follows redirects. Returns the final response.
   * @param {string} url
   * @param {object} headers
   * @returns {Response} Response
   */
  async getFollow(url, headers = {}) {
    const res = await fetch(url, {
      agent: this.proxyAgent,
      redirect: 'manual',
      method: 'GET',
      headers: {
        Cookie: this.stringifyCookies(),
        ...headers,
      },
    });
    this.updateCookies(res);

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
   * Makes a PUT request
   * @param {string} url
   * @param {object} data
   * @param {object} options
   * @param {object} headers
   * @returns {Response} Response
   */
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
   * @returns {string} Stringified cookies
   */
  stringifyCookies() {
    let result = '';

    for (const [key, value] of this.cookies) {
      // value till first semicolon
      let valueTillSemicolon = value.split(';')[0];
      result += `${key}=${valueTillSemicolon}`;
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
   * @returns {Cookies} Parsed cookies from set-cookie header
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
   * Updates cookies list
   * @param {Response} response
   */
  updateCookies(response) {
    const cookies = this.parseSetCookie(response);

    for (const [key, value] of cookies) {
      this.cookies.set(key, value);
    }
  }
}
