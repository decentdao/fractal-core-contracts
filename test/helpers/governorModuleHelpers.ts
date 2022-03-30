import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { VotesTokenWithSupply, GovernorModule } from "../../typechain-types";
import { BigNumber, ContractReceipt, ContractTransaction } from "ethers";

export const VoteType = {
  Against: 0,
  For: 1,
  Abstain: 2,
};

export type ProposalCreatedEvent = {
  proposalId: BigNumber;
  proposer: string;
  targets: string[];
  _values: BigNumber[];
  signatures: string[];
  calldatas: string[];
  startBlock: BigNumber;
  endBlock: BigNumber;
  description: string;
};

export async function govModPropose(
  _targets: string[],
  _values: BigNumber[],
  _DAO: GovernorModule,
  _proposer: SignerWithAddress,
  _transferCallData: string[],
  _description: string
): Promise<ProposalCreatedEvent> {
  const tx: ContractTransaction = await _DAO
    .connect(_proposer)
    .propose(_targets, _values, _transferCallData, _description);

  const receipt: ContractReceipt = await tx.wait();

  const _proposalCreatedEvent = receipt.events?.filter((x) => {
    return x.event === "ProposalCreated";
  });

  if (
    _proposalCreatedEvent === undefined ||
    _proposalCreatedEvent[0].args === undefined
  ) {
    return {
      proposalId: BigNumber.from("0"),
      proposer: "",
      targets: [""],
      _values: [BigNumber.from("0")],
      signatures: [""],
      calldatas: [""],
      startBlock: BigNumber.from("0"),
      endBlock: BigNumber.from("0"),
      description: "",
    };
  }

  return {
    proposalId: _proposalCreatedEvent[0].args[0],
    proposer: _proposalCreatedEvent[0].args[1],
    targets: _proposalCreatedEvent[0].args[2],
    _values: _proposalCreatedEvent[0].args[3],
    signatures: _proposalCreatedEvent[0].args[4],
    calldatas: _proposalCreatedEvent[0].args[5],
    startBlock: _proposalCreatedEvent[0].args[6],
    endBlock: _proposalCreatedEvent[0].args[7],
    description: _proposalCreatedEvent[0].args[8],
  };
}

export async function delegateTokens(
  governanceToken: VotesTokenWithSupply,
  voters: SignerWithAddress[]
): Promise<void> {
  for (let i = 0; i < voters.length; i++) {
    await governanceToken.connect(voters[i]).delegate(voters[i].address);
  }
}
