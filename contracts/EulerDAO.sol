// SPDX-License-Identifier: MIT

pragma solidity ^0.8.5;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/Create2Upgradeable.sol";

contract EulerDAO is
    Initializable,
    OwnableUpgradeable,
    ERC721EnumerableUpgradeable
{
    address[] public problems;
    mapping(uint256 => uint256) public targets;
    mapping(uint256 => uint256) public scores;
    mapping(uint256 => uint256) public timestamps;
    mapping(uint256 => address) public challengers;

    event Compete(uint256 indexed id);
    event Challenge(uint256 indexed id);

    function initialize() public initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __ERC165_init_unchained();
        __ERC721_init_unchained("Euler Solution", "EULARS");
    }

    function lock_solution(uint256 id, uint256 target) public {
        _mint(msg.sender, id);
        targets[id] = target;
    }

    function submit_code(bytes memory code) external {
        Create2Upgradeable.deploy(0, 0, code);
    }

    function compete(uint256 id, uint256 score) external payable {
        require(msg.sender == ownerOf(id));
        require(scores[id] == 0);
        uint256 st = cost_gas(score) + cost_base();
        require(msg.value >= st);
        scores[id] = score;
        emit Compete(id);
    }

    function lock_challenge(uint256 id) public payable {
        uint256 duration = block.timestamp - timestamps[id];
        duration = duration >> 3;
        if (duration > 128) {
            duration = 128;
        }
        uint256 fee = 0xffffffffffffffffffffffffffffffff / (1 << duration);
        require(msg.value >= fee);
        timestamps[id] = block.timestamp;
        challengers[id] = msg.sender;
    }

    function challenge(uint256 id, bytes calldata i) external payable {
        require(challengers[id] == msg.sender);
        uint256 score = scores[id];
        require(score > 0);
        address sol = Create2Upgradeable.computeAddress(0, bytes32(id));
        (bool ok, bytes memory o) = sol.staticcall{gas: score}(i);
        I(problems[targets[id]]).check(ok, i, o);
        delete scores[id];
        payable(msg.sender).transfer(cost_gas(score) + cost_base() / 2);
        emit Challenge(id);
    }

    function revoke(uint256 id) external payable {
        uint256 score = scores[id];
        require(challengers[id] == msg.sender);
        require(msg.sender == ownerOf(id));
        require(score > 0);
        delete scores[id];
        payable(msg.sender).transfer(cost_gas(score) + cost_base() / 2);
        emit Challenge(id);
    }

    function register_problem(address problem) external onlyOwner {
        problems.push(problem);
    }

    function cost_gas(uint256 gl) internal pure returns (uint256) {
        return 100 * 1e9 * gl;
    }

    function cost_base() internal pure returns (uint256) {
        return 1e18;
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
