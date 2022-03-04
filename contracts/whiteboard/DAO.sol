//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "./IDAO.sol";
import "./DAOModuleBase.sol";

contract DAO is IDAO, ERC165, DAOModuleBase, UUPSUpgradeable {
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
        override
        returns (bool)
    {
        return
            interfaceId == type(IDAO).interfaceId ||
            supportsInterface(interfaceId);
    }

    function _authorizeUpgrade(address newImplementation) internal override authorized {}
}
