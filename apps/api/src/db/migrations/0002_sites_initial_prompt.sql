-- Add initial_prompt column to sites.
-- Set at create time, cleared to NULL after the first block is inserted
-- (see addBlock in services/sites/blockOps.ts).
ALTER TABLE sites ADD COLUMN initial_prompt text NULL;
