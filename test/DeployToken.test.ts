import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DaoFactory,
  DaoFactory__factory,
  GovernanceToken,
  GovernanceToken__factory,
  MyGovernor,
  MyGovernor__factory,
  TestToken,
  TestToken__factory,
  TimelockController,
  TimelockController__factory,
  TokenFactory,
  TokenFactory__factory,
  WrappedToken,
  WrappedToken__factory,
} from "../typechain";
import chai from "chai";
import { ethers, network } from "hardhat";
import { BigNumber, ContractReceipt, ContractTransaction } from "ethers";
import {
  VoteType,
  delegateTokens,
  wrapTokens,
  createDaoAndToken,
  createDaoWrapToken,
  createDaoBringToken,
  propose,
  vote,
  queueProposal,
  executeProposal,
} from "../helpers";

const expect = chai.expect;

describe("Fractal DAO", function () {
  let daoFactory: DaoFactory;
  let governanceToken: GovernanceToken;
  let wrappedGovernanceToken: WrappedToken;
  let testToken: TestToken;
  let dao: MyGovernor;
  let timelockController: TimelockController;
  let tokenFactory: TokenFactory;
  let deployer: SignerWithAddress;
  let wallet: SignerWithAddress;
  let voterA: SignerWithAddress;
  let voterB: SignerWithAddress;
  let voterC: SignerWithAddress;
  let daoInfo: {
    votingToken: string;
    timelockController: string;
    daoProxy: string;
  };

  describe("When creating a DAO and new token", function () {
    beforeEach(async function () {
      [deployer, wallet, voterA, voterB, voterC] = await ethers.getSigners();
      tokenFactory = await new TokenFactory__factory(deployer).deploy();

      // Deploy an instance of the DAO Factory
      daoFactory = await new DaoFactory__factory(deployer).deploy(
        tokenFactory.address
      );

      // Create a new DAO using the DAO Factory
      daoInfo = await createDaoAndToken(
        daoFactory,
        "Test Token",
        "TTT",
        [voterA.address, voterB.address, voterC.address],
        [
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ],
        ethers.utils.parseUnits("0", 18),
        ethers.utils.parseUnits("500.0", 18),
        [wallet.address],
        [wallet.address],
        "Test DAO"
      );

      // eslint-disable-next-line camelcase
      dao = MyGovernor__factory.connect(daoInfo.daoProxy, deployer);
      timelockController = TimelockController__factory.connect(
        daoInfo.timelockController,
        deployer
      );

      // eslint-disable-next-line camelcase
      governanceToken = GovernanceToken__factory.connect(
        daoInfo.votingToken,
        deployer
      );

      await delegateTokens(governanceToken, [voterA, voterB, voterC]);
    });

    it("Should Set MyGovernor Implementation", async function () {
      // eslint-disable-next-line no-unused-expressions
      expect(await daoFactory.governanceImplementation()).to.be.properAddress;
      // eslint-disable-next-line no-unused-expressions
      expect(await daoFactory.tokenFactory()).to.be.properAddress;
    });

    it("Created a DAO", async () => {
      const PROPOSER_ROLE = ethers.utils.id("PROPOSER_ROLE");
      const EXECUTOR_ROLE = ethers.utils.id("EXECUTOR_ROLE");
      await expect(daoInfo.votingToken).to.equal(await dao.token());
      await expect(daoInfo.timelockController).to.equal(await dao.timelock());
      await expect(timelockController.hasRole(PROPOSER_ROLE, dao.address));
      await expect(timelockController.hasRole(EXECUTOR_ROLE, dao.address));
    });

    it("Revert if Hodlers[] does not equal allocations[]", async () => {
      await expect(
        createDaoAndToken(
          daoFactory,
          "Test Token",
          "TTT",
          [voterA.address, voterB.address, voterC.address],
          [
            ethers.utils.parseUnits("100.0", 18),
            ethers.utils.parseUnits("100.0", 18),
          ],
          ethers.utils.parseUnits("0", 18),
          ethers.utils.parseUnits("500.0", 18),
          [wallet.address],
          [wallet.address],
          "Test DAO"
        )
      ).to.be.revertedWith("ArraysNotEqual()");

      await expect(
        createDaoAndToken(
          daoFactory,
          "Test Token",
          "TTT",
          [voterA.address, voterB.address],
          [
            ethers.utils.parseUnits("100.0", 18),
            ethers.utils.parseUnits("100.0", 18),
            ethers.utils.parseUnits("100.0", 18),
          ],
          ethers.utils.parseUnits("0", 18),
          ethers.utils.parseUnits("500.0", 18),
          [wallet.address],
          [wallet.address],
          "Test DAO"
        )
      ).to.be.revertedWith("ArraysNotEqual()");
    });

    it("Minted tokens to the specified voters", async () => {
      expect(await governanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );
      expect(await governanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(daoInfo.timelockController)).to.eq(
        ethers.utils.parseUnits("200.0", 18)
      );
    });

    it("totalsupply less than allocations sum", async () => {
      // Create a new DAO using the DAO Factory
      daoInfo = await createDaoAndToken(
        daoFactory,
        "Test Token",
        "TTT",
        [voterA.address, voterB.address, voterC.address],
        [
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ],
        ethers.utils.parseUnits("0", 18),
        ethers.utils.parseUnits("100.0", 18), // totalsupply less than allocations sum
        [wallet.address],
        [wallet.address],
        "Test DAO"
      );

      // eslint-disable-next-line camelcase
      governanceToken = GovernanceToken__factory.connect(
        daoInfo.votingToken,
        deployer
      );

      expect(await governanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );
      expect(await governanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(daoInfo.timelockController)).to.eq(
        ethers.utils.parseUnits("0.0", 18)
      );
    });

    it("Creates a DAO proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalId = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      expect(proposalId).to.be.gt(0);
    });

    it("Allows voting on a DAO proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalId = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalId, VoteType.For, voterA);
      await vote(dao, proposalId, VoteType.For, voterB);
      await vote(dao, proposalId, VoteType.For, voterC);

      expect(await dao.hasVoted(proposalId, voterA.address)).to.eq(true);
      expect(await dao.hasVoted(proposalId, voterB.address)).to.eq(true);
      expect(await dao.hasVoted(proposalId, voterC.address)).to.eq(true);
    });

    it("Should execute a passing proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalId = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalId, VoteType.For, voterA);
      await vote(dao, proposalId, VoteType.For, voterB);
      await vote(dao, proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await queueProposal(dao, voterA, proposalId);

      expect(await governanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(voterB.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(voterC.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(daoInfo.timelockController)).to.eq(
        ethers.utils.parseUnits("200.0", 18)
      );

      await executeProposal(dao, voterA, proposalId);

      expect(await governanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(voterB.address)).to.eq(
        ethers.utils.parseUnits("200.0", 18)
      );

      expect(await governanceToken.balanceOf(voterC.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(daoInfo.timelockController)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );
    });

    it("Does not allow a proposal with quorum to get queued", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );
      console.log(await dao.quorumVotes());

      const proposalId = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");
      await vote(dao, proposalId, VoteType.For, voterA);
      await vote(dao, proposalId, VoteType.For, voterB);
      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await expect(queueProposal(dao, voterA, proposalId)).to.be.revertedWith(
        "Governor: proposal not successful"
      );
    });

    it("Does not allow a non proposalid queued", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalId = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      const fakeProposalId = await dao.hashProposal(
        [governanceToken.address],
        [BigNumber.from("0")],
        [transferCallData],
        ethers.utils.id("fake")
      );

      await network.provider.send("evm_mine");
      await expect(
        vote(dao, fakeProposalId, VoteType.For, voterA)
      ).to.be.revertedWith("Governor: unknown proposal id");
    });

    it("Does not allow a proposal without votes to get queued", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalId = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await expect(queueProposal(dao, voterA, proposalId)).to.be.revertedWith(
        "Governor: proposal not successful"
      );
    });

    it("Does not allow a proposal to be executed before it is queued", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalId = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalId, VoteType.For, voterA);
      await vote(dao, proposalId, VoteType.For, voterB);
      await vote(dao, proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await expect(executeProposal(dao, voterA, proposalId)).to.be.revertedWith(
        "TimelockController: operation is not ready"
      );
    });
  });
});
