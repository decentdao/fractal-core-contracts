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
import "./interfaces/IGovernorFactory.sol";
import "./interfaces/ITreasuryModuleFactory.sol";
import "./interfaces/ITimelockUpgradeable.sol";

/// @notice A factory contract for deploying DAOs along with any desired modules within one transaction
contract MetaFactory is IMetaFactory, ERC165 {
    function createDAOAndModules(
        address daoFactory,
        uint256 metaFactoryTempRoleIndex,
        IDAOFactory.CreateDAOParams memory createDAOParams,
        ModuleFactoryCallData[] memory moduleFactoriesCallData,
        ModuleActionData memory moduleActionData
    ) external returns (address[] memory) {
        if (
            moduleActionData.contractIndexes.length !=
            moduleActionData.functionDescs.length ||
            moduleActionData.contractIndexes.length !=
            moduleActionData.roles.length
        ) {
            revert UnequalArrayLengths();
        }

        address[] memory newContractAddresses = new address[](
            moduleFactoriesCallData.length + 2
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

        uint256 moduleFactoriesCallDataLength = moduleFactoriesCallData.length;
        for (uint256 i; i < moduleFactoriesCallDataLength; ) {
            uint256 newContractAddressesToPassLength = moduleFactoriesCallData[
                i
            ].newContractAddressesToPass.length;

            bytes memory newData = moduleFactoriesCallData[i].data;

            for (uint256 j; j < newContractAddressesToPassLength; ) {
                if (
                    moduleFactoriesCallData[i].newContractAddressesToPass[j] >=
                    i + 2
                ) {
                    revert InvalidModuleAddressToPass();
                }
                
                newData = abi.encodePacked(abi.encode(
                    newContractAddresses[
                        moduleFactoriesCallData[i].newContractAddressesToPass[j]
                    ]),
                    newData
                );

                unchecked {
                    j++;
                }
            }

            (bool success, bytes memory returnData) = moduleFactoriesCallData[i]
                .factory
                .call{value: moduleFactoriesCallData[i].value}(
                abi.encodeWithSignature("create(bytes)", newData)
            );

            if (!success) {
                revert FactoryCallFailed();
            }

            newContractAddresses[i + 2] = abi.decode(returnData, (address));
            unchecked {
                i++;
            }
        }

        addActionsRoles(moduleActionData, newContractAddresses);

        // Renounce the MetaFactory temporary role
        IAccessControl(newContractAddresses[1]).renounceRole(
            createDAOParams.roles[metaFactoryTempRoleIndex],
            address(this)
        );

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
