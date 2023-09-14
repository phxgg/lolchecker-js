import { HttpSession } from '../http/HttpSession.js';
import {
  AuthFailureError,
  SessionCookieError,
  LoginFailureError,
  RateLimitedError,
} from '../errors/index.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Response } from 'node-fetch';

export class Zendesk {
  /**
   * 
   * @param {string} username 
   * @param {string} password 
   * @param {HttpsProxyAgent<string>} proxyAgent 
   */
  constructor(username, password, proxyAgent) {
    this.session = new HttpSession(proxyAgent);
    this.email = null;
    this.uri = null;
    this.username = username;
    this.password = password;
  }

  async login() {
    const payload = {
      type: 'auth',
      username: this.username,
      password: this.password,
      remember: false,
      language: 'en_GB',
    };

    await this.initializeSession();
    if (!this.session.cookies.has('asid')) throw new SessionCookieError();

    const res = await this.session.put(
      'https://auth.riotgames.com/api/v1/authorization',
      payload,
      null,
      {
        'Content-Type': 'application/json',
      }
    );
    const data = await res.json();

    if (data?.error === 'auth_failure') throw new AuthFailureError();
    if (data?.error === 'rate_limited') throw new RateLimitedError();

    if (!this.session.cookies.has('sub')) throw new LoginFailureError();
    this.uri = data.response?.parameters?.uri;

    // const complete = await this.complete();
    // if (!complete) throw new RedirectError();

    // this.email = await this.getEmail();
    // logger.log(this.email + ' ' + this.uri)
  }

  async getEmail() {
    const res = await this.session.get(
      'https://support-leagueoflegends.riotgames.com/hc/en-us/requests'
    );
    const body = await res.text();
    console.log(body);
    const regex = /"email":"(.*?)"/g;
    const match = regex.exec(body);
    if (!match) return null;
    return match[1];
  }

  async complete() {
    if (!this.uri) throw new Error('No uri found');
    const res = await this.session.get(this.uri);
    console.log('complete', res.status);
    if (res.status >= 300 && res.status < 400) {
      return await this.follow(res);
    } else {
      return false;
    }
  }

  /**
   * 
   * @param {Response} response 
   * @returns {Promise<boolean>}
   */
  async follow(response) {
    const location = response.headers.get('location');
    if (!location) return false;
    // if location contains 'FAILED' return false
    console.log('follow', location);
    console.log('follow', 'FAILED: ' + location.includes('FAILED'));
    if (location.includes('FAILED')) return false;

    const res = await this.session.get(location);
    console.log('follow', res.status);
    if (res.status >= 300 && res.status < 400) {
      return await this.follow(res);
    } else {
      console.log('follow == 200', res.status == 200);
      return res.status == 200;
    }
  }

  async initializeSession() {
    await this.getAsidCookie();
  }

  async getAsidCookie() {
    const query =
      'redirect_uri=https://login.playersupport.riotgames.com/login_callback&client_id=player-support-zendesk&ui_locales=en-us%20en-us&response_type=code&scope=openid%20email';
    await this.session.get(`https://auth.riotgames.com/authorize?${query}`);
  }
}
