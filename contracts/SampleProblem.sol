// SPDX-License-Identifier: MIT

pragma solidity ^0.8.5;

contract SampleProblem {
    function check(
        bool ok,
        bytes calldata i,
        bytes calldata o
    ) external view {
        require(bytes4(i[:4]) == 0x6d5433e6);
        (uint256 x, uint256 y) = abi.decode(i[4:], (uint256, uint256));
        if (!ok) {
            return;
        }
        try this.decode(o) returns (uint256 z) {
            if (z == x && z >= y) {
                revert();
            }
            if (z == y && z >= x) {
                revert();
            }
        } catch {
            return;
        }
    }

    function decode(bytes calldata data) external pure returns (uint256) {
        return abi.decode(data, (uint256));
    }
}
