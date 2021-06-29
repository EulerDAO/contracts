async function main() {
    const EulerDAO = await ethers.getContractFactory("EulerDAO");
    const ed = await EulerDAO.attach('0xC3a65484e3D59689B318fB23c210a079873CFfbB');
    let data = get();
    try {
        await ed.problems(data);
        data += 1;
    } catch {
    } finally {
        set(data)
    }
}

function get() {
    try {
        const fs = require('fs');
        const content = fs.readFileSync('.cache/CountProblems.json');
        return JSON.parse(content);
    } catch {
        return 0;
    }
}

function set(data) {
    const content = JSON.stringify(data);
    const fs = require('fs');
    fs.writeFileSync('.cache/CountProblems.json', content);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });