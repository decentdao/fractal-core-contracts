import { Treasury } from "../typechain";
import { BigNumber, ContractReceipt, ContractTransaction } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export type TreasuryErc20TokensDepositedEvent = {
  tokenAddresses: string[];
  senders: string[];
  amounts: BigNumber[];
};

export type TreasuryErc20TokensWithdrawnEvent = {
  tokenAddresses: string[];
  recipients: string[];
  amounts: BigNumber[];
};

export async function TreasuryDepositErc20Tokens(
  _treasury: Treasury,
  _caller: SignerWithAddress,
  _tokenAddresses: string[],
  _senders: string[],
  _amounts: BigNumber[]
): Promise<TreasuryErc20TokensDepositedEvent> {
  const tx: ContractTransaction = await _treasury
    .connect(_caller)
    .depositErc20Tokens(_tokenAddresses, _senders, _amounts);

  const receipt: ContractReceipt = await tx.wait();

  const depositEvent = receipt.events?.filter((x) => {
    return x.event === "Erc20TokensDeposited";
  });

  if (depositEvent === undefined || depositEvent[0].args === undefined) {
    return {
      tokenAddresses: [""],
      senders: [""],
      amounts: [BigNumber.from("0")],
    };
  }
  return {
    tokenAddresses: depositEvent[0].args[0],
    senders: depositEvent[0].args[1],
    amounts: depositEvent[0].args[2],
  };
}

export async function TreasuryWithdrawErc20Tokens(
  _treasury: Treasury,
  _caller: SignerWithAddress,
  _tokenAddresses: string[],
  _recipients: string[],
  _amounts: BigNumber[]
): Promise<TreasuryErc20TokensWithdrawnEvent> {
  const tx: ContractTransaction = await _treasury
    .connect(_caller)
    .withdrawErc20Tokens(_tokenAddresses, _recipients, _amounts);

  const receipt: ContractReceipt = await tx.wait();

  const withdrawEvent = receipt.events?.filter((x) => {
    return x.event === "Erc20TokensWithdrawn";
  });

  if (withdrawEvent === undefined || withdrawEvent[0].args === undefined) {
    return {
      tokenAddresses: [""],
      recipients: [""],
      amounts: [BigNumber.from("0")],
    };
  }
  return {
    tokenAddresses: withdrawEvent[0].args[0],
    recipients: withdrawEvent[0].args[1],
    amounts: withdrawEvent[0].args[2],
  };
}
