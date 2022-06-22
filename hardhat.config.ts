import * as dotenv from "dotenv";
import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-waffle";
import "hardhat-deploy";
import "@typechain/hardhat";
import "hardhat-tracer";
import "solidity-coverage";
import createDAO from "./scripts/createDAO";
import addActionsRoles from "./scripts/addActionsRoles";
import removeActionsRoles from "./scripts/removeActionsRoles";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("createDAO", "Creates a Fractal DAO")
  .addParam("creator", "The address credited with creating the DAO")
  .addParam(
    "daoFactory",
    "The address of the DAO factory to create the DAO from"
  )
  .addParam(
    "daoImplementation",
    "The address of the DAO implementation contract"
  )
  .addParam(
    "accessControlImplementation",
    "The address of the Access Control implementation contract"
  )
  .addParam("daoName", "Name of the DAO")
  .addParam("roles", "Array of strings of the roles to initialize")
  .addParam("rolesAdmins", "Array of strings of role admins to initialize")
  .addParam("members", "Two-dimensional array of addresses of role members")
  .addParam(
    "daoFunctionDescs",
    "Array of strings of DAO function action descriptions"
  )
  .addParam(
    "daoActionRoles",
    "Two-dimensional array of strings of roles to give permissions over DAO function description actions"
  )
  .addParam(
    "moduleTargets",
    "Array of addresses of modules to initialize actions on"
  )
  .addParam(
    "moduleFunctionDescs",
    "Array of strings of module function action descriptions"
  )
  .addParam(
    "moduleActionRoles",
    "Two-dimensional array of strings of roles to give permissions over DAO function description actions"
  )
  .setAction(async (taskArgs, hre) => {
    await createDAO(
      hre,
      taskArgs.creator,
      taskArgs.daoFactory,
      taskArgs.daoImplementation,
      taskArgs.accessControlImplementation,
      taskArgs.daoName,
      JSON.parse(taskArgs.roles.replaceAll(`'`, `"`)),
      JSON.parse(taskArgs.rolesAdmins.replaceAll(`'`, `"`)),
      JSON.parse(taskArgs.members.replaceAll(`'`, `"`)),
      JSON.parse(taskArgs.daoFunctionDescs.replaceAll(`'`, `"`)),
      JSON.parse(taskArgs.daoActionRoles.replaceAll(`'`, `"`)),
      JSON.parse(taskArgs.moduleTargets.replaceAll(`'`, `"`)),
      JSON.parse(taskArgs.moduleFunctionDescs.replaceAll(`'`, `"`)),
      JSON.parse(taskArgs.moduleActionRoles.replaceAll(`'`, `"`))
    );
  });

task("addActionsRoles", "Adds Action Roles")
  .addParam("accessControlAddress", "Address of the access control contract")
  .addParam(
    "moduleTargets",
    "Array of addresses of modules to initialize actions on"
  )
  .addParam(
    "moduleFunctionDescs",
    "Array of strings of module function action descriptions"
  )
  .addParam(
    "moduleActionRoles",
    "Two-dimensional array of strings of roles to give permissions over DAO function description actions"
  )
  .setAction(async (taskArgs, hre) => {
    await addActionsRoles(
      hre,
      taskArgs.accessControlAddress,
      JSON.parse(taskArgs.moduleTargets.replaceAll(`'`, `"`)),
      JSON.parse(taskArgs.moduleFunctionDescs.replaceAll(`'`, `"`)),
      JSON.parse(taskArgs.moduleActionRoles.replaceAll(`'`, `"`))
    );
  });

task("removeActionsRoles", "Removes Action Roles")
  .addParam("accessControlAddress", "Address of the access control contract")
  .addParam(
    "moduleTargets",
    "Array of addresses of modules to initialize actions on"
  )
  .addParam(
    "moduleFunctionDescs",
    "Array of strings of module function action descriptions"
  )
  .addParam(
    "moduleActionRoles",
    "Two-dimensional array of strings of roles to give permissions over DAO function description actions"
  )
  .setAction(async (taskArgs, hre) => {
    await removeActionsRoles(
      hre,
      taskArgs.accessControlAddress,
      JSON.parse(taskArgs.moduleTargets.replaceAll(`'`, `"`)),
      JSON.parse(taskArgs.moduleFunctionDescs.replaceAll(`'`, `"`)),
      JSON.parse(taskArgs.moduleActionRoles.replaceAll(`'`, `"`))
    );
  });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.13",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
      mainnet: `privatekey://${process.env.MAINNET_DEPLOYER_PRIVATE_KEY}`,
      goerli: `privatekey://${process.env.GOERLI_DEPLOYER_PRIVATE_KEY}`,
    },
  },
  networks: {
    mainnet: {
      chainId: 1,
      url: process.env.MAINNET_PROVIDER,
      accounts: [process.env.MAINNET_DEPLOYER_PRIVATE_KEY || ""],
    },
    goerli: {
      chainId: 5,
      url: process.env.GOERLI_PROVIDER,
      accounts: [process.env.GOERLI_DEPLOYER_PRIVATE_KEY || ""],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  paths: {
    deploy: "deploy/core",
  },
};

export default config;
