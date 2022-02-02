# Fractal

## Governance

The DAO factory contract supports deploying new DAO instances via three external functions:
  1) createDaoAndToken - Creates both a DAO and a new ERC-20 governance token that supports voting
  2) createDaoWrapToken - Creates a DAO and wraps an existing ERC-20 token with a new ERC-20 token which supports voting
  3) createDaoBringToken - Creates a DAO with an existing ERC-20 token that already supports voting

Governance is handled via the MyGovernor contract which is extended by OpenZepplin governance modules.
- Currently the DAO supports
-- ERC-20 token weighted voting
-- Fractionalized quorum - percentage of token total supply required for a successful proposal
-- Voting delay - The number of blocks between when a proposal is created and voting begins
-- Voting periods - The number of blocks between when voting starts and ends
-- Proposal threshold - The number of votes required for a voter to become a proposer
-- Timelock Controller - Adds a delay in blocks between when a successful proposal is queued and when it can be executed

Note: When using a timelock, it is the timelock that will execute proposals and thus the timelock that should hold any funds, ownership, and access control roles. Funds in the Governor contract are not currently retrievable when using a timelock! (As of version 4.3 there is a caveat when using the Compound Timelock: ETH in the timelock is not easily usable, so it is recommended to manage ERC20 funds only in this combination until a future version resolves the issue.)

## Local Setup & Testing

1) Clone the repository:
```shell
git clone ...
```

2) Lookup the recommended Node version to use in the .nvmrc file (currently 16.13.2), and install and use the correct version:
```shell
nvm install 16.13.2
nvm use 16.13.2
```

3) Install necessary dependencies:
```shell
npm install
```

4) Compile contracts to create typechain files:
```shell
npm run compile
```

5) Run the tests
```shell
npm run test
```

## Deployment

Local Hardhat DAO Factory Deployment Process 
Deploy DAO Factory:
```shell
npx hardhat run scripts/deploy.ts
```

## References
- https://docs.openzeppelin.com/contracts/4.x/api/governance
