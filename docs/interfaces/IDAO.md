# IDAO









## Methods

### execute

```solidity
function execute(address[] targets, uint256[] values, bytes[] calldatas) external nonpayable
```

A function for executing function calls from the DAO



#### Parameters

| Name | Type | Description |
|---|---|---|
| targets | address[] | An array of addresses to target for the function calls |
| values | uint256[] | An array of ether values to send with the function calls |
| calldatas | bytes[] | An array of bytes defining the function calls |

### initialize

```solidity
function initialize(address _accessControl, address _moduleFactoryBase, string _name) external nonpayable
```

Function for initializing the Dao



#### Parameters

| Name | Type | Description |
|---|---|---|
| _accessControl | address | The address of the access control contract |
| _moduleFactoryBase | address | The address of the module factory |
| _name | string | Name of the Dao |



## Events

### Executed

```solidity
event Executed(address[] targets, uint256[] values, bytes[] calldatas)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| targets  | address[] | undefined |
| values  | uint256[] | undefined |
| calldatas  | bytes[] | undefined |



## Errors

### Unauthorized

```solidity
error Unauthorized(bytes32 role, address account)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### UnequalArrayLengths

```solidity
error UnequalArrayLengths()
```







