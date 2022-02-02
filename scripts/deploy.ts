import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { DaoFactory, DaoFactory__factory } from "../typechain";

async function main() {
  let daoFactory: DaoFactory;
  let deployer: SignerWithAddress;

  [deployer] = await ethers.getSigners();
  daoFactory = await new DaoFactory__factory(deployer).deploy();

  console.log("Dao Factory Address", daoFactory.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
