//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "./IDAO.sol";
import "./DAOModuleBase.sol";

// This should have UUPS standard
contract DAO is ERC165, DAOModuleBase {
    function execute(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas
    ) public authorized {
        string memory errorMessage = "DAO: call reverted without message";
        unchecked {
            for (uint256 i = 0; i < targets.length; i++) {
                (bool success, bytes memory returndata) = targets[i].call{
                    value: values[i]
                }(calldatas[i]);
                Address.verifyCallResult(success, returndata, errorMessage);
            }
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IDAO).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
