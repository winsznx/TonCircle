/**
 * Format TON address for display
 * @param {string} address - Full TON address
 * @param {number} startChars - Number of characters to show at start
 * @param {number} endChars - Number of characters to show at end
 * @returns {string} Formatted address
 */
export function formatAddress(address, startChars = 6, endChars = 4) {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format TON amount for display
 * @param {string|number} amount - Amount in nanoTON
 * @returns {string} Formatted amount in TON
 */
export function formatTON(amount) {
  if (!amount) return '0';
  const ton = Number(amount) / 1e9;
  return ton.toFixed(2);
}
