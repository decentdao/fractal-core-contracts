import { ethers } from "hardhat";
import { OpenZGovernor__factory, OpenZFactory__factory } from "../typechain";

async function main() {
  const [deployer] = await ethers.getSigners();
  const DAOFactory = await new OpenZFactory__factory(deployer).deploy();

  console.log("DAO Factory Address", DAOFactory.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
