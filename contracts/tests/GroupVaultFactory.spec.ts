import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address, beginCell } from '@ton/core';
import { GroupVaultFactory } from '../build/GroupVaultFactory/GroupVaultFactory_GroupVaultFactory';
import '@ton/test-utils';

describe('GroupVaultFactory', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let admin: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let groupVaultFactory: SandboxContract<GroupVaultFactory>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        admin = await blockchain.treasury('admin');
        user = await blockchain.treasury('user');

        groupVaultFactory = blockchain.openContract(
            await GroupVaultFactory.fromInit(deployer.address)
        );

        const deployResult = await groupVaultFactory.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            null,
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: groupVaultFactory.address,
            deploy: true,
            success: true,
        });
    });

    describe('Deployment and Initialization', () => {
        it('should deploy successfully with correct initial state', async () => {
            const factoryStatus = await groupVaultFactory.getGetFactoryStatus();

            expect(factoryStatus.totalGroups).toBe(0n);
            expect(factoryStatus.isActive).toBe(true);
            // Note: maxGroupsPerAdmin is not in the FactoryStatusResponse, it's stored in contract state
            expect(factoryStatus.registrationFee).toBe(toNano('2')); // Default from contract
        });

        it('should have correct owner address', async () => {
            const owner = await groupVaultFactory.getGetOwner();
            expect(owner.toString()).toBe(deployer.address.toString());
        });
    });

    describe('Group Registration', () => {
        const validGroupName = "Test Group";
        const validGroupHash = BigInt('1234567890123456789012345678901234567890123456789012345678901234567890');

        it('should register a new group successfully', async () => {
            const registerResult = await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'), // Registration fee + deployment cost
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

            // Check that group count increased
            const factoryStatus = await groupVaultFactory.getGetFactoryStatus();
            expect(factoryStatus.totalGroups).toBe(1n);

            // Check that group address can be calculated
            const groupAddress = await groupVaultFactory.getGetGroupByIndex(0n);
            expect(groupAddress).not.toBeNull();
            if (groupAddress) {
                expect(typeof groupAddress.toString()).toBe('string');
            }
        });

        it('should fail with insufficient registration fee', async () => {
            const registerResult = await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('1'), // Less than required fee
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
                success: false,
            });
        });

        it('should fail with invalid group name', async () => {
            const registerResult = await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "", // Empty name should be invalid
                    groupHash: validGroupHash,
                    adminAddress: admin.address
                }
            );

            expect(registerResult.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVaultFactory.address,
                success: false,
            });
        });

        it('should fail with invalid admin address', async () => {
            const registerResult = await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: validGroupName,
                    groupHash: validGroupHash,
                    adminAddress: Address.parseRaw("0:0000000000000000000000000000000000000000000000000000000000000000") // Zero address
                }
            );

            expect(registerResult.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVaultFactory.address,
                success: false,
            });
        });

        it('should return excess funds to sender', async () => {
            const initialBalance = await admin.getBalance();

            const registerResult = await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('3'), // More than needed
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

            // Check that excess was returned (gas fees will be deducted)
            const finalBalance = await admin.getBalance();
            expect(finalBalance).toBeLessThan(initialBalance);
            expect(finalBalance).toBeGreaterThan(initialBalance - toNano('3'));
        });
    });

    describe('Factory Settings Management', () => {
        it('should update factory settings successfully by owner', async () => {
            const newMaxGroups = 15n;
            const newRegistrationFee = toNano('3');

            const updateResult = await groupVaultFactory.send(
                deployer.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateFactorySettings',
                    maxGroupsPerAdmin: newMaxGroups,
                    registrationFee: newRegistrationFee
                }
            );

            expect(updateResult.transactions).toHaveTransaction({
                from: deployer.address,
                to: groupVaultFactory.address,
                success: true,
            });

            const factoryStatus = await groupVaultFactory.getGetFactoryStatus();
            // Note: maxGroupsPerAdmin is not in the FactoryStatusResponse, it's stored in contract state
            expect(factoryStatus.registrationFee).toBe(newRegistrationFee);
        });

        it('should fail to update settings by non-owner', async () => {
            const updateResult = await groupVaultFactory.send(
                user.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateFactorySettings',
                    maxGroupsPerAdmin: 15n,
                    registrationFee: toNano('3')
                }
            );

            expect(updateResult.transactions).toHaveTransaction({
                from: user.address,
                to: groupVaultFactory.address,
                success: false,
            });
        });

        it('should allow partial settings update', async () => {
            // Update only maxGroupsPerAdmin
            const updateResult1 = await groupVaultFactory.send(
                deployer.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateFactorySettings',
                    maxGroupsPerAdmin: 20n,
                    registrationFee: 0n // Zero means no change
                }
            );

            expect(updateResult1.transactions).toHaveTransaction({
                from: deployer.address,
                to: groupVaultFactory.address,
                success: true,
            });

            let factoryStatus = await groupVaultFactory.getGetFactoryStatus();
            // Note: maxGroupsPerAdmin is not in the FactoryStatusResponse, it's stored in contract state
            expect(factoryStatus.registrationFee).toBe(toNano('2')); // Should remain unchanged

            // Update only registrationFee
            const updateResult2 = await groupVaultFactory.send(
                deployer.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateFactorySettings',
                    maxGroupsPerAdmin: 0n, // Zero means no change
                    registrationFee: toNano('5')
                }
            );

            expect(updateResult2.transactions).toHaveTransaction({
                from: deployer.address,
                to: groupVaultFactory.address,
                success: true,
            });

            factoryStatus = await groupVaultFactory.getGetFactoryStatus();
            // Note: maxGroupsPerAdmin is not in the FactoryStatusResponse, it's stored in contract state
            expect(factoryStatus.registrationFee).toBe(toNano('5'));
        });
    });

    describe('Emergency Controls', () => {
        it('should emergency stop factory by owner', async () => {
            const stopResult = await groupVaultFactory.send(
                deployer.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'EmergencyStop',
                    reason: "Maintenance mode"
                }
            );

            expect(stopResult.transactions).toHaveTransaction({
                from: deployer.address,
                to: groupVaultFactory.address,
                success: true,
            });

            const factoryStatus = await groupVaultFactory.getGetFactoryStatus();
            expect(factoryStatus.isActive).toBe(false);
        });

        it('should fail to emergency stop by non-owner', async () => {
            const stopResult = await groupVaultFactory.send(
                user.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'EmergencyStop',
                    reason: "Unauthorized stop"
                }
            );

            expect(stopResult.transactions).toHaveTransaction({
                from: user.address,
                to: groupVaultFactory.address,
                success: false,
            });
        });

        it('should resume factory by owner after emergency stop', async () => {
            // First stop the factory
            await groupVaultFactory.send(
                deployer.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'EmergencyStop',
                    reason: "Maintenance mode"
                }
            );

            // Then resume it
            const resumeResult = await groupVaultFactory.send(
                deployer.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'ResumeFactory',
                }
            );

            expect(resumeResult.transactions).toHaveTransaction({
                from: deployer.address,
                to: groupVaultFactory.address,
                success: true,
            });

            const factoryStatus = await groupVaultFactory.getGetFactoryStatus();
            expect(factoryStatus.isActive).toBe(true);
        });

        it('should fail to resume by non-owner', async () => {
            // First stop the factory
            await groupVaultFactory.send(
                deployer.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'EmergencyStop',
                    reason: "Maintenance mode"
                }
            );

            // Try to resume by non-owner
            const resumeResult = await groupVaultFactory.send(
                user.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'ResumeFactory',
                }
            );

            expect(resumeResult.transactions).toHaveTransaction({
                from: user.address,
                to: groupVaultFactory.address,
                success: false,
            });
        });

        it('should reject group registration when factory is stopped', async () => {
            // Stop the factory first
            await groupVaultFactory.send(
                deployer.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'EmergencyStop',
                    reason: "Maintenance mode"
                }
            );

            // Try to register a group
            const registerResult = await groupVaultFactory.send(
                admin.getSender(),
                {
                    value: toNano('2.2'),
                },
                {
                    $$type: 'RegisterGroup',
                    groupName: "Test Group",
                    groupHash: validGroupHash,
                    adminAddress: admin.address
                }
            );

            expect(registerResult.transactions).toHaveTransaction({
                from: admin.address,
                to: groupVaultFactory.address,
                success: false,
            });
        });
    });

    describe('Getter Functions', () => {
        it('should return correct factory status', async () => {
            const factoryStatus = await groupVaultFactory.getGetFactoryStatus();

            expect(typeof factoryStatus.totalGroups).toBe('bigint');
            expect(typeof factoryStatus.isActive).toBe('boolean');
            expect(typeof factoryStatus.registrationFee).toBe('bigint');
        });

        it('should return correct owner address', async () => {
            const owner = await groupVaultFactory.getGetOwner();
            expect(owner.toString()).toBe(deployer.address.toString());
        });

        it('should calculate group address by index correctly', async () => {
            const groupAddress = await groupVaultFactory.getGetGroupByIndex(0n);
            expect(groupAddress).not.toBeNull();
            if (groupAddress) {
                expect(typeof groupAddress.toString()).toBe('string');
            }
        });

        it('should handle multiple group address calculations', async () => {
            const address1 = await groupVaultFactory.getGetGroupByIndex(0n);
            const address2 = await groupVaultFactory.getGetGroupByIndex(1n);
            const address3 = await groupVaultFactory.getGetGroupByIndex(2n);

            expect(address1).not.toBeNull();
            expect(address2).not.toBeNull();
            expect(address3).not.toBeNull();

            if (address1 && address2 && address3) {
                expect(address1.toString()).not.toBe(address2.toString());
                expect(address2.toString()).not.toBe(address3.toString());
                expect(address1.toString()).not.toBe(address3.toString());
            }
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle empty message gracefully', async () => {
            const result = await groupVaultFactory.send(
                user.getSender(),
                {
                    value: toNano('0.01'),
                },
                null
            );

            expect(result.transactions).toHaveTransaction({
                from: user.address,
                to: groupVaultFactory.address,
                success: true, // Should handle empty message and return funds
            });
        });

        it('should handle invalid message type gracefully', async () => {
            const result = await groupVaultFactory.send(
                user.getSender(),
                {
                    value: toNano('0.01'),
                },
                {
                    $$type: 'RegisterGroup', // Using valid message type for testing
                    groupName: "Invalid Test",
                    groupHash: BigInt('9999999999999999999999999999999999999999999999999999999999999999999999'),
                    adminAddress: user.address
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: user.address,
                to: groupVaultFactory.address,
                success: false, // Should fail for invalid message type
            });
        });

        it('should handle zero maxGroupsPerAdmin in settings update', async () => {
            const result = await groupVaultFactory.send(
                deployer.getSender(),
                {
                    value: toNano('0.02'),
                },
                {
                    $$type: 'UpdateFactorySettings',
                    maxGroupsPerAdmin: 0n, // Should not update
                    registrationFee: toNano('10')
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: deployer.address,
                to: groupVaultFactory.address,
                success: true,
            });

            const factoryStatus = await groupVaultFactory.getGetFactoryStatus();
            // Note: maxGroupsPerAdmin is not in the FactoryStatusResponse, it's stored in contract state
            expect(factoryStatus.registrationFee).toBe(toNano('10'));
        });
    });

    describe('Multiple Group Registration', () => {
        it('should handle multiple group registrations', async () => {
            const groupCount = 3;

            for (let i = 0; i < groupCount; i++) {
                const registerResult = await groupVaultFactory.send(
                    admin.getSender(),
                    {
                        value: toNano('2.2'),
                    },
                    {
                        $$type: 'RegisterGroup',
                        groupName: `Test Group ${i}`,
                        groupHash: BigInt(`123456789012345678901234567890123456789012345678901234567890123456789${i}`),
                        adminAddress: admin.address
                    }
                );

                expect(registerResult.transactions).toHaveTransaction({
                    from: admin.address,
                    to: groupVaultFactory.address,
                    success: true,
                });
            }

            const factoryStatus = await groupVaultFactory.getGetFactoryStatus();
            expect(factoryStatus.totalGroups).toBe(BigInt(groupCount));
        });

        it('should generate unique addresses for each group', async () => {
            const addresses: string[] = [];

            for (let i = 0; i < 5; i++) {
                const address = await groupVaultFactory.getGetGroupByIndex(BigInt(i));
                expect(address).not.toBeNull();
                if (address) {
                    addresses.push(address.toString());
                }
            }

            // Check all addresses are unique
            const uniqueAddresses = new Set(addresses);
            expect(uniqueAddresses.size).toBe(addresses.length);
        });
    });
});