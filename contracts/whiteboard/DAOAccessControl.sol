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
    mapping(bytes32 => bytes32[]) public actionsToRoles;
    error ArraysNotEqual();

    function initialize(
        address dao,
        address[] memory executors,
        bytes32[] memory roles,
        bytes32[] memory roleAdmins,
        address[][] memory members
    ) public initializer {
        if (roles.length != roleAdmins.length) {
            revert InvalidRoles();
        }

        bytes32 EXECUTE_ROLE = keccak256("EXECUTE");

        _grantRole(DEFAULT_ADMIN_ROLE, dao);
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

    function batchCreateRoles(
        bytes32[] memory roles,
        bytes32[] memory roleAdmins,
        address[][] memory members
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i = 0; i < roles.length; i++) {
            _setRoleAdmin(roles[i], roleAdmins[i]);
            for (uint256 j = 0; j < members[i].length; j++) {
                _grantRole(roles[i], members[i][j]);
            }
        }
    }

    function batchGrantRoles(bytes32[] memory roles, address[][] memory members)
        public
    {
        if (roles.length != members.length) revert InvalidRoles();
        for (uint256 i; i < roles.length; i++) {
            for (uint256 j = 0; j < members[i].length; j++) {
                grantRole(roles[i], members[i][j]);
            }
        }
    }

    function batchUpdateRoleAdmin(
        bytes32[] calldata roles,
        bytes32[] calldata newRoleAdmins
    ) public {
        if (roles.length != newRoleAdmins.length) revert InvalidRoles();
        for (uint256 i; i < roles.length; i++) {
            _updateRoleAdmin(roles[i], newRoleAdmins[i]);
        }
    }

    function _updateRoleAdmin(bytes32 role, bytes32 newRoleAdmin)
        internal
        onlyRole(getRoleAdmin(getRoleAdmin(role)))
    {
        _setRoleAdmin(role, newRoleAdmin);
    }

    function actionIsAuthorized(
        address sender,
        address module,
        bytes4 sig
    ) external view override returns (bool isAuthorized) {
        // can `sender`, call the function identified as `sig`, on `module`?
        // well, we need to see if `sender` has a `role` that was previously authorized to call `sig` on `module`
        uint256 roleLength = actionsToRoles[keccak256(abi.encodePacked(module, sig))].length;

        for(uint256 i; i < roleLength;) {
          if(hasRole(actionsToRoles[keccak256(abi.encodePacked(module, sig))][i], sender)) {
            isAuthorized = true;
            break;
          }
          unchecked {
            i++;
          }
        }
    }

    function addActionRoles(bytes32[] calldata actions, bytes32[] calldata roles) external override onlyRole(DEFAULT_ADMIN_ROLE) {
      if(actions.length != roles.length) {
        revert ArraysNotEqual();
      }

      uint256 arrayLength = actions.length;
      for(uint256 i; i < arrayLength;) {
        _addActionRole(actions[i], roles[i]);
        unchecked {
          i++;
        }
      }
    }

    function _addActionRole(bytes32 action, bytes32 role) internal {
      actionsToRoles[action].push(role);
    }

    function removeActionRoles(bytes32[] calldata actions, bytes32[] calldata roles) external override onlyRole(DEFAULT_ADMIN_ROLE) {
      if(actions.length != roles.length) {
        revert ArraysNotEqual();
      }

      uint256 arrayLength = actions.length;
      for(uint256 i; i < arrayLength;) {
        _removeActionRole(actions[i], roles[i]);
        unchecked {
          i++;
        }
      }
    }

    function _removeActionRole(bytes32 action, bytes32 role) internal {
      uint256 arrayLength = actionsToRoles[action].length;

      for(uint256 i; i < arrayLength;) {
        if(actionsToRoles[action][i] == role) {
          actionsToRoles[action][i] = actionsToRoles[action][arrayLength - 1];
          actionsToRoles[action].pop();
          break;
        }
        unchecked {
          i++;
        }
      }
    }

    function getActionRoles(bytes32 action) external view override returns(bytes32[] memory roles) {
      return actionsToRoles[action];
    }

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
