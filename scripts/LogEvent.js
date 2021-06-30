async function main() {
    const EulerDAO = await ethers.getContractFactory("EulerDAO");
    const ed = await EulerDAO.attach('0xC3a65484e3D59689B318fB23c210a079873CFfbB');
    let data = get();
    const confirmation = 12;
    const to = await ethers.getDefaultProvider().getBlockNumber() - confirmation;
    const from = Math.min(data.syncblock || 0, to - 4096);
    const fx = ed.filters.Compete(null);
    const fy = ed.filters.Challenge(null);
    const ex = await ed.queryFilter(fx, from, to);
    const ey = await ed.queryFilter(fy, from, to);
    data.syncblock = to;
    // set(data)
    const events = [...ex, ...ey];
    for (const e of events) {
        const id = e.args.id;
        
        console.log(e.args.id);
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

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });