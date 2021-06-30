const fs = require('fs');
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
    const cached = {};
    data.syncblock = to;

    for (const e of ez) {
        if (cached[e.args.tokenId]) {continue;}
        cached[e.args.tokenId] = true;

        content = {
            mint_time: [e.blockNumber, e.transactionIndex],
            score: await ed.scores(e.args.tokenId),
            target: await ed.targets(e.args.tokenId),
        }
        const dir = '.cache/solutions';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        var filename = format(e.args.tokenId);
        fs.writeFileSync(`${dir}/${filename}.json`, JSON.stringify(content));
    }

    // set(data)
    const events = [...ex, ...ey];
    for (const e of events) {
        const id = e.args.id;
        var filename = format(e.args.id);
        const raw = fs.readFileSync(`.cache/solutions/${filename}.json`);
        const content = JSON.parse(raw);
        content.score = ethers.BigNumber.from(content.score.hex);
        content.target = ethers.BigNumber.from(content.target.hex);

        if (!cached[e.args.id]) {
            cached[e.args.id] = true;
            content.score = await ed.scores(e.args.id);
            content.target = await ed.targets(e.args.id);
            fs.writeFileSync(`.cache/solutions/${filename}.json`, JSON.stringify(content));
        }
        {
            const filename = format(content.target);
            let solutions = [];
            try{
                const raw = fs.readFileSync(`.cache/problems/${filename}.json`);
                solutions = JSON.parse(raw);
            } catch {}
            const index = solutions.indexOf(content.target);
            if (index > 0) {
                solutions[index] = content;
            } else {
                solutions.push(content);
            }
            solutions.sort((x,y)=>{
                if (x.score > y.score) {return 1}
                if (x.score < y.score) {return -1}
                if (x.mint_time[0] > y.score[0]) {return 1}
                if (x.mint_time[0] < y.mint_time[0]) {return -1}
                if (x.mint_time[1] > y.mint_time[1]) {return 1}
                if (x.mint_time[1] > y.mint_time[1]) {return -1}
                return 1;
            });
            const dir = '.cache/problems';
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            fs.writeFileSync(`${dir}/${filename}.json`, JSON.stringify(solutions));
        }
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
    return '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000'.substring(0,68 - bigNumber.length) + bigNumber.substring(2)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });