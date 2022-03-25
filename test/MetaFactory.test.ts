import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import {
  DAO__factory,
  DAO,
  DAOFactory,
  DAOFactory__factory,
  IDAO__factory,
  AccessControl,
  AccessControl__factory,
  MetaFactory__factory,
  MetaFactory,
} from "../typechain";

describe("MetaFactory", () => {
  let accessControlImpl: AccessControl;
  let daoImpl: DAO;
  let accessControl: AccessControl;
  let dao: DAO;
  let daoFactory: DAOFactory;
  let metaFactory: MetaFactory;
  // Wallets
  let deployer: SignerWithAddress;
  let upgrader: SignerWithAddress;
  let executor1: SignerWithAddress;
  let executor2: SignerWithAddress;
  let executor3: SignerWithAddress;

  beforeEach(async () => {
    [deployer, executor1, executor2, executor3] = await ethers.getSigners();

    // Deploy Contracts
    daoImpl = await new DAO__factory(deployer).deploy();
    accessControlImpl = await new AccessControl__factory(deployer).deploy();
    daoFactory = await new DAOFactory__factory(deployer).deploy();
    metaFactory = await new MetaFactory__factory(deployer).deploy();

    const daoCalldata = daoFactory.interface.encodeFunctionData("createDAO", [
      {
        daoImplementation: daoImpl.address,
        accessControlImplementation: accessControlImpl.address,
        roles: ["EXECUTE_ROLE", "UPGRADE_ROLE"],
        rolesAdmins: ["DAO_ROLE", "DAO_ROLE"],
        members: [[executor1.address, executor2.address], [upgrader.address]],
        daoFunctionDescs: [
          "execute(address[],uint256[],bytes[])",
          "upgradeTo(address)",
        ],
        daoActionRoles: [["EXECUTE_ROLE"], ["EXECUTE_ROLE", "UPGRADE_ROLE"]],
        moduleTargets: [],
        moduleFunctionDescs: [],
        moduleActionRoles: [],
      },
    ]);

    await metaFactory
      .connect(deployer)
      .createDAOAndModules(daoFactory.address, 0);
  });

  it("Deploys a DAO and modules", async () => {});
});
