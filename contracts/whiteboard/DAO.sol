//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "./IDAO.sol";
import "./DAOModuleBase.sol";

contract DAO is IDAO, DAOModuleBase {
    function execute(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas
    ) public authorized {
        if(targets.length != values.length || targets.length != calldatas.length) revert UnequalArrayLengths();
        string memory errorMessage = "DAO: call reverted without message";
        uint256 targetlength = targets.length;
        for (uint256 i = 0; i < targetlength; ) {
            (bool success, bytes memory returndata) = targets[i].call{
                value: values[i]
            }(calldatas[i]);
            Address.verifyCallResult(success, returndata, errorMessage);
            unchecked {
                i++;
            }
        }
        emit Executed(targets, values, calldatas);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override
        returns (bool)
    {
        return
            interfaceId == type(IDAO).interfaceId ||
            supportsInterface(interfaceId);
    }
}
