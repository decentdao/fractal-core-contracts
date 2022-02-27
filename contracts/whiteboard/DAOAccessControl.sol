//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

import "./IDAOAccessControl.sol";

contract DAOAccessControl is IDAOAccessControl, ERC165, Initializable {
    struct RoleData {
        mapping(address => bool) members;
        bytes32 adminRole;
    }

    mapping(bytes32 => RoleData) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

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

    modifier onlyRole(bytes32 role) {
        _checkRole(role, msg.sender);
        _;
    }

    function hasRole(bytes32 role, address account)
        public
        view
        virtual
        override
        returns (bool)
    {
        return _roles[role].members[account];
    }

    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!hasRole(role, account)) {
            revert MissingRole(account, role);
        }
    }

    function getRoleAdmin(bytes32 role)
        public
        view
        virtual
        override
        returns (bytes32)
    {
        return _roles[role].adminRole;
    }

    function grantRole(bytes32 role, address account)
        public
        virtual
        override
        onlyRole(getRoleAdmin(role))
    {
        _grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account)
        public
        virtual
        override
        onlyRole(getRoleAdmin(role))
    {
        _revokeRole(role, account);
    }

    function renounceRole(bytes32 role, address account)
        public
        virtual
        override
    {
        if (account != msg.sender) {
            revert OnlySelfCanRenounce();
        }

        _revokeRole(role, account);
    }

    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    function _grantRole(bytes32 role, address account) internal virtual {
        if (!hasRole(role, account)) {
            _roles[role].members[account] = true;
            emit RoleGranted(role, account, msg.sender);
        }
    }

    function _revokeRole(bytes32 role, address account) internal virtual {
        if (hasRole(role, account)) {
            _roles[role].members[account] = false;
            emit RoleRevoked(role, account, msg.sender);
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
            interfaceId == type(IDAOAccessControl).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
