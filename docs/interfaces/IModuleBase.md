# IModuleBase









## Methods

### accessControl

```solidity
function accessControl() external view returns (contract IAccessControlDAO)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IAccessControlDAO | IAccessControlDAO The Access control interface |

### name

```solidity
function name() external view returns (string)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | string The string &quot;Name&quot; |

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




## Errors

### NotAuthorized

```solidity
error NotAuthorized()
```







