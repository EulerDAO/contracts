describe("Euler DAO", function () {
    const ctx = {};

    before(async function () {
        const chai = require("chai");
        const cap = require("chai-as-promised");
        chai.use(cap);
        chai.should();
    });
    before(async function () {
        const EulerDAO = await ethers.getContractFactory("EulerDAO");
        const ed = await upgrades.deployProxy(EulerDAO, []);
        await ed.deployed();
        const SampleProblem = await ethers.getContractFactory("SampleProblem");
        const sampleProblem = await SampleProblem.deploy();
        await sampleProblem.deployed();
        await ed.register_problem(sampleProblem.address);
        ctx.ed = ed;
        [ctx.owner, ctx.solver, ctx.challenger] = await ethers.getSigners();
    })
    it("lock solution", async function () {
        const SampleSolution = await artifacts.readArtifact('SampleSolution');
        const addr = await ctx.ed.addr(0, ethers.utils.keccak256(SampleSolution.bytecode));
        const code = SampleSolution.deployedBytecode.replace('0000000000000000000000000000000000000000', addr.substring(2));
        const digest = ethers.utils.keccak256(code);
        await ctx.ed.connect(ctx.solver).lock_solution(0, digest);
        await ctx.ed.ownerOf(0).should.eventually.equal(ctx.solver.address);
    });
    it("submit worong solution", async function () {
        const SampleSolution = await artifacts.readArtifact('SampleProblem');
        await ctx.ed.submit_code(0, SampleSolution.bytecode).should.be.rejected;
    });
    it("submit solution", async function () {
        const SampleSolution = await artifacts.readArtifact('SampleSolution');
        await ctx.ed.submit_code(0, SampleSolution.bytecode);
        await ctx.ed.scores(0).should.eventually.equal(0);
    });
    it("compete by others", async function () {
        await ctx.ed.compete(0, 20000, { value: ethers.utils.parseEther('2') }).should.be.rejected;
        await ctx.ed.scores(0).should.eventually.equal(0);
    });
    it("compete without pay", async function () {
        await ctx.ed.connect(ctx.solver).compete(0, 773, { value: ethers.utils.parseEther('1') }).should.be.rejected;
        await ctx.ed.scores(0).should.eventually.equal(0);
    });
    it("compete", async function () {
        await ctx.ed.connect(ctx.solver).compete(0, 773, { value: ethers.utils.parseEther('2') });
        await ctx.ed.scores(0).should.eventually.equal(773);
    });
    it("lock challenge", async function () {
        const SampleSolution = new ethers.utils.Interface(['function max(uint256 a, uint256 b) external pure returns (uint256)']);
        const challenge = SampleSolution.encodeFunctionData('max', [1, 2]);
        await ctx.ed.connect(ctx.challenger).lock_challenge(ethers.utils.keccak256(challenge));
    });
    it("challenge by others", async function () {
        const SampleSolution = new ethers.utils.Interface(['function max(uint256 a, uint256 b) external pure returns (uint256)']);
        const challenge = SampleSolution.encodeFunctionData('max', [1, 2]);
        await ctx.ed.challenge(0, challenge).should.be.rejected;
    });
    it("challenge", async function () {
        const SampleSolution = new ethers.utils.Interface(['function max(uint256 a, uint256 b) external pure returns (uint256)']);
        const challenge = SampleSolution.encodeFunctionData('max', [1, 2]);
        await ctx.ed.connect(ctx.challenger).challenge(0, challenge);
        await ctx.ed.scores(0).should.eventually.equal(0);
    });
    it("compete", async function () {
        await ctx.ed.connect(ctx.solver).compete(0, 774, { value: ethers.utils.parseEther('2') });
        await ctx.ed.scores(0).should.eventually.equal(774);
    });
    it("challenge fail", async function () {
        const SampleSolution = new ethers.utils.Interface(['function max(uint256 a, uint256 b) external pure returns (uint256)']);
        const challenge = SampleSolution.encodeFunctionData('max', [2, 3]);
        await ctx.ed.connect(ctx.challenger).lock_challenge(ethers.utils.keccak256(challenge));
        await ctx.ed.connect(ctx.challenger).challenge(0, challenge).should.be.rejected;
    });
    it("challenge fail", async function () {
        const SampleSolution = new ethers.utils.Interface(['function mox(uint256 a, uint256 b) external pure returns (uint256)']);
        const challenge = SampleSolution.encodeFunctionData('mox', [2, 3]);
        await ctx.ed.connect(ctx.challenger).lock_challenge(ethers.utils.keccak256(challenge));
        await ctx.ed.connect(ctx.challenger).challenge(0, challenge).should.be.rejected;
    });
    it("challenge fail", async function () {
        const SampleSolution = new ethers.utils.Interface(['function max(uint256 a, uint256 b) external pure returns (uint256)']);
        const challenge = SampleSolution.encodeFunctionData('max', [ethers.constants.MaxUint256, ethers.constants.MaxUint256]);
        await ctx.ed.connect(ctx.challenger).lock_challenge(ethers.utils.keccak256(challenge));
        await ctx.ed.connect(ctx.challenger).challenge(0, challenge).should.be.rejected;
    });
    it("solution fake", async function () {
        const SampleSolutionFake = await artifacts.readArtifact('SampleSolutionFake');
        const addr = await ctx.ed.addr(0, ethers.utils.keccak256(SampleSolutionFake.bytecode));
        const code = SampleSolutionFake.deployedBytecode.replace('0000000000000000000000000000000000000000', addr.substring(2));
        const digest = ethers.utils.keccak256(code);
        await ctx.ed.connect(ctx.solver).lock_solution(0, digest);
        await ctx.ed.ownerOf(1).should.eventually.equal(ctx.solver.address);
        await ctx.ed.submit_code(1, SampleSolutionFake.bytecode);
        await ctx.ed.connect(ctx.solver).compete(1, 10000, { value: ethers.utils.parseEther('2') });
    });
    it("solution fake challenge", async function () {
        const SampleSolution = new ethers.utils.Interface(['function max(uint256 a, uint256 b) external pure returns (uint256)']);
        const challenge = SampleSolution.encodeFunctionData('max', [3, 5]);
        await ctx.ed.connect(ctx.challenger).lock_challenge(ethers.utils.keccak256(challenge));
        await ctx.ed.connect(ctx.challenger).challenge(1, challenge);
    });
    it("solution spam", async function () {
        const SampleSolutionSpam = await artifacts.readArtifact('SampleSolutionSpam');
        const addr = await ctx.ed.addr(0, ethers.utils.keccak256(SampleSolutionSpam.bytecode));
        const code = SampleSolutionSpam.deployedBytecode.replace('0000000000000000000000000000000000000000', addr.substring(2));
        const digest = ethers.utils.keccak256(code);
        await ctx.ed.connect(ctx.solver).lock_solution(0, digest);
        await ctx.ed.ownerOf(2).should.eventually.equal(ctx.solver.address);
        await ctx.ed.submit_code(2, SampleSolutionSpam.bytecode);
        await ctx.ed.connect(ctx.solver).compete(2, 10000, { value: ethers.utils.parseEther('2') });
    });
    it("solution spam challenge", async function () {
        const SampleSolution = new ethers.utils.Interface(['function max(uint256 a, uint256 b) external pure returns (uint256)']);
        const challenge = SampleSolution.encodeFunctionData('max', [4, 5]);
        await ctx.ed.connect(ctx.challenger).lock_challenge(ethers.utils.keccak256(challenge));
        await ctx.ed.connect(ctx.challenger).challenge(2, challenge);
    });
});
