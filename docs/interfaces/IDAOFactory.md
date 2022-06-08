# IDAOFactory









## Methods

### createDAO

```solidity
function createDAO(address creator, IDAOFactory.CreateDAOParams createDAOParams) external nonpayable returns (address, address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| creator | address | undefined |
| createDAOParams | IDAOFactory.CreateDAOParams | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | address | undefined |



## Events

### DAOCreated

```solidity
event DAOCreated(address indexed daoAddress, address indexed accessControl, address indexed sender, address creator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoAddress `indexed` | address | undefined |
| accessControl `indexed` | address | undefined |
| sender `indexed` | address | undefined |
| creator  | address | undefined |



