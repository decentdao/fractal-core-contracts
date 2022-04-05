import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import {
  DAO__factory,
  DAO,
  DAOFactory,
  DAOFactory__factory,
  AccessControl,
  AccessControl__factory,
  MetaFactory__factory,
  MetaFactory,
  GovernorModule,
  GovernorModule__factory,
  GovernorFactory,
  GovernorFactory__factory,
  TreasuryModule,
  TreasuryModule__factory,
  TreasuryModuleFactory,
  TreasuryModuleFactory__factory,
  TimelockUpgradeable,
  TimelockUpgradeable__factory,
  VotesTokenWithSupply,
  VotesTokenWithSupply__factory,
  IMetaFactory__factory,
} from "../typechain-types";
import getInterfaceSelector from "./helpers/getInterfaceSelector";

describe("MetaFactory", () => {
  // Factories
  let daoFactory: DAOFactory;
  let govFactory: GovernorFactory;
  let treasuryFactory: TreasuryModuleFactory;
  let metaFactory: MetaFactory;

  // Impl
  let accessControlImpl: AccessControl;
  let daoImpl: DAO;
  let govImpl: GovernorModule;
  let timelockImpl: TimelockUpgradeable;
  let treasuryImpl: TreasuryModule;
  let governanceToken: VotesTokenWithSupply;

  // Deployed contracts(Proxy)
  let daoAddress: string;
  let accessControlAddress: string;
  let timelockAddress: string;
  let governorAddress: string;
  let treasuryAddress: string;
  let accessControl: AccessControl;
  let dao: DAO;
  let govModule: GovernorModule;
  let timelock: TimelockUpgradeable;
  let createTx: ContractTransaction;

  // Wallets
  let deployer: SignerWithAddress;
  let upgrader: SignerWithAddress;
  let executor1: SignerWithAddress;
  let voterA: SignerWithAddress;
  let voterB: SignerWithAddress;
  let voterC: SignerWithAddress;

  beforeEach(async () => {
    [deployer, executor1, voterA, voterB, voterC, upgrader] =
      await ethers.getSigners();

    // Deploy Impl Contracts
    daoImpl = await new DAO__factory(deployer).deploy();
    accessControlImpl = await new AccessControl__factory(deployer).deploy();
    // govImpl = await new GovernorModule__factory(deployer).deploy();
    // timelockImpl = await new TimelockUpgradeable__factory(deployer).deploy();
    treasuryImpl = await new TreasuryModule__factory(deployer).deploy();
    // Create a new ERC20Votes token to bring as the DAO governance token

    // Deploy Factory Impl
    daoFactory = await new DAOFactory__factory(deployer).deploy();
    govFactory = await new GovernorFactory__factory(deployer).deploy();
    treasuryFactory = await new TreasuryModuleFactory__factory(
      deployer
    ).deploy();
    metaFactory = await new MetaFactory__factory(deployer).deploy();

    const abiCoder = new ethers.utils.AbiCoder();

    const createDAOParams = {
      daoImplementation: daoImpl.address,
      accessControlImplementation: accessControlImpl.address,
      daoName: "TestDao",
      roles: ["EXECUTE_ROLE", "UPGRADE_ROLE"],
      rolesAdmins: ["DAO_ROLE", "DAO_ROLE"],
      members: [[executor1.address], [upgrader.address]],
      daoFunctionDescs: [
        "execute(address[],uint256[],bytes[])",
        "upgradeTo(address)",
      ],
      daoActionRoles: [["EXECUTE_ROLE"], ["EXECUTE_ROLE", "UPGRADE_ROLE"]],
      moduleTargets: [],
      moduleFunctionDescs: [],
      moduleActionRoles: [],
    };

    const moduleFactoriesCalldata = [
      {
        factory: treasuryFactory.address,
        implementation: treasuryImpl.address,
        data: abiCoder.encode(["address"], [treasuryImpl.address]),
        value: 0,
        newContractAddressesToPass: [1],
      },
    ];

    const moduleActionCalldata = {
      contractIndexes: [2, 2, 2, 2, 2, 2],
      functionDescs: [
        "withdrawEth(address[],uint256[])",
        "depositERC20Tokens(address[],address[],uint256[])",
        "withdrawERC20Tokens(address[],address[],uint256[])",
        "depositERC721Tokens(address[],address[],uint256[])",
        "withdrawERC721Tokens(address[],address[],uint256[])",
        "upgradeTo(address)",
      ],
      roles: [
        ["WITHDRAWER_ROLE"],
        ["WITHDRAWER_ROLE"],
        ["WITHDRAWER_ROLE"],
        ["WITHDRAWER_ROLE"],
        ["WITHDRAWER_ROLE"],
        ["UPGRADE_ROLE"],
      ],
    };

    await metaFactory
      .connect(deployer)
      .createDAOAndModules(
        daoFactory.address,
        0,
        createDAOParams,
        moduleFactoriesCalldata,
        moduleActionCalldata
      );
  });

  it("Created a DAO and module", async () => {
    expect(true).to.eq(true);
  });
});
