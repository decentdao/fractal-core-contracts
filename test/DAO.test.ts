import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BytesLike } from "ethers";
import { ethers } from "hardhat";
import { DAOFactory, DAO, DAOAccessControl } from "../typechain";

describe.only("DAO", () => {
  let daoFactory: DAOFactory;
  let daoPrototype: DAO;
  let daoAccessControlPrototype: DAOAccessControl;

  beforeEach(async () => {
    let DAOFactory = await ethers.getContractFactory("DAOFactory");
    daoFactory = await DAOFactory.deploy();
    const DAO = await ethers.getContractFactory("DAO");
    daoPrototype = await DAO.deploy();
    const DAOAccessControl = await ethers.getContractFactory("DAOAccessControl");
    daoAccessControlPrototype = await DAOAccessControl.deploy();
  });

  describe("an empty DAO", () => {
    let dao: DAO;
    let accessControl: DAOAccessControl;

    beforeEach(async () => {
      const createParams: [string, string, string[], BytesLike[], BytesLike[], string[][]] = [daoPrototype.address, daoAccessControlPrototype.address, [], [], [], []];
      const daoAddress = await daoFactory.callStatic.createDAO(...createParams);
      await daoFactory.createDAO(...createParams);
      const DAO = await ethers.getContractFactory("DAO");
      dao = DAO.attach(daoAddress);
      const DAOAccessControl = await ethers.getContractFactory("DAOAccessControl");
      accessControl = DAOAccessControl.attach(await dao.accessControl());
    });

    it("has the DEFAULT_ADMIN_ROLE", async () => {
      expect(await accessControl.hasRole(await accessControl.DEFAULT_ADMIN_ROLE(), dao.address)).to.be.true;
    });

    it("doesn't allow anyone to add new roles", async () => {
      const [account] = await ethers.getSigners();
      await expect(
        accessControl.grantRole(ethers.utils.keccak256(Buffer.from("new role")), ethers.constants.AddressZero)
      ).to.be.revertedWith(`AccessControl: account ${account.address.toLowerCase()} is missing role ${ethers.constants.HashZero}`)
    });

    it("doesn't allow anyone to grant the EXECUTE role", async () => {
      const [account] = await ethers.getSigners();
      await expect(
        accessControl.grantRole(await dao.EXECUTE_ROLE(), ethers.constants.AddressZero)
      ).to.be.revertedWith(`AccessControl: account ${account.address.toLowerCase()} is missing role ${ethers.constants.HashZero}`)
    });

    it("doesn't allow anyone to revoke existing roles", async () => {
      const [account] = await ethers.getSigners();
      await expect(
        accessControl.revokeRole(await dao.EXECUTE_ROLE(), dao.address)
      ).to.be.revertedWith(`AccessControl: account ${account.address.toLowerCase()} is missing role ${ethers.constants.HashZero}`)
    });

    it("doesn't allow anyone to call `execute`", async () => {
      const [account] = await ethers.getSigners();
      const executeRole = await dao.EXECUTE_ROLE();
      await expect(dao.execute([], [], [])).to.be.revertedWith(`Unauthorized("${executeRole}", "${account.address}")`)
    });
  });

  describe("a dao with one account that has `execute` permissions", () => {
    let dao: DAO;
    let executor: SignerWithAddress;

    beforeEach(async () => {
      [executor] = await ethers.getSigners();
      const permissions: [string, string, string[], BytesLike[], BytesLike[], string[][]] = [
        daoPrototype.address,
        daoAccessControlPrototype.address,
        [executor.address],
        [],
        [],
        []
      ];
      const daoAddress = await daoFactory.callStatic.createDAO(...permissions);
      await daoFactory.createDAO(...permissions);
      const DAO = await ethers.getContractFactory("DAO");
      dao = DAO.attach(daoAddress);
    });

    it("executor EOA should be able to call `execute`", async () => {
      const newDAOTx = await dao.execute(
        [daoFactory.address],
        [0],
        [daoFactory.interface.encodeFunctionData("createDAO", [daoPrototype.address, daoAccessControlPrototype.address, [], [], [], []])]
      );

      expect(newDAOTx).to.emit(daoFactory, "DAOCreated");
    });
  });

  it("DAO supports the expected ERC165 interface")
});
