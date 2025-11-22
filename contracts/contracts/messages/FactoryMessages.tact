/// Message for registering a new group
message(0x1001) RegisterGroup {
    groupName: String;
    groupHash: Int;
    adminAddress: Address;
}

/// Message for getting group information by hash
message(0x1002) GetGroupByHash {
    groupHash: Int;
}

/// Message for getting all groups
message(0x1003) GetAllGroups {}

/// Message for getting groups by admin
message(0x1004) GetGroupsByAdmin {
    adminAddress: Address;
}

/// Message for updating factory settings (admin only)
message(0x1005) UpdateFactorySettings {
    maxGroupsPerAdmin: Int;
    registrationFee: Int;
}

/// Message for factory emergency stop (admin only)
message(0x1006) EmergencyStop {
    reason: String;
}

/// Message for factory resume (admin only)
message(0x1007) ResumeFactory {}

/// Response message for group information
message(0x1081) GroupInfoResponse {
    groupHash: Int;
    groupVaultAddress: Address;
    groupName: String;
    adminAddress: Address;
    createdAt: Int;
    isActive: Bool;
}

/// Response message for multiple groups
message(0x1082) GroupsListResponse {
    groupHashes: Cell; // Cell containing array of Int hashes
    groupAddresses: Cell; // Cell containing array of Address
    groupNames: Cell; // Cell containing array of String
}

/// Response message for factory status
message(0x1083) FactoryStatusResponse {
    totalGroups: Int;
    isActive: Bool;
    registrationFee: Int;
}