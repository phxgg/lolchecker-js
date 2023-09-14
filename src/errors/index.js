export class AuthFailureError extends Error {
  constructor() {
    super('AUTH_FAILURE');
    this.name = 'AuthFailureError';
  }
}

export class LoginFailureError extends Error {
  constructor() {
    super('LOGIN_FAILURE');
    this.name = 'LoginFailureError';
  }
}

export class RateLimitedError extends Error {
  constructor() {
    super('RATE_LIMITED');
    this.name = 'RateLimitedError';
  }
}

export class RedirectError extends Error {
  constructor() {
    super('REDIRECT_ERROR');
    this.name = 'RedirectError';
  }
}

export class SessionCookieError extends Error {
  constructor() {
    super('MISSING_ASID_COOKIE');
    this.name = 'SessionCookieError';
  }
}

export class UnknownError extends Error {
  constructor() {
    super('UNKNOWN_ERROR');
    this.name = 'UnknownError';
  }
}
