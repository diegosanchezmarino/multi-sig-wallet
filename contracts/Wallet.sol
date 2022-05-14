// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

contract Wallet {
    
    address[] public approvers;
    uint256 public quorum;

    struct Transfer {
        uint256 id;
        uint256 amount;
        address payable to;
        uint256 approvals;
        bool sent;
    }

    event TransferCreated(uint256 id, uint256 amount, address to);
    event TransferApproved(uint256 id, address approver);
    event TransferSent(uint256 id);

    Transfer[] public transfers;
    mapping(address => mapping(uint256 => bool)) public approvals;

    constructor(address[] memory _approvers, uint256 _quorum) {
        approvers = _approvers;
        quorum = _quorum;
    }

    function getApprovers() external view returns (address[] memory) {
        return approvers;
    }

    function getTransfers() external view returns (Transfer[] memory) {
        return transfers;
    }

    function createTransfer(uint256 amount, address payable to)
        external
        onlyApprover
    {
        transfers.push(Transfer(transfers.length, amount, to, 0, false));
        emit TransferCreated(transfers.length - 1, amount, to);
    }

    function approveTransfer(uint256 id) external onlyApprover {
        Transfer storage transfer = transfers[id];

        require(!transfer.sent, "transfer already sent");
        require(!approvals[msg.sender][id], "transfer already approved");

        approvals[msg.sender][id] = true;
        transfer.approvals++;
        emit TransferApproved(id, msg.sender);

        if (transfer.approvals > quorum) {
            transfer.sent = true;
            address payable to = transfer.to;
            uint256 amount = transfer.amount;
            to.call{value: amount}("");
            emit TransferSent(id);
        }
    }

    modifier onlyApprover() {
        bool isApprover = false;
        for (uint256 i = 0; i < approvers.length; i++) {
            if (approvers[i] == msg.sender) {
                isApprover = true;
            }
        }
        require(isApprover, "not allowed, not an approver");
        _;
    }

    receive() external payable {}
}
