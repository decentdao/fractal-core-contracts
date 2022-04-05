//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IGovernorModule.sol";
import "./IDAOFactory.sol";
import "./IGovernorFactory.sol";

interface IMetaFactory {
    event DAOAndModulesCreated(address dao, address accessControl, address[] modules);

    error UnequalArrayLengths();
    error InvalidModuleAddressToPass();
    error FactoryCallFailed();

    struct ModuleFactoryCallData {
        address factory;
        bytes[] data;
        uint256 value;
        uint256[] newContractAddressesToPass;
    }

    struct ModuleActionData {
        uint256[] contractIndexes;
        string[] functionDescs;
        string[][] roles;
    }

    function createDAOAndModules(
        address daoFactory,
        uint256 metaFactoryTempRoleIndex,
        IDAOFactory.CreateDAOParams memory createDAOParams,
        ModuleFactoryCallData[] memory moduleFactoriesCallData,
        ModuleActionData memory moduleActionData
    ) external returns (address[] memory);
}
