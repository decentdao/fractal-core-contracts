import { ethers } from "hardhat";
import { DAOFactory__factory } from "../typechain";

async function main() {
  const [deployer] = await ethers.getSigners();
  const DAOFactory = await new DAOFactory__factory(deployer).deploy();

  console.log("DAO Factory Address", DAOFactory.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
