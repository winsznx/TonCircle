import { Address, beginCell, toNano } from '@ton/core';
import { getTonClient } from '../tonConnect';
import { FACTORY_ADDRESS, GAS_AMOUNTS } from '../../config/contracts';

/**
 * GroupVaultFactory Service
 * Handles all interactions with the factory contract
 */
class GroupVaultFactoryService {
  /**
   * Register a new group
   * @param {Object} params
   * @param {string} params.groupName - Name of the group
   * @param {string} params.groupHash - Unique hash for the group
   * @param {string} params.adminAddress - Admin wallet address
   * @param {Function} params.sendTransaction - TON Connect send function
   */
  async registerGroup({ groupName, groupHash, adminAddress, sendTransaction }) {
    try {
      const body = beginCell()
        .storeUint(0x1001, 32) // RegisterGroup opcode
        .storeUint(0, 64) // query_id
        .storeStringTail(groupName)
        .storeUint(BigInt(groupHash), 256)
        .storeAddress(Address.parse(adminAddress))
        .endCell();

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes
        messages: [
          {
            address: FACTORY_ADDRESS,
            amount: toNano(GAS_AMOUNTS.REGISTER_GROUP).toString(),
            payload: body.toBoc().toString('base64'),
          },
        ],
      };

      const result = await sendTransaction(transaction);
      return { success: true, result };
    } catch (error) {
      console.error('Error registering group:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get group address by index
   * @param {bigint} groupIndex - Index of the group
   * @returns {Promise<string|null>} Group vault address
   */
  async getGroupByIndex(groupIndex) {
    try {
      const client = await getTonClient();
      const factoryAddress = Address.parse(FACTORY_ADDRESS);

      const result = await client.runMethod(factoryAddress, 'getGroupByIndex', [
        { type: 'int', value: groupIndex },
      ]);

      const address = result.stack.readAddressOpt();
      return address ? address.toString() : null;
    } catch (error) {
      console.error('Error getting group by index:', error);
      return null;
    }
  }

  /**
   * Get group address by hash
   * @param {string} groupHash - Hash of the group
   * @returns {Promise<string|null>} Group vault address
   */
  async getGroupByHash(groupHash) {
    try {
      const client = await getTonClient();
      const factoryAddress = Address.parse(FACTORY_ADDRESS);

      const result = await client.runMethod(factoryAddress, 'getGroupByHash', [
        { type: 'int', value: BigInt(groupHash) },
      ]);

      const address = result.stack.readAddressOpt();
      return address ? address.toString() : null;
    } catch (error) {
      console.error('Error getting group by hash:', error);
      return null;
    }
  }

  /**
   * Get total number of groups
   * @returns {Promise<number>} Total group count
   */
  async getTotalGroups() {
    try {
      const client = await getTonClient();
      const factoryAddress = Address.parse(FACTORY_ADDRESS);

      const result = await client.runMethod(factoryAddress, 'getTotalGroups', []);
      const count = result.stack.readBigNumber();

      return Number(count);
    } catch (error) {
      console.error('Error getting total groups:', error);
      return 0;
    }
  }

  /**
   * Get factory status
   * @returns {Promise<Object>} Factory status info
   */
  async getFactoryStatus() {
    try {
      const client = await getTonClient();
      const factoryAddress = Address.parse(FACTORY_ADDRESS);

      const result = await client.runMethod(factoryAddress, 'getFactoryStatus', []);

      return {
        isActive: result.stack.readBoolean(),
        totalGroups: Number(result.stack.readBigNumber()),
        owner: result.stack.readAddress().toString(),
      };
    } catch (error) {
      console.error('Error getting factory status:', error);
      return null;
    }
  }

  /**
   * Get factory contract address
   * @returns {string} Factory address
   */
  getFactoryAddress() {
    return FACTORY_ADDRESS;
  }
}

export default new GroupVaultFactoryService();
