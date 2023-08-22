import { HttpsProxyAgent } from "https-proxy-agent";
import fetch, { Response } from "node-fetch";

export type Cookies = Map<string, string | undefined>;

export class HttpSession {
  public proxyAgent: HttpsProxyAgent<string>;
  public cookies: Cookies;

  constructor(proxyAgent: HttpsProxyAgent<string>) {
    this.proxyAgent = proxyAgent;
    this.cookies = new Map<string, string | undefined>();
  }

  public async get(url: string, headers?: any): Promise<Response> {
    const res = await fetch(url, {
      agent: this.proxyAgent,
      redirect: "manual",
      method: "GET",
      headers: {
        "Cookie": this.stringifyCookies(),
        ...headers
      },
    });

    this.updateCookies(res);
    return res;
  }

  public async put(url: string, data: any, options?: any, headers?: any): Promise<Response> {
    const res = await fetch(url, {
      agent: this.proxyAgent,
      method: "PUT",
      redirect: "manual",
      headers: {
        "Cookie": this.stringifyCookies(),
        ...headers
      },
      ...options,
      body: JSON.stringify(data)
    });

    this.updateCookies(res);
    return res;
  }

  public async getFollow(url: string, headers?: any): Promise<Response> {
    const res = await fetch(url, {
      agent: this.proxyAgent,
      redirect: "follow",
      method: "GET",
      headers: {
        "Cookie": this.stringifyCookies(),
        ...headers
      },
    });

    this.updateCookies(res);
    return res;
  }

  public async post(url: string, data: any, options?: any, headers?: any): Promise<Response> {
    const res = await fetch(url, {
      agent: this.proxyAgent,
      method: "POST",
      redirect: "manual",
      headers: {
        "Cookie": this.stringifyCookies(),
        ...headers
      },
      ...options,
      body: JSON.stringify(data)
    });

    this.updateCookies(res);
    return res;
  }

  public stringifyCookies(): string {
    let result = "";

    for (const [key, value] of this.cookies) {
      result += `${key}=${value}`;
      // if it's not last index add a semicolon
      if (this.cookies.size - 1 !== Array.from(this.cookies.keys()).indexOf(key)) {
        result += "; ";
      }
    }

    return result.trim();
  }

  private parseSetCookie(response: Response): Cookies {
    const cookies: Cookies = new Map<string, string | undefined>();

    const setCookie = response.headers.raw()['set-cookie'];
    if (!setCookie) return cookies;

    for (const value of setCookie) {
      const [key, ...rest] = value.split("=");
      const remainder = rest.join("=");
      cookies.set(key, remainder);
    }

    return cookies;
  }

  private updateCookies(response: Response) {
    const cookies = this.parseSetCookie(response);

    for (const [key, value] of cookies) {
      this.cookies.set(key, value);
    }
  }
}
