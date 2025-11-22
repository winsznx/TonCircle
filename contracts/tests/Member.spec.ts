import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address, beginCell } from '@ton/core';
import { Member } from '../build/Member/Member_Member';
import { GroupVault } from '../build/GroupVault/GroupVault_GroupVault';
import '@ton/test-utils';

describe('Member', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let admin: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let member: SandboxContract<Member>;
    let groupVault: SandboxContract<GroupVault>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        
        deployer = await blockchain.treasury('deployer');
        admin = await blockchain.treasury('admin');
        user = await blockchain.treasury('user');

        // Create a mock GroupVault for testing
        groupVault = blockchain.openContract(
            await GroupVault.fromInit(0n, deployer.address)
        );

        await groupVault.send(
            admin.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'UpdateGroupInitialization',
                groupHash: BigInt('12345678901234567890123456789012345678901234567890123456789012345678901234567890'),
                groupName: "Test Group",
                adminAddress: admin.address
            },
        );

        // Deploy Member contract
        const memberIndex = 0n;
        member = blockchain.openContract(
            await Member.fromInit(
                memberIndex,
                groupVault.address
            )
        );

        const deployResult = await member.send(
            user.getSender(),
            {
                value: toNano('0.05'),
            },
            null,
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: user.address,
            to: member.address,
            deploy: true,
            success: true,
        });

        // Initialize member information via group vault
        await member.send(
            admin.getSender(), // Use admin as sender for group vault operations
            {
                value: toNano('0.02'),
            },
            {
                $$type: 'UpdateMemberInitialization',
                memberAddress: user.address,
                joinedAt: BigInt(Math.floor(Date.now() / 1000)),
                initialReputationScore: 50n
            }
        );
    });

    describe('Deployment and Initialization', () => {
        it('should deploy successfully with correct initial state', async () => {
            const memberAddress = await member.getGetMemberAddress();
            const groupVaultAddress = await member.getGetGroupVaultAddress();
            const memberIndex = await member.getGetMemberIndex();
            const reputationScore = await member.getGetReputationScore();
            const memberStatus = await member.getGetMemberStatus();

            expect(memberAddress.toString()).toBe(user.address.toString());
            expect(groupVaultAddress.toString()).toBe(groupVault.address.toString());
            expect(memberIndex).toBe(0n);
            expect(reputationScore).toBe(50);
            expect(memberStatus).toBe(1); // MEMBER_STATUS_ACTIVE
        });

        it('should have correct initial balances', async () => {
            const totalContributed = await member.getGetTotalContributed();
            const totalOwed = await member.getGetTotalOwed();

            expect(totalContributed).toBe(0n);
            expect(totalOwed).toBe(0n);
        });

        it('should have correct initial statistics', async () => {
            const stats = await member.getGetStats();

            expect(stats.memberAddress.toString()).toBe(user.address.toString());
            expect(stats.contributionCount).toBe(0n);
            expect(stats.totalContributed).toBe(0n);
            expect(stats.debtCount).toBe(0n);
            expect(stats.totalOwed).toBe(0n);
            expect(stats.reputationScore).toBe(50);
            expect(stats.groupsParticipated).toBe(1n);
            expect(stats.successfulTransactions).toBe(0n);
        });
    });

    describe('Profile Management', () => {
        it('should update profile successfully', async () => {
            const updateResult = await member.send(
                user.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateProfile',
                    displayName: "Alice",
                    bio: "Test user bio"
                } as any // Type assertion for UpdateProfile
            );

            expect(updateResult.transactions).toHaveTransaction({
                from: user.address,
                to: member.address,
                success: true,
            });

            // Check profile was updated
            const profile = await member.getGetProfile();
            expect(profile.displayName).toBe("Alice");
            expect(profile.bio).toBe("Test user bio");
        });

        it('should update all profile fields', async () => {
            const updateResult = await member.send(
                user.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateProfile',
                    displayName: "Bob",
                    avatarHash: "avatar123",
                    bio: "Another bio",
                    contactInfo: beginCell().storeUint(123, 64).endCell()
                } as any // Type assertion for UpdateProfile
            );

            expect(updateResult.transactions).toHaveTransaction({
                from: user.address,
                to: member.address,
                success: true,
            });

            const profile = await member.getGetProfile();
            expect(profile.displayName).toBe("Bob");
            expect(profile.avatarHash).toBe("avatar123");
            expect(profile.bio).toBe("Another bio");
        });

        it('should fail to update profile by non-member', async () => {
            const updateResult = await member.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateProfile',
                    displayName: "Hacker",
                    bio: "Trying to hack profile"
                } as any // Type assertion for UpdateProfile
            );

            expect(updateResult.transactions).toHaveTransaction({
                from: admin.address,
                to: member.address,
                success: false,
            });
        });

        it('should handle partial profile updates', async () => {
            // Update only display name
            await member.send(
                user.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateProfile',
                    displayName: "Charlie"
                } as any // Type assertion for UpdateProfile
            );

            let profile = await member.getGetProfile();
            expect(profile.displayName).toBe("Charlie");

            // Update only bio
            await member.send(
                user.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateProfile',
                    bio: "Updated bio only"
                } as any // Type assertion for UpdateProfile
            );

            profile = await member.getGetProfile();
            expect(profile.displayName).toBe("Charlie"); // Should remain unchanged
            expect(profile.bio).toBe("Updated bio only");
        });
    });

    describe('Reputation Management', () => {
        it('should update reputation by group vault', async () => {
            const updateResult = await member.send(
                admin.getSender(), // Use admin as sender for group vault operations
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateReputation',
                    newScore: 75,
                    reason: "Good contribution",
                    updatedBy: admin.address
                } as any // Type assertion for UpdateReputation
            );

            expect(updateResult.transactions).toHaveTransaction({
                from: groupVault.address,
                to: member.address,
                success: true,
            });

            const reputationScore = await member.getGetReputationScore();
            expect(reputationScore).toBe(75);
        });

        it('should fail to update reputation by non-group vault', async () => {
            const updateResult = await member.send(
                user.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateReputation',
                    newScore: 100,
                    reason: "Self update",
                    updatedBy: user.address
                } as any // Type assertion for UpdateReputation
            );

            expect(updateResult.transactions).toHaveTransaction({
                from: user.address,
                to: member.address,
                success: false,
            });
        });

        it('should handle reputation boundaries', async () => {
            // Test minimum reputation (0)
            await member.send(
                admin.getSender(), // Use admin as sender for group vault operations
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateReputation',
                    newScore: 0,
                    reason: "Minimum reputation",
                    updatedBy: admin.address
                } as any // Type assertion for UpdateReputation
            );

            let reputationScore = await member.getGetReputationScore();
            expect(reputationScore).toBe(0);

            // Test maximum reputation (100)
            await member.send(
                admin.getSender(), // Use admin as sender for group vault operations
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateReputation',
                    newScore: 100,
                    reason: "Maximum reputation",
                    updatedBy: admin.address
                } as any // Type assertion for UpdateReputation
            );

            reputationScore = await member.getGetReputationScore();
            expect(reputationScore).toBe(100);
        });

        it('should fail to set invalid reputation scores', async () => {
            // Test negative reputation
            const negativeResult = await member.send(
                admin.getSender(), // Use admin as sender for group vault operations
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateReputation',
                    newScore: -10,
                    reason: "Negative reputation",
                    updatedBy: admin.address
                } as any // Type assertion for UpdateReputation
            );

            expect(negativeResult.transactions).toHaveTransaction({
                from: groupVault.address,
                to: member.address,
                success: false,
            });

            // Test reputation over 100
            const overResult = await member.send(
                admin.getSender(), // Use admin as sender for group vault operations
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateReputation',
                    newScore: 150,
                    reason: "Over 100 reputation",
                    updatedBy: admin.address
                } as any // Type assertion for UpdateReputation
            );

            expect(overResult.transactions).toHaveTransaction({
                from: groupVault.address,
                to: member.address,
                success: false,
            });
        });
    });

    describe('Contribution Management', () => {
        it('should record contribution by group vault', async () => {
            const contributionAmount = toNano('0.5');
            const contributionId = 123n;

            const recordResult = await member.send(
                admin.getSender(), // Use admin as sender for group vault operations
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'RecordContribution',
                    amount: contributionAmount,
                    purpose: "Goal contribution",
                    contributionId: contributionId,
                    timestamp: BigInt(Math.floor(Date.now() / 1000))
                } as any // Type assertion for RecordContribution
            );

            expect(recordResult.transactions).toHaveTransaction({
                from: groupVault.address,
                to: member.address,
                success: true,
            });

            const totalContributed = await member.getGetTotalContributed();
            expect(totalContributed).toBe(contributionAmount);

            const stats = await member.getGetStats();
            expect(stats.contributionCount).toBe(1n);
            expect(stats.totalContributed).toBe(contributionAmount);
            expect(stats.successfulTransactions).toBe(1n);
        });

        it('should fail to record contribution by non-group vault', async () => {
            const recordResult = await member.send(
                user.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'RecordContribution',
                    amount: toNano('0.5'),
                    purpose: "Self contribution",
                    contributionId: 456n,
                    timestamp: BigInt(Math.floor(Date.now() / 1000))
                } as any // Type assertion for RecordContribution
            );

            expect(recordResult.transactions).toHaveTransaction({
                from: user.address,
                to: member.address,
                success: false,
            });
        });

        it('should handle multiple contributions', async () => {
            const contributions = [
                { amount: toNano('0.1'), id: 1n },
                { amount: toNano('0.2'), id: 2n },
                { amount: toNano('0.3'), id: 3n }
            ];

            for (const contribution of contributions) {
                await member.send(
                    admin.getSender(), // Use admin as sender for group vault operations
                    {
                        value: toNano('0.02'),
                    },
                    {
                        $$type: 'RecordContribution',
                        amount: contribution.amount,
                        purpose: "Multiple contributions",
                        contributionId: contribution.id,
                        timestamp: BigInt(Math.floor(Date.now() / 1000))
                    } as any // Type assertion for RecordContribution
                );
            }

            const totalContributed = await member.getGetTotalContributed();
            expect(totalContributed).toBe(toNano('0.6'));

            const stats = await member.getGetStats();
            expect(stats.contributionCount).toBe(3n);
            expect(stats.successfulTransactions).toBe(3n);
        });
    });

    describe('Debt Management', () => {
        it('should record debt by group vault', async () => {
            const debtAmount = toNano('0.3');
            const debtId = 789n;

            const recordResult = await member.send(
                admin.getSender(), // Use admin as sender for group vault operations
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'RecordDebt',
                    amount: debtAmount,
                    creditor: admin.address,
                    debtId: debtId,
                    reason: "Expense debt",
                    dueDate: null
                } as any // Type assertion for RecordDebt
            );

            expect(recordResult.transactions).toHaveTransaction({
                from: groupVault.address,
                to: member.address,
                success: true,
            });

            const totalOwed = await member.getGetTotalOwed();
            expect(totalOwed).toBe(debtAmount);

            const stats = await member.getGetStats();
            expect(stats.debtCount).toBe(1n);
            expect(stats.totalOwed).toBe(debtAmount);
        });

        it('should fail to record debt by non-group vault', async () => {
            const recordResult = await member.send(
                user.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'RecordDebt',
                    amount: toNano('0.3'),
                    creditor: admin.address,
                    debtId: 999n,
                    reason: "Self debt",
                    dueDate: null
                } as any // Type assertion for RecordDebt
            );

            expect(recordResult.transactions).toHaveTransaction({
                from: user.address,
                to: member.address,
                success: false,
            });
        });

        it('should settle debt by group vault', async () => {
            // First record a debt
            await member.send(
                admin.getSender(), // Use admin as sender for group vault operations
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'RecordDebt',
                    amount: toNano('0.3'),
                    creditor: admin.address,
                    debtId: 111n,
                    reason: "Expense debt",
                    dueDate: null
                } as any // Type assertion for RecordDebt
            );

            // Then settle it
            const settleResult = await member.send(
                admin.getSender(), // Use admin as sender for group vault operations
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'GroupSettleDebt',
                    debtId: 111n,
                    amount: toNano('0.3'),
                    creditor: admin.address,
                    settlementId: 222n
                } as any // Type assertion for GroupSettleDebt
            );

            expect(settleResult.transactions).toHaveTransaction({
                from: groupVault.address,
                to: member.address,
                success: true,
            });

            const totalOwed = await member.getGetTotalOwed();
            expect(totalOwed).toBe(0n);

            const stats = await member.getGetStats();
            expect(stats.successfulTransactions).toBe(1n);
        });

        it('should fail to settle more than owed', async () => {
            // Record a small debt
            await member.send(
                admin.getSender(), // Use admin as sender for group vault operations
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'RecordDebt',
                    amount: toNano('0.1'),
                    creditor: admin.address,
                    debtId: 333n,
                    reason: "Small debt",
                    dueDate: null
                } as any // Type assertion for RecordDebt
            );

            // Try to settle more than owed
            const settleResult = await member.send(
                admin.getSender(), // Use admin as sender for group vault operations
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'GroupSettleDebt',
                    debtId: 333n,
                    amount: toNano('0.2'), // More than owed
                    creditor: admin.address,
                    settlementId: 444n
                } as any // Type assertion for GroupSettleDebt
            );

            expect(settleResult.transactions).toHaveTransaction({
                from: groupVault.address,
                to: member.address,
                success: false,
            });
        });
    });

    describe('Status Management', () => {
        it('should update status by group vault', async () => {
            const updateResult = await member.send(
                admin.getSender(), // Use admin as sender for group vault operations
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateStatus',
                    newStatus: 2, // MEMBER_STATUS_SUSPENDED
                    reason: "Suspension for violation",
                    updatedBy: admin.address
                } as any // Type assertion for UpdateStatus
            );

            expect(updateResult.transactions).toHaveTransaction({
                from: groupVault.address,
                to: member.address,
                success: true,
            });

            const memberStatus = await member.getGetMemberStatus();
            expect(memberStatus).toBe(2);
        });

        it('should fail to update status by non-group vault', async () => {
            const updateResult = await member.send(
                user.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateStatus',
                    newStatus: 1,
                    reason: "Self status change",
                    updatedBy: user.address
                } as any // Type assertion for UpdateStatus
            );

            expect(updateResult.transactions).toHaveTransaction({
                from: user.address,
                to: member.address,
                success: false,
            });
        });

        it('should handle different status values', async () => {
            // Test inactive status
            await member.send(
                admin.getSender(), // Use admin as sender for group vault operations
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateStatus',
                    newStatus: 2, // MEMBER_STATUS_INACTIVE
                    reason: "Deactivation",
                    updatedBy: admin.address
                } as any // Type assertion for UpdateStatus
            );

            let memberStatus = await member.getGetMemberStatus();
            expect(memberStatus).toBe(2);

            // Reactivate
            await member.send(
                admin.getSender(), // Use admin as sender for group vault operations
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateStatus',
                    newStatus: 1, // MEMBER_STATUS_ACTIVE
                    reason: "Reactivation",
                    updatedBy: admin.address
                } as any // Type assertion for UpdateStatus
            );

            memberStatus = await member.getGetMemberStatus();
            expect(memberStatus).toBe(1);
        });
    });

    describe('Getter Functions', () => {
        it('should return correct member address', async () => {
            const memberAddress = await member.getGetMemberAddress();
            expect(memberAddress.toString()).toBe(user.address.toString());
        });

        it('should return correct group vault address', async () => {
            const groupVaultAddress = await member.getGetGroupVaultAddress();
            expect(groupVaultAddress.toString()).toBe(groupVault.address.toString());
        });

        it('should return correct member index', async () => {
            const memberIndex = await member.getGetMemberIndex();
            expect(memberIndex).toBe(0n);
        });

        it('should return correct reputation score', async () => {
            const reputationScore = await member.getGetReputationScore();
            expect(reputationScore).toBe(50);
        });

        it('should return correct total contributed', async () => {
            const totalContributed = await member.getGetTotalContributed();
            expect(totalContributed).toBe(0n);
        });

        it('should return correct total owed', async () => {
            const totalOwed = await member.getGetTotalOwed();
            expect(totalOwed).toBe(0n);
        });

        it('should return correct member status', async () => {
            const memberStatus = await member.getGetMemberStatus();
            expect(memberStatus).toBe(1); // MEMBER_STATUS_ACTIVE
        });

        it('should return last active timestamp', async () => {
            const lastActive = await member.getGetLastActive();
            expect(typeof lastActive).toBe('bigint');
            expect(lastActive).toBeGreaterThan(0n);
        });

        it('should return member settings', async () => {
            const settings = await member.getGetSettings();
            expect(typeof settings.isPrivate).toBe('boolean');
            expect(typeof settings.allowDirectMessages).toBe('boolean');
            expect(typeof settings.autoSettleDebts).toBe('boolean');
            expect(typeof settings.minReputationForInteraction).toBe('bigint');
        });

        it('should return complete profile', async () => {
            // Update profile first
            await member.send(
                user.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateProfile',
                    displayName: "Test User",
                    bio: "Test bio"
                } as any // Type assertion for UpdateProfile
            );

            const profile = await member.getGetProfile();
            expect(profile.memberAddress.toString()).toBe(user.address.toString());
            expect(profile.displayName).toBe("Test User");
            expect(profile.bio).toBe("Test bio");
            expect(profile.reputationScore).toBe(50);
            expect(typeof profile.joinedAt).toBe('bigint');
            expect(profile.isActive).toBe(true);
            expect(profile.totalContributed).toBe(0n);
            expect(profile.totalOwed).toBe(0n);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle empty message gracefully', async () => {
            const result = await member.send(
                user.getSender(),
                {
                    value: toNano('0.01'),
                },
                null
            );

            expect(result.transactions).toHaveTransaction({
                from: user.address,
                to: member.address,
                success: true, // Should handle empty message and return funds
            });
        });

        it('should handle invalid message type gracefully', async () => {
            const result = await member.send(
                user.getSender(),
                {
                    value: toNano('0.01'),
                },
                {
                    $$type: 'UpdateProfile', // Valid type but missing required fields
                    // Missing required fields
                } as any // Type assertion
            );

            expect(result.transactions).toHaveTransaction({
                from: user.address,
                to: member.address,
                success: false, // Should fail for incomplete message
            });
        });

        it('should handle operations on inactive member', async () => {
            // Deactivate member first
            await member.send(
                admin.getSender(), // Use admin as sender for group vault operations
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateStatus',
                    newStatus: 2, // MEMBER_STATUS_INACTIVE
                    reason: "Deactivation test",
                    updatedBy: admin.address
                } as any // Type assertion for UpdateStatus
            );

            // Try to update profile (should fail)
            const updateResult = await member.send(
                user.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateProfile',
                    displayName: "Should fail"
                } as any // Type assertion for UpdateProfile
            );

            expect(updateResult.transactions).toHaveTransaction({
                from: user.address,
                to: member.address,
                success: false,
            });
        });

        it('should handle large numbers correctly', async () => {
            // Test with large contribution amount
            const largeAmount = toNano('1000');
            
            const recordResult = await member.send(
                admin.getSender(), // Use admin as sender for group vault operations
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'RecordContribution',
                    amount: largeAmount,
                    purpose: "Large contribution",
                    contributionId: 999999n,
                    timestamp: BigInt(Math.floor(Date.now() / 1000))
                } as any // Type assertion for RecordContribution
            );

            expect(recordResult.transactions).toHaveTransaction({
                from: groupVault.address,
                to: member.address,
                success: true,
            });

            const totalContributed = await member.getGetTotalContributed();
            expect(totalContributed).toBe(largeAmount);
        });
    });
});