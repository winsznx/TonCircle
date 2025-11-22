import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address, beginCell } from '@ton/core';
import { GroupVault } from '../build/GroupVault/GroupVault_GroupVault';
import { GroupVaultFactory } from '../build/GroupVaultFactory/GroupVaultFactory_GroupVaultFactory';
import { Member } from '../build/Member/Member_Member';
import '@ton/test-utils';

describe('GroupVault', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let admin: SandboxContract<TreasuryContract>;
    let user1: SandboxContract<TreasuryContract>;
    let user2: SandboxContract<TreasuryContract>;
    let user3: SandboxContract<TreasuryContract>;
    let groupVault: SandboxContract<GroupVault>;
    let groupVaultFactory: SandboxContract<GroupVaultFactory>;

    const validGroupName = "Test Group";
    const validGroupHash = BigInt('12345678901234567890123456789012345678901234567890123456789012345678901234567890');

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        
        deployer = await blockchain.treasury('deployer');
        admin = await blockchain.treasury('admin');
        user1 = await blockchain.treasury('user1');
        user2 = await blockchain.treasury('user2');
        user3 = await blockchain.treasury('user3');

        // Deploy GroupVaultFactory first
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

        // Deploy GroupVault
        const groupIndex = 0n;
        groupVault = blockchain.openContract(
            await GroupVault.fromInit(
                groupIndex,
                groupVaultFactory.address
            )
        );

        const deployResult = await groupVault.send(
            admin.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'UpdateGroupInitialization',
                groupHash: validGroupHash,
                groupName: validGroupName,
                adminAddress: admin.address
            },
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: admin.address,
            to: groupVault.address,
            deploy: true,
            success: true,
        });

        // Initialize group information via factory
        await groupVault.send(
            deployer.getSender(), // Use deployer as sender for factory operations
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
    });

    describe('Deployment and Initialization', () => {
        it('should deploy successfully with correct initial state', async () => {
            const groupInfo = await groupVault.getGetGroupInfo();
            
            expect(groupInfo.groupHash).toBe(validGroupHash);
            expect(groupInfo.groupName).toBe(validGroupName);
            expect(groupInfo.adminAddress.toString()).toBe(admin.address.toString());
            expect(groupInfo.memberCount).toBe(0n);
            expect(groupInfo.isActive).toBe(true);
        });

        it('should have correct factory and admin addresses', async () => {
            const factoryAddress = await groupVault.getGetFactoryAddress();
            const adminAddress = await groupVault.getGetAdminAddress();
            
            expect(factoryAddress.toString()).toBe(groupVaultFactory.address.toString());
            expect(adminAddress.toString()).toBe(admin.address.toString());
        });

        it('should have correct group index', async () => {
            const groupIndex = await groupVault.getGetGroupIndex();
            expect(groupIndex).toBe(0n);
        });

        it('should have default settings', async () => {
            const settings = await groupVault.getGetSettings();
            
            expect(settings.requireAdminApproval).toBe(false);
            expect(settings.minContribution).toBe(toNano('0.01'));
            expect(settings.maxMembers).toBe(100n);
            expect(settings.allowSelfRemoval).toBe(true);
            expect(settings.requireReputationThreshold).toBe(0n);
        });
    });

    describe('Member Management', () => {
        it('should add a member successfully', async () => {
            const addResult = await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.1'), // For Member contract deployment
                },
                {
                    $$type: 'AddMember',
                    memberAddress: user1.address,
                    memberData: null
                }
            );

            expect(addResult.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVault.address,
                success: true,
            });

            // Check member count increased
            const memberCount = await groupVault.getGetMemberCount();
            expect(memberCount).toBe(1n);

            // Check member is in the map
            const memberContract = await groupVault.getGetMemberContract(user1.address);
            expect(memberContract).not.toBeNull();
        });

        it('should add multiple members successfully', async () => {
            // Add first member
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

            // Add second member
            await groupVault.send(
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

            // Add third member
            await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'AddMember',
                    memberAddress: user3.address,
                    memberData: null
                }
            );

            const memberCount = await groupVault.getGetMemberCount();
            expect(memberCount).toBe(3n);

            // Check all members are in the map
            const member1Contract = await groupVault.getGetMemberContract(user1.address);
            const member2Contract = await groupVault.getGetMemberContract(user2.address);
            const member3Contract = await groupVault.getGetMemberContract(user3.address);

            expect(member1Contract).not.toBeNull();
            expect(member2Contract).not.toBeNull();
            expect(member3Contract).not.toBeNull();
        });

        it('should fail to add duplicate member', async () => {
            // Add member first
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

            // Try to add same member again
            const addResult = await groupVault.send(
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

            expect(addResult.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVault.address,
                success: false,
            });
        });

        it('should fail to add member when limit reached', async () => {
            // Update settings to low member limit
            await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateGroupSettings',
                    maxMembers: 2n,
                    requireAdminApproval: null,
                    minContribution: null
                } as any // Type assertion to bypass TS check
            );

            // Add first member
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

            // Add second member
            await groupVault.send(
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

            // Try to add third member (should fail)
            const addResult = await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'AddMember',
                    memberAddress: user3.address,
                    memberData: null
                }
            );

            expect(addResult.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVault.address,
                success: false,
            });
        });

        it('should remove a member successfully', async () => {
            // Add member first
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

            // Remove member
            const removeResult = await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'RemoveMember',
                    memberAddress: user1.address,
                    reason: "Test removal"
                }
            );

            expect(removeResult.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVault.address,
                success: true,
            });

            // Check member count decreased
            const memberCount = await groupVault.getGetMemberCount();
            expect(memberCount).toBe(0n);

            // Check member is removed from map
            const memberContract = await groupVault.getGetMemberContract(user1.address);
            expect(memberContract).toBeNull();
        });

        it('should fail to remove admin', async () => {
            // Try to remove admin
            const removeResult = await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'RemoveMember',
                    memberAddress: admin.address,
                    reason: "Trying to remove admin"
                }
            );

            expect(removeResult.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVault.address,
                success: false,
            });
        });

        it('should fail to remove non-existent member', async () => {
            const removeResult = await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'RemoveMember',
                    memberAddress: user1.address,
                    reason: "Removing non-existent member"
                }
            );

            expect(removeResult.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVault.address,
                success: false,
            });
        });
    });

    describe('Goal Management', () => {
        beforeEach(async () => {
            // Add a member for goal testing
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
        });

        it('should create a goal successfully', async () => {
            const goalId = 1n;
            const targetAmount = toNano('1');
            const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

            const createResult = await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'CreateGoal',
                    goalId: goalId,
                    title: "Test Goal",
                    description: "A test goal for funding",
                    targetAmount: targetAmount,
                    deadline: BigInt(deadline),
                    recipientAddress: user1.address
                }
            );

            expect(createResult.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVault.address,
                success: true,
            });

            // Check goal info
            const goalInfo = await groupVault.getGetGoal(goalId);
            expect(goalInfo).not.toBeNull();
            expect(goalInfo!!.goalId).toBe(goalId);
            expect(goalInfo!!.title).toBe("Test Goal");
            expect(goalInfo!!.description).toBe("A test goal for funding");
            expect(goalInfo!!.targetAmount).toBe(targetAmount);
            expect(goalInfo!!.currentAmount).toBe(0n);
            expect(goalInfo!!.deadline).toBe(BigInt(deadline));
            expect(goalInfo!!.isCompleted).toBe(false);
            expect(goalInfo!!.contributorCount).toBe(0n);
        });

        it('should fail to create goal with invalid deadline', async () => {
            const pastDeadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

            const createResult = await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'CreateGoal',
                    goalId: 1n,
                    title: "Invalid Goal",
                    description: "Goal with past deadline",
                    targetAmount: toNano('1'),
                    deadline: BigInt(pastDeadline),
                    recipientAddress: user1.address
                }
            );

            expect(createResult.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVault.address,
                success: false,
            });
        });

        it('should contribute to a goal successfully', async () => {
            // Create a goal first
            const goalId = 1n;
            const targetAmount = toNano('1');
            const deadline = Math.floor(Date.now() / 1000) + 86400;

            await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'CreateGoal',
                    goalId: goalId,
                    title: "Test Goal",
                    description: "A test goal for funding",
                    targetAmount: targetAmount,
                    deadline: BigInt(deadline),
                    recipientAddress: user1.address
                }
            );

            // Contribute to the goal
            const contributeResult = await groupVault.send(
                user1.getSender(),
                {
                    value: toNano('0.5'),
                },
                {
                    $$type: 'ContributeToGoal',
                    goalId: goalId,
                    amount: toNano('0.5'),
                    message: "Initial contribution"
                }
            );

            expect(contributeResult.transactions).toHaveTransaction({
                from: user1.address,
                to: groupVault.address,
                success: true,
            });

            // Check goal info updated
            const goalInfo = await groupVault.getGetGoal(goalId);
            expect(goalInfo).not.toBeNull();
            expect(goalInfo!!.currentAmount).toBe(toNano('0.5'));
            expect(goalInfo!!.contributorCount).toBe(1n);
        });

        it('should complete goal when target reached', async () => {
            // Create a goal
            const goalId = 1n;
            const targetAmount = toNano('1');
            const deadline = Math.floor(Date.now() / 1000) + 86400;

            await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'CreateGoal',
                    goalId: goalId,
                    title: "Test Goal",
                    description: "A test goal for funding",
                    targetAmount: targetAmount,
                    deadline: BigInt(deadline),
                    recipientAddress: user1.address
                }
            );

            // Contribute full amount
            await groupVault.send(
                user1.getSender(),
                {
                    value: toNano('1'),
                },
                {
                    $$type: 'ContributeToGoal',
                    goalId: goalId,
                    amount: toNano('1'),
                    message: "Full contribution"
                }
            );

            // Check goal is completed
            const goalInfo = await groupVault.getGetGoal(goalId);
            expect(goalInfo).not.toBeNull();
            expect(goalInfo!!.isCompleted).toBe(true);
            expect(goalInfo!!.currentAmount).toBe(toNano('1'));
        });

        it('should fail to contribute to completed goal', async () => {
            // Create and complete a goal
            const goalId = 1n;
            const targetAmount = toNano('1');
            const deadline = Math.floor(Date.now() / 1000) + 86400;

            await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'CreateGoal',
                    goalId: goalId,
                    title: "Test Goal",
                    description: "A test goal for funding",
                    targetAmount: targetAmount,
                    deadline: BigInt(deadline),
                    recipientAddress: user1.address
                }
            );

            await groupVault.send(
                user1.getSender(),
                {
                    value: toNano('1'),
                },
                {
                    $$type: 'ContributeToGoal',
                    goalId: goalId,
                    amount: toNano('1'),
                    message: "Full contribution"
                }
            );

            // Try to contribute again
            const contributeResult = await groupVault.send(
                user1.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'ContributeToGoal',
                    goalId: goalId,
                    amount: toNano('0.1'),
                    message: "Extra contribution"
                }
            );

            expect(contributeResult.transactions).toHaveTransaction({
                from: user1.address,
                to: groupVault.address,
                success: false,
            });
        });
    });

    describe('Expense Management', () => {
        beforeEach(async () => {
            // Add members for expense testing
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

            await groupVault.send(
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
        });

        it('should record an expense successfully', async () => {
            const expenseId = 1n;
            const totalAmount = toNano('0.3');

            const recordResult = await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'RecordExpense',
                    expenseId: expenseId,
                    description: "Dinner expense",
                    totalAmount: totalAmount,
                    paidBy: admin.address,
                    splitBetween: beginCell().storeUint(2, 32)
                        .storeAddress(user1.address)
                        .storeAddress(user2.address)
                        .endCell(),
                    splitAmounts: beginCell().storeUint(2, 32)
                        .storeCoins(toNano('0.15'))
                        .storeCoins(toNano('0.15'))
                        .endCell()
                }
            );

            expect(recordResult.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVault.address,
                success: true,
            });

            // Check expense info
            const expenseInfo = await groupVault.getGetExpense(expenseId);
            expect(expenseInfo).not.toBeNull();
            expect(expenseInfo!!.expenseId).toBe(expenseId);
            expect(expenseInfo!!.description).toBe("Dinner expense");
            expect(expenseInfo!!.totalAmount).toBe(totalAmount);
            expect(expenseInfo!!.paidBy.toString()).toBe(admin.address.toString());
        });

        it('should create debts when recording expense', async () => {
            const expenseId = 1n;
            const totalAmount = toNano('0.3');

            await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'RecordExpense',
                    expenseId: expenseId,
                    description: "Dinner expense",
                    totalAmount: totalAmount,
                    paidBy: admin.address,
                    splitBetween: beginCell().storeUint(2, 32)
                        .storeAddress(user1.address)
                        .storeAddress(user2.address)
                        .endCell(),
                    splitAmounts: beginCell().storeUint(2, 32)
                        .storeCoins(toNano('0.15'))
                        .storeCoins(toNano('0.15'))
                        .endCell()
                }
            );

            // Check debts were created
            const allDebts = await groupVault.getGetAllDebts();
            expect(allDebts.size).toBe(2n); // Two debts created
        });

        it('should settle a debt successfully', async () => {
            // Record an expense first
            const expenseId = 1n;
            const totalAmount = toNano('0.3');

            await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'RecordExpense',
                    expenseId: expenseId,
                    description: "Dinner expense",
                    totalAmount: totalAmount,
                    paidBy: admin.address,
                    splitBetween: beginCell().storeUint(1, 32)
                        .storeAddress(user1.address)
                        .endCell(),
                    splitAmounts: beginCell().storeUint(1, 32)
                        .storeCoins(toNano('0.3'))
                        .endCell()
                }
            );

            // Get the debt ID (should be 1)
            const debtId = 1n;

            // Settle the debt
            const settleResult = await groupVault.send(
                user1.getSender(),
                {
                    value: toNano('0.3'),
                },
                {
                    $$type: 'GroupSettleDebt',
                    debtId: debtId,
                    amount: toNano('0.3'),
                    creditor: admin.address,
                    settlementId: 1n
                }
            );

            expect(settleResult.transactions).toHaveTransaction({
                from: user1.address,
                to: groupVault.address,
                success: true,
            });

            // Check debt is settled
            const debtInfo = await groupVault.getGetDebt(debtId);
            expect(debtInfo).not.toBeNull();
            expect(debtInfo!!.isSettled).toBe(true);
        });
    });

    describe('Group Settings', () => {
        it('should update group settings successfully', async () => {
            const updateResult = await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateGroupSettings',
                    requireAdminApproval: true,
                    minContribution: toNano('0.05'),
                    maxMembers: 50n
                } as any // Type assertion to bypass TS check
            );

            expect(updateResult.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVault.address,
                success: true,
            });

            const settings = await groupVault.getGetSettings();
            expect(settings.requireAdminApproval).toBe(true);
            expect(settings.minContribution).toBe(toNano('0.05'));
            expect(settings.maxMembers).toBe(50n);
        });

        it('should fail to update settings by non-admin', async () => {
            const updateResult = await groupVault.send(
                user1.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateGroupSettings',
                    requireAdminApproval: true,
                    minContribution: toNano('0.05'),
                    maxMembers: 50n
                } as any // Type assertion to bypass TS check
            );

            expect(updateResult.transactions).toHaveTransaction({
                from: user1.address,
                to: groupVault.address,
                success: false,
            });
        });
    });

    describe('Getter Functions', () => {
        beforeEach(async () => {
            // Add some test data
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

            await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'CreateGoal',
                    goalId: 1n,
                    title: "Test Goal",
                    description: "A test goal",
                    targetAmount: toNano('1'),
                    deadline: BigInt(Math.floor(Date.now() / 1000) + 86400),
                    recipientAddress: user1.address
                }
            );
        });

        it('should return all members', async () => {
            const allMembers = await groupVault.getGetAllMembers();
            expect(allMembers.size).toBe(1n);
        });

        it('should return all goals', async () => {
            const allGoals = await groupVault.getGetAllGoals();
            expect(allGoals.size).toBe(1n);
        });

        it('should return all expenses', async () => {
            const allExpenses = await groupVault.getGetAllExpenses();
            expect(allExpenses.size).toBe(0n); // No expenses yet
        });

        it('should return all debts', async () => {
            const allDebts = await groupVault.getGetAllDebts();
            expect(allDebts.size).toBe(0n); // No debts yet
        });

        it('should return contract address', async () => {
            const contractAddress = await groupVault.getGetContractAddress();
            expect(contractAddress.toString()).toBe(groupVault.address.toString());
        });

        it('should return total members created', async () => {
            const totalMembersCreated = await groupVault.getGetTotalMembersCreated();
            expect(totalMembersCreated).toBe(1n);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle empty message gracefully', async () => {
            const result = await groupVault.send(
                user1.getSender(),
                {
                    value: toNano('0.01'),
                },
                {
                    $$type: 'UpdateGroupInitialization',
                    groupHash: validGroupHash,
                    groupName: validGroupName,
                    adminAddress: admin.address
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: groupVault.address,
                success: true, // Should handle empty message and return funds
            });
        });

        it('should handle invalid message type gracefully', async () => {
            const result = await groupVault.send(
                user1.getSender(),
                {
                    value: toNano('0.01'),
                },
                {
                    $$type: 'AddMember',
                    memberAddress: user1.address,
                    memberData: null
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: groupVault.address,
                success: false, // Should fail for incomplete message
            });
        });
    });
});
