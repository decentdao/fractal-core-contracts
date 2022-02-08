//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

/**
 * @dev Contract module which acts as the pass through for all DAO Types. 
 * Allows future extendability by deploying other DAO Type Factories.
 */
contract MetaDAO {

    /**
     * @dev Emitted when a call is performed as part of operation `id`.
     */
    event CallExecuted(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data);

    /**
     * @dev Returns the identifier of an operation containing a single
     * transaction.
     */
    function hashOperation(
        address target,
        uint256 value,
        bytes calldata data
    ) public pure virtual returns (bytes32 hash) {
        return keccak256(abi.encode(target, value, data));
    }

    /**
     * @dev Returns the identifier of an operation containing a batch of
     * transactions.
     */
    function hashOperationBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) public pure virtual returns (bytes32 hash) {
        return keccak256(abi.encode(targets, values, datas));
    }

    /**
     * @dev Execute an operation containing a single transaction.
     *
     * Emits a {CallExecuted} event.
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) public payable virtual {
        bytes32 id = hashOperation(target, value, data);
        _call(id, 0, target, value, data);
    }

    /**
     * @dev Execute operation containing a batch of transactions.
     *
     * Emits one {CallExecuted} event per transaction in the batch.
     */
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) public payable virtual {
        require(targets.length == values.length, "MetaDAO: length mismatch");
        require(targets.length == datas.length, "MetaDAO: length mismatch");

        bytes32 id = hashOperationBatch(targets, values, datas);
        for (uint256 i = 0; i < targets.length; ++i) {
            _call(id, i, targets[i], values[i], datas[i]);
        }
    }

    /**
     * @dev Execute an operation's call.
     *
     * Emits a {CallExecuted} event.
     */
    function _call(
        bytes32 id,
        uint256 index,
        address target,
        uint256 value,
        bytes calldata data
    ) private {
        string memory errorMessage = "MetaDAO: call reverted without message";
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        AddressUpgradeable.verifyCallResult(success, returndata, errorMessage);

        emit CallExecuted(id, index, target, value, data);
    }
}