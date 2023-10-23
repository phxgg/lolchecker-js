# lolchecker-js

## Installation

Use **Node v18+** to install the dependencies and run the script.

```bash
$ npm install
```

## Proxy List & Pass List formats

I recommend [Proxy-Cheap](https://app.proxy-cheap.com/r/UCHmnC) for proxies. It's cheap and works fine for me. You can use any proxy provider you want, but make sure to use **HTTP proxies**, and know that rotating proxies would probably work the best.

Your HTTP proxy list file should be in the following formats:

If it does **not** include a username and password:
```
host1:port1
host2:port2
...
```

If it **does** include a username and password:
```
host1:port1:username1:password1
host2:port2:username2:password2
...
```

Your pass list file should be in the following format:
```
password1
password2
...
```

## Usage

Copy `src/config.example.json` into `src/config.json` and configure with your own settings.


Run the script:

```bash
$ npm start
```

If the password is found, it will be printed to the console and saved into `credentials.txt`.
