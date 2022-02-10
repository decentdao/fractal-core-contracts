// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (governance/TimelockController.sol)

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @notice Created roles will be emitted during events. If you would like to reuse roles, find roles and use that role.
 */
contract ACL is AccessControl {
    mapping(bytes32 => bool) private _rolesInit;
    bytes32 public constant TIMELOCK = keccak256("TIMELOCK");

    constructor(address _timelock) {
        _rolesInit[TIMELOCK] = true;
        _setRoleAdmin(TIMELOCK, TIMELOCK);
        _setupRole(TIMELOCK, _timelock);
    }

    /**
     * @dev Modifier to make a function callable only by a certain role. In
     * addition to checking the sender's role, `address(0)` 's role is also
     * considered. Granting a role to `address(0)` is equivalent to enabling
     * this role for everyone.
     */
    modifier onlyRoleOrOpenRole(bytes32 role) {
        if (!hasRole(role, address(0))) {
            _checkRole(role, _msgSender());
        }
        _;
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function roleInitilized(bytes32 role) public view virtual returns (bool) {
        return _rolesInit[role];
    }


    /**
    * @dev createPermission for CREATE_PERMISSIONS_ROLE
    * @param _role The title of the role which can do an action in the system
    * @param _roleAdmin The role which is the admin of the created role. Grant _mangers _role title
    * @param _manager The address which has control over the action 
    * @notice when the DAO want to deploy a module - It will need to set up permissions to use the module 
    */
    function _createPermission(bytes32 _role, bytes32 _roleAdmin, address _manager) internal {
        _setRoleAdmin(_role, _roleAdmin);
        _setupRole(_role, _manager);
    }
    
    function createPermissionBatch(bytes32[] calldata roles, bytes32[] calldata roleAdmin, address[] calldata manager) public onlyRoleOrOpenRole(TIMELOCK) {
    require(roles.length == roleAdmin.length && roles.length == manager.length, "Array not equal");
        for(uint i; i < roles.length; i ++) {
            require(!roleInitilized(roles[i]), "Role already created");
            _rolesInit[roles[i]] = true;
            _createPermission(roles[i], roleAdmin[i], manager[i]);

        }
    }
}