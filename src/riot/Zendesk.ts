import { Response } from "node-fetch";
import { HttpSession } from "../http/HttpSession.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import { AuthFailureError, SessionCookieError, LoginFailureError, RateLimitedError, RedirectError } from "../errors/index.js"
import { Logger } from "../util/Logger.js";

const logger = Logger.getInstance();

export class Zendesk {
  public session: HttpSession;

  public email: string | null = null;
  public uri: string | null = null;
  public username: string;
  public password: string;

  constructor(username: string, password: string, proxyAgent: HttpsProxyAgent<string>) {
    this.session = new HttpSession(proxyAgent);
    this.username = username;
    this.password = password;
  }

  public async login(): Promise<void> {
    const payload = {
      type: 'auth',
      username: this.username,
      password: this.password,
      remember: false,
      language: 'en_GB'
    }

    await this.initializeSession();
    if (!this.session.cookies.has("asid")) throw new SessionCookieError();

    const res = await this.session.put("https://auth.riotgames.com/api/v1/authorization", payload, null, {
      "Content-Type": "application/json",
    }) as any;
    const data = await res.json();

    if (data?.error === "auth_failure") throw new AuthFailureError();
    if (data?.error === "rate_limited") throw new RateLimitedError();

    if (!this.session.cookies.has("sub")) throw new LoginFailureError();
    this.uri = data.response?.parameters?.uri;

    // const complete = await this.complete();
    // if (!complete) throw new RedirectError();

    // this.email = await this.getEmail();
    // logger.log(this.email + " " + this.uri)
  }

  private async getEmail(): Promise<string | null> {
    const res = await this.session.get("https://support-leagueoflegends.riotgames.com/hc/en-us/requests");
    const body = await res.text();
    console.log(body);
    const regex = /"email":"(.*?)"/g;
    const match = regex.exec(body);
    if (!match) return null;
    return match[1];
  }

  private async complete(): Promise<boolean> {
    if (!this.uri) throw new Error("No uri found");
    const res = await this.session.get(this.uri);
    console.log("complete", res.status);
    if (res.status >= 300 && res.status < 400) {
      return await this.follow(res);
    } else {
      return false;
    }
  }

  private async follow(response: Response): Promise<boolean> {
    const location = response.headers.get("location");
    if (!location) return false;
    // if location contains "FAILED" return false
    console.log("follow", location);
    console.log("follow", "FAILED: " + location.includes("FAILED"));
    if (location.includes("FAILED")) return false;

    const res = await this.session.get(location);
    console.log("follow", res.status);
    if (res.status >= 300 && res.status < 400) {
      return await this.follow(res);
    } else {
      console.log("follow == 200", res.status == 200);
      return res.status == 200;
    }
  }

  private async initializeSession(): Promise<void> {
    await this.getAsidCookie();
  }

  private async getAsidCookie(): Promise<void> {
    const query = "redirect_uri=https://login.playersupport.riotgames.com/login_callback&client_id=player-support-zendesk&ui_locales=en-us%20en-us&response_type=code&scope=openid%20email";
    const res = await this.session.get(`https://auth.riotgames.com/authorize?${query}`);
  }
}