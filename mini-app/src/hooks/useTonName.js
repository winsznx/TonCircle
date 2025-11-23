import { useState, useEffect } from 'react';

/**
 * Hook to resolve TON username for an address
 * @param {string} address - TON address to resolve
 * @returns {string|null} Resolved username or null
 */
export function useTonName(address) {
    const [tonName, setTonName] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!address) {
            setTonName(null);
            return;
        }

        const resolveName = async () => {
            setLoading(true);
            try {
                // TODO: Replace with actual TON DNS resolution
                // For hackathon demo, we can mock some known addresses
                // or use a public API if available

                // Mock for demo
                if (address === 'EQDU7ANbVtUxcw79x7dFfltROR2hNYGefwBIzdPEm33wKbs9') {
                    setTonName('toncircle.ton');
                } else {
                    setTonName(null);
                }

                // Real implementation would look like:
                // const response = await fetch(`https://tonapi.io/v2/accounts/${address}`);
                // const data = await response.json();
                // if (data.name) setTonName(data.name);

            } catch (error) {
                console.error('Error resolving TON name:', error);
                setTonName(null);
            } finally {
                setLoading(false);
            }
        };

        resolveName();
    }, [address]);

    return { tonName, loading };
}
