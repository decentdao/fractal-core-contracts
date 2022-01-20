# Governance

```shell
Governance is handled via the Gov Contract and extended by the openzepplin modules.
- Currently the dao supports 
-- erc20 weighted voting
-- fractionalized quorum
-- vote delays, voting periods, min proposal threshold(vote power)
- timelock controller -  This allows users to exit the system if they disagree with a decision before it is executed. We will use OpenZeppelin’s TimelockController in combination with the GovernorTimelockControl module.

When using a timelock, it is the timelock that will execute proposals and thus the timelock that should hold any funds, ownership, and access control roles. Funds in the Governor contract are not currently retrievable when using a timelock! (As of version 4.3 there is a caveat when using the Compound Timelock: ETH in the timelock is not easily usable, so it is recommended to manage ERC20 funds only in this combination until a future version resolves the issue.)

references
- https://docs.openzeppelin.com/contracts/4.x/governance#timelock

Deployment Process 
- Deploy Token and TimelockController
- Deploy Governance DAO w/ token and timelockcontroller addresses as param
- Set up timelock controller permissions
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/sample-script.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

# Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).
