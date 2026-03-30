// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "./KrypVault.sol";

contract KrypVaultFactory {
    address[] public allVaults;
    mapping(address => address[]) public employerVaults;

    event VaultCreated(address indexed employer, address vault);

    function createVault(address token) external returns (address) {
        KrypVault vault = new KrypVault(token, msg.sender);

        address vaultAddress = address(vault);

        allVaults.push(vaultAddress);
        employerVaults[msg.sender].push(vaultAddress);

        emit VaultCreated(msg.sender, vaultAddress);

        return vaultAddress;
    }

    function getVaults(address employer) external view returns (address[] memory) {
        return employerVaults[employer];
    }

    function getAllVaults() external view returns (address[] memory) {
        return allVaults;
    }
}