import { ethers, deployments } from "hardhat";
import {
  DAO,
  AccessControl,
  AccessControl__factory,
  DAOFactory,
  IDAOFactory__factory,
  DAO__factory,
} from "../typechain-types";
import { expect } from "chai";
import { ContractTransaction } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import getInterfaceSelector from "./helpers/getInterfaceSelector";

describe("DAOFactory", () => {
  let deployer: SignerWithAddress;
  let executor1: SignerWithAddress;
  let executor2: SignerWithAddress;
  let executor3: SignerWithAddress;
  let upgrader1: SignerWithAddress;
  let daoFactory: DAOFactory;
  let daoImpl: DAO;
  let accessControlImpl: AccessControl;
  let daoAddress: string;
  let accessControlAddress: string;
  let createDAOTx: ContractTransaction;
  let daoCreated: DAO;
  let accessControlCreated: AccessControl;

  beforeEach(async () => {
    [deployer, executor1, executor2, executor3, upgrader1] =
      await ethers.getSigners();

    // Use DAOFactory, DAO (implementation contract), AccessControl (implementation contract)
    // As deployed from the deploy scripts in the deploy/core folder
    await deployments.fixture();
    daoFactory = await ethers.getContract("DAOFactory");
    daoImpl = await ethers.getContract("DAO");
    accessControlImpl = await ethers.getContract("AccessControl");

    [daoAddress, accessControlAddress] = await daoFactory.callStatic.createDAO(
      deployer.address,
      {
        daoImplementation: daoImpl.address,
        accessControlImplementation: accessControlImpl.address,
        daoName: "TestDao",
        roles: ["EXECUTE_ROLE", "UPGRADE_ROLE"],
        rolesAdmins: ["DAO_ROLE", "DAO_ROLE"],
        members: [[executor1.address, executor2.address], [upgrader1.address]],
        daoFunctionDescs: [
          "execute(address[],uint256[],bytes[])",
          "upgradeTo(address)",
        ],
        daoActionRoles: [["EXECUTE_ROLE"], ["EXECUTE_ROLE", "UPGRADE_ROLE"]],
      }
    );

    createDAOTx = await daoFactory.createDAO(deployer.address, {
      daoImplementation: daoImpl.address,
      accessControlImplementation: accessControlImpl.address,
      daoName: "TestDao",
      roles: ["EXECUTE_ROLE", "UPGRADE_ROLE"],
      rolesAdmins: ["DAO_ROLE", "DAO_ROLE"],
      members: [[executor1.address, executor2.address], [upgrader1.address]],
      daoFunctionDescs: [
        "execute(address[],uint256[],bytes[])",
        "upgradeTo(address)",
      ],
      daoActionRoles: [["EXECUTE_ROLE"], ["EXECUTE_ROLE", "UPGRADE_ROLE"]],
    });

    // eslint-disable-next-line camelcase
    daoCreated = DAO__factory.connect(daoAddress, deployer);

    // eslint-disable-next-line camelcase
    accessControlCreated = AccessControl__factory.connect(
      accessControlAddress,
      deployer
    );
  });

  it("emits an event with the new DAO's address", async () => {
    expect(createDAOTx)
      .to.emit(daoFactory, "DAOCreated")
      .withArgs(
        daoAddress,
        accessControlAddress,
        deployer.address,
        deployer.address
      );
  });

  it("Creates a DAO and AccessControl Contract", async () => {
    // eslint-disable-next-line no-unused-expressions
    expect(daoAddress).to.be.properAddress;
    // eslint-disable-next-line no-unused-expressions
    expect(accessControlAddress).to.be.properAddress;
  });

  it("Base Init for DAO", async () => {
    expect(await daoCreated.accessControl()).to.eq(accessControlAddress);
    expect(await daoCreated.name()).to.eq("TestDao");
  });

  it("Base Init for Access Control", async () => {
    expect(
      await accessControlCreated.hasRole(
        await accessControlCreated.DAO_ROLE(),
        daoAddress
      )
    ).to.eq(true);
  });

  it("Executor Role is set", async () => {
    expect(
      await accessControlCreated.hasRole("EXECUTE_ROLE", executor1.address)
    ).to.eq(true);
    expect(
      await accessControlCreated.hasRole("EXECUTE_ROLE", executor2.address)
    ).to.eq(true);
    expect(await accessControlCreated.getRoleAdmin("EXECUTE_ROLE")).to.eq(
      "DAO_ROLE"
    );
  });

  it("Upgrade Role is set", async () => {
    expect(
      await accessControlCreated.hasRole("UPGRADE_ROLE", upgrader1.address)
    ).to.eq(true);
    expect(
      await accessControlCreated.hasRole("UPGRADE_ROLE", upgrader1.address)
    ).to.eq(true);
    expect(await accessControlCreated.getRoleAdmin("UPGRADE_ROLE")).to.eq(
      "DAO_ROLE"
    );
  });

  it("Should setup Actions", async () => {
    expect(
      await accessControlCreated.getActionRoles(
        daoAddress,
        "execute(address[],uint256[],bytes[])"
      )
    ).to.deep.eq(["EXECUTE_ROLE"]);

    expect(
      await accessControlCreated.getActionRoles(
        daoAddress,
        "upgradeTo(address)"
      )
    ).to.deep.eq(["EXECUTE_ROLE", "UPGRADE_ROLE"]);
  });

  it("Revert Initilize", async () => {
    await expect(accessControlCreated.initialize("", [], [], [], [], [], [])).to
      .reverted;
    await expect(daoCreated.initialize("", "")).to.reverted;
  });

  it("executor EOA should be able to call `execute`", async () => {
    const transferCallData = accessControlCreated.interface.encodeFunctionData(
      "grantRole",
      ["EXECUTE_ROLE", executor3.address]
    );

    expect(
      await accessControlCreated.hasRole("EXECUTE_ROLE", executor3.address)
    ).to.eq(false);

    const tx: ContractTransaction = await daoCreated
      .connect(executor1)
      .execute([accessControlCreated.address], [0], [transferCallData]);

    expect(tx).to.emit(accessControlCreated, "RoleGranted");

    expect(
      await accessControlCreated.hasRole("EXECUTE_ROLE", executor1.address)
    ).to.eq(true);
    expect(
      await accessControlCreated.hasRole("EXECUTE_ROLE", executor2.address)
    ).to.eq(true);
    expect(
      await accessControlCreated.hasRole("EXECUTE_ROLE", executor3.address)
    ).to.eq(true);
  });

  it("Non executor EOA should revert w/ Execute", async () => {
    const transferCallData = accessControlCreated.interface.encodeFunctionData(
      "grantRole",
      ["EXECUTE_ROLE", executor3.address]
    );

    await expect(
      daoCreated
        .connect(upgrader1)
        .execute([accessControlCreated.address], [0], [transferCallData])
    ).to.revertedWith("NotAuthorized()");
  });

  it("upgrader EOA should be able to upgrade", async () => {
    const newImpl = await new DAO__factory(deployer).deploy();

    await expect(
      daoCreated.connect(upgrader1).upgradeTo(newImpl.address)
    ).to.emit(daoCreated, "Upgraded");
  });

  it("Non-upgrader should revert w/ UpgradeTo", async () => {
    const newImpl = await new DAO__factory(deployer).deploy();

    await expect(daoCreated.upgradeTo(newImpl.address)).to.revertedWith(
      "NotAuthorized()"
    );
  });

  it("Supports the expected ERC165 interface", async () => {
    // Supports DAO Factory interface
    expect(
      await daoFactory.supportsInterface(
        // eslint-disable-next-line camelcase
        getInterfaceSelector(IDAOFactory__factory.createInterface())
      )
    ).to.eq(true);

    // Supports ERC-165 interface
    expect(await daoFactory.supportsInterface("0x01ffc9a7")).to.eq(true);
  });
});
