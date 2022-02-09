import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  TestToken,
  TestToken__factory,
  Treasury,
  Treasury__factory,
} from "../typechain";
import chai from "chai";
import { ethers } from "hardhat";
import {
  TreasuryDepositErc20Tokens,
  TreasuryWithdrawErc20Tokens,
} from "../helpers/Treasury";

const expect = chai.expect;

describe.only("Treasury", function () {
  let treasury: Treasury;
  let erc20TokenAlpha: TestToken;
  let erc20TokenBravo: TestToken;
  let deployer: SignerWithAddress;
  let owner: SignerWithAddress;
  let userA: SignerWithAddress;
  let userB: SignerWithAddress;

  beforeEach(async function () {
    [deployer, owner, userA, userB] = await ethers.getSigners();

    // Deploy a new treasury with the Owner account configured as the initial owner
    treasury = await new Treasury__factory(deployer).deploy(owner.address);

    erc20TokenAlpha = await new TestToken__factory(deployer).deploy(
      "ALPHA",
      "ALPHA",
      [treasury.address, userA.address, userB.address],
      [
        ethers.utils.parseUnits("100.0", 18),
        ethers.utils.parseUnits("100.0", 18),
        ethers.utils.parseUnits("100.0", 18),
      ]
    );

    erc20TokenBravo = await new TestToken__factory(deployer).deploy(
      "BRAVO",
      "BRAVO",
      [treasury.address, userA.address, userB.address],
      [
        ethers.utils.parseUnits("100.0", 18),
        ethers.utils.parseUnits("100.0", 18),
        ethers.utils.parseUnits("100.0", 18),
      ]
    );

    await erc20TokenAlpha
      .connect(userA)
      .approve(treasury.address, ethers.utils.parseUnits("100.0", 18));

    await erc20TokenAlpha
      .connect(userB)
      .approve(treasury.address, ethers.utils.parseUnits("100.0", 18));

    await erc20TokenBravo
      .connect(userA)
      .approve(treasury.address, ethers.utils.parseUnits("100.0", 18));

    await erc20TokenBravo
      .connect(userB)
      .approve(treasury.address, ethers.utils.parseUnits("100.0", 18));
  });

  it("Receives ERC-20 tokens", async () => {
    expect(await erc20TokenAlpha.balanceOf(userA.address)).to.equal(
      ethers.utils.parseUnits("100.0", 18)
    );
    expect(await erc20TokenAlpha.balanceOf(userB.address)).to.equal(
      ethers.utils.parseUnits("100.0", 18)
    );
    expect(await erc20TokenAlpha.balanceOf(treasury.address)).to.equal(
      ethers.utils.parseUnits("100.0", 18)
    );
    expect(await erc20TokenBravo.balanceOf(userA.address)).to.equal(
      ethers.utils.parseUnits("100.0", 18)
    );
    expect(await erc20TokenBravo.balanceOf(userB.address)).to.equal(
      ethers.utils.parseUnits("100.0", 18)
    );
    expect(await erc20TokenBravo.balanceOf(treasury.address)).to.equal(
      ethers.utils.parseUnits("100.0", 18)
    );
  });

  it("Emits event when ERC-20 tokens are deposited", async () => {
    const depositEvent = await TreasuryDepositErc20Tokens(
      treasury,
      owner,
      [erc20TokenAlpha.address],
      [userA.address],
      [ethers.utils.parseUnits("50.0", 18)]
    );

    expect(depositEvent.tokenAddresses).to.deep.equal([
      erc20TokenAlpha.address,
    ]);
    expect(depositEvent.senders).to.deep.equal([userA.address]);
    expect(depositEvent.amounts).to.deep.equal([
      ethers.utils.parseUnits("50.0", 18),
    ]);
  });

  it("Receives ERC-20 tokens using the deposit function", async () => {
    await TreasuryDepositErc20Tokens(
      treasury,
      owner,
      [erc20TokenAlpha.address],
      [userA.address],
      [ethers.utils.parseUnits("50.0", 18)]
    );

    expect(await erc20TokenAlpha.balanceOf(userA.address)).to.equal(
      ethers.utils.parseUnits("50.0", 18)
    );
    expect(await erc20TokenAlpha.balanceOf(treasury.address)).to.equal(
      ethers.utils.parseUnits("150.0", 18)
    );
  });

  it("Receives multiple ERC-20 tokens from multiple addresses using the deposit function", async () => {
    await TreasuryDepositErc20Tokens(
      treasury,
      owner,
      [erc20TokenAlpha.address],
      [userA.address],
      [ethers.utils.parseUnits("20.0", 18)]
    );

    await TreasuryDepositErc20Tokens(
      treasury,
      owner,
      [erc20TokenAlpha.address],
      [userB.address],
      [ethers.utils.parseUnits("30.0", 18)]
    );

    await TreasuryDepositErc20Tokens(
      treasury,
      owner,
      [erc20TokenBravo.address],
      [userA.address],
      [ethers.utils.parseUnits("40.0", 18)]
    );

    await TreasuryDepositErc20Tokens(
      treasury,
      owner,
      [erc20TokenBravo.address],
      [userB.address],
      [ethers.utils.parseUnits("50.0", 18)]
    );

    expect(await erc20TokenAlpha.balanceOf(userA.address)).to.equal(
      ethers.utils.parseUnits("80.0", 18)
    );

    expect(await erc20TokenAlpha.balanceOf(userB.address)).to.equal(
      ethers.utils.parseUnits("70.0", 18)
    );

    expect(await erc20TokenAlpha.balanceOf(treasury.address)).to.equal(
      ethers.utils.parseUnits("150.0", 18)
    );

    expect(await erc20TokenBravo.balanceOf(userA.address)).to.equal(
      ethers.utils.parseUnits("60.0", 18)
    );

    expect(await erc20TokenBravo.balanceOf(userB.address)).to.equal(
      ethers.utils.parseUnits("50.0", 18)
    );

    expect(await erc20TokenBravo.balanceOf(treasury.address)).to.equal(
      ethers.utils.parseUnits("190.0", 18)
    );
  });

  it("Emits event when ERC-20 tokens are withdrawn", async () => {
    const withdrawEvent = await TreasuryWithdrawErc20Tokens(
      treasury,
      owner,
      [erc20TokenAlpha.address],
      [userA.address],
      [ethers.utils.parseUnits("50.0", 18)]
    );

    expect(withdrawEvent.tokenAddresses).to.deep.equal([
      erc20TokenAlpha.address,
    ]);
    expect(withdrawEvent.recipients).to.deep.equal([userA.address]);
    expect(withdrawEvent.amounts).to.deep.equal([
      ethers.utils.parseUnits("50.0", 18),
    ]);
  });

  it("Sends ERC-20 tokens using the withdraw function", async () => {
    await TreasuryWithdrawErc20Tokens(
      treasury,
      owner,
      [erc20TokenAlpha.address],
      [userA.address],
      [ethers.utils.parseUnits("50.0", 18)]
    );

    expect(await erc20TokenAlpha.balanceOf(userA.address)).to.equal(
      ethers.utils.parseUnits("150.0", 18)
    );
    expect(await erc20TokenAlpha.balanceOf(treasury.address)).to.equal(
      ethers.utils.parseUnits("50.0", 18)
    );
  });

  it("Sends multiple ERC-20 tokens to multiple addresses using the withdraw function", async () => {
    await TreasuryWithdrawErc20Tokens(
      treasury,
      owner,
      [erc20TokenAlpha.address],
      [userA.address],
      [ethers.utils.parseUnits("20.0", 18)]
    );

    await TreasuryWithdrawErc20Tokens(
      treasury,
      owner,
      [erc20TokenAlpha.address],
      [userB.address],
      [ethers.utils.parseUnits("30.0", 18)]
    );

    await TreasuryWithdrawErc20Tokens(
      treasury,
      owner,
      [erc20TokenBravo.address],
      [userA.address],
      [ethers.utils.parseUnits("40.0", 18)]
    );

    await TreasuryWithdrawErc20Tokens(
      treasury,
      owner,
      [erc20TokenBravo.address],
      [userB.address],
      [ethers.utils.parseUnits("50.0", 18)]
    );

    expect(await erc20TokenAlpha.balanceOf(userA.address)).to.equal(
      ethers.utils.parseUnits("120.0", 18)
    );

    expect(await erc20TokenAlpha.balanceOf(userB.address)).to.equal(
      ethers.utils.parseUnits("130.0", 18)
    );

    expect(await erc20TokenAlpha.balanceOf(treasury.address)).to.equal(
      ethers.utils.parseUnits("50.0", 18)
    );

    expect(await erc20TokenBravo.balanceOf(userA.address)).to.equal(
      ethers.utils.parseUnits("140.0", 18)
    );

    expect(await erc20TokenBravo.balanceOf(userB.address)).to.equal(
      ethers.utils.parseUnits("150.0", 18)
    );

    expect(await erc20TokenBravo.balanceOf(treasury.address)).to.equal(
      ethers.utils.parseUnits("10.0", 18)
    );
  });

  it("Reverts when a non-owner attempts to withdraw ERC-20 tokens", async () => {
    await expect(
      TreasuryWithdrawErc20Tokens(
        treasury,
        userA,
        [erc20TokenBravo.address],
        [userB.address],
        [ethers.utils.parseUnits("50.0", 18)]
      )
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Reverts when the deposit function is called with inequal array lengths", async () => {
    await expect(
      TreasuryDepositErc20Tokens(
        treasury,
        owner,
        [erc20TokenAlpha.address, erc20TokenBravo.address],
        [userA.address],
        [ethers.utils.parseUnits("50.0", 18)]
      )
    ).to.be.revertedWith("ArraysNotEqual()");

    await expect(
      TreasuryDepositErc20Tokens(
        treasury,
        owner,
        [erc20TokenAlpha.address],
        [userA.address, userB.address],
        [ethers.utils.parseUnits("50.0", 18)]
      )
    ).to.be.revertedWith("ArraysNotEqual()");

    await expect(
      TreasuryDepositErc20Tokens(
        treasury,
        owner,
        [erc20TokenAlpha.address],
        [userA.address],
        [
          ethers.utils.parseUnits("50.0", 18),
          ethers.utils.parseUnits("50.0", 18),
        ]
      )
    ).to.be.revertedWith("ArraysNotEqual()");
  });

  it("Reverts when the withdraw function is called with inequal array lengths", async () => {
    await expect(
      TreasuryWithdrawErc20Tokens(
        treasury,
        owner,
        [erc20TokenAlpha.address, erc20TokenBravo.address],
        [userA.address],
        [ethers.utils.parseUnits("50.0", 18)]
      )
    ).to.be.revertedWith("ArraysNotEqual()");

    await expect(
      TreasuryWithdrawErc20Tokens(
        treasury,
        owner,
        [erc20TokenAlpha.address],
        [userA.address, userB.address],
        [ethers.utils.parseUnits("50.0", 18)]
      )
    ).to.be.revertedWith("ArraysNotEqual()");

    await expect(
      TreasuryWithdrawErc20Tokens(
        treasury,
        owner,
        [erc20TokenAlpha.address],
        [userA.address],
        [
          ethers.utils.parseUnits("50.0", 18),
          ethers.utils.parseUnits("50.0", 18),
        ]
      )
    ).to.be.revertedWith("ArraysNotEqual()");
  });
});
