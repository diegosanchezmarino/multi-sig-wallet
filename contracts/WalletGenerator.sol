// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "./Wallet.sol";

contract WalletGenerator {
    mapping(address => address[]) public wallets;

    event WalletCreated(address walletAddress, address creatorAddress);

    function getWalletsForAddress(address _addressFrom)
        public
        view
        returns (address[] memory)
    {
        return wallets[_addressFrom];
    }

    function createWallet(address[] memory _approvers, uint256 _quorum)
        external
    {
        Wallet newWallet = new Wallet(_approvers, _quorum);
        for (uint256 i = 0; i < _approvers.length; i++) {
            wallets[_approvers[i]].push(address(newWallet));
        }
        emit WalletCreated(address(newWallet), msg.sender);
    }
}
