import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/core/GroupVault.tact',
    options: {
        debug: false,
    },
};
