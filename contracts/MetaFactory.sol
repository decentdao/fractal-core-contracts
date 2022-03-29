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
    /// @notice Creates a DAO, access control, governor, and treasury contracts
    /// @param daoFactory The address of the DAO factory
    /// @param governorFactory The address of the governor factory
    /// @param treasuryFactory The address of the treasury factory
    /// @param treasuryImplementation The address of the treasury implementation
    /// @param createDAOParams The struct of parameters used for the DAO creation
    /// @param createGovernorParams The struct of parameters used for the governor creation
    /// @return dao The address of the created DAO contract
    /// @return accessControl The address of the created access control contract
    /// @return timelock The address of the created timelock contract
    /// @return governor The address of the created governor contract
    /// @return treasury The address of the created treasury contract
    function createDAOAndModules(
        address daoFactory,
        address governorFactory,
        address treasuryFactory,
        address treasuryImplementation,
        IDAOFactory.CreateDAOParams calldata createDAOParams,
        IGovernorFactory.CreateGovernorParams calldata createGovernorParams
    )
        external
        returns (
            address dao,
            address accessControl,
            address timelock,
            address governor,
            address treasury
        )
    {
        // must initiate in one transaction
        // Open up the execute function  or allow to create roles. Update access control?
        (dao, accessControl) = IDAOFactory(daoFactory).createDAO(
            msg.sender,
            createDAOParams
        );
        (timelock, governor) = IGovernorFactory(governorFactory).createGovernor(
            dao,
            accessControl,
            createGovernorParams
        );
        treasury = ITreasuryModuleFactory(treasuryFactory).createTreasury(
            accessControl,
            treasuryImplementation
        );

        // Roles
        string[] memory roles = new string[](2);
        roles[0] = "EXECUTE_ROLE";
        roles[1] = "GOV_ROLE";

        // Roles Admins
        string[] memory rolesAdmin = new string[](2);
        rolesAdmin[0] = "DAO_ROLE";
        rolesAdmin[1] = "DAO_ROLE";

        // Members
        address[][] memory members = new address[][](2);
        {
            address[] memory memberArray = new address[](1);
            memberArray[0] = timelock;
            members[0] = memberArray;
            
            address[] memory memberArray2 = new address[](1);
            memberArray2[0] = governor;
            members[1] = memberArray2;
        }

        // Targets
        address[] memory targets = new address[](11);
        targets[0] = timelock;
        targets[1] = timelock;
        targets[2] = timelock;
        targets[3] = timelock;
        targets[4] = governor;
        targets[5] = timelock;
        targets[6] = treasury;
        targets[7] = treasury;
        targets[8] = treasury;
        targets[9] = treasury;
        targets[10] = treasury;

        // FuncDescs
        string[] memory descs = new string[](11);
        descs[0] = "updateDelay(uint256)";
        descs[1] = "scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32,uint256)";
        descs[2] = "cancel(bytes32)";
        descs[3] = "executeBatch(address[],uint256[],bytes[],bytes32,bytes32)";
        descs[4] = "upgradeTo(address)";
        descs[5] = "upgradeTo(address)";
        descs[6] = "withdrawEth(address[],uint256[])";
        descs[7] = "depositERC20Tokens(address[],address[],uint256[])";
        descs[8] = "withdrawERC20Tokens(address[],address[],uint256[])";
        descs[9] = "depositERC721Tokens(address[],address[],uint256[])";
        descs[10] = "withdrawERC721Tokens(address[],address[],uint256[])";

        // Members
        string[][] memory actionRoles = new string[][](11);
        {
            string[] memory role1 = new string[](1);
            role1[0] = "GOV_ROLE";
            actionRoles[0] = role1;

            string[] memory role2 = new string[](1);
            role2[0] = "GOV_ROLE";
            actionRoles[1] = role2;

            string[] memory role3 = new string[](1);
            role3[0] = "GOV_ROLE";
            actionRoles[2] = role3;

            string[] memory role4 = new string[](1);
            role4[0] = "GOV_ROLE";
            actionRoles[3] = role4;

            string[] memory role5 = new string[](1);
            role5[0] = "UPGRADE_ROLE";
            actionRoles[4] = role5;

            string[] memory role6 = new string[](1);
            role6[0] = "UPGRADE_ROLE";
            actionRoles[5] = role6;

            string[] memory role7 = new string[](1);
            role7[0] = "DAO_ROLE";
            actionRoles[6] = role7;

            string[] memory role8 = new string[](1);
            role8[0] = "DAO_ROLE";
            actionRoles[7] = role8;

            string[] memory role9 = new string[](1);
            role9[0] = "DAO_ROLE";
            actionRoles[8] = role9;

            string[] memory role10 = new string[](1);
            role10[0] = "DAO_ROLE";
            actionRoles[9] = role10;

            string[] memory role11 = new string[](1);
            role11[0] = "DAO_ROLE";
            actionRoles[10] = role11;
        }

        // access
        address[] memory access = new address[](2);
        access[0] = accessControl;
        access[1] = accessControl;

        // values
        uint[] memory value = new uint[](2);
        value[0] = 0;
        value[1] = 0;

        // data
        bytes[] memory data = new bytes[](2);
        data[0] = abi.encodeWithSignature("grantRolesAndAdmins(string[],string[],address[][])", roles, rolesAdmin, members);
        data[1] = abi.encodeWithSignature("addActionsRoles(address[],string[],string[][])", targets, descs, actionRoles);


        IDAO(dao).execute(access, value, data);
        IAccessControl(accessControl).renounceRole("EXECUTE_ROLE", address(this));
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
