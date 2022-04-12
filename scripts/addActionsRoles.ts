import { HardhatRuntimeEnvironment } from "hardhat/types";

const addActionsRoles = async (
  hre: HardhatRuntimeEnvironment,
  accessControlAddress: string,
  moduleTargets: string[],
  moduleFunctionDescs: string[],
  moduleActionRoles: string[][]
): Promise<void> => {
  const accessControl = await hre.ethers.getContractAt(
    "AccessControl",
    accessControlAddress
  );

  await accessControl.addActionsRoles(
    moduleTargets,
    moduleFunctionDescs,
    moduleActionRoles
  );

  console.log("Added action roles");
};

export default addActionsRoles;
