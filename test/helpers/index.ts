import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TreasuryModule, TreasuryModuleFactory } from "../../typechain-types";
import { BigNumber, ContractReceipt, ContractTransaction, utils } from "ethers";
import { ethers } from "hardhat";

export type TreasuryEthDepositedEvent = {
  sender: string;
  amount: BigNumber;
};

export type TreasuryEthWithdrawnEvent = {
  recipients: string[];
  amounts: BigNumber[];
};

export type TreasuryERC20TokensDepositedEvent = {
  tokenAddresses: string[];
  senders: string[];
  amounts: BigNumber[];
};

export type TreasuryERC20TokensWithdrawnEvent = {
  tokenAddresses: string[];
  recipients: string[];
  amounts: BigNumber[];
};

export type TreasuryERC721TokensDepositedEvent = {
  tokenAddresses: string[];
  senders: string[];
  tokenIds: BigNumber[];
};

export type TreasuryERC721TokensWithdrawnEvent = {
  tokenAddresses: string[];
  recipients: string[];
  tokenIds: BigNumber[];
};

export async function createTreasuryFromFactory(
  caller: SignerWithAddress,
  treasuryFactory: TreasuryModuleFactory,
  accessControlAddress: string,
  treasuryImplementationAddress: string
): Promise<string> {
  const abiCoder = new ethers.utils.AbiCoder();

  const data = [
    abiCoder.encode(["address"], [accessControlAddress]),
    abiCoder.encode(["address"], [treasuryImplementationAddress]),
  ];

  const tx: ContractTransaction = await treasuryFactory
    .connect(caller)
    .create(data);

  const receipt: ContractReceipt = await tx.wait();

  const treasuryCreatedEvent = receipt.events?.filter((x) => {
    return x.event === "TreasuryCreated";
  });

  if (
    treasuryCreatedEvent === undefined ||
    treasuryCreatedEvent[0].args === undefined
  ) {
    return "";
  } else {
    return treasuryCreatedEvent[0].args.treasuryAddress;
  }
}

export async function TreasuryDepositEth(
  _treasury: TreasuryModule,
  _sender: SignerWithAddress,
  _amount: BigNumber
): Promise<TreasuryEthDepositedEvent> {
  const tx: ContractTransaction = await _sender.sendTransaction({
    to: _treasury.address,
    value: _amount,
  });

  const receipt: ContractReceipt = await tx.wait();

  const depositEvent = receipt.events?.filter((x) => {
    return x.event === "EthDeposited";
  });

  if (depositEvent === undefined || depositEvent[0].args === undefined) {
    return {
      sender: "",
      amount: BigNumber.from("0"),
    };
  }
  return {
    sender: depositEvent[0].args[0],
    amount: depositEvent[0].args[1],
  };
}

export async function TreasuryWithdrawEth(
  _treasury: TreasuryModule,
  _caller: SignerWithAddress,
  _recipients: string[],
  _amounts: BigNumber[]
): Promise<TreasuryEthWithdrawnEvent> {
  const tx: ContractTransaction = await _treasury
    .connect(_caller)
    .withdrawEth(_recipients, _amounts);

  const receipt: ContractReceipt = await tx.wait();

  const withdrawEvent = receipt.events?.filter((x) => {
    return x.event === "EthWithdrawn";
  });

  if (withdrawEvent === undefined || withdrawEvent[0].args === undefined) {
    return {
      recipients: [""],
      amounts: [BigNumber.from("0")],
    };
  }
  return {
    recipients: withdrawEvent[0].args[0],
    amounts: withdrawEvent[0].args[1],
  };
}

export async function TreasuryDepositERC20Tokens(
  _treasury: TreasuryModule,
  _caller: SignerWithAddress,
  _tokenAddresses: string[],
  _senders: string[],
  _amounts: BigNumber[]
): Promise<TreasuryERC20TokensDepositedEvent> {
  const tx: ContractTransaction = await _treasury
    .connect(_caller)
    .depositERC20Tokens(_tokenAddresses, _senders, _amounts);

  const receipt: ContractReceipt = await tx.wait();

  const depositEvent = receipt.events?.filter((x) => {
    return x.event === "ERC20TokensDeposited";
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

export async function TreasuryWithdrawERC20Tokens(
  _treasury: TreasuryModule,
  _caller: SignerWithAddress,
  _tokenAddresses: string[],
  _recipients: string[],
  _amounts: BigNumber[]
): Promise<TreasuryERC20TokensWithdrawnEvent> {
  const tx: ContractTransaction = await _treasury
    .connect(_caller)
    .withdrawERC20Tokens(_tokenAddresses, _recipients, _amounts);

  const receipt: ContractReceipt = await tx.wait();

  const withdrawEvent = receipt.events?.filter((x) => {
    return x.event === "ERC20TokensWithdrawn";
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

export async function TreasuryDepositERC721Tokens(
  _treasury: TreasuryModule,
  _caller: SignerWithAddress,
  _tokenAddresses: string[],
  _senders: string[],
  _tokenIds: BigNumber[]
): Promise<TreasuryERC721TokensDepositedEvent> {
  const tx: ContractTransaction = await _treasury
    .connect(_caller)
    .depositERC721Tokens(_tokenAddresses, _senders, _tokenIds);

  const receipt: ContractReceipt = await tx.wait();

  const depositEvent = receipt.events?.filter((x) => {
    return x.event === "ERC721TokensDeposited";
  });

  if (depositEvent === undefined || depositEvent[0].args === undefined) {
    return {
      tokenAddresses: [""],
      senders: [""],
      tokenIds: [BigNumber.from("0")],
    };
  }
  return {
    tokenAddresses: depositEvent[0].args[0],
    senders: depositEvent[0].args[1],
    tokenIds: depositEvent[0].args[2],
  };
}

export async function TreasuryWithdrawERC721Tokens(
  _treasury: TreasuryModule,
  _caller: SignerWithAddress,
  _tokenAddresses: string[],
  _recipients: string[],
  _tokenIds: BigNumber[]
): Promise<TreasuryERC721TokensWithdrawnEvent> {
  const tx: ContractTransaction = await _treasury
    .connect(_caller)
    .withdrawERC721Tokens(_tokenAddresses, _recipients, _tokenIds);

  const receipt: ContractReceipt = await tx.wait();

  const withdrawEvent = receipt.events?.filter((x) => {
    return x.event === "ERC721TokensWithdrawn";
  });

  if (withdrawEvent === undefined || withdrawEvent[0].args === undefined) {
    return {
      tokenAddresses: [""],
      recipients: [""],
      tokenIds: [BigNumber.from("0")],
    };
  }
  return {
    tokenAddresses: withdrawEvent[0].args[0],
    recipients: withdrawEvent[0].args[1],
    tokenIds: withdrawEvent[0].args[2],
  };
}
