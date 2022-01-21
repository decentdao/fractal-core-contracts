import { Signer } from "ethers";
const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("Fractal DAO", function () {
  let Factory;
  let factory: any;
  let DAO;
  // let dao;
  // let name = 'DecentPunks';
  // let symbol = 'DCP';
  // let baseURI = 'https://gateway.pinata.cloud/ipfs/QmVZHhYvpa1py2C3ZifDpduQYiq1c7s8deCJweMroTiGr9/';
  // let predictedAddress;
  let deployer;
  let wallet;


  beforeEach(async function () {
    [deployer, wallet] = await ethers.getSigners();
    Factory = await ethers.getContractFactory("MyDAOFactoryUUPS");
    factory = await Factory.deploy();
    DAO = await ethers.getContractFactory("MyGovernor");
  });

  describe("Deployment", function () {
    it("Should Set MyGovernor Implementation", async () => {
      return expect(await factory.governanceImplementation()).to.be
        .properAddress;
    });
  });
});
