# DAOFactory





A factory contract for deploying DAOs with an access control contract



## Methods

### createDAO

```solidity
function createDAO(address creator, IDAOFactory.CreateDAOParams createDAOParams) external nonpayable returns (address dao, address accessControl)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| creator | address | undefined |
| createDAOParams | IDAOFactory.CreateDAOParams | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| dao | address | undefined |
| accessControl | address | undefined |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```

Returns whether a given interface ID is supported



#### Parameters

| Name | Type | Description |
|---|---|---|
| interfaceId | bytes4 | An interface ID bytes4 as defined by ERC-165 |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | bool Indicates whether the interface is supported |



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



