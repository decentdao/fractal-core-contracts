import { ethers } from "hardhat";
import { DaoFactory__factory } from "../typechain";

async function main() {
  const [deployer] = await ethers.getSigners();
  const daoFactory = await new DaoFactory__factory(deployer).deploy();

  console.log("DAO Factory Address", daoFactory.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
