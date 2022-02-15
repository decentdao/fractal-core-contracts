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
  TokenFactoryModuleMock,
  ACL,
  ACL__factory,
  TokenFactoryModuleMock__factory,
  VotesTokenWithSupplyModuleMock__factory,
} from "../typechain";
import chai from "chai";
import { ethers, network } from "hardhat";
import { BigNumber, ContractReceipt, ContractTransaction } from "ethers";
import {
  VoteType,
  delegateTokens,
  bravoCreateDAOAndToken,
  vote,
  bravoQueueProposal,
  bravoPropose,
} from "../helpers/Index";

const expect = chai.expect;

describe("ACL Contract", function () {
  let daoFactory: BravoFactory;
  let governanceToken: VotesTokenWithSupply;
  let dao: BravoGovernor;
  let governorImpl: BravoGovernor;
  let timelockController: TimelockController;
  let tokenFactory: TokenFactory;
  let moduleFactory: TokenFactoryModuleMock;
  let acl: ACL;
  // Wallets
  let deployer: SignerWithAddress;
  let minter: SignerWithAddress;
  let minter2: SignerWithAddress;
  let user: SignerWithAddress;
  let proposerExecutor: SignerWithAddress;
  let voterA: SignerWithAddress;
  let voterB: SignerWithAddress;
  let voterC: SignerWithAddress;
  // Objects
  let daoInfo: {
    votingToken: string;
    timelockController: string;
    daoProxy: string;
    acl: string;
  };

  describe("ACL", function () {
    beforeEach(async function () {
      [
        deployer,
        minter,
        minter2,
        user,
        proposerExecutor,
        voterA,
        voterB,
        voterC,
      ] = await ethers.getSigners();
      // Dao Factory Init
      tokenFactory = await new TokenFactory__factory(deployer).deploy();
      governorImpl = await new BravoGovernor__factory(deployer).deploy();

      // Deploy an instance of the DAO Factory
      daoFactory = await new BravoFactory__factory(deployer).deploy();

      // Create a new DAO using the DAO Factory
      daoInfo = await bravoCreateDAOAndToken(
        daoFactory,
        governorImpl.address,
        [proposerExecutor.address],
        [proposerExecutor.address],
        "Test DAO",
        BigNumber.from("0"),
        BigNumber.from("0"),
        BigNumber.from("1"),
        BigNumber.from("5"),
        BigNumber.from("0"),
        BigNumber.from("4"),
        tokenFactory.address,
        "Test Token",
        "TTT",
        ethers.utils.parseUnits("500.0", 18),
        [voterA.address, voterB.address, voterC.address],
        [
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ]
      );

      // Init Contracts
      // eslint-disable-next-line camelcase
      dao = BravoGovernor__factory.connect(daoInfo.daoProxy, deployer);

      // eslint-disable-next-line camelcase
      timelockController = TimelockController__factory.connect(
        daoInfo.timelockController,
        deployer
      );

      // eslint-disable-next-line camelcase
      governanceToken = VotesTokenWithSupply__factory.connect(
        daoInfo.votingToken,
        deployer
      );
      // eslint-disable-next-line camelcase
      acl = ACL__factory.connect(daoInfo.acl, deployer);

      // Deploy module Factory
      moduleFactory = await new TokenFactoryModuleMock__factory(
        deployer
      ).deploy();

      await delegateTokens(governanceToken, [voterA, voterB, voterC]);
    });

    it("Should Mint token with minterRole", async () => {
      const transferCallDataACL = acl.interface.encodeFunctionData(
        "createPermissionBatch",
        [
          [ethers.utils.id("MINTER")],
          [ethers.utils.id("TIMELOCK")],
          [minter.address],
        ]
      );

      const transferCallDataModule = moduleFactory.interface.encodeFunctionData(
        "createToken",
        [
          "test",
          "TTT",
          [user.address],
          [ethers.utils.parseUnits("100.0", 18)],
          ethers.utils.parseUnits("100.0", 18),
          deployer.address,
          acl.address,
          [ethers.utils.id("MINTER")],
        ]
      );

      const proposalCreatedEvent = await bravoPropose(
        [acl.address, moduleFactory.address],
        [BigNumber.from("0"), BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataACL, transferCallDataModule],
        "Deploy Token Module"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await bravoQueueProposal(dao, voterA, proposalCreatedEvent.proposalId);
      const tx: ContractTransaction = await dao
        .connect(voterA)
        ["execute(uint256)"](proposalCreatedEvent.proposalId);
      const receipt: ContractReceipt = await tx.wait();
      const TokenEvent = receipt.events?.filter((x) => {
        return (
          x.topics[0] ===
          ethers.utils.id("TokenDeployed(address,string,string)")
        );
      });
      if (TokenEvent === undefined || TokenEvent[0] === undefined) {
        return {};
      }
      const TokenDecode = await moduleFactory.interface.decodeEventLog(
        "TokenDeployed",
        TokenEvent[0].data,
        TokenEvent[0].topics
      );

      // eslint-disable-next-line camelcase
      const tokenModule = VotesTokenWithSupplyModuleMock__factory.connect(
        TokenDecode.tokenAddress,
        deployer
      );

      expect(await tokenModule.balanceOf(user.address)).to.eq(
        ethers.utils.parseUnits("100", 18)
      );

      await tokenModule
        .connect(minter)
        .mint(user.address, ethers.utils.parseUnits("100.0", 18));

      expect(await tokenModule.balanceOf(user.address)).to.eq(
        ethers.utils.parseUnits("200.0", 18)
      );
    });

    it("Should Deploy two identical modules with different roles", async () => {
      const transferCallDataACL = acl.interface.encodeFunctionData(
        "createPermissionBatch",
        [
          [ethers.utils.id("MINTER")],
          [ethers.utils.id("TIMELOCK")],
          [minter.address],
        ]
      );

      const transferCallDataModule = moduleFactory.interface.encodeFunctionData(
        "createToken",
        [
          "test",
          "TTT",
          [user.address],
          [ethers.utils.parseUnits("100.0", 18)],
          ethers.utils.parseUnits("100.0", 18),
          deployer.address,
          acl.address,
          [ethers.utils.id("MINTER")],
        ]
      );

      const proposalCreatedEvent = await bravoPropose(
        [acl.address, moduleFactory.address],
        [BigNumber.from("0"), BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataACL, transferCallDataModule],
        "Deploy Token Module"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await bravoQueueProposal(dao, voterA, proposalCreatedEvent.proposalId);
      const tx: ContractTransaction = await dao
        .connect(voterA)
        ["execute(uint256)"](proposalCreatedEvent.proposalId);
      const receipt: ContractReceipt = await tx.wait();
      const TokenEvent = receipt.events?.filter((x) => {
        return (
          x.topics[0] ===
          ethers.utils.id("TokenDeployed(address,string,string)")
        );
      });
      if (TokenEvent === undefined || TokenEvent[0] === undefined) {
        return {};
      }
      const TokenDecode = await moduleFactory.interface.decodeEventLog(
        "TokenDeployed",
        TokenEvent[0].data,
        TokenEvent[0].topics
      );

      // eslint-disable-next-line camelcase
      const tokenModule = VotesTokenWithSupplyModuleMock__factory.connect(
        TokenDecode.tokenAddress,
        deployer
      );

      expect(await tokenModule.balanceOf(user.address)).to.eq(
        ethers.utils.parseUnits("100", 18)
      );

      await tokenModule
        .connect(minter)
        .mint(user.address, ethers.utils.parseUnits("100.0", 18));

      expect(await tokenModule.balanceOf(user.address)).to.eq(
        ethers.utils.parseUnits("200.0", 18)
      );

      // Deploy an identical module
      // Must have a different Role
      const transferCallDataACL2 = acl.interface.encodeFunctionData(
        "createPermissionBatch",
        [
          [ethers.utils.id("MINTER2")],
          [ethers.utils.id("TIMELOCK")],
          [minter2.address],
        ]
      );

      const transferCallDataModule2 =
        moduleFactory.interface.encodeFunctionData("createToken", [
          "test2",
          "TTT2",
          [user.address],
          [ethers.utils.parseUnits("122.0", 18)],
          ethers.utils.parseUnits("122.0", 18),
          deployer.address,
          acl.address,
          [ethers.utils.id("MINTER2")],
        ]);

      const proposalCreatedEvent2 = await bravoPropose(
        [acl.address, moduleFactory.address],
        [BigNumber.from("0"), BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataACL2, transferCallDataModule2],
        "Deploy 2nd Token Module"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalCreatedEvent2.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent2.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent2.proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await bravoQueueProposal(dao, voterA, proposalCreatedEvent2.proposalId);
      const tx2: ContractTransaction = await dao
        .connect(voterA)
        ["execute(uint256)"](proposalCreatedEvent2.proposalId);
      const receipt2: ContractReceipt = await tx2.wait();
      const TokenEvent2 = receipt2.events?.filter((x) => {
        return (
          x.topics[0] ===
          ethers.utils.id("TokenDeployed(address,string,string)")
        );
      });
      if (TokenEvent2 === undefined || TokenEvent2[0] === undefined) {
        return {};
      }
      const TokenDecode2 = await moduleFactory.interface.decodeEventLog(
        "TokenDeployed",
        TokenEvent2[0].data,
        TokenEvent2[0].topics
      );

      // eslint-disable-next-line camelcase
      const tokenModule2 = VotesTokenWithSupplyModuleMock__factory.connect(
        TokenDecode2.tokenAddress,
        deployer
      );

      expect(await tokenModule2.balanceOf(user.address)).to.eq(
        ethers.utils.parseUnits("122", 18)
      );

      await tokenModule2
        .connect(minter2)
        .mint(user.address, ethers.utils.parseUnits("100.0", 18));

      expect(await tokenModule2.balanceOf(user.address)).to.eq(
        ethers.utils.parseUnits("222.0", 18)
      );

      await expect(
        tokenModule2
          .connect(minter)
          .mint(user.address, ethers.utils.parseUnits("100.0", 18))
      ).to.revertedWith("Not Minter");
    });

    it("Should Deploy two identical modules with reusing the same roles", async () => {
      const transferCallDataACL = acl.interface.encodeFunctionData(
        "createPermissionBatch",
        [
          [ethers.utils.id("MINTER")],
          [ethers.utils.id("TIMELOCK")],
          [minter.address],
        ]
      );

      const transferCallDataModule = moduleFactory.interface.encodeFunctionData(
        "createToken",
        [
          "test",
          "TTT",
          [user.address],
          [ethers.utils.parseUnits("100.0", 18)],
          ethers.utils.parseUnits("100.0", 18),
          deployer.address,
          acl.address,
          [ethers.utils.id("MINTER")],
        ]
      );

      const proposalCreatedEvent = await bravoPropose(
        [acl.address, moduleFactory.address],
        [BigNumber.from("0"), BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataACL, transferCallDataModule],
        "Deploy Token Module"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await bravoQueueProposal(dao, voterA, proposalCreatedEvent.proposalId);
      const tx: ContractTransaction = await dao
        .connect(voterA)
        ["execute(uint256)"](proposalCreatedEvent.proposalId);
      const receipt: ContractReceipt = await tx.wait();
      const TokenEvent = receipt.events?.filter((x) => {
        return (
          x.topics[0] ===
          ethers.utils.id("TokenDeployed(address,string,string)")
        );
      });
      if (TokenEvent === undefined || TokenEvent[0] === undefined) {
        return {};
      }
      const TokenDecode = await moduleFactory.interface.decodeEventLog(
        "TokenDeployed",
        TokenEvent[0].data,
        TokenEvent[0].topics
      );

      // eslint-disable-next-line camelcase
      const tokenModule = VotesTokenWithSupplyModuleMock__factory.connect(
        TokenDecode.tokenAddress,
        deployer
      );

      expect(await tokenModule.balanceOf(user.address)).to.eq(
        ethers.utils.parseUnits("100", 18)
      );

      await tokenModule
        .connect(minter)
        .mint(user.address, ethers.utils.parseUnits("100.0", 18));

      expect(await tokenModule.balanceOf(user.address)).to.eq(
        ethers.utils.parseUnits("200.0", 18)
      );

      // Deploy an identical module
      // Reuse a role
      const transferCallDataModule2 =
        moduleFactory.interface.encodeFunctionData("createToken", [
          "test2",
          "TTT2",
          [user.address],
          [ethers.utils.parseUnits("122.0", 18)],
          ethers.utils.parseUnits("122.0", 18),
          deployer.address,
          acl.address,
          [ethers.utils.id("MINTER")],
        ]);

      const proposalCreatedEvent2 = await bravoPropose(
        [moduleFactory.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataModule2],
        "Deploy 2nd Token Module"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalCreatedEvent2.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent2.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent2.proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await bravoQueueProposal(dao, voterA, proposalCreatedEvent2.proposalId);
      const tx2: ContractTransaction = await dao
        .connect(voterA)
        ["execute(uint256)"](proposalCreatedEvent2.proposalId);
      const receipt2: ContractReceipt = await tx2.wait();
      const TokenEvent2 = receipt2.events?.filter((x) => {
        return (
          x.topics[0] ===
          ethers.utils.id("TokenDeployed(address,string,string)")
        );
      });
      if (TokenEvent2 === undefined || TokenEvent2[0] === undefined) {
        return {};
      }
      const TokenDecode2 = await moduleFactory.interface.decodeEventLog(
        "TokenDeployed",
        TokenEvent2[0].data,
        TokenEvent2[0].topics
      );

      // eslint-disable-next-line camelcase
      const tokenModule2 = VotesTokenWithSupplyModuleMock__factory.connect(
        TokenDecode2.tokenAddress,
        deployer
      );

      expect(await tokenModule2.balanceOf(user.address)).to.eq(
        ethers.utils.parseUnits("122", 18)
      );

      await tokenModule2
        .connect(minter)
        .mint(user.address, ethers.utils.parseUnits("100.0", 18));

      expect(await tokenModule2.balanceOf(user.address)).to.eq(
        ethers.utils.parseUnits("222.0", 18)
      );

      await expect(
        tokenModule2
          .connect(minter2)
          .mint(user.address, ethers.utils.parseUnits("100.0", 18))
      ).to.revertedWith("Not Minter");
    });

    it("Should Revert If not minter Role", async () => {
      const transferCallDataACL = acl.interface.encodeFunctionData(
        "createPermissionBatch",
        [
          [ethers.utils.id("MINTER")],
          [ethers.utils.id("TIMELOCK")],
          [minter.address],
        ]
      );

      const transferCallDataModule = moduleFactory.interface.encodeFunctionData(
        "createToken",
        [
          "test",
          "TTT",
          [user.address],
          [ethers.utils.parseUnits("100.0", 18)],
          ethers.utils.parseUnits("100.0", 18),
          deployer.address,
          acl.address,
          [ethers.utils.id("MINTER")],
        ]
      );

      const proposalCreatedEvent = await bravoPropose(
        [acl.address, moduleFactory.address],
        [BigNumber.from("0"), BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataACL, transferCallDataModule],
        "Deploy Token Module"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await bravoQueueProposal(dao, voterA, proposalCreatedEvent.proposalId);
      const tx: ContractTransaction = await dao
        .connect(voterA)
        ["execute(uint256)"](proposalCreatedEvent.proposalId);
      const receipt: ContractReceipt = await tx.wait();
      const TokenEvent = receipt.events?.filter((x) => {
        return (
          x.topics[0] ===
          ethers.utils.id("TokenDeployed(address,string,string)")
        );
      });
      if (TokenEvent === undefined || TokenEvent[0] === undefined) {
        return {};
      }
      const TokenDecode = await moduleFactory.interface.decodeEventLog(
        "TokenDeployed",
        TokenEvent[0].data,
        TokenEvent[0].topics
      );

      // eslint-disable-next-line camelcase
      const tokenModule = VotesTokenWithSupplyModuleMock__factory.connect(
        TokenDecode.tokenAddress,
        deployer
      );

      expect(await tokenModule.balanceOf(user.address)).to.eq(
        ethers.utils.parseUnits("100", 18)
      );

      await tokenModule
        .connect(minter)
        .mint(user.address, ethers.utils.parseUnits("100.0", 18));

      expect(await tokenModule.balanceOf(user.address)).to.eq(
        ethers.utils.parseUnits("200.0", 18)
      );

      await expect(
        tokenModule
          .connect(user)
          .mint(user.address, ethers.utils.parseUnits("100.0", 18))
      ).to.revertedWith("Not Minter");
    });

    it("Should Revert if overwriting Timelock role", async () => {
      const transferCallDataACL = acl.interface.encodeFunctionData(
        "createPermissionBatch",
        [
          [ethers.utils.id("TIMELOCK")],
          [ethers.utils.id("TIMELOCK")],
          [minter.address],
        ]
      );

      const proposalCreatedEvent = await bravoPropose(
        [acl.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataACL],
        "Deploy Token Module"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await bravoQueueProposal(dao, voterA, proposalCreatedEvent.proposalId);
      await expect(
        dao.connect(voterA)["execute(uint256)"](proposalCreatedEvent.proposalId)
      ).to.revertedWith("TimelockController: underlying transaction reverted");
    });

    it("Should Revert if overwriting MINTER role", async () => {
      const transferCallDataACL = acl.interface.encodeFunctionData(
        "createPermissionBatch",
        [
          [ethers.utils.id("MINTER")],
          [ethers.utils.id("TIMELOCK")],
          [minter.address],
        ]
      );

      const transferCallDataModule = moduleFactory.interface.encodeFunctionData(
        "createToken",
        [
          "test",
          "TTT",
          [user.address],
          [ethers.utils.parseUnits("100.0", 18)],
          ethers.utils.parseUnits("100.0", 18),
          deployer.address,
          acl.address,
          [ethers.utils.id("MINTER")],
        ]
      );

      const proposalCreatedEvent = await bravoPropose(
        [acl.address, moduleFactory.address],
        [BigNumber.from("0"), BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataACL, transferCallDataModule],
        "Deploy Token Module"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await bravoQueueProposal(dao, voterA, proposalCreatedEvent.proposalId);
      const tx: ContractTransaction = await dao
        .connect(voterA)
        ["execute(uint256)"](proposalCreatedEvent.proposalId);
      const receipt: ContractReceipt = await tx.wait();
      const TokenEvent = receipt.events?.filter((x) => {
        return (
          x.topics[0] ===
          ethers.utils.id("TokenDeployed(address,string,string)")
        );
      });
      if (TokenEvent === undefined || TokenEvent[0] === undefined) {
        return {};
      }
      const TokenDecode = await moduleFactory.interface.decodeEventLog(
        "TokenDeployed",
        TokenEvent[0].data,
        TokenEvent[0].topics
      );

      // eslint-disable-next-line camelcase
      const tokenModule = VotesTokenWithSupplyModuleMock__factory.connect(
        TokenDecode.tokenAddress,
        deployer
      );

      expect(await tokenModule.balanceOf(user.address)).to.eq(
        ethers.utils.parseUnits("100", 18)
      );

      await tokenModule
        .connect(minter)
        .mint(user.address, ethers.utils.parseUnits("100.0", 18));

      expect(await tokenModule.balanceOf(user.address)).to.eq(
        ethers.utils.parseUnits("200.0", 18)
      );

      // overwrite Minter Role w/ another transaction
      // Check if transaction reverts
      const transferCallDataACLOverwrite = acl.interface.encodeFunctionData(
        "createPermissionBatch",
        [
          [ethers.utils.id("MINTER")],
          [ethers.utils.id("TIMELOCK")],
          [user.address],
        ]
      );

      const proposalCreatedEventOverwrite = await bravoPropose(
        [acl.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataACLOverwrite],
        "Deploy Token Module: Overwrite"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(
        dao,
        proposalCreatedEventOverwrite.proposalId,
        VoteType.For,
        voterA
      );
      await vote(
        dao,
        proposalCreatedEventOverwrite.proposalId,
        VoteType.For,
        voterB
      );
      await vote(
        dao,
        proposalCreatedEventOverwrite.proposalId,
        VoteType.For,
        voterC
      );

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await bravoQueueProposal(
        dao,
        voterA,
        proposalCreatedEventOverwrite.proposalId
      );
      await expect(
        dao
          .connect(voterA)
          ["execute(uint256)"](proposalCreatedEventOverwrite.proposalId)
      ).to.revertedWith("TimelockController: underlying transaction reverted");
    });

    it("Should Revert if roleAdmin tries to mint without role", async () => {
      const transferCallDataACL = acl.interface.encodeFunctionData(
        "createPermissionBatch",
        [
          [ethers.utils.id("MINTER")],
          [ethers.utils.id("TIMELOCK")],
          [minter.address],
        ]
      );

      const transferCallDataModule = moduleFactory.interface.encodeFunctionData(
        "createToken",
        [
          "test",
          "TTT",
          [user.address],
          [ethers.utils.parseUnits("100.0", 18)],
          ethers.utils.parseUnits("100.0", 18),
          deployer.address,
          acl.address,
          [ethers.utils.id("MINTER")],
        ]
      );

      const proposalCreatedEvent = await bravoPropose(
        [acl.address, moduleFactory.address],
        [BigNumber.from("0"), BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataACL, transferCallDataModule],
        "Deploy Token Module"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await bravoQueueProposal(dao, voterA, proposalCreatedEvent.proposalId);
      const tx: ContractTransaction = await dao
        .connect(voterA)
        ["execute(uint256)"](proposalCreatedEvent.proposalId);
      const receipt: ContractReceipt = await tx.wait();
      const TokenEvent = receipt.events?.filter((x) => {
        return (
          x.topics[0] ===
          ethers.utils.id("TokenDeployed(address,string,string)")
        );
      });
      if (TokenEvent === undefined || TokenEvent[0] === undefined) {
        return {};
      }
      const TokenDecode = await moduleFactory.interface.decodeEventLog(
        "TokenDeployed",
        TokenEvent[0].data,
        TokenEvent[0].topics
      );

      // eslint-disable-next-line camelcase
      const tokenModule = VotesTokenWithSupplyModuleMock__factory.connect(
        TokenDecode.tokenAddress,
        deployer
      );

      expect(await tokenModule.balanceOf(user.address)).to.eq(
        ethers.utils.parseUnits("100", 18)
      );

      await tokenModule
        .connect(minter)
        .mint(user.address, ethers.utils.parseUnits("100.0", 18));

      expect(await tokenModule.balanceOf(user.address)).to.eq(
        ethers.utils.parseUnits("200.0", 18)
      );

      // Attempt to mint with Timelock
      // Check if transaction reverts w/out role
      const transferCallDataMint = tokenModule.interface.encodeFunctionData(
        "mint",
        [timelockController.address, ethers.utils.parseUnits("100.0", 18)]
      );

      const proposalCreatedEventMint = await bravoPropose(
        [tokenModule.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataMint],
        "Mint to Timelock"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(
        dao,
        proposalCreatedEventMint.proposalId,
        VoteType.For,
        voterA
      );
      await vote(
        dao,
        proposalCreatedEventMint.proposalId,
        VoteType.For,
        voterB
      );
      await vote(
        dao,
        proposalCreatedEventMint.proposalId,
        VoteType.For,
        voterC
      );

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await bravoQueueProposal(
        dao,
        voterA,
        proposalCreatedEventMint.proposalId
      );
      await expect(
        dao
          .connect(voterA)
          ["execute(uint256)"](proposalCreatedEventMint.proposalId)
      ).to.revertedWith("TimelockController: underlying transaction reverted");
    });
  });
});
