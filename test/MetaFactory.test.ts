// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { expect } from "chai";
// import { BigNumber, ContractTransaction } from "ethers";
// import { ethers, network, deployments } from "hardhat";
// import {
//   DAO__factory,
//   DAO,
//   DAOFactory,
//   AccessControl,
//   AccessControl__factory,
//   IMetaFactory__factory,
//   MetaFactory,
//   GovernorModule,
//   GovernorModule__factory,
//   GovernorFactory,
//   TreasuryModule,
//   TreasuryModule__factory,
//   TreasuryModuleFactory,
//   TimelockUpgradeable,
//   TimelockUpgradeable__factory,
//   TokenFactory,
//   VotesTokenWithSupply,
//   VotesTokenWithSupply__factory,
// } from "../typechain-types";
// import getInterfaceSelector from "./helpers/getInterfaceSelector";
// import {
//   VoteType,
//   govModPropose,
//   delegateTokens,
// } from "./helpers/governorModuleHelpers";

// describe("MetaFactory", () => {
//   // Factories
//   let daoFactory: DAOFactory;
//   let govFactory: GovernorFactory;
//   let treasuryFactory: TreasuryModuleFactory;
//   let metaFactory: MetaFactory;
//   let tokenFactory: TokenFactory;

//   // Impl
//   let accessControlImpl: AccessControl;
//   let daoImpl: DAO;
//   let govImpl: GovernorModule;
//   let timelockImpl: TimelockUpgradeable;
//   let treasuryImpl: TreasuryModule;

//   // Deployed contract addresses
//   let daoAddress: string;
//   let accessControlAddress: string;
//   let timelockAddress: string;
//   let governorAddress: string;
//   let treasuryAddress: string;
//   let tokenAddress: string;

//   // Deployed contracts
//   let accessControl: AccessControl;
//   let dao: DAO;
//   let govModule: GovernorModule;
//   let treasuryModule: TreasuryModule;
//   let timelock: TimelockUpgradeable;
//   let token: VotesTokenWithSupply;

//   // Wallets
//   let deployer: SignerWithAddress;
//   let upgrader: SignerWithAddress;
//   let executor: SignerWithAddress;
//   let withdrawer: SignerWithAddress;
//   let userA: SignerWithAddress;
//   let userB: SignerWithAddress;

//   let createTx: ContractTransaction;

//   beforeEach(async () => {
//     [deployer, upgrader, executor, withdrawer, userA, userB] =
//       await ethers.getSigners();

//     // Run deploy scripts
//     await deployments.fixture();

//     // Get deployed MetaFactory contract
//     metaFactory = await ethers.getContract("MetaFactory");

//     // Get deployed factory contracts
//     daoFactory = await ethers.getContract("DAOFactory");
//     treasuryFactory = await ethers.getContract("TreasuryModuleFactory");
//     tokenFactory = await ethers.getContract("TokenFactory");
//     govFactory = await ethers.getContract("GovernorFactory");

//     // Get deployed implementation contracts
//     daoImpl = await ethers.getContract("DAO");
//     accessControlImpl = await ethers.getContract("AccessControl");
//     treasuryImpl = await ethers.getContract("TreasuryModule");
//     govImpl = await ethers.getContract("GovernorModule");
//     timelockImpl = await ethers.getContract("TimelockUpgradeable");

//     const abiCoder = new ethers.utils.AbiCoder();

//     const createDAOParams = {
//       daoImplementation: daoImpl.address,
//       accessControlImplementation: accessControlImpl.address,
//       daoName: "TestDao",
//       roles: [
//         "EXECUTE_ROLE",
//         "UPGRADE_ROLE",
//         "WITHDRAWER_ROLE",
//         "GOVERNOR_ROLE",
//       ],
//       rolesAdmins: ["DAO_ROLE", "DAO_ROLE", "DAO_ROLE", "DAO_ROLE"],
//       members: [
//         [executor.address],
//         [upgrader.address],
//         [withdrawer.address],
//         [],
//       ],
//       daoFunctionDescs: [
//         "execute(address[],uint256[],bytes[])",
//         "upgradeTo(address)",
//       ],
//       daoActionRoles: [["EXECUTE_ROLE"], ["UPGRADE_ROLE"]],
//     };

