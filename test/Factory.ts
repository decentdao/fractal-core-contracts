const { expect } = require("chai");
const { ethers } = require("hardhat");

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
    // dao = await DAO.attach(daoAddress);
    const grant = ethers.utils.parseUnits("500.0", 18);
    const newProposal = {
      grantAmount: grant,
      transferCalldata: fractaltoken.interface.encodeFunctionData("mint", [
        wallet.address,
        grant,
      ]),
      descriptionHash: ethers.utils.id("Proposal #2: Give wallet some tokens"),
    };
    await expect(
      await dao
        .connect(voterA)
        ["propose(address[],uint256[],bytes[],string)"](
          [fractaltoken.address],
          [0],
          [newProposal.transferCalldata],
          newProposal.descriptionHash
        )
    ).to.emit(dao, "ProposalCreated");

    // await expect(proposeTx.wait()).to.emit(DAO, "ProposalCreated");
    // await network.provider.send('evm_mine'); // wait 1 block before opening voting
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
  });
});
