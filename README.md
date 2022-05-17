# Fractal

## Architecture

The DAO factory contract enables deploying new Fractal DAOs, which at their core consist of two contracts:


### DAO.sol

The DAO contract contains the minimum viable core functionality required for a DAO. Primarily, this consists of the execute function, which can be passed any arbitrary function call to be made from the DAO's behalf, assuming the caller has the correct permissions.


### AccessControl.sol

The Access Control contract contains functionality for handling all access permissions within the DAO contract, and any associated modules. Roles and admins of the roles can be assigned to addresses. These roles can then be given permissions to execute actions, which are defined by function signatures within the DAO contract, and any modules assocaited with the DAO.

## Local Setup & Testing

Clone the repository:
```shell
git clone ...
```

Lookup the recommended Node version to use in the .nvmrc file and install and use the correct version:
```shell
nvm install 
nvm use
```

Install necessary dependencies:
```shell
npm install
```

Compile contracts to create typechain files:
```shell
npm run compile
```

Run the tests
```shell
npm run test
```

## Local Hardhat deployment

To deploy the base Fractal contracts open a terminal and run:
```shell
npx hardhat node
```
This will deploy the following contracts and log the addresses they were deployed to:
 - MetaFactory
 - DAOFactory
 - TokenFactory
 - DAO Implementation
 - AccessControl Implementation

A hardhat task has been created for deploying a DAO which accepts all the necessary arguments.
The DAOFactory address and DAOImplementation address deployed in the previous step should be passed as parameters when using this task. 
It is important to note that only single quotes should be used when using this task, as double quotes are removed by the Hardhat argument parser. An example DAO deployment using this task is shown below.

```shell
npx hardhat createDAO \
  --creator "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266" \
  --dao-factory "0x5FbDB2315678afecb367f032d93F642f64180aa3" \
  --dao-implementation "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" \
  --access-control-implementation "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" \
  --dao-name "Decent DAO" \
  --roles "['EXECUTE_ROLE','UPGRADE_ROLE']" \
  --roles-admins "['DAO_ROLE','DAO_ROLE']" \
  --members "[['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266','0x70997970c51812dc3a010c7d01b50e0d17dc79c8'],['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266']]" \
  --dao-function-descs "['execute(address[],uint256[],bytes[])','upgradeTo(address)']" \
  --dao-action-roles "[['EXECUTE_ROLE'],['EXECUTE_ROLE','UPGRADE_ROLE']]" \
  --module-targets "[]" \
  --module-function-descs "[]" \
  --module-action-roles "[]" \
  --network localhost
```

If the transaction succeeds, the task console logs the address of the deployed DAO and Access Control contracts.
