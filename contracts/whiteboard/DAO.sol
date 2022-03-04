//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./IDAOAccessControl.sol";
import "./IDAO.sol";

contract DAO is IDAO, ERC165, Initializable {
    IDAOAccessControl public accessControl;

    // Are clones upgradeable
    function initialize(
        address accessControlImplementation,
        address[] memory executors,
        bytes32[] memory roles,
        bytes32[] memory rolesAdmins,
        address[][] memory members
    ) public initializer {
        accessControl = IDAOAccessControl(
            address(
                new ERC1967Proxy(
                    accessControlImplementation,
                    abi.encodeWithSelector(
                        IDAOAccessControl(payable(address(0)))
                            .initialize
                            .selector,
                        address(this),
                        executors,
                        roles,
                        rolesAdmins,
                        members
                    )
                )
            )
        );
    }

    function execute(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas
    ) public {
        // Todo: Add authorize function modifier

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
