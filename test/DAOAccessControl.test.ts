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
  const defaultAdminRoleString = "0x00";
  const defaultAdminRole: BytesLike =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const executorRole: BytesLike = ethers.utils.id("EXECUTE");
  const roleAString = "roleA";
  const roleBString = "roleB";
  const roleCString = "roleC";

  // Actions
  const action1: BytesLike = ethers.utils.id("action1");
  const action2: BytesLike = ethers.utils.id("action2");
  const action3: BytesLike = ethers.utils.id("action3");

  beforeEach(async function () {
    [
      dao,
      deployer,
      executor1,
      executor2,
      executor3,
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
        [executor1.address, executor2.address, executor3.address],
        [roleBString, roleAString],
        [roleAString, defaultAdminRole],
        [
          [roleBMember1.address, roleBMember2.address],
          [roleAMember1.address, roleAMember2.address],
        ]
      );
    });

    it("Should setup Executor Role", async () => {
      // Assign Executor Role
      expect(
        await daoAccessControl.hasRole(executorRole, executor1.address)
      ).to.eq(true);

      expect(
        await daoAccessControl.hasRole(executorRole, executor2.address)
      ).to.eq(true);

      expect(
        await daoAccessControl.hasRole(executorRole, executor3.address)
      ).to.eq(true);

      expect(await daoAccessControl.getRoleAdmin(executorRole)).to.eq(
        defaultAdminRole
      );
    });

    it("Should setup Default Admin Role", async () => {
      // Default Admin
      expect(
        await daoAccessControl.hasRole(defaultAdminRole, dao.address)
      ).to.eq(true);

      expect(
        await daoAccessControl.hasRole(defaultAdminRole, executor1.address)
      ).to.eq(false);

      expect(
        await daoAccessControl.hasRole(defaultAdminRole, roleAMember1.address)
      ).to.eq(false);

      expect(
        await daoAccessControl.hasRole(defaultAdminRole, roleBMember1.address)
      ).to.eq(false);
    });

    it("Should setup Roles", async () => {
      expect(
        await daoAccessControl.hasRole(
          ethers.utils.id(roleBString),
          roleBMember1.address
        )
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(
          ethers.utils.id(roleBString),
          roleBMember2.address
        )
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(
          ethers.utils.id(roleAString),
          roleAMember1.address
        )
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(
          ethers.utils.id(roleAString),
          roleAMember2.address
        )
      ).to.eq(true);
    });
  });

  describe("Create New Roles", function () {
    beforeEach(async function () {
      // Initialize with roleA as the admin of roleB
      await daoAccessControl.initialize(
        dao.address,
        [executor1.address, executor2.address, executor3.address],
        [],
        [],
        []
      );
    });

    it("Should batch create Roles", async () => {
      await daoAccessControl.connect(dao).grantRolesAndAdmins(
        [roleBString, roleAString],
        [roleAString, defaultAdminRoleString],
        [
          [roleBMember1.address, roleBMember2.address],
          [roleAMember1.address, roleAMember2.address],
        ]
      );

      expect(
        await daoAccessControl.hasRole(
          ethers.utils.id(roleBString),
          roleBMember1.address
        )
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(
          ethers.utils.id(roleBString),
          roleBMember2.address
        )
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(
          ethers.utils.id(roleAString),
          roleAMember1.address
        )
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(
          ethers.utils.id(roleAString),
          roleAMember2.address
        )
      ).to.eq(true);
      expect(
        await daoAccessControl.getRoleAdmin(ethers.utils.id(roleBString))
      ).to.eq(ethers.utils.id(roleAString));

      // Todo: Need to figure out how to handle defaultAdminRole string
      // expect(
      //   await daoAccessControl.getRoleAdmin(ethers.utils.id(roleAString))
      // ).to.eq(defaultAdminRole);
    });

    it("Should override/update Role Admins", async () => {
      await daoAccessControl.connect(dao).grantRolesAndAdmins(
        [roleBString, roleAString],
        [roleAString, defaultAdminRoleString],
        [
          [roleBMember1.address, roleBMember2.address],
          [roleAMember1.address, roleAMember2.address],
        ]
      );

      await daoAccessControl
        .connect(dao)
        .grantRolesAndAdmins(
          [roleAString, roleBString],
          [roleBString, defaultAdminRoleString],
          [[], []]
        );

      expect(
        await daoAccessControl.hasRole(
          ethers.utils.id(roleBString),
          roleBMember1.address
        )
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(
          ethers.utils.id(roleBString),
          roleBMember2.address
        )
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(
          ethers.utils.id(roleAString),
          roleAMember1.address
        )
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(
          ethers.utils.id(roleAString),
          roleAMember2.address
        )
      ).to.eq(true);
      expect(
        await daoAccessControl.getRoleAdmin(ethers.utils.id(roleAString))
      ).to.eq(ethers.utils.id(roleBString));
      // Todo: Figure out how to handle defaultAdminRole string
      // expect(
      //   await daoAccessControl.getRoleAdmin(ethers.utils.id(roleBString))
      // ).to.eq(ethers.utils.id(defaultAdminRole));
    });

    it("Should revert UnAuthorized (batch create)", async () => {
      await expect(
        daoAccessControl.connect(executor1).grantRolesAndAdmins(
          [roleBString, roleAString],
          [roleAString, defaultAdminRole],
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
        [executor1.address, executor2.address, executor3.address],
        [roleBString, roleAString],
        [roleAString, defaultAdminRole],
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
          [action1, action2],
          [[roleAString, roleBString], [roleAString]]
        );
      expect(await daoAccessControl.getActionRoles(action1)).to.deep.eq([
        ethers.utils.id(roleAString),
        ethers.utils.id(roleBString),
      ]);

      expect(await daoAccessControl.getActionRoles(action2)).to.deep.eq([
        ethers.utils.id(roleAString),
      ]);
    });

    it("Should revert Non-Authorized User (Add)", async () => {
      // Give both roleA and roleB authorization over action1
      // Give roleA authorization over action2
      await expect(
        daoAccessControl
          .connect(executor1)
          .addActionsRoles(
            [action1, action2],
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
          [action1, action2],
          [[roleAString, roleBString], [roleAString]]
        );

      // Should not add a role that has already been added
      await daoAccessControl
        .connect(dao)
        .removeActionsRoles([action1, action2], [[roleAString], [roleBString]]);

      expect(await daoAccessControl.getActionRoles(action1)).to.deep.eq([
        ethers.utils.id(roleBString),
      ]);

      expect(
        await daoAccessControl.isRoleAuthorized(
          action1,
          ethers.utils.id(roleAString)
        )
      ).to.eq(false);
      expect(
        await daoAccessControl.isRoleAuthorized(
          action2,
          ethers.utils.id(roleBString)
        )
      ).to.eq(false);
    });

    it("Should Remove Actions (Remove)", async () => {
      // Give both roleA and roleB authorization over action1
      // Give roleA authorization over action2
      await daoAccessControl
        .connect(dao)
        .addActionsRoles(
          [action1, action2],
          [[roleAString, roleBString], [roleAString]]
        );

      // Should not add a role that has already been added
      await expect(
        daoAccessControl
          .connect(executor1)
          .removeActionsRoles(
            [action1, action2],
            [[ethers.utils.id(roleAString)], [ethers.utils.id(roleBString)]]
          )
      ).to.reverted;
    });
  });
});
