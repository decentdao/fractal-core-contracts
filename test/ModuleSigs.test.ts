import { ethers } from "hardhat";
import { DAOAccessControl, FooModule, Bar } from "../typechain";

describe.only("Modules", () => {
  let daoAccessControl: DAOAccessControl;
  let fooModule: FooModule;
  let bar: Bar;

  beforeEach(async () => {
    const DAOAccessControl = await ethers.getContractFactory("DAOAccessControl");
    daoAccessControl = await DAOAccessControl.deploy();

    const FooModule = await ethers.getContractFactory("FooModule");
    fooModule = await FooModule.deploy(daoAccessControl.address);

    const Bar = await ethers.getContractFactory("Bar");
    bar = await Bar.deploy(fooModule.address);
  });

  it("permissioned A", async () => {
    await fooModule.fooPermissionedA();
    await bar.barPermissionedA();
    console.log(fooModule.interface.getSighash(fooModule.interface.functions["fooPermissionedA()"]));
    console.log(bar.interface.getSighash(bar.interface.functions["barPermissionedA()"]));
  })

  it("permissioned B", async () => {
    await fooModule.fooPermissionedB();
    await bar.barPermissionedB();
    console.log(fooModule.interface.getSighash(fooModule.interface.functions["fooPermissionedB()"]));
    console.log(bar.interface.getSighash(bar.interface.functions["barPermissionedB()"]));
  })

  it("permissioned C", async () => {
    await fooModule.fooPermissionedC();
    await bar.barPermissionedC();
    console.log(fooModule.interface.getSighash(fooModule.interface.functions["fooPermissionedC()"]));
    console.log(bar.interface.getSighash(bar.interface.functions["barPermissionedC()"]));
  })
});
