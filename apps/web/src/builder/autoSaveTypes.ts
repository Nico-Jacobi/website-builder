export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface AutoSaveAdapter {
    patchContent(blockId: string, fieldPath: string, value: unknown): void;
    uploadAsset(file: File): Promise<{ id: string; url: string }>;
    subscribe(cb: (status: SaveStatus) => void): () => void;
    getStatus(): SaveStatus;
}
