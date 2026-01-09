-- AlterTable
ALTER TABLE "Trade" ADD COLUMN IF NOT EXISTS "workflow" JSONB;

-- Add new enum values to TradeStatus if they don't exist
DO $$ BEGIN
    ALTER TYPE "TradeStatus" ADD VALUE IF NOT EXISTS 'proposed';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE "TradeStatus" ADD VALUE IF NOT EXISTS 'expired';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
