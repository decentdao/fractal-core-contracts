//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./interfaces/IDAOFactory.sol";
import "./interfaces/IAccessControl.sol";
import "./interfaces/IModuleBase.sol";

/// @notice A factory contract for deploying DAOs with an access control contract
contract DAOFactory is IDAOFactory, ERC165 {
  /// @notice Creates a DAO with an access control contract
  /// @param createDaoParams Struct of all the parameters required to create a DAO
  /// @return dao The address of the deployed DAO proxy contract
  /// @return accessControl The address of the deployed access control proxy contract
  function createDAO(CreateDAOParams calldata createDaoParams)
    external
    returns (address dao, address accessControl)
  {
    dao = address(new ERC1967Proxy(createDaoParams.daoImplementation, ""));

    uint256 arrayLength = createDaoParams.moduleTargets.length +
      createDaoParams.daoFunctionDescs.length;

    address[] memory targets = new address[](arrayLength);
    string[] memory functionDescs = new string[](arrayLength);
    string[][] memory actionRoles = new string[][](arrayLength);

    for (uint256 i; i < createDaoParams.daoFunctionDescs.length; i++) {
      targets[i] = dao;
      functionDescs[i] = createDaoParams.daoFunctionDescs[i];
      actionRoles[i] = createDaoParams.daoActionRoles[i];
    }

    for (uint256 i; i < createDaoParams.moduleTargets.length; i++) {
      uint256 currentIndex = i + createDaoParams.daoFunctionDescs.length;
      targets[currentIndex] = createDaoParams.moduleTargets[i];
      functionDescs[currentIndex] = createDaoParams.moduleFunctionDescs[i];
      actionRoles[currentIndex] = createDaoParams.moduleActionRoles[i];
    }

    accessControl = address(
      new ERC1967Proxy(
        createDaoParams.accessControlImplementation,
        abi.encodeWithSelector(
          IAccessControl(payable(address(0))).initialize.selector,
          dao,
          createDaoParams.roles,
          createDaoParams.rolesAdmins,
          createDaoParams.members,
          targets,
          functionDescs,
          actionRoles
        )
      )
    );

    IModuleBase(dao).initialize(accessControl);

    emit DAOCreated(dao, accessControl);
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
