import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DaoFactory,
  DaoFactory__factory,
  VotesTokenWithSupply,
  VotesTokenWithSupply__factory,
  MyGovernor,
  MyGovernor__factory,
  TestToken,
  TimelockController,
  TimelockController__factory,
  TokenFactory,
  TokenFactory__factory,
  VotesTokenWrapped,
} from "../typechain";
import chai from "chai";
import { ethers, network } from "hardhat";
import { BigNumber, ContractReceipt, ContractTransaction } from "ethers";
import {
  VoteType,
  delegateTokens,
  createDaoBringToken,
  propose,
  vote,
  queueProposal,
  executeProposal,
} from "../helpers";

const expect = chai.expect;

describe("Fractal DAO", function () {
  let daoFactory: DaoFactory;
  let governanceToken: VotesTokenWithSupply;
  let wrappedGovernanceToken: VotesTokenWrapped;
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

  describe("When creating a DAO an existing ERC20Votes token", function () {
    beforeEach(async function () {
      [deployer, wallet, voterA, voterB, voterC] = await ethers.getSigners();
      tokenFactory = await new TokenFactory__factory(deployer).deploy();

      // Deploy an instance of the DAO Factory
      daoFactory = await new DaoFactory__factory(deployer).deploy(
        tokenFactory.address
      );

      // Create a new ERC20Votes token to bring as the DAO governance token
      governanceToken = await new VotesTokenWithSupply__factory(
        deployer
      ).deploy(
        "Test Token",
        "TEST",
        [voterA.address, voterB.address, voterC.address],
        [
          ethers.utils.parseUnits("600.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ],
        ethers.utils.parseUnits("800", 18),
        ethers.constants.AddressZero
      );

      // Create a new DAO using the DAO Factory and the existing test token
      daoInfo = await createDaoBringToken(
        daoFactory,
        governanceToken.address,
        BigNumber.from("0"),
        [wallet.address],
        [wallet.address],
        "Test DAO"
      );

      // eslint-disable-next-line camelcase
      dao = MyGovernor__factory.connect(daoInfo.daoProxy, deployer);

      // eslint-disable-next-line camelcase
      timelockController = TimelockController__factory.connect(
        daoInfo.timelockController,
        deployer
      );

      await governanceToken
        .connect(voterA)
        .transfer(
          timelockController.address,
          ethers.utils.parseUnits("500.0", 18)
        );

      await delegateTokens(governanceToken, [voterA, voterB, voterC]);
    });

    it("Should Set MyGovernor Implementation", async function () {
      return expect(await daoFactory.governanceImplementation()).to.be
        .properAddress;
    });

    it("Created a DAO", async () => {
      await expect(daoInfo.votingToken).to.be.properAddress;
      await expect(daoInfo.timelockController).to.be.properAddress;
      await expect(daoInfo.daoProxy).to.be.properAddress;
    });

    it("Creates a DAO proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("500", 18)]
      );

      const proposalId = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: Transfer 500 tokens to Voter B"
      );

      expect(proposalId).to.be.gt(0);
    });

    it("Allows voting on a DAO proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("500", 18)]
      );

      const proposalId = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: Transfer 500 tokens to Voter B"
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
        [voterB.address, ethers.utils.parseUnits("500", 18)]
      );

      const proposalId = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: Transfer 500 tokens to Voter B"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalId, VoteType.For, voterA);
      await vote(dao, proposalId, VoteType.For, voterB);
      await vote(dao, proposalId, VoteType.For, voterC);

      expect(await dao.hasVoted(proposalId, voterA.address)).to.eq(true);
      expect(await dao.hasVoted(proposalId, voterB.address)).to.eq(true);
      expect(await dao.hasVoted(proposalId, voterC.address)).to.eq(true);

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

      expect(await governanceToken.balanceOf(timelockController.address)).to.eq(
        ethers.utils.parseUnits("500.0", 18)
      );

      await executeProposal(dao, voterA, proposalId);

      expect(await governanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(voterB.address)).to.eq(
        ethers.utils.parseUnits("600.0", 18)
      );

      expect(await governanceToken.balanceOf(voterC.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(timelockController.address)).to.eq(
        ethers.utils.parseUnits("0", 18)
      );
    });

    it("Does not allow a proposal with no votes to get queued", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("500", 18)]
      );

      const proposalId = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: Transfer 500 tokens to Voter B"
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
        [voterB.address, ethers.utils.parseUnits("500", 18)]
      );

      const proposalId = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: Transfer 500 tokens to Voter B"
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
