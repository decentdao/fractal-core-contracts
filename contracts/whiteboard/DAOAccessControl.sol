//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

import "./IDAOAccessControl.sol";

contract DAOAccessControl is
    IDAOAccessControl,
    ERC165,
    Initializable,
    AccessControl
{
    function initialize(
        address dao,
        address[] memory executors,
        bytes32[] memory roles,
        bytes32[] memory roleAdmins,
        address[][] memory members
    ) public initializer returns (bytes32 EXECUTE_ROLE) {
        if (
            roles.length != roleAdmins.length ||
            roleAdmins.length != members.length
        ) {
            revert InvalidRoles();
        }

        EXECUTE_ROLE = keccak256(
            abi.encodePacked(block.chainid, dao, "EXECUTE")
        );

        // is this necessary?
        _grantRole(DEFAULT_ADMIN_ROLE, dao);

        unchecked {
            for (uint256 i = 0; i < executors.length; i++) {
                _grantRole(EXECUTE_ROLE, executors[i]);
            }

            for (uint256 i = 0; i < roles.length; i++) {
                _setRoleAdmin(roles[i], roleAdmins[i]);
                for (uint256 j = 0; j < members[i].length; j++) {
                    _grantRole(roles[i], members[i][j]);
                }
            }
        }
    }

    // ///////
    // // TODO: this is hacky maybe

    // function grantRole(bytes32, address) public virtual override {
    //     revert NoOp();
    // }

    // function grantRole(string calldata roleID, address moduleAddress, address account) public {
    //     bytes32 role = keccak256(abi.encodePacked(block.chainid, moduleAddress, roleID));
    //     _checkRole(getRoleAdmin(role), _msgSender());
    //     _grantRole(role, account);
    // }

    // ///////

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC165, AccessControl)
        returns (bool)
    {
        return
            interfaceId == type(IDAOAccessControl).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
