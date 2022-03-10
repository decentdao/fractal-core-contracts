import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import {
  DAO__factory,
  DAO,
  IDAO__factory,
  AccessControl,
  AccessControl__factory,
} from "../typechain";
import getInterfaceSelector from "./helpers/getInterfaceSelector";

describe("DAO", () => {
  let daoAccessControl: AccessControl;
  let dao: DAO;
  // Wallets
  let deployer: SignerWithAddress;
  let executor1: SignerWithAddress;
  let executor2: SignerWithAddress;
  let executor3: SignerWithAddress;

  beforeEach(async () => {
    [deployer, executor1, executor2, executor3] = await ethers.getSigners();

    // Deploy Contracts
    daoAccessControl = await new AccessControl__factory(deployer).deploy();
    dao = await new DAO__factory(deployer).deploy();
  });

  describe("an empty DAO", () => {
    beforeEach(async () => {
      // Initilizes Contracts
      await daoAccessControl.initialize(dao.address, [], [], [], [], [], []);
      await dao.initialize(daoAccessControl.address);
    });

    it("Supports the expected ERC165 interface", async () => {
      // Supports DAO interface
      expect(
        await dao.supportsInterface(
          // eslint-disable-next-line camelcase
          getInterfaceSelector(IDAO__factory.createInterface())
        )
      ).to.eq(true);

      // Supports ERC-165 interface
      expect(await dao.supportsInterface("0x01ffc9a7")).to.eq(true);

      // Todo: Add checks for arbitrary interfaces returning false
    });

    it("has the DAO_ROLE", async () => {
      expect(
        await daoAccessControl.hasRole(
          await daoAccessControl.DAO_ROLE(),
          dao.address
        )
      ).to.eq(true);
    });

    it("doesn't allow anyone to grant the EXECUTE role", async () => {
      await expect(
        daoAccessControl.grantRole("EXECUTE_ROLE", deployer.address)
      ).to.be.revertedWith(`MissingRole("${deployer.address}", "")`);
    });

    it("doesn't allow anyone to revoke existing roles", async () => {
      await expect(
        daoAccessControl.revokeRole("EXECUTE_ROLE", executor1.address)
      ).to.be.revertedWith(`MissingRole("${deployer.address}", "")`);
    });

    it("doesn't allow anyone to call `execute`", async () => {
      await expect(dao.connect(executor1).execute([], [], [])).to.reverted;
    });
  });

  describe("a dao with `execute` permissions", () => {
    beforeEach(async () => {
      // Initilizes Contracts
      await daoAccessControl.initialize(
        dao.address,
        ["EXECUTE_ROLE"],
        ["DAO_ROLE"],
        [[executor1.address, executor2.address]],
        [dao.address],
        ["execute(address[],uint256[],bytes[])"],
        [["EXECUTE_ROLE"]]
      );
      await dao.initialize(daoAccessControl.address);
    });

    it("Init Access Control", async () => {
      expect(await dao.accessControl()).to.eq(daoAccessControl.address);
    });

    it("executor EOA should be able to call `execute`", async () => {
      const transferCallData = daoAccessControl.interface.encodeFunctionData(
        "grantRole",
        ["EXECUTE_ROLE", executor3.address]
      );

      expect(
        await daoAccessControl.hasRole("EXECUTE_ROLE", executor3.address)
      ).to.eq(false);

      const tx: ContractTransaction = await dao
        .connect(executor1)
        .execute([daoAccessControl.address], [0], [transferCallData]);

      expect(tx).to.emit(daoAccessControl, "RoleGranted");

      expect(
        await daoAccessControl.hasRole("EXECUTE_ROLE", executor1.address)
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole("EXECUTE_ROLE", executor2.address)
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole("EXECUTE_ROLE", executor3.address)
      ).to.eq(true);
    });

    it("UnAuthUser should NOT be able to call `execute`", async () => {
      const transferCallData = daoAccessControl.interface.encodeFunctionData(
        "grantRole",
        ["EXECUTE_ROLE", executor3.address]
      );

      await expect(
        dao
          .connect(executor3)
          .execute([daoAccessControl.address], [0], [transferCallData])
      ).to.be.revertedWith("NotAuthorized");
    });

    it("UnAuthDAO should NOT be able to call `execute`", async () => {
      const daoUnAuth = await new DAO__factory(deployer).deploy();
      daoUnAuth.initialize(daoAccessControl.address);
      const transferCallData = daoAccessControl.interface.encodeFunctionData(
        "grantRole",
        ["EXECUTE_ROLE", executor3.address]
      );

      await expect(
        daoUnAuth
          .connect(executor1)
          .execute([daoAccessControl.address], [0], [transferCallData])
      ).to.reverted;
    });
  });
});
