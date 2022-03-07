import { ethers } from "hardhat";
import {
  AccessControl__factory,
  DAO,
  DAOAccessControl,
  DAOAccessControl__factory,
  DAOFactory,
  DAOFactory__factory,
  DAO__factory,
} from "../typechain";
import { expect } from "chai";
import { ContractTransaction } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe.only("DAOFactory", () => {
  let deployer: SignerWithAddress;
  let executor1: SignerWithAddress;
  let executor2: SignerWithAddress;
  let daoFactory: DAOFactory;
  let daoImpl: DAO;
  let accessControlImpl: DAOAccessControl;
  let daoAddress: string;
  let accessControlAddress: string;
  let createDAOTx: ContractTransaction;

  beforeEach(async () => {
    [deployer, executor1, executor2] = await ethers.getSigners();
    daoFactory = await new DAOFactory__factory(deployer).deploy();
    daoImpl = await new DAO__factory(deployer).deploy();
    accessControlImpl = await new DAOAccessControl__factory(deployer).deploy();

    const createParams: [
      string,
      string,
      string[],
      string[],
      string[][],
      string[],
      string[],
      string[][]
    ] = [
      daoImpl.address,
      accessControlImpl.address,
      ["EXECUTE_ROLE"],
      ["DAO_ROLE"],
      [[executor1.address, executor2.address]],
      [dao.address],
      ["execute(address[],uint256[],bytes[])"],
      [["EXECUTE_ROLE"]],
    ];

    [daoAddress, accessControlAddress] = await daoFactory.callStatic.createDAO(
      ...createParams
    );
    createDAOTx = await daoFactory.createDAO(...createParams);
  });

  it("emits an event with the new DAO's address", async () => {
    expect(createDAOTx)
      .to.emit(daoFactory, "DAOCreated")
      .withArgs(daoAddress, accessControlAddress);
  });

  it("Creates a DAO and AccessControl Contract", async () => {
    // eslint-disable-next-line no-unused-expressions
    expect(daoAddress).to.be.properAddress;
    // eslint-disable-next-line no-unused-expressions
    expect(accessControlAddress).to.be.properAddress;
  });

  it("Base Init for DAO", async () => {
    // eslint-disable-next-line camelcase
    const daoCreated = DAO__factory.connect(daoAddress, deployer);
    expect(await daoCreated.accessControl()).to.eq(accessControlAddress);
  });

  it("Base Init for Access Control", async () => {
    // eslint-disable-next-line camelcase
    const accessControlCreated = DAOAccessControl__factory.connect(
      accessControlAddress,
      deployer
    );
    expect(
      await accessControlCreated.hasRole(
        await accessControlCreated.DAO_ROLE(),
        daoAddress
      )
    ).to.eq(true);
  });

  // it("Returns a dao contract and an accessControl contract");

  // it("Inits the dao contract");
  // it("Inits the access control contract");
  // it("Upgradeability???");

  it.skip("DAOFactory supports the expected ERC165 interface");
});
