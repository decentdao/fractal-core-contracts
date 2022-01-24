const { expect } = require("chai");
const { ethers } = require("hardhat");
const { network } = require("hardhat");

const daoABI = require("../data/abi/MyGovernor.json");

describe("Fractal DAO", function () {
  let Factory;
  let factory: any;
  let FractalToken: any;
  let fractaltoken: any;
  let DAO: any;
  let dao: any;
  // let dao;
  // let name = 'DecentPunks';
  // let symbol = 'DCP';
  // let baseURI = 'https://gateway.pinata.cloud/ipfs/QmVZHhYvpa1py2C3ZifDpduQYiq1c7s8deCJweMroTiGr9/';
  // let predictedAddress;
  let deployer;
  let wallet: any;
  let voterA: any;
  let voterB: any;
  let voterC: any;

  async function distributeTokens(governanceToken: any) {
    fractaltoken = await FractalToken.attach(governanceToken);
    // Distribute governance tokens
    const votes = ethers.utils.parseUnits("100.0", 18);
    await fractaltoken.connect(voterA).mint(voterA.address, votes);
    await fractaltoken.connect(voterB).mint(voterB.address, votes);
    await fractaltoken.connect(voterC).mint(voterC.address, votes);

    // delegate votes
    await fractaltoken.connect(voterA).delegate(voterA.address);
    await fractaltoken.connect(voterB).delegate(voterB.address);
    await fractaltoken.connect(voterC).delegate(voterC.address);
  }

  async function createDAO() {
    // create DAO via factory
    await expect(
      factory.createDAO(
        "testDAO",
        "testToken",
        "TTT",
        0,
        [wallet.address],
        [wallet.address]
      )
    ).to.emit(factory, "DaoDeployed");
    return factory.Daos(0);
  }

  async function propose(governanceToken: any, daoAddress: any) {
    fractaltoken = await FractalToken.attach(governanceToken);
    dao = await new ethers.Contract(daoAddress, daoABI, wallet);
    const grant = ethers.utils.parseUnits("500.0", 18);
    const newProposal = {
      grantAmount: grant,
      transferCalldata: fractaltoken.interface.encodeFunctionData("mint", [
        wallet.address,
        grant,
      ]),
      descriptionHash: "Proposal #2: Give wallet some tokens",
    };

    await dao
      .connect(voterA)
      ["propose(address[],uint256[],bytes[],string)"](
        [fractaltoken.address],
        [0],
        [newProposal.transferCalldata],
        newProposal.descriptionHash
      );

    const proposalId = await dao.hashProposal(
      [fractaltoken.address],
      [0],
      [newProposal.transferCalldata],
      ethers.utils.id(newProposal.descriptionHash)
    );
    return proposalId;
  }

  async function vote(proposalId: any) {
    await network.provider.send("evm_mine"); // wait 1 block before opening voting
    const VoteType = {
      Against: 0,
      For: 1,
      Abstain: 2,
    };

    await dao.connect(voterA).castVote(proposalId, VoteType.For);
    await dao.connect(voterB).castVote(proposalId, VoteType.For);
    await dao.connect(voterC).castVote(proposalId, VoteType.Against);
    expect(await dao.hasVoted(proposalId, voterA.address)).to.eq(true);
    expect(await dao.hasVoted(proposalId, voterB.address)).to.eq(true);
    expect(await dao.hasVoted(proposalId, voterC.address)).to.eq(true);
  }

  async function execute(proposalId: any) {
    // Queue Proposal
    const grant = ethers.utils.parseUnits("500.0", 18);
    const newProposal = {
      grantAmount: grant,
      transferCalldata: fractaltoken.interface.encodeFunctionData("mint", [
        wallet.address,
        grant,
      ]),
      descriptionHash: "Proposal #2: Give wallet some tokens",
    };

    await dao
      .connect(wallet)
      ["queue(address[],uint256[],bytes[],bytes32)"](
        [fractaltoken.address],
        [0],
        [newProposal.transferCalldata],
        ethers.utils.id(newProposal.descriptionHash)
      );

    // Execute Proposal
    await dao
      .connect(wallet)
      ["execute(address[],uint256[],bytes[],bytes32)"](
        [fractaltoken.address],
        [0],
        [newProposal.transferCalldata],
        ethers.utils.id(newProposal.descriptionHash)
      );
  }

  beforeEach(async function () {
    [deployer, wallet, voterA, voterB, voterC] = await ethers.getSigners();
    Factory = await ethers.getContractFactory("MyDAOFactoryUUPS");
    factory = await Factory.deploy();
    DAO = await ethers.getContractFactory("MyGovernor");
    FractalToken = await ethers.getContractFactory("FractalToken");
  });

  describe("Deployment", function () {
    it("Should Set MyGovernor Implementation", async () => {
      return expect(await factory.governanceImplementation()).to.be
        .properAddress;
    });

    it("Should create a dao proposal", async () => {
      const DaoInfo = await createDAO();
      await distributeTokens(DaoInfo.votingToken);
      await propose(DaoInfo.votingToken, DaoInfo.daoProxy);
    });

    it("Should vote on a dao proposal", async () => {
      const DaoInfo = await createDAO();
      await distributeTokens(DaoInfo.votingToken);
      const proposalId = await propose(DaoInfo.votingToken, DaoInfo.daoProxy);
      await vote(proposalId);
    });

    it("Should execute a passing proposal", async () => {
      const DaoInfo = await createDAO();
      await distributeTokens(DaoInfo.votingToken);
      const proposalId = await propose(DaoInfo.votingToken, DaoInfo.daoProxy);
      await vote(proposalId);
      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");
      await execute(proposalId);
    });
  });
});
