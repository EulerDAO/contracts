# Contracts

Smart Contracts of EulerDAO

# Development

run the following command to install requirments and then follow <https://hardhat.org/>

```sh
npm install
```

## Local Configs

optionally a `.dev.config.js` can be place in the workspace root like this.

> debug condig, private credentials and API key can be placed here, you can check [hardhat.config.js](hardhat.config.js) to see how it is loaded.

```js
module.exports = function (config) {
    config.networks = {
        hardhat: {
            forking: {
            }
        }
    }
}
```

# Contribute

1. private local configs should never be uploaded
2. `.gitignore` should not be uploaded (you can add `.gitignore` into `.gitignore`)
3. format the the code style
