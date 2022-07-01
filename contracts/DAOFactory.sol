//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/ERC165Storage.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/utils/Create2.sol";

import "./interfaces/IDAOFactory.sol";
import "./interfaces/IDAOAccessControl.sol";
import "./interfaces/IDAO.sol";

/// @notice A factory contract for deploying DAOs with an access control contract
contract DAOFactory is IDAOFactory, ERC165Storage {
    constructor() {
        _registerInterface(type(IDAOFactory).interfaceId);
    }

    /// @notice Creates a DAO with an access control contract
    /// @param creator Address of the Dao Creator
    /// @param createDAOParams Struct of all the parameters required to create a DAO
    /// @return dao The address of the deployed DAO proxy contract
    /// @return accessControl The address of the deployed access control proxy contract
    function createDAO(
        address creator,
        CreateDAOParams calldata createDAOParams
    ) external returns (address dao, address accessControl) {
        dao = _createDAO(creator, createDAOParams);
        accessControl = _createAccessControl(createDAOParams);

        address[] memory targets = new address[](
            createDAOParams.daoFunctionDescs.length
        );

        for (uint256 i; i < createDAOParams.daoFunctionDescs.length; ) {
            targets[i] = dao;
            unchecked {
                i++;
            }
        }

        IDAO(dao).initialize(
            accessControl,
            address(this),
            createDAOParams.daoName
        );
        IDAOAccessControl(accessControl).initialize(
            dao,
            createDAOParams.roles,
            createDAOParams.rolesAdmins,
            createDAOParams.members,
            targets,
            createDAOParams.daoFunctionDescs,
            createDAOParams.daoActionRoles
        );

        emit DAOCreated(dao, accessControl, msg.sender, creator);
    }

    function _createDAO(address creator, CreateDAOParams calldata createDAOParams)
        internal
        returns (address _dao)
    {
        _dao = Create2.deploy(
            0,
            keccak256(abi.encodePacked(creator, msg.sender, block.chainid, createDAOParams.salt)),
            abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(createDAOParams.daoImplementation, "")
            )
        );
    }

    function _createAccessControl(CreateDAOParams memory createDAOParams)
        private
        returns (address _accessControl)
    {
        _accessControl = Create2.deploy(
            0,
            keccak256(abi.encodePacked(tx.origin, block.chainid, createDAOParams.salt)),
            abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(createDAOParams.accessControlImplementation, "")
            )
        );
    }

    /// @notice Returns whether a given interface ID is supported
    /// @param interfaceId An interface ID bytes4 as defined by ERC-165
    /// @return bool Indicates whether the interface is supported
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IDAOFactory).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
