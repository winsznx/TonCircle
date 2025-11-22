import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tolk' as any, // Tolk support is in Blueprint but types not updated yet
    target: 'contracts/expense_splitter.tolk',
};
