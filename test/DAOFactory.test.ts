import { ethers } from "hardhat";
import { DAO, DAOAccessControl, DAOFactory } from "../typechain";
import { expect } from "chai";
import { ContractTransaction } from "ethers";

describe("DAOFactory", () => {
  let daoAddress: string;
  let createDAOTx: ContractTransaction;
  let daoFactory: DAOFactory;
  let daoPrototype: DAO;
  let daoAccessControlPrototype: DAOAccessControl;

  beforeEach(async () => {
    const DAOFactory = await ethers.getContractFactory("DAOFactory");
    daoFactory = await DAOFactory.deploy();
    const DAO = await ethers.getContractFactory("DAO");
    daoPrototype = await DAO.deploy();
    const DAOAccessControl = await ethers.getContractFactory(
      "DAOAccessControl"
    );
    daoAccessControlPrototype = await DAOAccessControl.deploy();

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
      daoPrototype.address,
      daoAccessControlPrototype.address,
      [],
      [],
      [],
      [],
      [],
      [],
    ];

    daoAddress = await daoFactory.callStatic.createDAO(...createParams);
    createDAOTx = await daoFactory.createDAO(...createParams);
  });

  it("emits an event with the new DAO's address", async () => {
    expect(createDAOTx).to.emit(daoFactory, "DAOCreated").withArgs(daoAddress);
  });

  it.skip("DAOFactory supports the expected ERC165 interface");
});