//     const moduleFactoriesCalldata = [
//       {
//         factory: treasuryFactory.address,
//         data: [abiCoder.encode(["address"], [treasuryImpl.address])],
//         value: 0,
//         newContractAddressesToPass: [1],
//         addressesReturned: 1,
//       },
//       {
//         factory: tokenFactory.address,
//         data: [
//           abiCoder.encode(["string"], ["DECENT"]),
//           abiCoder.encode(["string"], ["DCNT"]),
//           abiCoder.encode(["address[]"], [[userA.address, userB.address]]),
//           abiCoder.encode(
//             ["uint256[]"],
//             [
//               [
//                 ethers.utils.parseUnits("100", 18),
//                 ethers.utils.parseUnits("100", 18),
//               ],
//             ]
//           ),
//           abiCoder.encode(["uint256"], [ethers.utils.parseUnits("1000", 18)]),
//         ],
//         value: 0,
//         newContractAddressesToPass: [2],
//         addressesReturned: 1,
//       },
//       {
//         factory: govFactory.address,
//         data: [
//           abiCoder.encode(["address"], [govImpl.address]),
//           abiCoder.encode(["address"], [timelockImpl.address]),
//           abiCoder.encode(["string"], ["TestGov"]),
//           abiCoder.encode(["uint64"], [BigNumber.from("0")]),
//           abiCoder.encode(["uint256"], [BigNumber.from("1")]),
//           abiCoder.encode(["uint256"], [BigNumber.from("5")]),
//           abiCoder.encode(["uint256"], [BigNumber.from("0")]),
//           abiCoder.encode(["uint256"], [BigNumber.from("4")]),
//           abiCoder.encode(["uint256"], [BigNumber.from("1")]),
//         ],
//         value: 0,
//         newContractAddressesToPass: [0, 1, 3],
//         addressesReturned: 2,
//       },
//     ];

//     const moduleActionCalldata = {
//       contractIndexes: [2, 2, 2, 2, 2, 2, 4, 5, 5, 5, 5, 5],
//       functionDescs: [
//         "withdrawEth(address[],uint256[])",
//         "depositERC20Tokens(address[],address[],uint256[])",
//         "withdrawERC20Tokens(address[],address[],uint256[])",
//         "depositERC721Tokens(address[],address[],uint256[])",
//         "withdrawERC721Tokens(address[],address[],uint256[])",
//         "upgradeTo(address)",
//         "upgradeTo(address)",
//         "upgradeTo(address)",
//         "updateDelay(uint256)",
//         "scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32,uint256)",
//         "cancel(bytes32)",
//         "executeBatch(address[],uint256[],bytes[],bytes32,bytes32)",
//       ],
//       roles: [
//         ["WITHDRAWER_ROLE"],
//         ["WITHDRAWER_ROLE"],
//         ["WITHDRAWER_ROLE"],
//         ["WITHDRAWER_ROLE"],
//         ["WITHDRAWER_ROLE"],
//         ["UPGRADE_ROLE"],
//         ["UPGRADE_ROLE"],
//         ["UPGRADE_ROLE"],
//         ["GOVERNOR_ROLE"],
//         ["GOVERNOR_ROLE"],
//         ["GOVERNOR_ROLE"],
//         ["GOVERNOR_ROLE"],
//       ],
//     };

