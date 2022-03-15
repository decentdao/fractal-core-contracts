import { ContractTransaction } from "ethers";
import { DAOFactory } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const deployDAO = async (
  daoFactory: DAOFactory,
  deployer: SignerWithAddress,
  createDAOParams: {
    daoImplementation: string;
    accessControlImplementation: string;
    roles: string[];
    rolesAdmins: string[];
    members: string[][];
    daoFunctionDescs: string[];
    daoActionRoles: string[][];
    moduleTargets: string[];
    moduleFunctionDescs: string[];
    moduleActionRoles: string[][];
  }
): Promise<ContractTransaction> => {
  const daoFactoryTx = await daoFactory
    .connect(deployer)
    .createDAO(createDAOParams);

  return daoFactoryTx;
};

export default deployDAO;
