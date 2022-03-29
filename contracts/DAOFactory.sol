//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "./interfaces/IDAOFactory.sol";
import "./interfaces/IAccessControl.sol";
import "./interfaces/IDAO.sol";

/// @notice A factory contract for deploying DAOs with an access control contract
contract DAOFactory is IDAOFactory, ERC165 {
    /// @notice Creates a DAO with an access control contract
    /// @param creator Address of the Dao Creator
    /// @param createDAOParams Struct of all the parameters required to create a DAO
    /// @return dao The address of the deployed DAO proxy contract
    /// @return accessControl The address of the deployed access control proxy contract
    function createDAO(address creator, CreateDAOParams calldata createDAOParams)
        external
        returns (address dao, address accessControl)
    {
        dao = address(new ERC1967Proxy(createDAOParams.daoImplementation, ""));

        uint256 arrayLength = createDAOParams.moduleTargets.length +
            createDAOParams.daoFunctionDescs.length;

        address[] memory targets = new address[](arrayLength);
        string[] memory functionDescs = new string[](arrayLength);
        string[][] memory actionRoles = new string[][](arrayLength);

        uint256 daoFunctionDescsLength = createDAOParams
            .daoFunctionDescs
            .length;
        for (uint256 i; i < daoFunctionDescsLength; ) {
            targets[i] = dao;
            functionDescs[i] = createDAOParams.daoFunctionDescs[i];
            actionRoles[i] = createDAOParams.daoActionRoles[i];
            unchecked {
                i++;
            }
        }

        uint256 moduleTargetsLength = createDAOParams.moduleTargets.length;
        for (uint256 i; i < moduleTargetsLength; ) {
            uint256 currentIndex = i + createDAOParams.daoFunctionDescs.length;
            targets[currentIndex] = createDAOParams.moduleTargets[i];
            functionDescs[currentIndex] = createDAOParams.moduleFunctionDescs[
                i
            ];
            actionRoles[currentIndex] = createDAOParams.moduleActionRoles[i];
            unchecked {
                i++;
            }
        }

        accessControl = address(
            new ERC1967Proxy(
                createDAOParams.accessControlImplementation,
                abi.encodeWithSelector(
                    IAccessControl(payable(address(0))).initialize.selector,
                    dao,
                    createDAOParams.roles,
                    createDAOParams.rolesAdmins,
                    createDAOParams.members,
                    targets,
                    functionDescs,
                    actionRoles
                )
            )
        );

        IDAO(dao).initialize(accessControl, createDAOParams.daoName);

        emit DAOCreated(dao, accessControl, msg.sender, creator);
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
