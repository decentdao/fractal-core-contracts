//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces/IAccessControl.sol";

contract AccessControl is IAccessControl, ERC165, Initializable {
    string public constant DAO_ROLE = "DAO_ROLE";

    mapping(string => RoleData) private _roles;
    mapping(address => mapping(bytes4 => string[])) private _actionsToRoles;

    modifier onlyRole(string memory role) {
        _checkRole(role, msg.sender);
        _;
    }

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
    }

    function grantRole(string memory role, address account)
        public
        override
        onlyRole(getRoleAdmin(role))
    {
        _grantRole(role, account);
    }

    function revokeRole(string memory role, address account)
        public
        override
        onlyRole(getRoleAdmin(role))
    {
        _revokeRole(role, account);
    }

    function renounceRole(string memory role, address account) public override {
        require(
            account == msg.sender,
            "DAOAccessControl: can only renounce roles for self"
        );

        _revokeRole(role, account);
    }

    function hasRole(string memory role, address account)
        public
        view
        override
        returns (bool)
    {
        return _roles[role].members[account];
    }

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

    function grantRolesAndAdmins(
        string[] memory roles,
        string[] memory roleAdmins,
        address[][] memory members
    ) external onlyRole(DAO_ROLE) {
        _grantRolesAndAdmins(roles, roleAdmins, members);
    }

    function addActionsRoles(
        address[] memory targets,
        string[] memory functionDescs,
        string[][] memory roles
    ) external override onlyRole(DAO_ROLE) {
        _addActionsRoles(targets, functionDescs, roles);
    }

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

    function getActionRoles(address target, string memory functionDesc)
        external
        view
        override
        returns (string[] memory roles)
    {
        bytes4 encodedSig = bytes4(keccak256(abi.encodePacked(functionDesc)));
        return _actionsToRoles[target][encodedSig];
    }

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

    function _setRoleAdmin(string memory role, string memory adminRole)
        internal
    {
        string memory previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    function _grantRole(string memory role, address account) internal {
        if (!hasRole(role, account)) {
            _roles[role].members[account] = true;
            emit RoleGranted(role, account,msg.sender);
        }
    }

    function _revokeRole(string memory role, address account) internal {
        if (hasRole(role, account)) {
            _roles[role].members[account] = false;
            emit RoleRevoked(role, account, msg.sender);
        }
    }

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

    function _addActionRole(
        address target,
        string memory functionDesc,
        string memory role
    ) internal {
        bytes4 encodedSig = bytes4(keccak256(abi.encodePacked(functionDesc)));
        _actionsToRoles[target][encodedSig].push(role);

        emit ActionRoleAdded(target, functionDesc, encodedSig, role);
    }

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
