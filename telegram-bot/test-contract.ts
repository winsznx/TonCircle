/**
 * Quick test script to verify bot can read from deployed contracts
 * Run with: npx ts-node test-contract.ts
 */

import { ContractService } from './src/services/contractService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testContractReading() {
  console.log('🧪 Testing Contract Reading...\n');

  const contractService = new ContractService();

  // Test 1: Read factory status
  console.log('📍 Test 1: Reading Factory Status');
  try {
    const factoryStatus = await contractService.getFactoryStatus();
    if (factoryStatus) {
      console.log('✅ Factory Status:');
      console.log('   Owner:', factoryStatus.owner);
      console.log('   Active:', factoryStatus.isActive);
      console.log('   Total Groups:', factoryStatus.totalGroups);
    } else {
      console.log('❌ Failed to read factory status');
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  console.log('\n---\n');

  // Test 2: Check if contract is deployed
  console.log('📍 Test 2: Checking Contract Deployment');
  const factoryAddress = 'EQDU7ANbVtUxcw79x7dFfltROR2hNYGefwBIzdPEm33wKbs9';
  const isDeployed = await contractService.isContractDeployed(factoryAddress);
  console.log('   Factory deployed:', isDeployed ? '✅ Yes' : '❌ No');

  console.log('\n---\n');

  // Test 3: Get contract balance
  console.log('📍 Test 3: Reading Contract Balance');
  const balance = await contractService.getContractBalance(factoryAddress);
  console.log('   Balance:', balance, 'TON');

  console.log('\n---\n');

  // Test 4: Read group status (if you have a group)
  console.log('📍 Test 4: Reading Group Status');
  console.log('   Note: This will fail if no groups created yet');
  console.log('   Create a group in mini-app first to test this\n');

  // Example: Replace with actual group address
  const exampleGroupAddress = 'EQA...'; // Replace with real group address
  if (exampleGroupAddress.startsWith('EQA')) {
    console.log('   ⏭️  Skipping (no group address provided)');
    console.log('   Create a group in mini-app and add address here');
  } else {
    try {
      const groupStatus = await contractService.getGroupStatus(exampleGroupAddress);
      if (groupStatus) {
        console.log('✅ Group Status:');
        console.log('   Name:', groupStatus.groupName);
        console.log('   Members:', groupStatus.memberCount);
        console.log('   Expenses:', groupStatus.totalExpenses);
        console.log('   Goals:', groupStatus.goalCount);
        console.log('   Active:', groupStatus.isActive);
      }
    } catch (error) {
      console.log('❌ Error reading group:', error);
    }
  }

  console.log('\n✅ Contract reading test complete!\n');
  console.log('Next steps:');
  console.log('1. Create a group in mini-app');
  console.log('2. Copy the group contract address');
  console.log('3. Test /linkgroup command in bot');
  console.log('4. Test /status command to see real data\n');
}

testContractReading().catch(console.error);
