require("@nomiclabs/hardhat-waffle");
require("@openzeppelin/hardhat-upgrades");

task("accounts", "Prints the list of accounts", async () => {
    const accounts = await ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

const config = {
    solidity: "0.8.5",
    settings: {
        optimizer: {
            enabled: true,
            runs: 2048
        }
    },
};

try {
    require('./.dev.config.js')(config)
} catch {
}

module.exports = config