//     [
//       daoAddress,
//       accessControlAddress,
//       treasuryAddress,
//       tokenAddress,
//       governorAddress,
//       timelockAddress,
//     ] = await metaFactory.callStatic.createDAOAndModules(
//       daoFactory.address,
//       0,
//       createDAOParams,
//       moduleFactoriesCalldata,
//       moduleActionCalldata,
//       [[5], [0], [0], [4]]
//     );

//     createTx = await metaFactory
//       .connect(deployer)
//       .createDAOAndModules(
//         daoFactory.address,
//         0,
//         createDAOParams,
//         moduleFactoriesCalldata,
//         moduleActionCalldata,
//         [[5], [0], [0], [4]]
//       );

//     // eslint-disable-next-line camelcase
//     dao = DAO__factory.connect(daoAddress, deployer);

//     // eslint-disable-next-line camelcase
//     accessControl = AccessControl__factory.connect(
//       accessControlAddress,
//       deployer
//     );

//     // eslint-disable-next-line camelcase
//     treasuryModule = TreasuryModule__factory.connect(treasuryAddress, deployer);

//     // eslint-disable-next-line camelcase
//     token = VotesTokenWithSupply__factory.connect(tokenAddress, deployer);

//     // eslint-disable-next-line camelcase
//     govModule = GovernorModule__factory.connect(governorAddress, deployer);

//     // eslint-disable-next-line camelcase
//     timelock = TimelockUpgradeable__factory.connect(timelockAddress, deployer);
//   });

//   it("Emitted the correct events", async () => {
//     expect(createTx)
//       .to.emit(metaFactory, "DAOAndModulesCreated")
//       .withArgs(dao.address, accessControl.address, [
//         treasuryModule.address,
//         token.address,
//         govModule.address,
//         timelock.address,
//       ]);

//     expect(createTx)
//       .to.emit(daoFactory, "DAOCreated")
//       .withArgs(
//         daoAddress,
//         accessControlAddress,
//         metaFactory.address,
//         deployer.address
//       );

//     expect(createTx)
//       .to.emit(treasuryFactory, "TreasuryCreated")
//       .withArgs(treasuryModule.address, accessControl.address);

//     expect(createTx)
//       .to.emit(govFactory, "GovernorCreated")
//       .withArgs(govModule.address, timelock.address);
//   });

//   it("Setup the correct roles", async () => {
//     expect(await accessControl.hasRole("DAO_ROLE", dao.address)).to.eq(true);

//     expect(await accessControl.hasRole("DAO_ROLE", metaFactory.address)).to.eq(
//       false
//     );

//     expect(await accessControl.hasRole("EXECUTE_ROLE", executor.address)).to.eq(
//       true
//     );

//     expect(
//       await accessControl.hasRole("EXECUTE_ROLE", metaFactory.address)
//     ).to.eq(false);

//     expect(await accessControl.hasRole("EXECUTE_ROLE", upgrader.address)).to.eq(
//       false
//     );

//     expect(await accessControl.hasRole("UPGRADE_ROLE", upgrader.address)).to.eq(
//       true
//     );

//     expect(await accessControl.hasRole("UPGRADE_ROLE", executor.address)).to.eq(
//       false
//     );
//   });

//   it("Sets up the correct DAO role authorization", async () => {
//     expect(
//       await accessControl.isRoleAuthorized(
//         "EXECUTE_ROLE",
//         dao.address,
//         "execute(address[],uint256[],bytes[])"
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "UPGRADE_ROLE",
//         dao.address,
//         "execute(address[],uint256[],bytes[])"
//       )
//     ).to.eq(false);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "RANDOM_ROLE",
//         dao.address,
//         "execute(address[],uint256[],bytes[])"
//       )
//     ).to.eq(false);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "EXECUTE_ROLE",
//         dao.address,
//         "upgradeTo(address)"
//       )
//     ).to.eq(false);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "UPGRADE_ROLE",
//         dao.address,
//         "upgradeTo(address)"
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "RANDOM_ROLE",
//         dao.address,
//         "upgradeTo(address)"
//       )
//     ).to.eq(false);
//   });

