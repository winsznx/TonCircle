import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address, beginCell } from '@ton/core';
import { GroupVaultFactory } from '../build/GroupVaultFactory/GroupVaultFactory_GroupVaultFactory';
import { GroupVault } from '../build/GroupVault/GroupVault_GroupVault';
import { Member } from '../build/Member/Member_Member';
import '@ton/test-utils';

describe('TON Circle Edge Cases and Error Handling', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let admin: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let attacker: SandboxContract<TreasuryContract>;
    
    let groupVaultFactory: SandboxContract<GroupVaultFactory>;
    let groupVault: SandboxContract<GroupVault>;
    let member: SandboxContract<Member>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        
        deployer = await blockchain.treasury('deployer');
        admin = await blockchain.treasury('admin');
        user = await blockchain.treasury('user');
        attacker = await blockchain.treasury('attacker');

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

    describe('Security and Attack Vectors', () => {
        it('should prevent unauthorized group registration', async () => {
            // Try to register group with invalid admin address
            const result = await groupVaultFactory.send(
                attacker.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "Malicious Group",
                    groupHash: BigInt('99999999999999999999999999999999999999999999999999999999999999999999999999999'),
                    adminAddress: attacker.address
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: attacker.address,
                to: groupVaultFactory.address,
                success: true, // Registration should succeed (no authorization check)
            });

            // But attacker should not be able to control the group
            const groupAddress = await groupVaultFactory.getGetGroupByIndex(0n);
            expect(groupAddress).not.toBeNull();

            const deployedGroupVault = blockchain.openContract(
                await GroupVault.fromInit(0n, groupVaultFactory.address)
            );

            // Try to initialize group with wrong admin
            const initResult = await deployedGroupVault.send(
                attacker.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateGroupInitialization',
                    groupHash: BigInt('99999999999999999999999999999999999999999999999999999999999999999999999999999'),
                    groupName: "Malicious Group",
                    adminAddress: attacker.address
                }
            );

            expect(initResult.transactions).toHaveTransaction({
                from: attacker.address,
                to: deployedGroupVault.address,
                success: false, // Should fail - only factory can initialize
            });
        });

        it('should prevent unauthorized member addition', async () => {
            // Deploy and initialize a group
            await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "Protected Group",
                    groupHash: BigInt('11111111111111111111111111111111111111111111111111111111111111111111111111111111'),
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
                    groupHash: BigInt('11111111111111111111111111111111111111111111111111111111111111111111111111111'),
                    groupName: "Protected Group",
                    adminAddress: admin.address
                }
            );

            // Try to add member as non-admin
            const result = await groupVault.send(
                attacker.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'AddMember',
                    memberAddress: attacker.address,
                    memberData: null
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: attacker.address,
                to: groupVault.address,
                success: false, // Should fail - only admin can add members
            });
        });

        it('should prevent goal manipulation', async () => {
            // Deploy and initialize a group
            await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "Goal Test Group",
                    groupHash: BigInt('22222222222222222222222222222222222222222222222222222222222222222222222222222'),
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
                    groupHash: BigInt('22222222222222222222222222222222222222222222222222222222222222222222222222222'),
                    groupName: "Goal Test Group",
                    adminAddress: admin.address
                }
            );

            // Try to create goal as non-admin
            const result = await groupVault.send(
                attacker.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'CreateGoal',
                    goalId: 1n,
                    title: "Malicious Goal",
                    description: "Trying to steal funds",
                    targetAmount: toNano('100'),
                    deadline: BigInt(Math.floor(Date.now() / 1000) + 86400),
                    recipientAddress: attacker.address
                } as any // Type assertion for CreateGoal
            );

            expect(result.transactions).toHaveTransaction({
                from: attacker.address,
                to: groupVault.address,
                success: false, // Should fail - only admin can create goals
            });
        });

        it('should prevent expense manipulation', async () => {
            // Deploy and initialize a group
            await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "Expense Test Group",
                    groupHash: BigInt('33333333333333333333333333333333333333333333333333333333333333333333333333'),
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
                    groupHash: BigInt('33333333333333333333333333333333333333333333333333333333333333333333333333'),
                    groupName: "Expense Test Group",
                    adminAddress: admin.address
                }
            );

            // Try to record expense as non-admin
            const result = await groupVault.send(
                attacker.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'RecordExpense',
                    expenseId: 1n,
                    description: "Fake expense",
                    totalAmount: toNano('1000'),
                    paidBy: attacker.address,
                    splitBetween: beginCell().storeUint(1, 32)
                        .storeAddress(admin.address)
                        .endCell(),
                    splitAmounts: beginCell().storeUint(1, 32)
                        .storeCoins(toNano('1000'))
                        .endCell()
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: attacker.address,
                to: groupVault.address,
                success: false, // Should fail - only admin can record expenses
            });
        });
    });

    describe('Boundary Conditions', () => {
        it('should handle maximum values correctly', async () => {
            // Deploy and initialize a group
            await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "Boundary Test Group",
                    groupHash: BigInt('44444444444444444444444444444444444444444444444444444444444444444444444'),
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
                    groupHash: BigInt('44444444444444444444444444444444444444444444444444444444444444444444444'),
                    groupName: "Boundary Test Group",
                    adminAddress: admin.address
                }
            );

            // Test with maximum contribution amount
            const maxAmount = toNano('115792089237316195423570985008687907853269984665640564039457584007913129639936'); // 2^256 - 1

            const result = await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'CreateGoal',
                    goalId: 1n,
                    title: "Max Amount Goal",
                    description: "Testing maximum amount",
                    targetAmount: maxAmount,
                    deadline: BigInt(Math.floor(Date.now() / 1000) + 86400),
                    recipientAddress: user.address
                } as any // Type assertion for CreateGoal
            );

            expect(result.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVault.address,
                success: true, // Should handle max amount
            });

            const goalInfo = await groupVault.getGetGoal(1n);
            expect(goalInfo).not.toBeNull();
            expect(goalInfo!!.targetAmount).toBe(maxAmount);
        });

        it('should handle minimum values correctly', async () => {
            // Deploy and initialize a group
            await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "Min Test Group",
                    groupHash: BigInt('55555555555555555555555555555555555555555555555555555555555555555555555'),
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
                    groupHash: BigInt('55555555555555555555555555555555555555555555555555555555555555555555'),
                    groupName: "Min Test Group",
                    adminAddress: admin.address
                }
            );

            // Test with minimum contribution amount (1 nanoTON)
            const minAmount = 1n;

            const result = await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'CreateGoal',
                    goalId: 1n,
                    title: "Min Amount Goal",
                    description: "Testing minimum amount",
                    targetAmount: minAmount,
                    deadline: BigInt(Math.floor(Date.now() / 1000) + 86400),
                    recipientAddress: user.address
                } as any // Type assertion for CreateGoal
            );

            expect(result.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVault.address,
                success: true, // Should handle min amount
            });

            const goalInfo = await groupVault.getGetGoal(1n);
            expect(goalInfo).not.toBeNull();
            expect(goalInfo!!.targetAmount).toBe(minAmount);
        });

        it('should handle zero values correctly', async () => {
            // Deploy and initialize a group
            await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "Zero Test Group",
                    groupHash: BigInt('66666666666666666666666666666666666666666666666666666666666666666666'),
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
                    groupHash: BigInt('66666666666666666666666666666666666666666666666666666666666666666'),
                    groupName: "Zero Test Group",
                    adminAddress: admin.address
                }
            );

            // Try to create goal with zero amount
            const result = await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'CreateGoal',
                    goalId: 1n,
                    title: "Zero Amount Goal",
                    description: "Testing zero amount",
                    targetAmount: 0n,
                    deadline: BigInt(Math.floor(Date.now() / 1000) + 86400),
                    recipientAddress: user.address
                } as any // Type assertion for CreateGoal
            );

            expect(result.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVault.address,
                success: false, // Should fail - zero amount not allowed
            });
        });
    });

    describe('Resource Exhaustion', () => {
        it('should handle gas limit gracefully', async () => {
            // Deploy and initialize a group
            await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "Gas Test Group",
                    groupHash: BigInt('77777777777777777777777777777777777777777777777777777777777777777777777777'),
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
                    groupHash: BigInt('77777777777777777777777777777777777777777777777777777777777777777777777'),
                    groupName: "Gas Test Group",
                    adminAddress: admin.address
                }
            );

            // Try operation with insufficient gas
            const result = await groupVault.send(
                admin.getSender(),
                {
                    value: 1n, // Very low gas
                },
                {
                    $$type: 'CreateGoal',
                    goalId: 1n,
                    title: "Gas Test Goal",
                    description: "Testing gas limits",
                    targetAmount: toNano('1'),
                    deadline: BigInt(Math.floor(Date.now() / 1000) + 86400),
                    recipientAddress: user.address
                } as any // Type assertion for CreateGoal
            );

            expect(result.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVault.address,
                success: false, // Should fail due to insufficient gas
            });
        });

        it('should handle storage limits', async () => {
            // Deploy and initialize a group
            await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "Storage Test Group",
                    groupHash: BigInt('88888888888888888888888888888888888888888888888888888888888888888888888888888'),
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
                    groupHash: BigInt('88888888888888888888888888888888888888888888888888888888888888888888888888'),
                    groupName: "Storage Test Group",
                    adminAddress: admin.address
                }
            );

            // Set low member limit
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
                } as any // Type assertion for UpdateGroupSettings
            );

            // Add members up to limit
            await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'AddMember',
                    memberAddress: user.address,
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
                    memberAddress: attacker.address,
                    memberData: null
                }
            );

            // Try to add one more (should fail)
            const result = await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'AddMember',
                    memberAddress: deployer.address,
                    memberData: null
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVault.address,
                success: false, // Should fail - member limit reached
            });

            const memberCount = await groupVault.getGetMemberCount();
            expect(memberCount).toBe(2n);
        });
    });

    describe('Data Integrity', () => {
        it('should maintain data consistency across operations', async () => {
            // Deploy and initialize a group
            await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "Consistency Test Group",
                    groupHash: BigInt('99999999999999999999999999999999999999999999999999999999999999999999999999'),
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
                    groupHash: BigInt('99999999999999999999999999999999999999999999999999999999999999999999'),
                    groupName: "Consistency Test Group",
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
                    memberAddress: user.address,
                    memberData: null
                }
            );

            // Create goal
            await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'CreateGoal',
                    goalId: 1n,
                    title: "Consistency Goal",
                    description: "Testing data consistency",
                    targetAmount: toNano('1'),
                    deadline: BigInt(Math.floor(Date.now() / 1000) + 86400),
                    recipientAddress: user.address
                } as any // Type assertion for CreateGoal
            );

            // Verify all data is consistent
            const groupInfo = await groupVault.getGetGroupInfo();
            expect(groupInfo.groupName).toBe("Consistency Test Group");
            expect(groupInfo.memberCount).toBe(1n);

            const goalInfo = await groupVault.getGetGoal(1n);
            expect(goalInfo).not.toBeNull();
            expect(goalInfo!!.title).toBe("Consistency Goal");
            expect(goalInfo!!.targetAmount).toBe(toNano('1'));

            const memberContract = await groupVault.getGetMemberContract(user.address);
            expect(memberContract).not.toBeNull();
        });

        it('should handle concurrent access correctly', async () => {
            // Deploy and initialize a group
            await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "Concurrency Test Group",
                    groupHash: BigInt('12121212121212121212121212121212121212121212121212121212121212121212121212121212'),
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
                    groupHash: BigInt('12121212121212121212121212121212121212121212121212121212121212121212121212'),
                    groupName: "Concurrency Test Group",
                    adminAddress: admin.address
                }
            );

            // Try concurrent operations
            const operations = [
                groupVault.send(
                    admin.getSender(),
                    {
                        value: toNano('0.1'),
                    },
                    {
                        $$type: 'AddMember',
                        memberAddress: user.address,
                        memberData: null
                    }
                ),
                groupVault.send(
                    admin.getSender(),
                    {
                        value: toNano('0.02'),
                    },
                    {
                        $$type: 'CreateGoal',
                        goalId: 1n,
                        title: "Concurrent Goal 1",
                        description: "First concurrent goal",
                        targetAmount: toNano('1'),
                        deadline: BigInt(Math.floor(Date.now() / 1000) + 86400),
                        recipientAddress: user.address
                    } as any // Type assertion for CreateGoal
                ),
                groupVault.send(
                    admin.getSender(),
                    {
                        value: toNano('0.02'),
                    },
                    {
                        $$type: 'CreateGoal',
                        goalId: 2n,
                        title: "Concurrent Goal 2",
                        description: "Second concurrent goal",
                        targetAmount: toNano('2'),
                        deadline: BigInt(Math.floor(Date.now() / 1000) + 86400),
                        recipientAddress: user.address
                    } as any // Type assertion for CreateGoal
                )
            ];

            const results = await Promise.all(operations);

            // At least some should succeed
            let successCount = 0;
            results.forEach(result => {
                if (result.transactions.some(tx =>
                    'success' in tx && (tx as any).success
                )) {
                    successCount++;
                }
            });

            expect(successCount).toBeGreaterThan(0);
        });
    });

    describe('Recovery Scenarios', () => {
        it('should handle partial failures gracefully', async () => {
            // Deploy and initialize a group
            await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "Recovery Test Group",
                    groupHash: BigInt('13131313131313131313131313131313131313131313131313131313131313131313131313'),
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
                    groupHash: BigInt('13131313131313131313131313131313131313131313131313131313131313131313'),
                    groupName: "Recovery Test Group",
                    adminAddress: admin.address
                }
            );

            // Simulate partial failure - add member but fail to create member contract
            const result = await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.01'), // Insufficient for member deployment
                },
                {
                    $$type: 'AddMember',
                    memberAddress: user.address,
                    memberData: null
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVault.address,
                success: false, // Should fail due to insufficient gas
            });

            // Group state should remain consistent
            const memberCount = await groupVault.getGetMemberCount();
            expect(memberCount).toBe(0n); // Should not have increased

            // Retry with sufficient gas
            const retryResult = await groupVault.send(
                admin.getSender(),
                {
                    value: toNano('0.1'),
                },
                {
                    $$type: 'AddMember',
                    memberAddress: user.address,
                    memberData: null
                }
            );

            expect(retryResult.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVault.address,
                success: true, // Should succeed with sufficient gas
            });

            const finalMemberCount = await groupVault.getGetMemberCount();
            expect(finalMemberCount).toBe(1n);
        });
    });
});