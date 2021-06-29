require("@nomiclabs/hardhat-waffle");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-etherscan");

task("accounts", "Prints the list of accounts", async () => {
    const accounts = await ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

task("deploy", "deploy EulerDAO", async () => {
    const EulerDAO = await ethers.getContractFactory("EulerDAO");
    const ed = await upgrades.deployProxy(EulerDAO, []);
    console.log(`${ed.address}`)
});

task("reg", "register problem", async (args) => {
    const EulerDAO = await ethers.getContractFactory("EulerDAO");
    const ed = await EulerDAO.attach('0xC3a65484e3D59689B318fB23c210a079873CFfbB');
    await ed.register_problem(args.addr);
}).addPositionalParam('addr', 'problem address');

task("problems", "register problem", async (args) => {
    const EulerDAO = await ethers.getContractFactory("EulerDAO");
    const ed = await EulerDAO.attach('0xC3a65484e3D59689B318fB23c210a079873CFfbB');
    console.log(`${await ed.problems(args.target)}`);
}).addPositionalParam('target', 'problem num');

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
