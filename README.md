# lolchecker-js

## Installation

Use **Node v18+** to install the dependencies and run the script.

```bash
$ npm install
```

## Proxy List & Pass List formats

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
