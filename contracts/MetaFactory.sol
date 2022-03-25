//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "hardhat/console.sol";

// import "./interfaces/IDAOFactory.sol";
// import "./interfaces/IAccessControl.sol";
// import "./interfaces/IDAO.sol";

/// @notice A factory contract for deploying DAOs along with any desired modules within one transaction
contract MetaFactory is ERC165 {
    error UnequalArrayLengths();

    struct CreateDAOAndModulesParams {
        address daoFactory;
        uint256 daoValue;
        bytes daoCalldata;
        address[] moduleFactories;
        uint256[] moduleValues;
        bytes[] moduleCalldatas;
        bool[] moduleRequiresDAOAddress;
        bool[] moduleRequiresAccessControlAddress;
    }

    function createDAOAndModules(
        CreateDAOAndModulesParams calldata createDAOAndModulesParams
    ) external {
        uint256 moduleCount = createDAOAndModulesParams.moduleFactories.length;
        if (
            moduleCount != createDAOAndModulesParams.moduleValues.length ||
            moduleCount != createDAOAndModulesParams.moduleCalldatas.length ||
            moduleCount !=
            createDAOAndModulesParams.moduleRequiresDAOAddress.length ||
            moduleCount !=
            createDAOAndModulesParams.moduleRequiresAccessControlAddress.length
        ) {
            revert UnequalArrayLengths();
        }
        // Deploy DAO, get DAO and Access Control addresses
        string
            memory errorMessage = "MetaFactory: Call reverted without message";
        (bool success, bytes memory returndata) = createDAOAndModulesParams
            .daoFactory
            .call{value: createDAOAndModulesParams.daoValue}(
            createDAOAndModulesParams.daoCalldata
        );
        Address.verifyCallResult(success, returndata, errorMessage);

        // Get DAO address and Access Control address from return data

        (address dao, address accessControl) = abi.decode(returndata, (address, address));
        console.logAddress(dao);
        console.logAddress(accessControl);

        // Create modules
        // for (uint256 i = 0; i < moduleCount; ) {
        //     (bool success, bytes memory returndata) = createDAOAndModulesParams.moduleFactories[i].call{
        //         value: createDAOAndModulesParams.moduleValues[i]
        //     }(createDAOAndModulesParams.moduleCalldatas[i]);
        //     Address.verifyCallResult(success, returndata, errorMessage);
        //     unchecked {
        //         i++;
        //     }
        // }
    }

    // /// @notice Returns whether a given interface ID is supported
    // /// @param interfaceId An interface ID bytes4 as defined by ERC-165
    // /// @return bool Indicates whether the interface is supported
    // function supportsInterface(bytes4 interfaceId)
    //     public
    //     view
    //     virtual
    //     override
    //     returns (bool)
    // {
    //     return
    //         interfaceId == type(IDAOFactory).interfaceId ||
    //         super.supportsInterface(interfaceId);
    // }
}
