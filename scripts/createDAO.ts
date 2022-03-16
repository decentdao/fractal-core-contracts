import { DAOFactory__factory } from "../typechain";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const createDAO = async (
  hre: HardhatRuntimeEnvironment,
  daoFactoryAddress: string,
  daoImplementationAddress: string,
  accessControlImplementationAddress: string,
  roles: string[],
  rolesAdmins: string[],
  members: string[][],
  daoFunctionDescs: string[],
  daoActionRoles: string[][],
  moduleTargets: string[],
  moduleFunctionDescs: string[],
  moduleActionRoles: string[][]
): Promise<void> => {
  const daoFactory = await hre.ethers.getContractAt(
    // eslint-disable-next-line camelcase
    DAOFactory__factory.abi,
    daoFactoryAddress
  );

  const tx = await daoFactory.createDAO({
    daoImplementation: daoImplementationAddress,
    accessControlImplementation: accessControlImplementationAddress,
    roles: roles,
    rolesAdmins: rolesAdmins,
    members: members,
    daoFunctionDescs: daoFunctionDescs,
    daoActionRoles: daoActionRoles,
    moduleTargets: moduleTargets,
    moduleFunctionDescs: moduleFunctionDescs,
    moduleActionRoles: moduleActionRoles,
  });

  const txReceipt = await tx.wait();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deployDAOEvent = txReceipt.events?.filter((x: any) => {
    return x.event === "DAOCreated";
  });

  const createdDAOAddress = deployDAOEvent[0].args.daoAddress;
  const createdAccessControlAddress = deployDAOEvent[0].args.accessControl;

  console.log("DAO created at ", createdDAOAddress);
  console.log("Access Control created at ", createdAccessControlAddress);
};

export default createDAO;
