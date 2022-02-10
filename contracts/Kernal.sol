// pragma solidity ^0.8.0;

// import "./ACL.sol";


// contract Kernel {
//     bytes32 public constant APP_MANAGER_ROLE = keccak256("APP_MANAGER_ROLE");
//     bytes32 internal constant KERNEL_DEFAULT_ACL_APP_ID = keccak256("KERNEL_DEFAULT_ACL_APP_ID");

//     string private constant ERROR_APP_NOT_CONTRACT = "KERNEL_APP_NOT_CONTRACT";
//     string private constant ERROR_INVALID_APP_CHANGE = "KERNEL_INVALID_APP_CHANGE";
//     string private constant ERROR_AUTH_FAILED = "KERNEL_AUTH_FAILED";

//      // app id => address
//     mapping (bytes32 => address) public apps;

//     /**
//     * @dev Initialize can only be called once. It saves the block number in which it was initialized.
//     * @notice Initialize this kernel instance along with its ACL and set `_permissionsCreator` as the entity that can create other permissions
//     */

//     constructor() {
//         address aclAddress = address(new ACL());    
//         _setAppIfNew(KERNEL_DEFAULT_ACL_APP_ID, aclAddress);
//     }

//     /**
//     * @dev Create a new instance of an app linked to this kernel and set its base
//     *      implementation if it was not already set
//     * @notice Create a new upgradeable instance of `_appId` app linked to the Kernel, setting its code to `_appBase`. `_setDefault ? 'Also sets it as the default app instance.':''`
//     * @param _appId Identifier for app
//     * @param _appBase Address of the app's base implementation
//     * @param _initializePayload Payload for call made by the proxy during its construction to initialize
//     *        Useful when the Kernel needs to know of an instance of a particular app,
//     *        like Vault for escape hatch mechanism.
//     * @return AppProxy instance
//     */
//     function newAppInstancePayload(bytes32 _appId, address _appBase, bytes _initializePayload, bytes32 _newRole, bytes32 _roleAdmin, address _manager)
//         public
//         returns (address)
//     {
//         _setAppIfNew(_appId, _appBase);
//         acl().createPermission(_newRole, _roleAdmin, _manager);
//         //todo:create function for new app proxy
//         //todo:module factory
//         //todo:pass in function to call
//         address appCode = getApp(_appId);

//         // If initialize payload is provided, it will be executed
//         if (_initializePayload.length > 0) {
//             require(isContract(appCode));
//             // Cannot make delegatecall as a delegateproxy.delegatedFwd as it
//             // returns ending execution context and halts contract deployment
//             require(appCode.delegatecall(_initializePayload));
//         }
//         appProxy = newAppProxy(this, _appId, _initializePayload);
//     }
    
//     /**
//     * @dev Get the address of an app instance or base implementation
//     * @param _appId Identifier for app
//     * @return Address of the app
//     */
//     function getApp(bytes32 _appId) public view returns (address) {
//         return apps[_appId];
//     }

//     /**
//     * @dev Get the installed ACL app
//     * @return ACL app
//     */
//     function acl() public view returns (ACL) {
//         return ACL(getApp(KERNEL_DEFAULT_ACL_APP_ID));
//     }

//     // todo: check if contract - Address.sol
//     function _setApp(bytes32 _appId, address _app) internal {
//         require(isContract(_app), ERROR_APP_NOT_CONTRACT);
//         apps[_appId] = _app;
//         emit SetApp(_appId, _app);
//     }

//     function _setAppIfNew(bytes32 _appId, address _app) internal {
//         address app = getApp(_appId);
//         if (app != address(0)) {
//             // The only way to set an app is if it passes the isContract check, so no need to check it again
//             require(app == _app, ERROR_INVALID_APP_CHANGE);
//         } else {
//             _setApp(_appId, _app);
//         }
//     }
// }