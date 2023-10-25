# lolchecker-js

lolchecker-js is a Node.js script that tries to bruteforce its way into a League of Legends account, of which we know the username, using a list of passwords. It uses HTTP proxies to avoid IP rate limiting.

## Installation

Use **Node v18+** to install the dependencies and run the script.

```sh
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

I recommend checking out [CrackStation](https://crackstation.net/crackstation-wordlist-password-cracking-dictionary.htm) for password lists. You can use any password list you want, but make sure to use **one password per line**.

Your pass list file should be in the following format:
```
password1
password2
...
```

## Usage

Copy `src/config.example.json` into `src/config.json` and configure with your own settings.


Run the script:

```sh
$ npm start
```

If the password is found, it will be printed to the console and saved into `credentials.txt`.

## Disclaimer

This script is for educational purposes only. I am not responsible for any actions for anyone who uses this script. Use at your own risk.
