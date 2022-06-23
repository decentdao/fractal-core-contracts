import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DAOAccessControl,
  DAOAccessControl__factory,
  IDAOAccessControl__factory,
} from "../typechain-types";
import chai from "chai";
import { ethers } from "hardhat";
import getInterfaceSelector from "./helpers/getInterfaceSelector";

const expect = chai.expect;

describe("DAO Access Control Contract", function () {
  let daoAccessControl: DAOAccessControl;

  // Wallets
  let dao: SignerWithAddress;
  let deployer: SignerWithAddress;
  let executor1: SignerWithAddress;
  let executor2: SignerWithAddress;
  let roleAMember1: SignerWithAddress;
  let roleAMember2: SignerWithAddress;
  let roleBMember1: SignerWithAddress;
  let roleBMember2: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  // Roles
  const daoRoleString = "DAO_ROLE";
  const openRoleString = "OPEN_ROLE";
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
      user1,
      user2,
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
        ],
        [dao.address],
        ["execute(address[],uint256[],bytes[])"],
        [["EXECUTE_ROLE"]]
      );
    });

    it("Supports the expected ERC165 interface", async () => {
      // Supports Access Control interface
      expect(
        await daoAccessControl.supportsInterface(
          // eslint-disable-next-line camelcase
          getInterfaceSelector(IDAOAccessControl__factory.createInterface())
        )
      ).to.eq(true);

      // Supports ERC-165 interface
      expect(await daoAccessControl.supportsInterface("0x01ffc9a7")).to.eq(
        true
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

    it("Supports the Open Role", async () => {
      expect(await daoAccessControl.hasRole(openRoleString, dao.address)).to.eq(
        true
      );
      expect(
        await daoAccessControl.hasRole(openRoleString, executor1.address)
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(openRoleString, roleAMember1.address)
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(openRoleString, user1.address)
      ).to.eq(true);
      expect(
        await daoAccessControl.hasRole(openRoleString, user2.address)
      ).to.eq(true);
    });
  });

  describe("Roles", function () {
    beforeEach(async function () {
      // Initialize with roleA as the admin of roleB
      await daoAccessControl.initialize(dao.address, [], [], [], [], [], []);
    });

    it("Admin of a role can grant new members", async () => {
      await daoAccessControl.connect(dao).daoGrantRolesAndAdmins(
        [roleBString, roleAString],
        [roleAString, daoRoleString],
        [
          [roleBMember1.address, roleBMember2.address],
          [roleAMember1.address, roleAMember2.address],
        ]
      );

      expect(await daoAccessControl.hasRole(roleAString, user1.address)).to.eq(
        false
      );

      expect(await daoAccessControl.hasRole(roleAString, user2.address)).to.eq(
        false
      );

      await daoAccessControl
        .connect(roleAMember1)
        .adminGrantRole(roleBString, user1.address);

      await daoAccessControl
        .connect(roleAMember1)
        .adminGrantRole(roleBString, user2.address);

      expect(await daoAccessControl.hasRole(roleBString, user1.address)).to.eq(
        true
      );

      expect(await daoAccessControl.hasRole(roleBString, user2.address)).to.eq(
        true
      );
    });

    it("Non-Admin of a role can not grant new members", async () => {
      await daoAccessControl.connect(dao).daoGrantRolesAndAdmins(
        [roleBString, roleAString],
        [roleAString, daoRoleString],
        [
          [roleBMember1.address, roleBMember2.address],
          [roleAMember1.address, roleAMember2.address],
        ]
      );

      expect(await daoAccessControl.hasRole(roleAString, user1.address)).to.eq(
        false
      );

      expect(await daoAccessControl.hasRole(roleAString, user2.address)).to.eq(
        false
      );

      await expect(
        daoAccessControl
          .connect(user1)
          .adminGrantRole(roleBString, user1.address)
      ).to.be.revertedWith(`MissingRole("${user1.address}", "${roleAString}")`);

      await expect(
        daoAccessControl
          .connect(roleBMember1)
          .adminGrantRole(roleBString, user1.address)
      ).to.be.revertedWith(
        `MissingRole("${roleBMember1.address}", "${roleAString}")`
      );
    });

    it("Admin of a role can revoke members", async () => {
      await daoAccessControl.connect(dao).daoGrantRolesAndAdmins(
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

      await daoAccessControl
        .connect(roleAMember1)
        .adminRevokeRole(roleBString, roleBMember1.address);

      await daoAccessControl
        .connect(roleAMember1)
        .adminRevokeRole(roleBString, roleBMember2.address);

      expect(
        await daoAccessControl.hasRole(roleBString, roleBMember1.address)
      ).to.eq(false);

      expect(
        await daoAccessControl.hasRole(roleBString, roleBMember2.address)
      ).to.eq(false);
    });

    it("Non-Admin of a role can not revoke members", async () => {
      await daoAccessControl.connect(dao).daoGrantRolesAndAdmins(
        [roleBString, roleAString],
        [roleAString, daoRoleString],
        [
          [roleBMember1.address, roleBMember2.address],
          [roleAMember1.address, roleAMember2.address],
        ]
      );

      await expect(
        daoAccessControl
          .connect(roleBMember1)
          .adminRevokeRole(roleBString, roleBMember2.address)
      ).to.be.revertedWith(
        `MissingRole("${roleBMember1.address}", "${roleAString}")`
      );

      await expect(
        daoAccessControl
          .connect(user1)
          .adminRevokeRole(roleBString, roleBMember2.address)
      ).to.be.revertedWith(`MissingRole("${user1.address}", "${roleAString}")`);
    });

    it("A role member can renounce their role", async () => {
      await daoAccessControl.connect(dao).daoGrantRolesAndAdmins(
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

      await daoAccessControl
        .connect(roleBMember1)
        .userRenounceRole(roleBString, roleBMember1.address);

      await daoAccessControl
        .connect(roleBMember2)
        .userRenounceRole(roleBString, roleBMember2.address);

      expect(
        await daoAccessControl.hasRole(roleBString, roleBMember1.address)
      ).to.eq(false);

      expect(
        await daoAccessControl.hasRole(roleBString, roleBMember2.address)
      ).to.eq(false);
    });

    it("A role member cannot renounce another user's role", async () => {
      await daoAccessControl.connect(dao).daoGrantRolesAndAdmins(
        [roleBString, roleAString],
        [roleAString, daoRoleString],
        [
          [roleBMember1.address, roleBMember2.address],
          [roleAMember1.address, roleAMember2.address],
        ]
      );

      await expect(
        daoAccessControl
          .connect(roleAMember1)
          .userRenounceRole(roleBString, roleBMember1.address)
      ).to.be.revertedWith("OnlySelfRenounce()");

      await expect(
        daoAccessControl
          .connect(roleBMember2)
          .userRenounceRole(roleBString, roleBMember1.address)
      ).to.be.revertedWith("OnlySelfRenounce()");
    });

    it("Should batch create Roles", async () => {
      await daoAccessControl.connect(dao).daoGrantRolesAndAdmins(
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
      await daoAccessControl.connect(dao).daoGrantRolesAndAdmins(
        [roleBString, roleAString],
        [roleAString, daoRoleString],
        [
          [roleBMember1.address, roleBMember2.address],
          [roleAMember1.address, roleAMember2.address],
        ]
      );

      await daoAccessControl
        .connect(dao)
        .daoGrantRolesAndAdmins(
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
        daoAccessControl.connect(executor1).daoGrantRolesAndAdmins(
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
        ],
        [dao.address],
        ["execute(address[],uint256[],bytes[])"],
        [["EXECUTE_ROLE"]]
      );
    });
    it("Should setup Actions", async () => {
      // Give both roleA and roleB authorization over action1
      // Give roleA authorization over action2
      await daoAccessControl
        .connect(dao)
        .daoAddActionsRoles(
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
          .daoAddActionsRoles(
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
        .daoAddActionsRoles(
          [deployer.address, deployer.address],
          [function1, function2],
          [[roleAString, roleBString], [roleAString]]
        );

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

      await daoAccessControl
        .connect(dao)
        .daoRemoveActionsRoles(
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
        .daoAddActionsRoles(
          [deployer.address, deployer.address],
          [function1, function2],
          [[roleAString, roleBString], [roleAString]]
        );

      // Should not add a role that has already been added
      await expect(
        daoAccessControl
          .connect(executor1)
          .daoRemoveActionsRoles(
            [deployer.address, deployer.address],
            [function1, function2],
            [[roleAString, roleBString], [roleAString]]
          )
      ).to.reverted;
    });
  });
});
