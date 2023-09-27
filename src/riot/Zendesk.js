import { HttpSession } from '../http/HttpSession.js';
import { AuthFailureError, SessionCookieError, LoginFailureError, RateLimitedError } from '../errors/index.js';
import * as Types from '../typedef.js';
import { Logger } from '../util/Logger.js';

const logger = Logger.getInstance();

export class Zendesk {
  /**
   * @param {string} username Username
   * @param {string} password Password
   * @param {Types.HttpsProxyAgent} proxyAgent Proxy agent to use for requests
   */
  constructor(username, password, proxyAgent = null) {
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

    const res = await this.session.put('https://auth.riotgames.com/api/v1/authorization', payload, null, {
      'Content-Type': 'application/json',
    });
    const data = await res.json();

    switch (data?.error) {
      case 'auth_failure':
        throw new AuthFailureError();
      case 'rate_limited':
        throw new RateLimitedError();
      case 'login_failure':
        throw new LoginFailureError();
    }

    if (!this.session.cookies.has('sub')) throw new LoginFailureError();
    this.uri = data.response?.parameters?.uri;
    if (!this.uri) throw new LoginFailureError();
    await this.completeLoginRedirection(this.uri);
  }

  /**
   * Complete the login process by following the redirect uri and setting the cookies
   * FIXME: Gets stuck on cloudflare security check page
   * @param {string} uri URI to follow
   */
  async completeLoginRedirection(uri) {
    const res = await this.session.getFollow(uri);
  }

  async getEmail() {
    const res = await this.session.getFollow('https://support-leagueoflegends.riotgames.com/hc/en-us/requests');
    const body = await res.text();
    logger.warn(body);
    const regex = /"email":"(.*?)"/g;
    const match = regex.exec(body);
    if (!match) return null;
    return match[1];
  }

  /**
   * We call this function to get the necessary cookies for the zendesk login
   */
  async initializeSession() {
    await this.getAsidCookie();
  }

  async getAsidCookie() {
    const query =
      'redirect_uri=https://login.playersupport.riotgames.com/login_callback&client_id=player-support-zendesk&ui_locales=en-us%20en-us&response_type=code&scope=openid%20email';
    const res = await this.session.getFollow(`https://auth.riotgames.com/authorize?${query}`);
  }
}
