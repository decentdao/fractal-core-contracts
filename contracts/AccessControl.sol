//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces/IAccessControl.sol";

/// @title Access Control
/// @notice Use this contract for role based permissions
/// @dev OpenZeppelin access control using strings instead of bytes
contract AccessControl is IAccessControl, ERC165, UUPSUpgradeable {
    string public constant DAO_ROLE = "DAO_ROLE";

    mapping(string => RoleData) private _roles;
    mapping(address => mapping(bytes4 => string[])) private _actionsToRoles;

    /// @dev Modifier that checks that an account has a specific role. Reverts
    /// with a standardized message including the required role.
    /// The format of the revert reason is given by the following regular expression:
    modifier onlyRole(string memory role) {
        _checkRole(role, msg.sender);
        _;
    }

    /// @dev Initilize permissions and DAO role
    /// @param dao Address to receive DAO role
    /// @param roles What permissions are assigned to
    /// @param roleAdmins Roles which have the ability to remove or add members
    /// @param members Users which have the permission to interact with various features
    /// @param targets Module addresses
    /// @param functionDescs Function Descs used to generate function sigs
    /// @param actionRoles Roles that indicate a specific feature or action on a module
    function initialize(
        address dao,
        string[] memory roles,
        string[] memory roleAdmins,
        address[][] memory members,
        address[] memory targets,
        string[] memory functionDescs,
        string[][] memory actionRoles
    ) public override initializer {
        if (
            roles.length != roleAdmins.length ||
            roles.length != members.length ||
            targets.length != functionDescs.length ||
            targets.length != functionDescs.length
        ) revert UnequalArrayLengths();

        _grantRole(DAO_ROLE, dao);
        _grantRolesAndAdmins(roles, roleAdmins, members);
        _addActionsRoles(targets, functionDescs, actionRoles);
        __UUPSUpgradeable_init();
    }

    /// @dev Grants `role` to `account`.
    /// If `account` had not been already granted `role`, emits a {RoleGranted}
    /// event.
    /// Requirements:
    /// - the caller must have ``role``'s admin role.
    function grantRole(string memory role, address account)
        public
        override
        onlyRole(getRoleAdmin(role))
    {
        _grantRole(role, account);
    }

    /// @dev Revokes `role` from `account`.
    /// If `account` had been granted `role`, emits a {RoleRevoked} event.
    /// Requirements:
    /// - the caller must have ``role``'s admin role.
    function revokeRole(string memory role, address account)
        public
        override
        onlyRole(getRoleAdmin(role))
    {
        _revokeRole(role, account);
    }

    /// @dev Revokes `role` from the calling account.
    /// Roles are often managed via {grantRole} and {revokeRole}: this function's
    /// purpose is to provide a mechanism for accounts to lose their privileges
    /// if they are compromised (such as when a trusted device is misplaced).
    ///
    /// If the calling account had been revoked `role`, emits a {RoleRevoked}
    /// event.
    ///
    /// Requirements:
    /// - the caller must be `account`.
    function renounceRole(string memory role, address account) public override {
        require(
            account == msg.sender,
            "DAOAccessControl: can only renounce roles for self"
        );

        _revokeRole(role, account);
    }

    /// @dev Returns `true` if `account` has been granted `role`.
    function hasRole(string memory role, address account)
        public
        view
        override
        returns (bool)
    {
        return _roles[role].members[account];
    }

    /// @dev Returns the admin role that controls `role`. See {grantRole} and
    /// {revokeRole}.
    /// To change a role's admin, use {_setRoleAdmin}.
    function getRoleAdmin(string memory role)
        public
        view
        override
        returns (string memory)
    {
        return _roles[role].adminRole;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IAccessControl).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /// @dev grantRolesAndAdmins allows the DAO_ROLE to create/grant roles and create/update admins
    /// @param roles What permissions are assigned to
    /// @param roleAdmins Roles which have the ability to remove or add members
    /// @param members Users which have the permission to interact with various features
    function grantRolesAndAdmins(
        string[] memory roles,
        string[] memory roleAdmins,
        address[][] memory members
    ) external onlyRole(DAO_ROLE) {
        _grantRolesAndAdmins(roles, roleAdmins, members);
    }

    /// @dev Creates permissioned actions used by the DAO and Modules
    /// @param targets Module addresses
    /// @param functionDescs Function Descs used to generate function sigs
    /// @param roles Roles that indicate a specific feature or action on a module
    function addActionsRoles(
        address[] memory targets,
        string[] memory functionDescs,
        string[][] memory roles
    ) external override onlyRole(DAO_ROLE) {
        _addActionsRoles(targets, functionDescs, roles);
    }

    /// @dev removes permissioned actions used by the DAO and Modules
    /// @param targets Module addresses
    /// @param functionDescs Function Descs used to generate function sigs
    /// @param roles Roles that indicate a specific feature or action on a module
    function removeActionsRoles(
        address[] memory targets,
        string[] memory functionDescs,
        string[][] memory roles
    ) external override onlyRole(DAO_ROLE) {
        if (targets.length != functionDescs.length)
            revert UnequalArrayLengths();
        if (targets.length != roles.length) revert UnequalArrayLengths();
        uint256 actionsLength = targets.length;
        for (uint256 i = 0; i < actionsLength; ) {
            uint256 rolesLength = roles[i].length;
            for (uint256 j = 0; j < rolesLength; ) {
                _removeActionRole(targets[i], functionDescs[i], roles[i][j]);
                unchecked {
                    j++;
                }
            }
            unchecked {
                i++;
            }
        }
    }

    /// @dev Checks if a caller has the permissions to call the specific action
    /// @param caller User attempting to utilize the action
    /// @param target Address corresponding to the action
    /// @param sig function sig
    function actionIsAuthorized(
        address caller,
        address target,
        bytes4 sig
    ) external view override returns (bool isAuthorized) {
        string[] memory roles = _actionsToRoles[target][sig];
        uint256 roleLength = roles.length;

        for (uint256 i = 0; i < roleLength; ) {
            if (hasRole(roles[i], caller)) {
                isAuthorized = true;
                break;
            }
            unchecked {
                i++;
            }
        }
    }

    /// @dev Roles assigned to a specific action
    /// @param target Address corresponding to the action
    /// @param functionDesc function Definition
    function getActionRoles(address target, string memory functionDesc)
        external
        view
        override
        returns (string[] memory roles)
    {
        bytes4 encodedSig = bytes4(keccak256(abi.encodePacked(functionDesc)));
        return _actionsToRoles[target][encodedSig];
    }

    /// @dev Checks if a specific role is permissioned for an action
    /// @param role Role that indicate a specific feature or action on a module
    /// @param target Module address
    /// @param functionDesc Function Desc used to generate function sigs
    function isRoleAuthorized(
        string calldata role,
        address target,
        string memory functionDesc
    ) external view override returns (bool isAuthorized) {
        bytes4 encodedSig = bytes4(keccak256(abi.encodePacked(functionDesc)));
        string[] memory roles = _actionsToRoles[target][encodedSig];
        uint256 rolesLength = roles.length;

        for (uint256 i = 0; i < rolesLength; ) {
            if (
                keccak256(abi.encodePacked(role)) ==
                keccak256(abi.encodePacked(roles[i]))
            ) {
                isAuthorized = true;
                break;
            }
            unchecked {
                i++;
            }
        }
    }

    /// @dev Sets `adminRole` as ``role``'s admin role.
    /// Emits a {RoleAdminChanged} event.
    function _setRoleAdmin(string memory role, string memory adminRole)
        internal
    {
        string memory previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    /// @dev Grants `role` to `account`.
    /// Internal function without access restriction.
    function _grantRole(string memory role, address account) internal {
        if (!hasRole(role, account)) {
            _roles[role].members[account] = true;
            emit RoleGranted(role, account, msg.sender);
        }
    }

    /// @dev Revokes `role` from `account`.
    /// Internal function without access restriction.
    function _revokeRole(string memory role, address account) internal {
        if (hasRole(role, account)) {
            _roles[role].members[account] = false;
            emit RoleRevoked(role, account, msg.sender);
        }
    }

    /// @dev Grants `roles` to `accounts` w/ Admins.
    /// Internal function without access restriction.
    function _grantRolesAndAdmins(
        string[] memory roles,
        string[] memory roleAdmins,
        address[][] memory members
    ) internal {
        if (roles.length != roleAdmins.length) revert UnequalArrayLengths();
        if (roles.length != members.length) revert UnequalArrayLengths();

        uint256 rolesLength = roles.length;
        for (uint256 i = 0; i < rolesLength; ) {
            _setRoleAdmin(roles[i], roleAdmins[i]);

            uint256 membersLength = members[i].length;
            for (uint256 j = 0; j < membersLength; ) {
                _grantRole(roles[i], members[i][j]);
                unchecked {
                    j++;
                }
            }
            unchecked {
                i++;
            }
        }
    }

    /// @dev Adds `roles` to `actions`.
    /// Internal function without access restriction.
    function _addActionsRoles(
        address[] memory targets,
        string[] memory functionDescs,
        string[][] memory roles
    ) internal {
        if (targets.length != functionDescs.length)
            revert UnequalArrayLengths();
        if (targets.length != roles.length) revert UnequalArrayLengths();

        uint256 targetsLength = targets.length;
        for (uint256 i = 0; i < targetsLength; ) {
            uint256 rolesLength = roles[i].length;
            for (uint256 j = 0; j < rolesLength; ) {
                _addActionRole(targets[i], functionDescs[i], roles[i][j]);
                unchecked {
                    j++;
                }
            }
            unchecked {
                i++;
            }
        }
    }

    /// @dev Adds a `role` to an `action`.
    /// Internal function without access restriction.
    function _addActionRole(
        address target,
        string memory functionDesc,
        string memory role
    ) internal {
        bytes4 encodedSig = bytes4(keccak256(abi.encodePacked(functionDesc)));
        _actionsToRoles[target][encodedSig].push(role);

        emit ActionRoleAdded(target, functionDesc, encodedSig, role);
    }

    /// @dev removes a `role` from an `action`.
    /// Internal function without access restriction.
    function _removeActionRole(
        address target,
        string memory functionDesc,
        string memory role
    ) internal {
        bytes4 encodedSig = bytes4(keccak256(abi.encodePacked(functionDesc)));
        uint256 rolesLength = _actionsToRoles[target][encodedSig].length;
        for (uint256 i = 0; i < rolesLength; ) {
            if (
                keccak256(
                    abi.encodePacked(_actionsToRoles[target][encodedSig][i])
                ) == keccak256(abi.encodePacked(role))
            ) {
                _actionsToRoles[target][encodedSig][i] = _actionsToRoles[
                    target
                ][encodedSig][rolesLength - 1];
                _actionsToRoles[target][encodedSig].pop();

                emit ActionRoleRemoved(target, functionDesc, encodedSig, role);

                break;
            }
            unchecked {
                i++;
            }
        }
    }

    /// @dev Function that should revert when `msg.sender` is not authorized to upgrade the contract. Called by
    /// {upgradeTo} and {upgradeToAndCall}.
    /// @dev Only DAO_ROLE has the permission to call

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DAO_ROLE)
    {}

    /// @dev Revert with a standard message if `account` is missing `role`.
    /// The format of the revert reason is given by the following regular expression:
    ///  /^AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})$/
    function _checkRole(string memory role, address account) internal view {
        if (!hasRole(role, account)) {
            revert(
                string(
                    abi.encodePacked(
                        "DAOAccessControl: account ",
                        Strings.toHexString(uint160(account), 20),
                        " is missing role ",
                        role
                    )
                )
            );
        }
    }
}
