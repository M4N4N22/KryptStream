// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMockTaskManagerView {
    function mockStorage(uint256 ctHash) external view returns (uint256);
}

contract KrypVault {
    address private constant MOCK_TASK_MANAGER_ADDRESS =
        0xeA30c4B8b44078Bbf8a6ef5b9f1eC1626C7848D9;

    IERC20 public immutable token;
    uint256 public totalDeposited;
    mapping(address => euint128) private encryptedAllocations;
    mapping(address => bool) public hasAllocation;
    address public employer;

    error OnlyEmployer();
    error TransferFailed();
    error ClaimAmountPending();

    constructor(address tokenAddress, address _employer) {
        token = IERC20(tokenAddress);
        employer = _employer;
    }

    modifier onlyEmployer() {
        if (msg.sender != employer) revert OnlyEmployer();
        _;
    }

    function isEmployer(address user) external view returns (bool) {
        return user == employer;
    }

    function deposit(uint256 amount) external onlyEmployer {
        if (!token.transferFrom(msg.sender, address(this), amount))
            revert TransferFailed();
        totalDeposited += amount;
    }

    function setAllocation(
        address worker,
        InEuint128 calldata encAmount
    ) external onlyEmployer {
        euint128 handle = FHE.asEuint128(encAmount);
        FHE.allowThis(handle);
        FHE.allow(handle, worker);
        encryptedAllocations[worker] = handle;
        hasAllocation[worker] = true;
    }

    event AllocationSet(address indexed worker);

    function claim() external {
        euint128 encVaultBal = FHE.asEuint128(uint128(totalDeposited));
        ebool canClaim = FHE.lte(encryptedAllocations[msg.sender], encVaultBal);
        euint128 safeAmount = FHE.select(
            canClaim,
            encryptedAllocations[msg.sender],
            FHE.asEuint128(0)
        );

        euint128 zeroHandle = FHE.asEuint128(0);
        FHE.allowThis(zeroHandle);
        FHE.allow(zeroHandle, msg.sender);
        encryptedAllocations[msg.sender] = zeroHandle;
        hasAllocation[msg.sender] = false;

        uint128 plainAmount = _resolveTransferAmount(safeAmount);
        if (plainAmount == 0) {
            return;
        }

        totalDeposited -= plainAmount;

        // TODO TASK-005: replace with Privara SDK disbursement
        if (!token.transfer(msg.sender, plainAmount)) revert TransferFailed();
    }

    function getAllocationHandle(
        address worker
    ) external view returns (euint128) {
        return encryptedAllocations[worker];
    }

    function revokeAllocation(address worker) external onlyEmployer {
        euint128 zeroHandle = FHE.asEuint128(0);
        FHE.allowThis(zeroHandle);
        FHE.allow(zeroHandle, worker);
        encryptedAllocations[worker] = zeroHandle;
        hasAllocation[worker] = false;
    }

    function _resolveTransferAmount(
        euint128 amountHandle
    ) internal returns (uint128) {
        FHE.decrypt(amountHandle);
        (uint128 plainAmount, bool decrypted) = FHE.getDecryptResultSafe(
            amountHandle
        );
        if (decrypted) {
            return plainAmount;
        }

        if (block.chainid == 31337) {
            return
                uint128(
                    IMockTaskManagerView(MOCK_TASK_MANAGER_ADDRESS).mockStorage(
                        euint128.unwrap(amountHandle)
                    )
                );
        }

        revert ClaimAmountPending();
    }
}
