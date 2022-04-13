import { HardhatRuntimeEnvironment } from "hardhat/types";

const removeActionsRoles = async (
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

  await accessControl.removeActionsRoles(
    moduleTargets,
    moduleFunctionDescs,
    moduleActionRoles
  );

  console.log("Removed action roles");
};

export default removeActionsRoles;
