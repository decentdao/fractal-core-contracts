//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @dev ACL contract acts as system level permission.
 * ACL gets deployed during a DAO deployment
 * When a user wants to deploy a module - they call this contract to verify permissions
 * The module factory will deploy the module with a reference to the DAO's ACL
 * @notice To deploy a module - You must propose two transactions (Create permissions via ACL, Deploy Module via Module Factory)
 * The ACL will register the newly created role and the module will reference the ACL for the new role or a reused role.
 */
contract ACL is AccessControl {
    mapping(bytes32 => bool) private _rolesInit;
    bytes32 public constant TIMELOCK = keccak256("TIMELOCK");
    /// Role Already Created
    error RoleCreated();
    /// Array Not Equal
    error ArrayNotEqual();

    /**
     * @dev Set Timelock as the DEFAULT ADMIN
     * @param _timelock The timelock address
     */
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
     * @dev Returns `true` if `role` has been initilized.
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
    function _createPermission(
        bytes32 _role,
        bytes32 _roleAdmin,
        address _manager
    ) internal {
        if (roleInitilized(_role)) revert RoleCreated();
        _rolesInit[_role] = true;
        _setRoleAdmin(_role, _roleAdmin);
        _setupRole(_role, _manager);
    }

    function createPermissionBatch(
        bytes32[] calldata roles,
        bytes32[] calldata roleAdmin,
        address[] calldata manager
    ) public onlyRoleOrOpenRole(TIMELOCK) {
        if (roles.length != roleAdmin.length || roles.length != manager.length)
            revert ArrayNotEqual();
        for (uint256 i; i < roles.length; i++) {
            _createPermission(roles[i], roleAdmin[i], manager[i]);
        }
    }
}
