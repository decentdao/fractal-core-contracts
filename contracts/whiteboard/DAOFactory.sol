//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./IDAOFactory.sol";
import "./IDAOAccessControl.sol";
import "./IDAOModuleBase.sol";

contract DAOFactory is IDAOFactory, ERC165 {
  function createDAO(
    address daoImplementation,
    address accessControlImplementation,
    string[] memory roles,
    string[] memory rolesAdmins,
    address[][] memory members,
    address[] memory targets,
    string[] memory functionDescs,
    string[][] memory actionRoles
  ) external returns (address) {
    address dao = address(new ERC1967Proxy(daoImplementation, ""));

    address accessControl = address(
      new ERC1967Proxy(
        accessControlImplementation,
        abi.encodeWithSelector(
          IDAOAccessControl(payable(address(0))).initialize.selector,
          dao,
          roles,
          rolesAdmins,
          members,
          targets,
          functionDescs,
          actionRoles
        )
      )
    );

    IDAOModuleBase(dao).initialize(accessControl);

    emit DAOCreated(dao);

    return dao;
  }

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
