import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address, beginCell } from '@ton/core';
import { GroupVaultFactory } from '../build/GroupVaultFactory/GroupVaultFactory_GroupVaultFactory';
import { GroupVault } from '../build/GroupVault/GroupVault_GroupVault';
import { Member } from '../build/Member/Member_Member';
import '@ton/test-utils';

describe('TON Circle Integration Tests', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let admin: SandboxContract<TreasuryContract>;
    let user1: SandboxContract<TreasuryContract>;
    let user2: SandboxContract<TreasuryContract>;
    let user3: SandboxContract<TreasuryContract>;
    
    let groupVaultFactory: SandboxContract<GroupVaultFactory>;
    let groupVault: SandboxContract<GroupVault>;
    let member1: SandboxContract<Member>;
    let member2: SandboxContract<Member>;
    let member3: SandboxContract<Member>;

    const validGroupName = "Integration Test Group";
    const validGroupHash = BigInt('12345678901234567890123456789012345678901234567890123456789012345678901234567890');

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        
        deployer = await blockchain.treasury('deployer');
        admin = await blockchain.treasury('admin');
        user1 = await blockchain.treasury('user1');
        user2 = await blockchain.treasury('user2');
        user3 = await blockchain.treasury('user3');

        // Deploy GroupVaultFactory
        groupVaultFactory = blockchain.openContract(
            await GroupVaultFactory.fromInit(deployer.address)
        );

        await groupVaultFactory.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            null,
        );
    });

    describe('Complete Group Lifecycle', () => {
        it('should handle complete group creation and management flow', async () => {
            // 1. Register a new group
            const registerResult = await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: validGroupName,
                    groupHash: validGroupHash,
                    adminAddress: admin.address
                }
            );

            expect(registerResult.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVaultFactory.address,
                success: true,
            });

            // Get the deployed GroupVault address
            const groupAddress = await groupVaultFactory.getGetGroupByIndex(0n);
            expect(groupAddress).not.toBeNull();

            // Open the deployed GroupVault contract
            groupVault = blockchain.openContract(
                await GroupVault.fromInit(0n, groupVaultFactory.address)
            );

            // 2. Add multiple members
            const members = [user1, user2, user3];
            const memberContracts: SandboxContract<Member>[] = [];

            for (let i = 0; i < members.length; i++) {
                const addResult = await groupVault.send(
                    admin.getSender(),
                    {
                        value: toNano('0.1'),
                    },
                    {
                        $$type: 'AddMember',
                        memberAddress: members[i].address,
                        memberData: null
                    }
                );

                expect(addResult.transactions).toHaveTransaction({
                    from: admin.address,
                    to: groupVault.address,
                    success: true,
                });

                // Create member contract instance for testing
                const memberContract = blockchain.openContract(
                    await Member.fromInit(BigInt(i), groupVault.address)
                );
                memberContracts.push(memberContract);
            }

            // Check member count
            const memberCount = await groupVault.getGetMemberCount();
            expect(memberCount).toBe(3n);

            // 3. Create and fund a goal
            const goalId = 1n;
            const targetAmount = toNano('3');
            const deadline = Math.floor(Date.now() / 1000) + 86400;

            const createGoalResult = await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'CreateGoal',
                    goalId: goalId,
                    title: "Group Trip Fund",
                    description: "Funding for group trip",
                    targetAmount: targetAmount,
                    deadline: BigInt(deadline),
                    recipientAddress: user1.address
                } as any // Type assertion for CreateGoal
            );

            expect(createGoalResult.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVault.address,
                success: true,
            });

            // 4. Members contribute to goal
            const contributions = [
                { user: user1, amount: toNano('1') },
                { user: user2, amount: toNano('1') },
                { user: user3, amount: toNano('1') }
            ];

            for (const contribution of contributions) {
                const contributeResult = await groupVault.send(
                    contribution.user.getSender(),
                    {
                        value: contribution.amount,
                    },
                    {
                        $$type: 'ContributeToGoal',
                        goalId: goalId,
                        amount: contribution.amount,
                        message: "Contribution for group trip"
                    }
                );

                expect(contributeResult.transactions).toHaveTransaction({
                    from: contribution.user.address,
                    to: groupVault.address,
                    success: true,
                });
            }

            // Check goal is completed
            const goalInfo = await groupVault.getGetGoal(goalId);
            expect(goalInfo).not.toBeNull();
            expect(goalInfo!!.isCompleted).toBe(true);
            expect(goalInfo!!.currentAmount).toBe(targetAmount);
            expect(goalInfo!!.contributorCount).toBe(3n);

            // 5. Record and settle expenses
            const expenseId = 1n;
            const totalAmount = toNano('0.6');

            const recordExpenseResult = await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'RecordExpense',
                    expenseId: expenseId,
                    description: "Group dinner",
                    totalAmount: totalAmount,
                    paidBy: admin.address,
                    splitBetween: beginCell().storeUint(3, 32)
                        .storeAddress(user1.address)
                        .storeAddress(user2.address)
                        .storeAddress(user3.address)
                        .endCell(),
                    splitAmounts: beginCell().storeUint(3, 32)
                        .storeCoins(toNano('0.2'))
                        .storeCoins(toNano('0.2'))
                        .storeCoins(toNano('0.2'))
                        .endCell()
                }
            );

            expect(recordExpenseResult.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVault.address,
                success: true,
            });

            // 6. Settle debts
            const allDebts = await groupVault.getGetAllDebts();
            expect(allDebts.size).toBe(3n);

            // Each member settles their debt
            for (let i = 0; i < 3; i++) {
                const debtId = BigInt(i + 1); // Debts are numbered 1, 2, 3
                const settleResult = await groupVault.send(
                    members[i].getSender(),
                    {
                        value: toNano('0.2'),
                    },
                    {
                        $$type: 'GroupSettleDebt',
                        debtId: debtId,
                        amount: toNano('0.2'),
                        creditor: admin.address,
                        settlementId: BigInt(i + 100)
                    }
                );

                expect(settleResult.transactions).toHaveTransaction({
                    from: members[i].address,
                    to: groupVault.address,
                    success: true,
                });
            }

            // Check all debts are settled
            const settledDebts = await groupVault.getGetAllDebts();
            let settledCount = 0;
            for (let i = 0; i < settledDebts.size; i++) {
                const debt = await groupVault.getGetDebt(BigInt(i + 1));
                if (debt && debt.isSettled) {
                    settledCount++;
                }
            }
            expect(settledCount).toBe(3);
        });
    });

    describe('Member Profile and Reputation Integration', () => {
        it('should handle member profile updates and reputation changes', async () => {
            // Deploy group and add member
            const groupAddress = await groupVaultFactory.getGetGroupByIndex(0n);
            groupVault = blockchain.openContract(
                await GroupVault.fromInit(0n, groupVaultFactory.address)
            );

            // Initialize group
            await groupVault.send(
                deployer.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateGroupInitialization',
                    groupHash: validGroupHash,
                    groupName: validGroupName,
                    adminAddress: admin.address
                }
            );

            // Add member
            await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'AddMember',
                    memberAddress: user1.address,
                    memberData: null
                }
            );

            // Get member contract address
            const memberContractAddress = await groupVault.getGetMemberContract(user1.address);
            expect(memberContractAddress).not.toBeNull();

            // Open member contract
            member1 = blockchain.openContract(
                await Member.fromInit(0n, groupVault.address)
            );

            // Initialize member
            await member1.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateMemberInitialization',
                    memberAddress: user1.address,
                    joinedAt: BigInt(Math.floor(Date.now() / 1000)),
                    initialReputationScore: 50n
                }
            );

            // Member updates profile
            const profileUpdateResult = await member1.send(
                user1.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateProfile',
                    displayName: "Alice Johnson",
                    bio: "Active group member",
                    avatarHash: "avatar123"
                } as any // Type assertion for UpdateProfile
            );

            expect(profileUpdateResult.transactions).toHaveTransaction({
                from: user1.address,
                to: member1.address,
                success: true,
            });

            // Admin updates member reputation
            const reputationUpdateResult = await member1.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateReputation',
                    newScore: 75,
                    reason: "Excellent contributions",
                    updatedBy: admin.address
                } as any // Type assertion for UpdateReputation
            );

            expect(reputationUpdateResult.transactions).toHaveTransaction({
                from: admin.address,
                to: member1.address,
                success: true,
            });

            // Verify profile and reputation
            const profile = await member1.getGetProfile();
            expect(profile.displayName).toBe("Alice Johnson");
            expect(profile.bio).toBe("Active group member");
            expect(profile.reputationScore).toBe(75);

            const stats = await member1.getGetStats();
            expect(stats.reputationScore).toBe(75);
        });
    });

    describe('Multi-Group Scenarios', () => {
        it('should handle multiple groups with overlapping members', async () => {
            // Create first group
            await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "First Group",
                    groupHash: BigInt('11111111111111111111111111111111111111111111111111111111111111111111111111111111111111'),
                    adminAddress: admin.address
                }
            );

            // Create second group
            await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "Second Group",
                    groupHash: BigInt('22222222222222222222222222222222222222222222222222222222222222222222222222222222222222'),
                    adminAddress: user1.address // Different admin
                }
            );

            // Check factory status
            const factoryStatus = await groupVaultFactory.getGetFactoryStatus();
            expect(factoryStatus.totalGroups).toBe(2n);

            // Get group addresses
            const group1Address = await groupVaultFactory.getGetGroupByIndex(0n);
            const group2Address = await groupVaultFactory.getGetGroupByIndex(1n);

            expect(group1Address).not.toBeNull();
            expect(group2Address).not.toBeNull();
            if (group1Address && group2Address) {
                expect(group1Address.toString()).not.toBe(group2Address.toString());
            }

            // Open both groups
            const group1 = blockchain.openContract(
                await GroupVault.fromInit(0n, groupVaultFactory.address)
            );

            const group2 = blockchain.openContract(
                await GroupVault.fromInit(1n, groupVaultFactory.address)
            );

            // Initialize groups
            await group1.send(
                deployer.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateGroupInitialization',
                    groupHash: BigInt('11111111111111111111111111111111111111111111111111111111111111111111111111111111111'),
                    groupName: "First Group",
                    adminAddress: admin.address
                }
            );

            await group2.send(
                deployer.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateGroupInitialization',
                    groupHash: BigInt('22222222222222222222222222222222222222222222222222222222222222222222222222222222222'),
                    groupName: "Second Group",
                    adminAddress: user1.address
                }
            );

            // Add user2 to both groups
            await group1.send(
                admin.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'AddMember',
                    memberAddress: user2.address,
                    memberData: null
                }
            );

            await group2.send(
                user1.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'AddMember',
                    memberAddress: user2.address,
                    memberData: null
                }
            );

            // Check member counts
            const group1MemberCount = await group1.getGetMemberCount();
            const group2MemberCount = await group2.getGetMemberCount();

            expect(group1MemberCount).toBe(1n);
            expect(group2MemberCount).toBe(1n);
        });
    });

    describe('Error Recovery and Edge Cases', () => {
        it('should handle failed transactions gracefully', async () => {
            // Try to register group with insufficient funds
            const failedResult = await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('0.1'), // Insufficient
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "Failed Group",
                    groupHash: BigInt('99999999999999999999999999999999999999999999999999999999999999999999999999999999999'),
                    adminAddress: admin.address
                }
            );

            expect(failedResult.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVaultFactory.address,
                success: false,
            });

            // Verify factory state unchanged
            const factoryStatus = await groupVaultFactory.getGetFactoryStatus();
            expect(factoryStatus.totalGroups).toBe(0n);

            // Register group successfully
            const successResult = await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "Success Group",
                    groupHash: validGroupHash,
                    adminAddress: admin.address
                }
            );

            expect(successResult.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVaultFactory.address,
                success: true,
            });

            // Verify factory state updated
            const updatedFactoryStatus = await groupVaultFactory.getGetFactoryStatus();
            expect(updatedFactoryStatus.totalGroups).toBe(1n);
        });

        it('should handle concurrent operations', async () => {
            // Create group
            await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "Concurrent Test Group",
                    groupHash: BigInt('88888888888888888888888888888888888888888888888888888888888888888888888888888888888888'),
                    adminAddress: admin.address
                }
            );

            const groupAddress = await groupVaultFactory.getGetGroupByIndex(0n);
            groupVault = blockchain.openContract(
                await GroupVault.fromInit(0n, groupVaultFactory.address)
            );

            // Initialize group
            await groupVault.send(
                deployer.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateGroupInitialization',
                    groupHash: BigInt('88888888888888888888888888888888888888888888888888888888888888888888888888888888888888'),
                    groupName: "Concurrent Test Group",
                    adminAddress: admin.address
                }
            );

            // Add multiple members rapidly
            const addPromises = [
                groupVault.send(
                    admin.getSender(),
                    {
                        value: toNano('0.1'),
                    },
                    {
                        $$type: 'AddMember',
                        memberAddress: user1.address,
                        memberData: null
                    }
                ),
                groupVault.send(
                    admin.getSender(),
                    {
                        value: toNano('0.1'),
                    },
                    {
                        $$type: 'AddMember',
                        memberAddress: user2.address,
                        memberData: null
                    }
                ),
                groupVault.send(
                    admin.getSender(),
                    {
                        value: toNano('0.1'),
                    },
                    {
                        $$type: 'AddMember',
                        memberAddress: user3.address,
                        memberData: null
                    }
                )
            ];

            const results = await Promise.all(addPromises);

            // All should succeed
            results.forEach((result, index) => {
                expect(result.transactions).toHaveTransaction({
                    from: admin.address,
                    to: groupVault.address,
                    success: true,
                });
            });

            // Verify all members added
            const memberCount = await groupVault.getGetMemberCount();
            expect(memberCount).toBe(3n);
        });
    });

    describe('Performance and Gas Optimization', () => {
        it('should handle batch operations efficiently', async () => {
            // Create group
            await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "Performance Test Group",
                    groupHash: BigInt('77777777777777777777777777777777777777777777777777777777777777777777777777777'),
                    adminAddress: admin.address
                }
            );

            const groupAddress = await groupVaultFactory.getGetGroupByIndex(0n);
            groupVault = blockchain.openContract(
                await GroupVault.fromInit(0n, groupVaultFactory.address)
            );

            // Initialize group
            await groupVault.send(
                deployer.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateGroupInitialization',
                    groupHash: BigInt('77777777777777777777777777777777777777777777777777777777777777777777777777777'),
                    groupName: "Performance Test Group",
                    adminAddress: admin.address
                }
            );

            // Measure gas for adding multiple members
            const initialGas = await admin.getBalance();

            for (let i = 0; i < 5; i++) {
                await groupVault.send(
                    admin.getSender(),
                    {
                        value: toNano('0.1'),
                    },
                    {
                        $$type: 'AddMember',
                        memberAddress: Address.parseFriendly(`EQD${i + 1000}`.repeat(64).substring(0, 64))!.address, // Generate unique addresses
                        memberData: null
                    }
                );
            }

            const finalGas = await admin.getBalance();
            const gasUsed = initialGas - finalGas;

            // Verify gas usage is reasonable (this is a rough check)
            expect(gasUsed).toBeLessThan(toNano('1')); // Should use less than 1 TON for 5 additions

            const memberCount = await groupVault.getGetMemberCount();
            expect(memberCount).toBe(5n);
        });
    });
});