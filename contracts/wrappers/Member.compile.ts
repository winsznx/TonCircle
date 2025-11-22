import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/core/Member.tact',
    options: {
        debug: false,
    },
};
