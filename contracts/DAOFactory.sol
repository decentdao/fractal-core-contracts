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
        accessControl = _createAccessControl(creator, createDAOParams);

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

    /// @notice Creates a DAO contract
    /// @param creator Address of the Dao Creator
    /// @param createDAOParams Struct of all the parameters required to create a DAO
    /// @return _dao The address of the deployed DAO proxy contract
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

    /// @notice Creates a an access control contract
    /// @param creator Address of the Dao Creator
    /// @param createDAOParams Struct of all the parameters required to create a DAO
    /// @return _accessControl The address of the deployed access control proxy contract
    function _createAccessControl(address creator, CreateDAOParams memory createDAOParams)
        internal
        returns (address _accessControl)
    {
        _accessControl = Create2.deploy(
            0,
            keccak256(abi.encodePacked(creator, msg.sender, block.chainid, createDAOParams.salt)),
            abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(createDAOParams.accessControlImplementation, "")
            )
        );
    }
}
