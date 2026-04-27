import { createContext, useContext } from 'react';

export type BlockTarget =
    | { kind: 'page'; index: number }
    | { kind: 'chrome'; position: 'header' | 'footer' };

export const BlockTargetContext = createContext<BlockTarget | null>(null);

export function useBlockTarget(): BlockTarget | null {
    return useContext(BlockTargetContext);
}
