//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/governance/utils/IVotesUpgradeable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./interfaces/IMetaFactory.sol";
import "./interfaces/IDAOFactory.sol";
import "./interfaces/IDAO.sol";
import "./interfaces/IAccessControl.sol";

/// @notice A factory contract for deploying DAOs along with any desired modules within one transaction
contract MetaFactory is IMetaFactory, ERC165 {
    function createDAOAndModules(
        address daoFactory,
        uint256 metaFactoryTempRoleIndex,
        IDAOFactory.CreateDAOParams memory createDAOParams,
        ModuleFactoryCallData[] memory moduleFactoriesCallData,
        ModuleActionData memory moduleActionData,
        uint256[][] memory roleModuleMembers
    ) external returns (address[] memory) {
        if (
            moduleActionData.contractIndexes.length !=
            moduleActionData.functionDescs.length ||
            moduleActionData.contractIndexes.length !=
            moduleActionData.roles.length ||
            createDAOParams.roles.length != roleModuleMembers.length
        ) {
            revert UnequalArrayLengths();
        }

        uint256 modulesLength = moduleFactoriesCallData.length;
        uint256 newContractAddressesLength = 2;
        for (uint256 i; i < modulesLength; ) {
            newContractAddressesLength += moduleFactoriesCallData[i]
                .addressesReturned;

            unchecked {
                i++;
            }
        }

        address[] memory newContractAddresses = new address[](
            newContractAddressesLength
        );

        // Give this contract a temporary role so it can execute through DAO
        uint256 tempRoleMembersLength = createDAOParams
            .members[metaFactoryTempRoleIndex]
            .length;
        address[] memory tempRoleNewMembers = new address[](
            tempRoleMembersLength + 1
        );

        for (uint256 i; i < tempRoleMembersLength; ) {
            tempRoleNewMembers[i] = createDAOParams.members[
                metaFactoryTempRoleIndex
            ][i];
            unchecked {
                i++;
            }
        }

        tempRoleNewMembers[tempRoleMembersLength] = address(this);

        createDAOParams.members[metaFactoryTempRoleIndex] = tempRoleNewMembers;

        (address dao, address accessControl) = IDAOFactory(daoFactory)
            .createDAO(msg.sender, createDAOParams);

        newContractAddresses[0] = dao;
        newContractAddresses[1] = accessControl;

        newContractAddresses = createModules(newContractAddresses, moduleFactoriesCallData);

        addActionsRoles(moduleActionData, newContractAddresses);

        addModuleRoles(
            createDAOParams.roles,
            roleModuleMembers,
            newContractAddresses
        );

        // Renounce the MetaFactory temporary role
        IAccessControl(newContractAddresses[1]).renounceRole(
            createDAOParams.roles[metaFactoryTempRoleIndex],
            address(this)
        );

        address[] memory moduleAddresses = new address[](
            newContractAddresses.length - 2
        );
        for (uint256 i; i < moduleAddresses.length; ) {
            moduleAddresses[i] = newContractAddresses[i + 2];

            unchecked {
                i++;
            }
        }

        emit DAOAndModulesCreated(
            newContractAddresses[0],
            newContractAddresses[1],
            moduleAddresses
        );

        return newContractAddresses;
    }

    function createModules(
        address[] memory newContractAddresses,
        ModuleFactoryCallData[] memory moduleFactoriesCallData
    ) private returns (address[] memory) {
        uint256 newContractAddressIndex = 2;

        for (uint256 i; i < moduleFactoriesCallData.length;) {
            uint256 newContractAddressesToPassLength = moduleFactoriesCallData[
                i
            ].newContractAddressesToPass.length;

            bytes[] memory newData = new bytes[](
                moduleFactoriesCallData[i].data.length +
                    newContractAddressesToPassLength
            );

            for (uint256 j; j < newContractAddressesToPassLength;) {
                if (
                    moduleFactoriesCallData[i].newContractAddressesToPass[j] >=
                    i + 2
                ) {
                    revert InvalidModuleAddressToPass();
                }

                newData[j] = abi.encode(
                    newContractAddresses[
                        moduleFactoriesCallData[i].newContractAddressesToPass[j]
                    ]
                );

                unchecked {
                    j++;
                }
            }

            for (uint256 j; j < moduleFactoriesCallData[i].data.length; ) {
                newData[
                    j + newContractAddressesToPassLength
                ] = moduleFactoriesCallData[i].data[j];

                unchecked {
                    j++;
                }
            }

            (bool success, bytes memory returnData) = moduleFactoriesCallData[i]
                .factory
                .call{value: moduleFactoriesCallData[i].value}(
                abi.encodeWithSignature("create(bytes[])", newData)
            );

            if (!success) {
                revert FactoryCallFailed();
            }

            address[] memory newModuleAddresses = new address[](moduleFactoriesCallData[i].addressesReturned);
            newModuleAddresses = abi.decode(returnData, (address[]));

            for(uint256 j; j < newModuleAddresses.length;) {
              newContractAddresses[newContractAddressIndex] = newModuleAddresses[j];
              unchecked {
                newContractAddressIndex++;
                j++;
              }
            }
           
            unchecked {
                i++;
            }
        }

        return newContractAddresses;
    }

    function addActionsRoles(
        ModuleActionData memory moduleActionData,
        address[] memory newContractAddresses
    ) private {
        uint256 moduleActionTargetsLength = moduleActionData
            .contractIndexes
            .length;
        address[] memory moduleActionTargets = new address[](
            moduleActionTargetsLength
        );
        for (uint256 i; i < moduleActionTargetsLength; ) {
            moduleActionTargets[i] = newContractAddresses[
                moduleActionData.contractIndexes[i]
            ];

            unchecked {
                i++;
            }
        }

        bytes memory data = abi.encodeWithSignature(
            "addActionsRoles(address[],string[],string[][])",
            moduleActionTargets,
            moduleActionData.functionDescs,
            moduleActionData.roles
        );

        address[] memory targetArray = new address[](1);
        uint256[] memory valuesArray = new uint256[](1);
        bytes[] memory dataArray = new bytes[](1);

        targetArray[0] = newContractAddresses[1];
        valuesArray[0] = 0;
        dataArray[0] = data;

        IDAO(newContractAddresses[0]).execute(
            targetArray,
            valuesArray,
            dataArray
        );
    }

    function addModuleRoles(
        string[] memory roles,
        uint256[][] memory roleModuleMembers,
        address[] memory newContractAddresses
    ) private {

      
        uint256 newMembersLength = roleModuleMembers.length;
        address[][] memory newMembers = new address[][](newMembersLength);
        for (uint256 i; i < newMembersLength; ) {
            uint256 newMembersInnerLength = roleModuleMembers[i].length;
            for (uint256 j; j < newMembersInnerLength; ) {
                newMembers[i][j] = newContractAddresses[
                    roleModuleMembers[i][j]
                ];
                unchecked {
                    j++;
                }
            }
            unchecked {
                i++;
            }
        }

        bytes memory data = abi.encodeWithSignature(
            "grantRoles(string[],address[][])",
            roles,
            newMembers
        );

        address[] memory targetArray = new address[](1);
        uint256[] memory valuesArray = new uint256[](1);
        bytes[] memory dataArray = new bytes[](1);

        targetArray[0] = newContractAddresses[1];
        valuesArray[0] = 0;
        dataArray[0] = data;

        IDAO(newContractAddresses[0]).execute(
            targetArray,
            valuesArray,
            dataArray
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
            interfaceId == type(IMetaFactory).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
