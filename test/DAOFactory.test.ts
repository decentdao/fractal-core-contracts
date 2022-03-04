// import { ethers } from "hardhat";
// import { DAO, DAOAccessControl, DAOFactory } from "../typechain";
// import { expect } from "chai";
// import { ContractTransaction, BytesLike } from "ethers";

// describe("DAOFactory", () => {
//   let daoFactory: DAOFactory;
//   let daoPrototype: DAO;
//   let daoAccessControlPrototype: DAOAccessControl;

//   beforeEach(async () => {
//     const DAOFactory = await ethers.getContractFactory("DAOFactory");
//     daoFactory = await DAOFactory.deploy();
//     const DAO = await ethers.getContractFactory("DAO");
//     daoPrototype = await DAO.deploy();
//     const DAOAccessControl = await ethers.getContractFactory("DAOAccessControl");
//     daoAccessControlPrototype = await DAOAccessControl.deploy();
//   });

//   describe("creating new DAOs", () => {
//     let daoAddress: string;
//     let createDAOTx: ContractTransaction;

//     beforeEach(async () => {
//       const createParams: [string, string, string[], BytesLike[], BytesLike[], string[][]] = [daoPrototype.address, daoAccessControlPrototype.address, [], [], [], []];
//       daoAddress = await daoFactory.callStatic.createDAO(...createParams);
//       createDAOTx = await daoFactory.createDAO(...createParams);
//     });

//     it("emits an event with the new DAO's address", async () => {
//       expect(createDAOTx).to.emit(daoFactory, "DAOCreated").withArgs(daoAddress);
//     });
//   });

//   it("DAOFactory supports the expected ERC165 interface")
// });