//   it("Sets up the correct Treasury role authorization", async () => {
//     expect(
//       await accessControl.isRoleAuthorized(
//         "WITHDRAWER_ROLE",
//         treasuryModule.address,
//         "withdrawEth(address[],uint256[])"
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "UPGRADE_ROLE",
//         treasuryModule.address,
//         "withdrawEth(address[],uint256[])"
//       )
//     ).to.eq(false);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "WITHDRAWER_ROLE",
//         treasuryModule.address,
//         "depositERC20Tokens(address[],address[],uint256[])"
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "UPGRADE_ROLE",
//         treasuryModule.address,
//         "depositERC20Tokens(address[],address[],uint256[])"
//       )
//     ).to.eq(false);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "WITHDRAWER_ROLE",
//         treasuryModule.address,
//         "withdrawERC20Tokens(address[],address[],uint256[])"
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "UPGRADE_ROLE",
//         treasuryModule.address,
//         "withdrawERC20Tokens(address[],address[],uint256[])"
//       )
//     ).to.eq(false);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "WITHDRAWER_ROLE",
//         treasuryModule.address,
//         "depositERC721Tokens(address[],address[],uint256[])"
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "UPGRADE_ROLE",
//         treasuryModule.address,
//         "depositERC721Tokens(address[],address[],uint256[])"
//       )
//     ).to.eq(false);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "WITHDRAWER_ROLE",
//         treasuryModule.address,
//         "withdrawERC721Tokens(address[],address[],uint256[])"
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "UPGRADE_ROLE",
//         treasuryModule.address,
//         "withdrawERC721Tokens(address[],address[],uint256[])"
//       )
//     ).to.eq(false);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "UPGRADE_ROLE",
//         treasuryModule.address,
//         "upgradeTo(address)"
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "WITHDRAWER_ROLE",
//         treasuryModule.address,
//         "upgradeTo(address)"
//       )
//     ).to.eq(false);
//   });

//   it("Sets up the correct Governor module role authorization", async () => {
//     expect(
//       await accessControl.isRoleAuthorized(
//         "UPGRADE_ROLE",
//         govModule.address,
//         "upgradeTo(address)"
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "WITHDRAWER_ROLE",
//         govModule.address,
//         "upgradeTo(address)"
//       )
//     ).to.eq(false);
//   });

