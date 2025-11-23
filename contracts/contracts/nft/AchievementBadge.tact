/// Achievement Badge NFT Contract
/// Mints unique NFT badges for member achievements in TON Circle
/// Follows TEP-62 NFT Standard

import "../utils/GroupUtils.tact";
import "../utils/MathUtils.tact";

/// Badge types
const BADGE_FIRST_CONTRIBUTION: Int = 1;
const BADGE_ACTIVE_MEMBER: Int = 2; // 10+ contributions
const BADGE_SUPER_CONTRIBUTOR: Int = 3; // 50+ contributions
const BADGE_TRUSTED_MEMBER: Int = 4; // Reputation 100+
const BADGE_SOCIAL_BUTTERFLY: Int = 5; // 5+ groups
const BADGE_WHALE: Int = 6; // 100+ TON contributed
const BADGE_GOAL_ACHIEVER: Int = 7; // Completed 5+ goals
const BADGE_DEBT_FREE: Int = 8; // No pending debts for 30+ days
const BADGE_FOUNDER: Int = 9; // Created a group
const BADGE_EARLY_ADOPTER: Int = 10; // One of first 100 users

/// Badge rarity levels
const RARITY_COMMON: Int = 1;
const RARITY_UNCOMMON: Int = 2;
const RARITY_RARE: Int = 3;
const RARITY_EPIC: Int = 4;
const RARITY_LEGENDARY: Int = 5;

/// Badge metadata
struct BadgeMetadata {
    badgeType: Int;
    badgeName: String;
    description: String;
    rarity: Int;
    imageUrl: String;
    earnedAt: Int;
    earnedBy: Address;
    groupAddress: Address?; // Group where it was earned (if applicable)
}

