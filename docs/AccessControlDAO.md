# AccessControlDAO



> Access Control

Use this contract for managing DAO role based permissions



## Methods

### DAO_ROLE

```solidity
function DAO_ROLE() external view returns (string)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | string The string &quot;DAO_ROLE&quot; |

### OPEN_ROLE

```solidity
function OPEN_ROLE() external view returns (string)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### actionIsAuthorized

```solidity
function actionIsAuthorized(address caller, address target, bytes4 sig) external view returns (bool isAuthorized)
```

Checks if a caller has the permissions to execute the specific action



#### Parameters

| Name | Type | Description |
|---|---|---|
| caller | address | Address attempting to execute the action |
| target | address | Contract address corresponding to the action |
| sig | bytes4 | The function signature used to define the action |

#### Returns

| Name | Type | Description |
|---|---|---|
| isAuthorized | bool | undefined |

### addActionsRoles

```solidity
function addActionsRoles(address[] targets, string[] functionDescs, string[][] roles) external nonpayable
```

Authorizes roles to execute the specified actions



#### Parameters

| Name | Type | Description |
|---|---|---|
| targets | address[] | The contract addresses that the action functions are implemented on |
| functionDescs | string[] | The function descriptions used to define the actions |
| roles | string[][] | Roles being granted permission for an action |

### getActionRoles

```solidity
function getActionRoles(address target, string functionDesc) external view returns (string[] roles)
```

Returns the roles autorized to execute the specified action



#### Parameters

| Name | Type | Description |
|---|---|---|
| target | address | Contract address corresponding to the action |
| functionDesc | string | The function description used to define the action |

#### Returns

| Name | Type | Description |
|---|---|---|
| roles | string[] | undefined |

### getRoleAdmin

```solidity
function getRoleAdmin(string role) external view returns (string)
```

Returns the role that is the admin of the specified role



#### Parameters

| Name | Type | Description |
|---|---|---|
| role | string | Role that the admin role is being returned for |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | string The admin role of the specified role |

### grantRole

```solidity
function grantRole(string role, address account) external nonpayable
```

Grants a role to the specified address



#### Parameters

| Name | Type | Description |
|---|---|---|
| role | string | The role being granted |
| account | address | The address being granted the specified role |

### grantRoles

```solidity
function grantRoles(string[] roles, address[][] members) external nonpayable
```

Grants roles to the specified addresses



#### Parameters

| Name | Type | Description |
|---|---|---|
| roles | string[] | The roles being granted |
| members | address[][] | Addresses being granted each specified role |

### grantRolesAndAdmins

```solidity
function grantRolesAndAdmins(string[] roles, string[] roleAdmins, address[][] members) external nonpayable
```

Grants roles to the specified addresses and defines admin roles



#### Parameters

| Name | Type | Description |
|---|---|---|
| roles | string[] | The roles being granted |
| roleAdmins | string[] | The roles being granted as admins of the specified of roles |
| members | address[][] | Addresses being granted each specified role |

### hasRole

```solidity
function hasRole(string role, address account) external view returns (bool)
```

Returns whether the account has been granted the role



#### Parameters

| Name | Type | Description |
|---|---|---|
| role | string | Role that authorization is being checked on |
| account | address | Address that the role authorization is being check on |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | boolean Indicates whether the address has been granted the role |

### initialize

```solidity
function initialize(address dao, string[] roles, string[] roleAdmins, address[][] members, address[] targets, string[] functionDescs, string[][] actionRoles) external nonpayable
```

Initialize DAO action and role permissions



#### Parameters

| Name | Type | Description |
|---|---|---|
| dao | address | Address to receive DAO role |
| roles | string[] | What permissions are assigned to |
| roleAdmins | string[] | Roles which have the ability to remove or add members |
| members | address[][] | Addresses to be granted the specified roles |
| targets | address[] | Contract addresses for actions to be defined on |
| functionDescs | string[] | Function descriptions used to define actions |
| actionRoles | string[][] | Roles being granted permission for an action |

### isRoleAuthorized

```solidity
function isRoleAuthorized(string role, address target, string functionDesc) external view returns (bool isAuthorized)
```

Checks if a specific role is authorized for an action



#### Parameters

| Name | Type | Description |
|---|---|---|
| role | string | Role that authorization is being checked on |
| target | address | Contract address corresponding to the action |
| functionDesc | string | Function description used to define the action |

#### Returns

| Name | Type | Description |
|---|---|---|
| isAuthorized | bool | Indicates whether the role is authorized to execute the action |

### proxiableUUID

```solidity
function proxiableUUID() external view returns (bytes32)
```



*Implementation of the ERC1822 {proxiableUUID} function. This returns the storage slot used by the implementation. It is used to validate that the this implementation remains valid after an upgrade. IMPORTANT: A proxy pointing at a proxiable contract should not be considered proxiable itself, because this risks bricking a proxy that upgrades to it, by delegating to itself until out of gas. Thus it is critical that this function revert if invoked through a proxy. This is guaranteed by the `notDelegated` modifier.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### removeActionsRoles

```solidity
function removeActionsRoles(address[] targets, string[] functionDescs, string[][] roles) external nonpayable
```

Removes autorization for roles to execute the specified actions



#### Parameters

| Name | Type | Description |
|---|---|---|
| targets | address[] | The contract addresses that the action functions are implemented on |
| functionDescs | string[] | The function description used to define the actions |
| roles | string[][] | Roles that action permissions are being removed on |

### renounceRole

```solidity
function renounceRole(string role, address account) external nonpayable
```

Enables an address to remove one of its own roles



#### Parameters

| Name | Type | Description |
|---|---|---|
| role | string | The role being renounced |
| account | address | The address renouncing the role |

### revokeRole

```solidity
function revokeRole(string role, address account) external nonpayable
```

Revokes a role from the specified address



#### Parameters

| Name | Type | Description |
|---|---|---|
| role | string | The role being revoked |
| account | address | The address the role is being revoked from |

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

### ActionRoleAdded

```solidity
event ActionRoleAdded(address target, string functionDesc, bytes4 encodedSig, string role)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| target  | address | undefined |
| functionDesc  | string | undefined |
| encodedSig  | bytes4 | undefined |
| role  | string | undefined |

### ActionRoleRemoved

```solidity
event ActionRoleRemoved(address target, string functionDesc, bytes4 encodedSig, string role)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| target  | address | undefined |
| functionDesc  | string | undefined |
| encodedSig  | bytes4 | undefined |
| role  | string | undefined |

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

### RoleAdminChanged

```solidity
event RoleAdminChanged(string role, string previousAdminRole, string adminRole)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role  | string | undefined |
| previousAdminRole  | string | undefined |
| adminRole  | string | undefined |

### RoleGranted

```solidity
event RoleGranted(string role, address account, address admin)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role  | string | undefined |
| account  | address | undefined |
| admin  | address | undefined |

### RoleRevoked

```solidity
event RoleRevoked(string role, address account, address admin)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role  | string | undefined |
| account  | address | undefined |
| admin  | address | undefined |

### Upgraded

```solidity
event Upgraded(address indexed implementation)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| implementation `indexed` | address | undefined |



## Errors

### MissingRole

```solidity
error MissingRole(address account, string role)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |
| role | string | undefined |

### OnlySelfRenounce

```solidity
error OnlySelfRenounce()
```






### UnequalArrayLengths

```solidity
error UnequalArrayLengths()
```