//   it("Sets up the correct timelock role authorization", async () => {
//     expect(
//       await accessControl.isRoleAuthorized(
//         "UPGRADE_ROLE",
//         timelock.address,
//         "upgradeTo(address)"
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "GOVERNOR_ROLE",
//         timelock.address,
//         "upgradeTo(address)"
//       )
//     ).to.eq(false);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "GOVERNOR_ROLE",
//         timelock.address,
//         "updateDelay(uint256)"
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "UPGRADE_ROLE",
//         timelock.address,
//         "updateDelay(uint256)"
//       )
//     ).to.eq(false);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "GOVERNOR_ROLE",
//         timelock.address,
//         "updateDelay(uint256)"
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "UPGRADE_ROLE",
//         timelock.address,
//         "updateDelay(uint256)"
//       )
//     ).to.eq(false);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "GOVERNOR_ROLE",
//         timelock.address,
//         "scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32,uint256)"
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "UPGRADE_ROLE",
//         timelock.address,
//         "scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32,uint256)"
//       )
//     ).to.eq(false);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "GOVERNOR_ROLE",
//         timelock.address,
//         "cancel(bytes32)"
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "UPGRADE_ROLE",
//         timelock.address,
//         "cancel(bytes32)"
//       )
//     ).to.eq(false);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "GOVERNOR_ROLE",
//         timelock.address,
//         "executeBatch(address[],uint256[],bytes[],bytes32,bytes32)"
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.isRoleAuthorized(
//         "UPGRADE_ROLE",
//         timelock.address,
//         "executeBatch(address[],uint256[],bytes[],bytes32,bytes32)"
//       )
//     ).to.eq(false);
//   });

//   it("Sets up the correct DAO action authorization", async () => {
//     expect(
//       await accessControl.actionIsAuthorized(
//         executor.address,
//         dao.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [
//               ethers.utils.solidityPack(
//                 ["string"],
//                 ["execute(address[],uint256[],bytes[])"]
//               ),
//             ]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.actionIsAuthorized(
//         timelock.address,
//         dao.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [
//               ethers.utils.solidityPack(
//                 ["string"],
//                 ["execute(address[],uint256[],bytes[])"]
//               ),
//             ]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.actionIsAuthorized(
//         upgrader.address,
//         dao.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [ethers.utils.solidityPack(["string"], ["upgradeTo(address)"])]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.actionIsAuthorized(
//         executor.address,
//         dao.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [ethers.utils.solidityPack(["string"], ["upgradeTo(address)"])]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(false);
//   });

//   it("Sets up the correct Treasury action authorization", async () => {
//     expect(
//       await accessControl.actionIsAuthorized(
//         withdrawer.address,
//         treasuryModule.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [
//               ethers.utils.solidityPack(
//                 ["string"],
//                 ["withdrawEth(address[],uint256[])"]
//               ),
//             ]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.actionIsAuthorized(
//         dao.address,
//         treasuryModule.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [
//               ethers.utils.solidityPack(
//                 ["string"],
//                 ["withdrawEth(address[],uint256[])"]
//               ),
//             ]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.actionIsAuthorized(
//         withdrawer.address,
//         treasuryModule.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [
//               ethers.utils.solidityPack(
//                 ["string"],
//                 ["depositERC20Tokens(address[],address[],uint256[])"]
//               ),
//             ]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.actionIsAuthorized(
//         dao.address,
//         treasuryModule.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [
//               ethers.utils.solidityPack(
//                 ["string"],
//                 ["depositERC20Tokens(address[],address[],uint256[])"]
//               ),
//             ]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.actionIsAuthorized(
//         withdrawer.address,
//         treasuryModule.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [
//               ethers.utils.solidityPack(
//                 ["string"],
//                 ["withdrawERC20Tokens(address[],address[],uint256[])"]
//               ),
//             ]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.actionIsAuthorized(
//         dao.address,
//         treasuryModule.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [
//               ethers.utils.solidityPack(
//                 ["string"],
//                 ["withdrawERC20Tokens(address[],address[],uint256[])"]
//               ),
//             ]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.actionIsAuthorized(
//         withdrawer.address,
//         treasuryModule.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [
//               ethers.utils.solidityPack(
//                 ["string"],
//                 ["depositERC721Tokens(address[],address[],uint256[])"]
//               ),
//             ]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.actionIsAuthorized(
//         dao.address,
//         treasuryModule.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [
//               ethers.utils.solidityPack(
//                 ["string"],
//                 ["depositERC721Tokens(address[],address[],uint256[])"]
//               ),
//             ]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.actionIsAuthorized(
//         withdrawer.address,
//         treasuryModule.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [
//               ethers.utils.solidityPack(
//                 ["string"],
//                 ["withdrawERC721Tokens(address[],address[],uint256[])"]
//               ),
//             ]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.actionIsAuthorized(
//         dao.address,
//         treasuryModule.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [
//               ethers.utils.solidityPack(
//                 ["string"],
//                 ["withdrawERC721Tokens(address[],address[],uint256[])"]
//               ),
//             ]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.actionIsAuthorized(
//         upgrader.address,
//         treasuryModule.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [ethers.utils.solidityPack(["string"], ["upgradeTo(address)"])]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.actionIsAuthorized(
//         dao.address,
//         treasuryModule.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [ethers.utils.solidityPack(["string"], ["upgradeTo(address)"])]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(true);
//   });

//   it("Sets up the correct Governor module action authorization", async () => {
//     expect(
//       await accessControl.actionIsAuthorized(
//         upgrader.address,
//         govModule.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [ethers.utils.solidityPack(["string"], ["upgradeTo(address)"])]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.actionIsAuthorized(
//         dao.address,
//         govModule.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [ethers.utils.solidityPack(["string"], ["upgradeTo(address)"])]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(true);
//   });

//   it("Sets up the correct timelock action authorization", async () => {
//     expect(
//       await accessControl.actionIsAuthorized(
//         upgrader.address,
//         timelock.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [ethers.utils.solidityPack(["string"], ["upgradeTo(address)"])]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(true);

//     expect(
//       await accessControl.actionIsAuthorized(
//         dao.address,
//         timelock.address,
//         ethers.utils.hexDataSlice(
//           ethers.utils.solidityKeccak256(
//             ["bytes"],
//             [ethers.utils.solidityPack(["string"], ["upgradeTo(address)"])]
//           ),
//           0,
//           4
//         )
//       )
//     ).to.eq(true);
//   });

//   it("Supports the expected ERC165 interface", async () => {
//     // Supports Module Factory interface
//     expect(
//       await metaFactory.supportsInterface(
//         // eslint-disable-next-line camelcase
//         getInterfaceSelector(IMetaFactory__factory.createInterface())
//       )
//     ).to.eq(true);
//     // Supports ERC-165 interface
//     expect(await govFactory.supportsInterface("0x01ffc9a7")).to.eq(true);
//   });

//   it("Allocated correct token amounts", async () => {
//     expect(await token.balanceOf(treasuryModule.address)).to.eq(
//       ethers.utils.parseUnits("800", 18)
//     );

//     expect(await token.balanceOf(userA.address)).to.eq(
//       ethers.utils.parseUnits("100", 18)
//     );

//     expect(await token.balanceOf(userB.address)).to.eq(
//       ethers.utils.parseUnits("100", 18)
//     );
//   });

//   it("Supports creating, voting on, and executing a proposal", async () => {
//     await delegateTokens(token, [userA, userB]);

//     const transferCallData = treasuryModule.interface.encodeFunctionData(
//       "withdrawERC20Tokens",
//       [[token.address], [userA.address], [ethers.utils.parseUnits("100", 18)]]
//     );

//     const proposalCreatedEvent = await govModPropose(
//       [treasuryModule.address],
//       [BigNumber.from("0")],
//       govModule,
//       userA,
//       [transferCallData],
//       "Proposal #1: transfer 100 tokens from treasury to User A"
//     );

//     await network.provider.send("evm_mine");

//     // Users A and B vote "For"
//     await govModule
//       .connect(userA)
//       .castVote(proposalCreatedEvent.proposalId, VoteType.For);
//     await govModule
//       .connect(userB)
//       .castVote(proposalCreatedEvent.proposalId, VoteType.For);

//     await network.provider.send("evm_mine");
//     await network.provider.send("evm_mine");
//     await network.provider.send("evm_mine");

//     await govModule
//       .connect(userA)
//       .queue(
//         proposalCreatedEvent.targets,
//         proposalCreatedEvent._values,
//         proposalCreatedEvent.calldatas,
//         ethers.utils.id(proposalCreatedEvent.description)
//       );

//     await govModule
//       .connect(userA)
//       .execute(
//         proposalCreatedEvent.targets,
//         proposalCreatedEvent._values,
//         proposalCreatedEvent.calldatas,
//         ethers.utils.id(proposalCreatedEvent.description)
//       );

//     expect(await token.balanceOf(treasuryModule.address)).to.eq(
//       ethers.utils.parseUnits("700", 18)
//     );

//     expect(await token.balanceOf(userA.address)).to.eq(
//       ethers.utils.parseUnits("200", 18)
//     );
//   });
// });
