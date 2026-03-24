-- Add columns that upstream code references but were never migrated
ALTER TABLE discoveries ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE discoveries ADD COLUMN IF NOT EXISTS is_friends_family BOOLEAN DEFAULT false;
ALTER TABLE discoveries ADD COLUMN IF NOT EXISTS phone TEXT;
