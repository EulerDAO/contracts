// SPDX-License-Identifier: MIT

pragma solidity ^0.8.5;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/Create2Upgradeable.sol";

contract EulerDAO is Initializable, OwnableUpgradeable, ERC721Upgradeable {
    address[] public problems;
    uint256[] public targets;
    bytes32[] public digests;
    address[] public solutions;
    uint256[] public scores;
    uint256 public staking;
    mapping(bytes32 => uint256) timestamps;
    mapping(bytes32 => address) challengers;

    event Problem(uint256 indexed target, address indexed problem);
    event Solution(uint256 indexed id, address indexed solution);
    event Compete(uint256 indexed id, uint256 indexed score);
    event Challenge(uint256 indexed id, uint256 indexed score);

    function initialize() public initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __ERC165_init_unchained();
        __ERC721_init_unchained("Euler Solution", "EULARS");
    }

    function lock_solution(uint256 target, bytes32 digest) public {
        _mint(msg.sender, targets.length);
        targets.push(target);
        digests.push(digest);
        solutions.push(address(0));
        scores.push(0);
    }

    function submit_code(uint256 id, bytes memory code) external payable {
        address sol = Create2Upgradeable.deploy(0, bytes32(targets[id]), code);
        bytes32 digest;
        assembly {
            digest := extcodehash(sol)
        }
        require(digest == digests[id]);
        solutions[id] = sol;
        emit Solution(id, sol);
    }

    function compete(uint256 id, uint256 score) external payable {
        uint256 st = cost(score);
        require(msg.value >= st);
        require(msg.sender == ownerOf(id));
        scores[id] = score;
        staking += st;
        emit Compete(id, score);
    }

    function lock_challenge(bytes32 digest) public {
        require(timestamps[digest] + 10 minutes < block.timestamp);
        timestamps[digest] = block.timestamp;
        challengers[digest] = msg.sender;
    }

    function challenge(uint256 id, bytes calldata i) external payable {
        require(challengers[keccak256(i)] == msg.sender);
        uint256 gas = scores[id];
        require(gas > 0);
        (bool ok, bytes memory o) = solutions[id].staticcall{gas: gas}(i);
        I(problems[targets[id]]).check(ok, i, o);
        scores[id] = 0;
        uint256 st = cost(gas);
        uint256 tax = cost(0) / 2;
        staking -= st;
        payable(msg.sender).transfer(st - tax);
        emit Challenge(id, gas);
    }

    function register_problem(address problem) external onlyOwner {
        problems.push(problem);
        emit Problem(problems.length - 1, problem);
    }

    function claim_donation() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance - staking);
    }

    function addr(uint256 tgt, bytes32 h) external view returns (address) {
        return Create2Upgradeable.computeAddress(bytes32(tgt), h);
    }

    function cost(uint256 gl) internal pure returns (uint256) {
        return 100 * 1e9 * gl + 1e18;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://eulerdao.github.io/solutions/index?id=";
    }

    receive() external payable {}
}

interface I {
    function check(
        bool,
        bytes calldata,
        bytes calldata
    ) external view;
}
