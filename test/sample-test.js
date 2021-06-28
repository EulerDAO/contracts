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
        const SampleSolution = await ethers.getContractFactory('SampleSolution');
        const digest = ethers.utils.keccak256(SampleSolution.bytecode);
        await ctx.ed.connect(ctx.solver).lock_solution(digest, 0);
        await ctx.ed.ownerOf(digest).should.eventually.equal(ctx.solver.address);
        ctx.digest = digest;
    });
    it("submit solution", async function () {
        const SampleSolution = await ethers.getContractFactory('SampleSolution');
        await ctx.ed.submit_code(SampleSolution.bytecode);
    });
    it("compete by others", async function () {
        await ctx.ed.compete(ctx.digest, 20000, { value: ethers.utils.parseEther('2') }).should.be.rejected;
        await ctx.ed.scores(ctx.digest).should.eventually.equal(0);
    });
    it("compete without pay", async function () {
        await ctx.ed.connect(ctx.solver).compete(ctx.digest, 500, { value: ethers.utils.parseEther('1') }).should.be.rejected;
        await ctx.ed.scores(ctx.digest).should.eventually.equal(0);
    });
    it("compete", async function () {
        await ctx.ed.connect(ctx.solver).compete(ctx.digest, 500, { value: ethers.utils.parseEther('2') });
        await ctx.ed.scores(ctx.digest).should.eventually.equal(500);
    });
    it("lock challenge", async function () {
        const SampleSolution = new ethers.utils.Interface(['function max(uint256 a, uint256 b) external pure returns (uint256)']);
        const challenge = SampleSolution.encodeFunctionData('max', [1, 2]);
        await ctx.ed.connect(ctx.challenger).lock_challenge(ctx.digest);
    });
    it("challenge by others", async function () {
        const SampleSolution = new ethers.utils.Interface(['function max(uint256 a, uint256 b) external pure returns (uint256)']);
        const challenge = SampleSolution.encodeFunctionData('max', [1, 2]);
        await ctx.ed.challenge(ctx.digest, challenge).should.be.rejected;
    });
    it("challenge", async function () {
        const SampleSolution = new ethers.utils.Interface(['function max(uint256 a, uint256 b) external pure returns (uint256)']);
        const challenge = SampleSolution.encodeFunctionData('max', [1, 2]);
        await ctx.ed.connect(ctx.challenger).challenge(ctx.digest, challenge);
        await ctx.ed.scores(ctx.digest).should.eventually.equal(0);
    });
    it("compete", async function () {
        await ctx.ed.connect(ctx.solver).compete(ctx.digest, 774, { value: ethers.utils.parseEther('2') });
        await ctx.ed.scores(ctx.digest).should.eventually.equal(774);
    });
    it("challenge fail", async function () {
        const SampleSolution = new ethers.utils.Interface(['function max(uint256 a, uint256 b) external pure returns (uint256)']);
        const challenge = SampleSolution.encodeFunctionData('max', [1, 2]);
        await ctx.ed.connect(ctx.challenger).challenge(ctx.digest, challenge).should.be.rejected;
    });
    it("challenge fail", async function () {
        const SampleSolution = new ethers.utils.Interface(['function mox(uint256 a, uint256 b) external pure returns (uint256)']);
        const challenge = SampleSolution.encodeFunctionData('mox', [2, 3]);
        await ctx.ed.connect(ctx.challenger).challenge(ctx.digest, challenge).should.be.rejected;
    });
    it("challenge fail", async function () {
        const SampleSolution = new ethers.utils.Interface(['function max(uint256 a, uint256 b) external pure returns (uint256)']);
        const challenge = SampleSolution.encodeFunctionData('max', [ethers.constants.MaxUint256, ethers.constants.MaxUint256]);
        await ctx.ed.connect(ctx.challenger).challenge(ctx.challenger, challenge).should.be.rejected;
    });
    it("solution fake", async function () {
        const SampleSolutionFake = await ethers.getContractFactory('SampleSolutionFake');
        const digest = ethers.utils.keccak256(SampleSolutionFake.bytecode);
        await ctx.ed.connect(ctx.solver).lock_solution(digest, 0);
        await ctx.ed.ownerOf(digest).should.eventually.equal(ctx.solver.address);
        await ctx.ed.submit_code(SampleSolutionFake.bytecode);
        await ctx.ed.connect(ctx.solver).compete(digest, 10000, { value: ethers.utils.parseEther('2') });
        const SampleSolution = new ethers.utils.Interface(['function max(uint256 a, uint256 b) external pure returns (uint256)']);
        const challenge = SampleSolution.encodeFunctionData('max', [3, 5]);
        await ctx.ed.connect(ctx.challenger).lock_challenge(digest);
        await ctx.ed.connect(ctx.challenger).challenge(digest, challenge);
    });
    it("solution spam", async function () {
        const SampleSolutionSpam = await ethers.getContractFactory('SampleSolutionSpam');
        const digest = ethers.utils.keccak256(SampleSolutionSpam.bytecode);
        await ctx.ed.connect(ctx.solver).lock_solution(digest, 0);
        await ctx.ed.ownerOf(digest).should.eventually.equal(ctx.solver.address);
        await ctx.ed.submit_code(SampleSolutionSpam.bytecode);
        await ctx.ed.connect(ctx.solver).compete(digest, 10000, { value: ethers.utils.parseEther('2') });
        const SampleSolution = new ethers.utils.Interface(['function max(uint256 a, uint256 b) external pure returns (uint256)']);
        const challenge = SampleSolution.encodeFunctionData('max', [3, 5]);
        await ctx.ed.connect(ctx.challenger).lock_challenge(digest);
        await ctx.ed.connect(ctx.challenger).challenge(digest, challenge);
    });
});