/// NFT Transfer message (TEP-62)
message(0x5fcc3d14) Transfer {
    queryId: Int as uint64;
    newOwner: Address;
    responseDestination: Address;
    customPayload: Cell?;
    forwardAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

/// Get static data message
message(0x2fcb26a2) GetStaticData {
    queryId: Int as uint64;
}

/// Report static data message
message(0x8b771735) ReportStaticData {
    queryId: Int as uint64;
    index: Int;
    collection: Address;
}

/// NFT Collection contract address (will be deployed separately)
contract AchievementBadgeCollection {
    collectionOwner: Address;
    nextItemIndex: Int = 0;
    collectionContent: Cell; // Metadata URI

    init(owner: Address, content: Cell) {
        self.collectionOwner = owner;
        self.collectionContent = content;
    }

    /// Mint new badge NFT
    receive(msg: MintBadge) {
        // Only authorized minters can mint
        require(sender() == self.collectionOwner || self.isAuthorizedMinter(sender()), "Unauthorized minter");

        let nftInit: StateInit = self.getNftInit(self.nextItemIndex);
        let nftAddress: Address = contractAddress(nftInit);

        // Deploy NFT item
        send(SendParameters{
            to: nftAddress,
            value: 0,
            mode: SendRemainingValue,
            bounce: true,
            body: msg.toCell(),
            code: nftInit.code,
            data: nftInit.data
        });

        self.nextItemIndex = self.nextItemIndex + 1;
    }

    /// Get NFT address by index
    get fun getNftAddressByIndex(index: Int): Address {
        let nftInit: StateInit = self.getNftInit(index);
        return contractAddress(nftInit);
    }

    /// Get collection data
    get fun getCollectionData(): CollectionData {
        return CollectionData {
            nextItemIndex: self.nextItemIndex,
            collectionContent: self.collectionContent,
            ownerAddress: self.collectionOwner
        };
    }

    /// Helper: Get NFT init
    fun getNftInit(index: Int): StateInit {
        return initOf AchievementBadgeItem(myAddress(), index);
    }

    /// Helper: Check if address is authorized minter
    fun isAuthorizedMinter(addr: Address): Bool {
        // GroupVault contracts can mint badges
        // This would check a mapping of authorized contracts
        return true; // Simplified for now
    }
}

/// Individual NFT badge item
contract AchievementBadgeItem with GroupUtils, MathUtils {
    collection: Address;
    itemIndex: Int;
    owner: Address?;
    individualContent: Cell?;
    badgeMetadata: BadgeMetadata?;
    isInitialized: Bool = false;

    init(collection: Address, itemIndex: Int) {
        self.collection = collection;
        self.itemIndex = itemIndex;
        self.owner = null;
    }

    /// Initialize badge with metadata (called during minting)
    receive(msg: MintBadge) {
        require(!self.isInitialized, "Already initialized");
        require(sender() == self.collection, "Only collection can initialize");

        self.owner = msg.owner;
        self.badgeMetadata = msg.metadata;
        self.individualContent = msg.content;
        self.isInitialized = true;

        // Notify owner of new badge
        self.notifyOwner(msg.owner, "New badge earned!");
    }

    /// Transfer NFT to new owner
    receive(msg: Transfer) {
        require(self.isInitialized, "Not initialized");
        require(sender() == self.owner!!, "Only owner can transfer");

        self.owner = msg.newOwner;

        // Send excess back
        send(SendParameters{
            to: msg.responseDestination,
            value: 0,
            mode: SendRemainingValue,
            body: Excesses { queryId: msg.queryId }.toCell()
        });

        // Forward notification if requested
        if (msg.forwardAmount > 0) {
            send(SendParameters{
                to: msg.newOwner,
                value: msg.forwardAmount,
                mode: SendPayGasSeparately,
                body: OwnershipAssigned {
                    queryId: msg.queryId,
                    prevOwner: sender(),
                    forwardPayload: msg.forwardPayload
                }.toCell()
            });
        }
    }

    /// Get NFT data
    receive(msg: GetStaticData) {
        send(SendParameters{
            to: sender(),
            value: 0,
            mode: SendRemainingValue,
            body: ReportStaticData {
                queryId: msg.queryId,
                index: self.itemIndex,
                collection: self.collection
            }.toCell()
        });
    }

    /// Get NFT data getter
    get fun getNftData(): NftData {
        return NftData {
            isInitialized: self.isInitialized,
            index: self.itemIndex,
            collectionAddress: self.collection,
            ownerAddress: self.owner,
            individualContent: self.individualContent
        };
    }

    /// Get badge metadata
    get fun getBadgeMetadata(): BadgeMetadata? {
        return self.badgeMetadata;
    }

    /// Get badge rarity name
    get fun getRarityName(): String {
        if (self.badgeMetadata == null) {
            return "Unknown";
        }

        let rarity: Int = self.badgeMetadata!!.rarity;
        if (rarity == RARITY_LEGENDARY) { return "Legendary"; }
        if (rarity == RARITY_EPIC) { return "Epic"; }
        if (rarity == RARITY_RARE) { return "Rare"; }
        if (rarity == RARITY_UNCOMMON) { return "Uncommon"; }
        return "Common";
    }
}

/// Supporting structures

struct CollectionData {
    nextItemIndex: Int;
    collectionContent: Cell;
    ownerAddress: Address;
}

struct NftData {
    isInitialized: Bool;
    index: Int;
    collectionAddress: Address;
    ownerAddress: Address?;
    individualContent: Cell?;
}

/// Messages

message MintBadge {
    queryId: Int as uint64;
    owner: Address;
    metadata: BadgeMetadata;
    content: Cell;
}

message Excesses {
    queryId: Int as uint64;
}

message OwnershipAssigned {
    queryId: Int as uint64;
    prevOwner: Address;
    forwardPayload: Slice as remaining;
}

/// Helper: Get badge metadata by type
fun getBadgeInfo(badgeType: Int): BadgeMetadata {
    let metadata: BadgeMetadata = BadgeMetadata {
        badgeType: badgeType,
        badgeName: "",
        description: "",
        rarity: RARITY_COMMON,
        imageUrl: "",
        earnedAt: now(),
        earnedBy: myAddress(),
        groupAddress: null
    };

    if (badgeType == BADGE_FIRST_CONTRIBUTION) {
        metadata.badgeName = "First Contribution";
        metadata.description = "Made your first contribution to a TON Circle group";
        metadata.rarity = RARITY_COMMON;
        metadata.imageUrl = "ipfs://badge_first_contribution.png";
    } else if (badgeType == BADGE_ACTIVE_MEMBER) {
        metadata.badgeName = "Active Member";
        metadata.description = "Contributed to 10+ group activities";
        metadata.rarity = RARITY_UNCOMMON;
        metadata.imageUrl = "ipfs://badge_active_member.png";
    } else if (badgeType == BADGE_SUPER_CONTRIBUTOR) {
        metadata.badgeName = "Super Contributor";
        metadata.description = "Contributed to 50+ group activities";
        metadata.rarity = RARITY_RARE;
        metadata.imageUrl = "ipfs://badge_super_contributor.png";
    } else if (badgeType == BADGE_TRUSTED_MEMBER) {
        metadata.badgeName = "Trusted Member";
        metadata.description = "Achieved reputation score of 100+";
        metadata.rarity = RARITY_EPIC;
        metadata.imageUrl = "ipfs://badge_trusted_member.png";
    } else if (badgeType == BADGE_SOCIAL_BUTTERFLY) {
        metadata.badgeName = "Social Butterfly";
        metadata.description = "Active in 5+ different groups";
        metadata.rarity = RARITY_RARE;
        metadata.imageUrl = "ipfs://badge_social_butterfly.png";
    } else if (badgeType == BADGE_WHALE) {
        metadata.badgeName = "Whale";
        metadata.description = "Contributed 100+ TON across all groups";
        metadata.rarity = RARITY_LEGENDARY;
        metadata.imageUrl = "ipfs://badge_whale.png";
    } else if (badgeType == BADGE_FOUNDER) {
        metadata.badgeName = "Group Founder";
        metadata.description = "Created a TON Circle group";
        metadata.rarity = RARITY_UNCOMMON;
        metadata.imageUrl = "ipfs://badge_founder.png";
    }

    return metadata;
}
