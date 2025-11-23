import "../utils/GroupUtils.tact";
import "../utils/MathUtils.tact";
import "../utils/EventUtils.tact";
import "../utils/CryptoUtils.tact";
import "../messages/FactoryMessages.tact";
import "../types/GroupTypes.tact";
import "./GroupVault.tact";

/// GroupVaultFactory contract for creating and managing group vaults
contract GroupVaultFactory with GroupUtils, MathUtils, EventUtils, CryptoUtils {
    
    /// Total number of groups created
    groupCount: Int = 0;
    
    /// Factory settings
    maxGroupsPerAdmin: Int = 10;
    registrationFee: Int = ton("2");
    isActive: Bool = true;
    
    /// Factory owner (for admin operations)
    owner: Address;
    
    /// Contract initialization
    init(owner: Address) {
        self.owner = owner;
    }
    
    /// Empty receiver for deployment
    receive() {
        // Forward remaining value back to sender
        cashback(sender());
    }
    
    /// Handles registering a new group
    receive(msg: RegisterGroup) {
        // Check if factory is active
        require(self.isActive, "Factory is not active");
        
        // Validate group name
        require(self.validateGroupName(msg.groupName), "Invalid group name");
        
        // Validate admin address
        require(self.isValidAddress(msg.adminAddress), "Invalid admin address");
        
        // Check registration fee
        require(context().value >= self.registrationFee + ton("0.2"), "Insufficient registration fee");
        
        // Create GroupVault contract with new initialization pattern
        let groupVaultInit = initOf GroupVault(self.groupCount, myAddress());
        let groupVaultAddress: Address = contractAddress(groupVaultInit);

        // Deploy the GroupVault contract
        deploy(DeployParameters {
            init: groupVaultInit,
            value: ton("0.2"),
            body: UpdateGroupInitialization {
                groupHash: msg.groupHash,
                groupName: msg.groupName,
                adminAddress: msg.adminAddress
            }.toCell()
        });

        self.groupCount = self.safeAdd(self.groupCount, 1);
        
        // Emit event
        let eventData: Cell = self.createGroupCreatedData(msg.groupName, msg.adminAddress, now());
        self.emitGroupEvent(EVENT_GROUP_CREATED, groupVaultAddress, eventData);
        
        // Send excess back to sender
        if (context().value > self.registrationFee) {
            cashback(sender());
        }
    }
    
    
    /// Handles updating factory settings (owner only)
    receive(msg: UpdateFactorySettings) {
        // Only owner can update settings
        require(sender() == self.owner, "Only owner can update settings");
        
        // Update settings if provided
        if (msg.maxGroupsPerAdmin > 0) {
            self.maxGroupsPerAdmin = msg.maxGroupsPerAdmin;
        }
        if (msg.registrationFee >= 0) {
            self.registrationFee = msg.registrationFee;
        }
        
        // Emit event
        let eventData: Cell = beginCell()
            .storeUint(self.maxGroupsPerAdmin, 32)
            .storeCoins(self.registrationFee)
            .storeUint(now(), 64)
            .endCell();
        
        self.emitGroupEvent(EVENT_GROUP_CREATED, zeroAddress(), eventData); // Using 0 as group hash for factory events
    }
    
    /// Handles emergency stop (owner only)
    receive(msg: EmergencyStop) {
        // Only owner can emergency stop
        require(sender() == self.owner, "Only owner can emergency stop");
        
        self.isActive = false;
        
        // Emit event
        let eventData: Cell = beginCell()
            .storeSlice(msg.reason.asSlice())
            .storeUint(now(), 64)
            .storeAddress(sender())
            .endCell();
        
        self.emitGroupEvent(EVENT_GROUP_CREATED, zeroAddress(), eventData); // Using 0 as group hash for factory events
    }
    
    /// Handles resuming factory (owner only)
    receive(msg: ResumeFactory) {
        // Only owner can resume
        require(sender() == self.owner, "Only owner can resume factory");
        
        self.isActive = true;
        
        // Emit event
        let eventData: Cell = beginCell()
            .storeUint(now(), 64)
            .storeAddress(sender())
            .endCell();
        
        self.emitGroupEvent(EVENT_GROUP_CREATED, zeroAddress(), eventData); // Using 0 as group hash for factory events
    }
    
    /// Getter for group address by index and factory address
    get fun getGroupByIndex(groupIndex: Int): Address? {
        return contractAddress(initOf GroupVault(groupIndex, myAddress()));
    }
    
    /// Getter for factory status
    get fun getFactoryStatus(): FactoryStatusResponse {
        return FactoryStatusResponse {
            totalGroups: self.groupCount,
            isActive: self.isActive,
            registrationFee: self.registrationFee
        };
    }
    
    /// Getter for factory owner
    get fun getOwner(): Address {
        return self.owner;
    }
    
}

inline fun zeroAddress(): Address {
    return newAddress(0,0);
}