# DAO





A minimum viable DAO contract



## Methods

### accessControl

```solidity
function accessControl() external view returns (contract IAccessControlDAO)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IAccessControlDAO | undefined |

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

Function for initializing the contract that can only be called once



#### Parameters

| Name | Type | Description |
|---|---|---|
| _accessControl | address | The address of the access control contract |
| _moduleFactoryBase | address | The address of the module factory |
| _name | string | Name of the Dao |

### moduleFactory

```solidity
function moduleFactory() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### name

```solidity
function name() external view returns (string)
```

Returns the module name




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | The module name |

### proxiableUUID

```solidity
function proxiableUUID() external view returns (bytes32)
```



*Implementation of the ERC1822 {proxiableUUID} function. This returns the storage slot used by the implementation. It is used to validate that the this implementation remains valid after an upgrade. IMPORTANT: A proxy pointing at a proxiable contract should not be considered proxiable itself, because this risks bricking a proxy that upgrades to it, by delegating to itself until out of gas. Thus it is critical that this function revert if invoked through a proxy. This is guaranteed by the `notDelegated` modifier.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

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

### upgradeTo

```solidity
function upgradeTo(address newImplementation) external nonpayable
```



*Upgrade the implementation of the proxy to `newImplementation`. Calls {_authorizeUpgrade}. Emits an {Upgraded} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newImplementation | address | undefined |

### upgradeToAndCall

```solidity
function upgradeToAndCall(address newImplementation, bytes data) external payable
```



*Upgrade the implementation of the proxy to `newImplementation`, and subsequently execute the function call encoded in `data`. Calls {_authorizeUpgrade}. Emits an {Upgraded} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newImplementation | address | undefined |
| data | bytes | undefined |



## Events

### AdminChanged

```solidity
event AdminChanged(address previousAdmin, address newAdmin)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousAdmin  | address | undefined |
| newAdmin  | address | undefined |

### BeaconUpgraded

```solidity
event BeaconUpgraded(address indexed beacon)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| beacon `indexed` | address | undefined |

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

### Upgraded

```solidity
event Upgraded(address indexed implementation)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| implementation `indexed` | address | undefined |



## Errors

### NotAuthorized

```solidity
error NotAuthorized()
```






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







