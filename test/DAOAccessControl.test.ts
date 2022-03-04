import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { DAOAccessControl, DAOAccessControl__factory } from "../typechain";
import chai from "chai";
import { ethers } from "hardhat";
import { BytesLike } from "ethers";

const expect = chai.expect;

describe.only("DAO Access Control Contract", function () {
  let daoAccessControl: DAOAccessControl;

  // Wallets
  let dao: SignerWithAddress;
  let deployer: SignerWithAddress;
  let executor1: SignerWithAddress;
  let executor2: SignerWithAddress;
  let executor3: SignerWithAddress;
  let roleAMember1: SignerWithAddress;
  let roleAMember2: SignerWithAddress;
  let roleBMember1: SignerWithAddress;
  let roleBMember2: SignerWithAddress;

  // Roles
  const daoRoleString = "DAO_ROLE";
  const executorString = "EXECUTE";
  const roleAString = "roleA";
  const roleBString = "roleB";

  // Actions
  const function1 = "functionName1(uint)";
  const function2 = "functionName2(address)";

  beforeEach(async function () {
    [
      dao,
      deployer,
      executor1,
      executor2,
      roleAMember1,
      roleAMember2,
      roleBMember1,
      roleBMember2,
    ] = await ethers.getSigners();

    // DAO Access Control contract deployment
    daoAccessControl = await new DAOAccessControl__factory(deployer).deploy();
  });

  describe("Initilize Access Control", function () {
    beforeEach(async function () {
      // Initialize with roleA as the admin of roleB
      await daoAccessControl.initialize(
        dao.address,
        [executorString, roleBString, roleAString],
        [daoRoleString, roleAString, daoRoleString],
        [
          [executor1.address, executor2.address],
          [roleBMember1.address, roleBMember2.address],
          [roleAMember1.address, roleAMember2.address],
        ]
      );
    });

    it("Should setup Executor Role", async () => {
      // Assign Executor Role
      expect(
        await daoAccessControl.hasRole(executorString, executor1.address)
      ).to.eq(true);

      expect(
        await daoAccessControl.hasRole(executorString, executor2.address)
      ).to.eq(true);

      expect(await daoAccessControl.getRoleAdmin(executorString)).to.eq(
        daoRoleString
      );
    });

    it("Should setup Default Admin Role", async () => {
      // Default Admin
      expect(await daoAccessControl.hasRole(daoRoleString, dao.address)).to.eq(
        true
      );

      expect(
        await daoAccessControl.hasRole(daoRoleString, executor1.address)
      ).to.eq(false);

      expect(
        await daoAccessControl.hasRole(daoRoleString, roleAMember1.address)
      ).to.eq(false);

      expect(
        await daoAccessControl.hasRole(daoRoleString, roleBMember1.address)
      ).to.eq(false);
    });

    it("Should setup Roles", async () => {
      expect(
        await daoAccessControl.hasRole(roleBString, roleBMember1.address)
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(roleBString, roleBMember2.address)
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(roleAString, roleAMember1.address)
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(roleAString, roleAMember2.address)
      ).to.eq(true);
    });
  });

  describe("Create New Roles", function () {
    beforeEach(async function () {
      // Initialize with roleA as the admin of roleB
      await daoAccessControl.initialize(dao.address, [], [], []);
    });

    it("Should batch create Roles", async () => {
      await daoAccessControl.connect(dao).grantRolesAndAdmins(
        [roleBString, roleAString],
        [roleAString, daoRoleString],
        [
          [roleBMember1.address, roleBMember2.address],
          [roleAMember1.address, roleAMember2.address],
        ]
      );

      expect(
        await daoAccessControl.hasRole(roleBString, roleBMember1.address)
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(roleBString, roleBMember2.address)
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(roleAString, roleAMember1.address)
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(roleAString, roleAMember2.address)
      ).to.eq(true);
      expect(await daoAccessControl.getRoleAdmin(roleBString)).to.eq(
        roleAString
      );

      expect(await daoAccessControl.getRoleAdmin(roleAString)).to.eq(
        daoRoleString
      );
    });

    it("Should override/update Role Admins", async () => {
      await daoAccessControl.connect(dao).grantRolesAndAdmins(
        [roleBString, roleAString],
        [roleAString, daoRoleString],
        [
          [roleBMember1.address, roleBMember2.address],
          [roleAMember1.address, roleAMember2.address],
        ]
      );

      await daoAccessControl
        .connect(dao)
        .grantRolesAndAdmins(
          [roleAString, roleBString],
          [roleBString, daoRoleString],
          [[], []]
        );

      expect(
        await daoAccessControl.hasRole(roleBString, roleBMember1.address)
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(roleBString, roleBMember2.address)
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(roleAString, roleAMember1.address)
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(roleAString, roleAMember2.address)
      ).to.eq(true);
      expect(await daoAccessControl.getRoleAdmin(roleAString)).to.eq(
        roleBString
      );
      expect(await daoAccessControl.getRoleAdmin(roleBString)).to.eq(
        daoRoleString
      );
    });

    it("Should revert UnAuthorized (batch create)", async () => {
      await expect(
        daoAccessControl.connect(executor1).grantRolesAndAdmins(
          [roleBString, roleAString],
          [roleAString, daoRoleString],
          [
            [roleBMember1.address, roleBMember2.address],
            [roleAMember1.address, roleAMember2.address],
          ]
        )
      ).to.reverted;
    });
  });

  describe("Action Roles", function () {
    beforeEach(async function () {
      // Initialize with roleA as the admin of roleB
      await daoAccessControl.initialize(
        dao.address,
        [roleBString, roleAString],
        [roleAString, daoRoleString],
        [
          [roleBMember1.address, roleBMember2.address],
          [roleAMember1.address, roleAMember2.address],
        ]
      );
    });
    it("Should setup Actions", async () => {
      // Give both roleA and roleB authorization over action1
      // Give roleA authorization over action2
      await daoAccessControl
        .connect(dao)
        .addActionsRoles(
          [deployer.address, deployer.address],
          [function1, function2],
          [[roleAString, roleBString], [roleAString]]
        );
      expect(
        await daoAccessControl.getActionRoles(deployer.address, function1)
      ).to.deep.eq([roleAString, roleBString]);

      expect(
        await daoAccessControl.getActionRoles(deployer.address, function2)
      ).to.deep.eq([roleAString]);
    });

    it("Should revert Non-Authorized User (Add)", async () => {
      // Give both roleA and roleB authorization over action1
      // Give roleA authorization over action2
      await expect(
        daoAccessControl
          .connect(executor1)
          .addActionsRoles(
            [deployer.address, deployer.address],
            [function1, function2],
            [[roleAString, roleBString], [roleAString]]
          )
      ).to.reverted;
    });

    it("Should Remove Actions", async () => {
      // Give both roleA and roleB authorization over action1
      // Give roleA authorization over action2
      await daoAccessControl
        .connect(dao)
        .addActionsRoles(
          [deployer.address, deployer.address],
          [function1, function2],
          [[roleAString, roleBString], [roleAString]]
        );

      await daoAccessControl
        .connect(dao)
        .removeActionsRoles(
          [deployer.address, deployer.address],
          [function1, function2],
          [[roleAString], [roleAString]]
        );

      expect(
        await daoAccessControl.getActionRoles(deployer.address, function1)
      ).to.deep.eq([roleBString]);

      expect(
        await daoAccessControl.isRoleAuthorized(
          deployer.address,
          deployer.address,
          roleAString
        )
      ).to.eq(false);
      expect(
        await daoAccessControl.isRoleAuthorized(
          deployer.address,
          deployer.address,
          roleBString
        )
      ).to.eq(false);
    });

    it("Unauthorized user (Remove)", async () => {
      // Give both roleA and roleB authorization over action1
      // Give roleA authorization over action2
      await daoAccessControl
        .connect(dao)
        .addActionsRoles(
          [deployer.address, deployer.address],
          [function1, function2],
          [[roleAString, roleBString], [roleAString]]
        );

      // Should not add a role that has already been added
      await expect(
        daoAccessControl
          .connect(executor1)
          .removeActionsRoles(
            [deployer.address, deployer.address],
            [function1, function2],
            [[roleAString, roleBString], [roleAString]]
          )
      ).to.reverted;
    });
  });
});
