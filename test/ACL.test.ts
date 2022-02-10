import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  BravoFactory,
  BravoFactory__factory,
  VotesTokenWithSupply,
  VotesTokenWithSupply__factory,
  BravoGovernor,
  BravoGovernor__factory,
  TimelockController,
  TimelockController__factory,
  TokenFactory,
  TokenFactory__factory,
  TestToken,
  TestToken__factory,
  VotesTokenWrapped,
  VotesTokenWrapped__factory,
  TokenFactoryModuleMock,
  ACL,
  ACL__factory,
  TokenFactoryModuleMock__factory,
  VotesTokenWithSupplyModule,
  VotesTokenWithSupplyModule__factory,
} from "../typechain";
import chai from "chai";
import { ethers, network } from "hardhat";
import { BigNumber, ContractReceipt, ContractTransaction } from "ethers";
import {
  VoteType,
  delegateTokens,
  createDAOAndToken,
  vote,
  queueProposal,
  executeProposal,
  propose,
  createDAOWrapToken,
  wrapTokens,
  createDAOBringToken,
} from "../helpers/Bravo";

const expect = chai.expect;

describe.only("Bravo DAO", function () {
  let daoFactory: BravoFactory;
  let governanceToken: VotesTokenWithSupply;
  let dao: BravoGovernor;
  let testToken: VotesTokenWithSupplyModule;
  let wrappedGovernanceToken: VotesTokenWrapped;
  let governorImpl: BravoGovernor;
  let timelockController: TimelockController;
  let tokenFactory: TokenFactory;
  let deployer: SignerWithAddress;
  let wallet: SignerWithAddress;
  let minter: SignerWithAddress;
  let moduleFactory: TokenFactoryModuleMock;
  let acl: ACL;

  describe("ACL", function () {
    beforeEach(async function () {
      [deployer, minter, wallet] = await ethers.getSigners();
      moduleFactory = await new TokenFactoryModuleMock__factory(
        deployer
      ).deploy();
      acl = await new ACL__factory(deployer).deploy(deployer.address);

      // Create a role called MINTER.
      // Add an address which is assigned to the minter role
      // The TIMELOCK role has admin revoke and grant rights
      await acl
        .connect(deployer)
        .createPermissionBatch(
          [ethers.utils.id("MINTER")],
          [ethers.utils.id("TIMELOCK")],
          [minter.address]
        );

      const tx: ContractTransaction = await moduleFactory.createToken(
        "test",
        "TTT",
        [wallet.address],
        [ethers.utils.parseUnits("100.0", 18)],
        ethers.utils.parseUnits("100.0", 18),
        deployer.address,
        acl.address
      );
      const receipt: ContractReceipt = await tx.wait();
      const TokenEvent = receipt.events?.filter((x) => {
        return x.event === "TokenDeployed";
      });
      if (TokenEvent === undefined || TokenEvent[0].args === undefined) {
        return {
          tokenAddress: "0",
          name: "0",
          symbol: "0",
        };
      }
      testToken = VotesTokenWithSupplyModule__factory.connect(
        TokenEvent[0].args[0],
        deployer
      );
    });

    it("Should Mint token with minterRole", async () => {
      await testToken
        .connect(minter)
        .mint(wallet.address, ethers.utils.parseUnits("100.0", 18));

      expect(await testToken.balanceOf(wallet.address)).to.eq(
        ethers.utils.parseUnits("200.0", 18)
      );
    });

    it("Should Revert If not minter Role", async () => {
      await expect(
        testToken
          .connect(wallet)
          .mint(wallet.address, ethers.utils.parseUnits("100.0", 18))
      ).to.revertedWith("Not Minter");
    });

    it.only("Should Revert if overwriting created Roles", async () => {
      await expect(
        acl
          .connect(deployer)
          .createPermissionBatch(
            [ethers.utils.id("MINTER")],
            [ethers.utils.id("TIMELOCK")],
            [minter.address]
          )
      ).to.revertedWith("Role already created");

      await expect(
        acl
          .connect(deployer)
          .createPermissionBatch(
            [ethers.utils.id("TIMELOCK")],
            [ethers.utils.id("TIMELOCK")],
            [minter.address]
          )
      ).to.revertedWith("Role already created");
    });
  });
});
