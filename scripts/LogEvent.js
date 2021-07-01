const fs = require('fs');
const root_dir = '.cache';
const solution_dir = '.cache/solutions';
const timestamp_dir = '.cache/solutions/timestamp';
const score_dir = '.cache/solutions/score';
async function main() {
    const EulerDAO = await ethers.getContractFactory("EulerDAO");
    const ed = await EulerDAO.attach('0xC3a65484e3D59689B318fB23c210a079873CFfbB');
    let data = get();
    const confirmation = 12;
    const to = await ethers.getDefaultProvider().getBlockNumber() - confirmation;
    const from = Math.min(data.syncblock || 0, to - 4096);
    const fx = ed.filters.Compete(null);
    const fy = ed.filters.Challenge(null);
    const fz = ed.filters.Transfer(ethers.constants.AddressZero, null, null);
    const ex = await ed.queryFilter(fx, from, to);
    const ey = await ed.queryFilter(fy, from, to);
    const ez = await ed.queryFilter(fz, from, to);
    data.syncblock = to;
    prepare_dir();

    write_pool = []
    for (const e of ez) {
        content = [e.blockNumber, e.transactionIndex]
        var filename = format(e.args.tokenId);
        const res = fs.writeFileSync(`${timestamp_dir}/${filename}.json`, JSON.stringify(content));
        write_pool.push(res);
    }
    await Promise.all(write_pool);


    score_pool = []
    for (const e of  [...ex, ...ey]) {
        score_pool.push(produce_solution_score(ed, e.args.id));
    }

    active_solution = {}
    await Promise.all(score_pool).then((values) => values.forEach((v) => {
        if (ethers.BigNumber.from(v.score).gt(0)) {
            id = v.id;
            delete v['id'];
            active_solution[id] = v;
        }
    }));
    fs.writeFileSync(`${solution_dir}/active_solution.json`, JSON.stringify(active_solution));
}

async function produce_solution_score(ed, id) {
    var filename = format(id);
    const raw = fs.readFileSync(`${timestamp_dir}/${filename}.json`);
    const content = {timestamp: JSON.parse(raw)};
    content.score = (await ed.scores(id)).toHexString();
    content.target = (await ed.targets(id)).toHexString();
    fs.writeFileSync(`${score_dir}/${filename}.json`, JSON.stringify(content));
    content.id = filename;
    return content;
}

function prepare_dir() {
    if (!fs.existsSync(root_dir)) {
        fs.mkdirSync(root_dir);
    }
    if (!fs.existsSync(solution_dir)) {
        fs.mkdirSync(solution_dir);
    }
    if (!fs.existsSync(timestamp_dir)) {
        fs.mkdirSync(timestamp_dir);
    }
    if (!fs.existsSync(score_dir)) {
        fs.mkdirSync(score_dir);
    }
}

function get() {
    try {
        const fs = require('fs');
        const content = fs.readFileSync('.cache/LogEvent.json');
        return JSON.parse(content);
    } catch {
        return {};
    }
}

function set(data) {
    const content = JSON.stringify(data);
    const fs = require('fs');
    fs.writeFileSync('.cache/LogEvent.json', content);
}

function format(bigNumber) {
    bigNumber = bigNumber.toHexString()
    return '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000'.substring(0, 68 - bigNumber.length) + bigNumber.substring(2)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });