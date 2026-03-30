// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract MinimalVault {
    mapping(address => euint128) private allocations;

    function setAllocation(address worker, InEuint128 calldata encAmount) external {
        euint128 handle = FHE.asEuint128(encAmount);
        FHE.allowThis(handle);
        FHE.allow(handle, worker);
        allocations[worker] = handle;
    }

    function getAllocationHandle(address worker) external view returns (euint128) {
        return allocations[worker];
    }
}
