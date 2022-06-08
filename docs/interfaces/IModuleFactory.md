# IModuleFactory







*The interface to be inherited by Fractal module factories*

## Methods

### addVersion

```solidity
function addVersion(string _semanticVersion, string _frontendURI, address _impl) external nonpayable
```



*add a new version to update module users*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _semanticVersion | string | semantic version control |
| _frontendURI | string | IPFS hash of the static frontend |
| _impl | address | address of the impl |

### create

```solidity
function create(bytes[] data) external nonpayable returns (address[])
```



*Creates a module*

#### Parameters

| Name | Type | Description |
|---|---|---|
| data | bytes[] | The array of bytes used to create the module |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address[] | address[] Array of the created module addresses |

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

### VersionCreated

```solidity
event VersionCreated(string semanticVersion, string frontendURI, address impl)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| semanticVersion  | string | undefined |
| frontendURI  | string | undefined |
| impl  | address | undefined |



## Errors

### NotAuthorized

```solidity
error NotAuthorized()
```







