-- Add doctor profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty VARCHAR(100) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS reg_number VARCHAR(100) DEFAULT '';
